// VUSD swaps relayed by the bridge. The user signs one transaction; the bridge relayer does every other step.
//
//   to_vusd    USDT (BSC) -> VUSD (Vitruveo)
//     user     approve (if needed) + lockUSDT on BSC
//     relay    receipt signed TO THE RELAYER -> zeroEscrow(user) on BSC -> claimToken(relayer) on Vitruveo
//              -> depositFor(user): VUSD minted straight to the user (relayer's standing USDT.b approval)
//   from_vusd  VUSD (Vitruveo) -> USDT (BSC)
//     user     VUSD.redeemTo(relayer): USDT.b goes to the relayer
//     relay    burnUSDTToken (relayer escrow) -> receipt signed TO THE USER -> zeroEscrow(relayer)
//              -> claimUSDT(user) on BSC, gas paid by the relayer
//
// The relayer is the Vitruveo notary wallet (on BSC, the BSC notary submits claimUSDT). BridgedUSDT only checks
// the notary signature on a claim, not who sends it, so the relayer can claim on the user's behalf.
//
// Each swap is a bridge_swaps row. Every step checks the chain first (already zeroed / claimed / deposited?), and
// a step's tx hash is stored before it is awaited, so a retried swap never repeats a step. A lease
// (locked_until) keeps two requests from running the same swap at once.
import { ethers } from "ethers";
import { sql } from "./db";
import { isClaimed, notaryWallet, readEscrow, signReceipt } from "./chain";
import { insertReceipt, updateReceipt } from "./receipts";
import { BSC_CHAIN_ID, CHAIN_NAME, TOKENS, VITRUVEO_CHAIN_ID, VUSD, VUSD_ABI, errMsg, providerFor } from "./config";

const USDT = TOKENS.USDT;
const ONE = 10n ** 18n;
const TX_WAIT_MS = 90_000;

export const relayer = () => notaryWallet(VITRUVEO_CHAIN_ID);
export const relayerAddress = () => relayer()?.address ?? null;
const bscRelayer = () => notaryWallet(BSC_CHAIN_ID);

const bridge = (chainId, runner) => new ethers.Contract(USDT.address[chainId], USDT.abi, runner ?? providerFor(chainId));
const vusd = (runner) => new ethers.Contract(VUSD, VUSD_ABI, runner ?? providerFor(VITRUVEO_CHAIN_ID));
const vusdIface = new ethers.Interface(VUSD_ABI);

// ---- store ----

export function toSwap(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    kind: row.kind,
    account: row.account,
    amount: String(row.amount),
    state: row.state,
    done: row.state === "done",
    error: row.error,
    receiptId: row.receipt_id != null ? String(row.receipt_id) : null,
    txs: { zero: row.zero_tx, claim: row.claim_tx, deposit: row.deposit_tx, burn: row.burn_tx, refund: row.refund_tx },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSwap(id) {
  const [row] = await sql`select * from bridge_swaps where id = ${id}`;
  return row || null;
}

export const listOpenSwaps = (account) =>
  sql`select * from bridge_swaps where account = ${account.toLowerCase()} and state not in ('done', 'void') order by created_at`;

async function save(id, f) {
  const [row] = await sql`
    update bridge_swaps set
      state = coalesce(${f.state ?? null}, state),
      escrow_block = coalesce(${f.escrowBlock != null ? String(f.escrowBlock) : null}::bigint, escrow_block),
      receipt_id = coalesce(${f.receiptId ?? null}::bigint, receipt_id),
      zero_tx = coalesce(${f.zero_tx ?? null}, zero_tx),
      claim_tx = coalesce(${f.claim_tx ?? null}, claim_tx),
      claim_block = coalesce(${f.claimBlock != null ? String(f.claimBlock) : null}::bigint, claim_block),
      deposit_tx = coalesce(${f.deposit_tx ?? null}, deposit_tx),
      burn_tx = coalesce(${f.burn_tx ?? null}, burn_tx),
      refund_tx = coalesce(${f.refund_tx ?? null}, refund_tx),
      error = ${f.error ?? null},
      updated_at = now()
    where id = ${id}
    returning *`;
  return row;
}

async function lease(id) {
  const [row] = await sql`
    update bridge_swaps set locked_until = now() + interval '5 minutes'
    where id = ${id} and (locked_until is null or locked_until < now())
    returning *`;
  return row || null;
}
const release = (id) => sql`update bridge_swaps set locked_until = null where id = ${id}`;

// ---- tx steps ----

// Sends the tx for `col` at most once. A stored hash is awaited instead of resent; it is only replaced when it
// reverted or the RPC no longer knows it (dropped). The caller checks the chain first, so a step that already
// took effect is never sent again.
async function txStep(job, col, chainId, label, send) {
  const p = providerFor(chainId);
  let hash = job[col];
  if (hash) {
    let rc = await p.getTransactionReceipt(hash);
    if (!rc) rc = await p.waitForTransaction(hash, 1, (await p.getTransaction(hash)) ? TX_WAIT_MS : 15_000).catch(() => null);
    if (rc?.status === 1) return rc;
    if (!rc && (await p.getTransaction(hash))) throw new Error(`${label} is still pending on ${CHAIN_NAME[chainId]} (${hash}).`);
    hash = null; // reverted or dropped: send again
  }
  const tx = await send();
  Object.assign(job, await save(job.id, { [col]: tx.hash }));
  const rc = await p.waitForTransaction(tx.hash, 1, TX_WAIT_MS).catch(() => null);
  if (!rc) throw new Error(`${label} is still pending on ${CHAIN_NAME[chainId]} (${tx.hash}).`);
  if (rc.status !== 1) throw new Error(`${label} reverted on ${CHAIN_NAME[chainId]} (${tx.hash}).`);
  return rc;
}

const chainReceipt = (r) => ({
  token: "USDT",
  account: r.account,
  destChainId: r.destChainId,
  destContract: r.destContract,
  direction: r.direction,
  amount: r.amount,
  blockNumber: r.blockNumber,
});

// A relayed receipt must belong to exactly one swap. Two users locking the same amount in the same BSC block would
// produce the same relayer receipt; the second is refused (collision) and continues as a normal bridge instead.
async function issueReceipt(job, { account, sourceChainId, amount, blockNumber }) {
  const collision = () => Object.assign(new Error("Receipt collision"), { collision: true });
  const signed = await signReceipt({ token: "USDT", account, sourceChainId, amount, blockNumber });
  if (await isClaimed(signed)) throw collision();
  let row;
  try {
    row = await insertReceipt(signed, { status: "pending", source: "relay" });
  } catch (e) {
    if (e?.code === "23505") throw collision();
    throw e;
  }
  const [other] = await sql`select id from bridge_swaps where receipt_id = ${row.id} and id <> ${job.id}`;
  if (other) throw collision();
  Object.assign(job, await save(job.id, { receiptId: row.id }));
  return signed;
}

const relayerFunds = async (need) => {
  const bal = BigInt(await bridge(VITRUVEO_CHAIN_ID).balanceOf(relayerAddress()));
  if (bal < need) throw new Error(`The bridge relayer holds ${ethers.formatEther(bal)} USDT.b, needs ${ethers.formatEther(need)}.`);
};

// A depositFor(user) by the relayer for this amount after the claim, not already attributed to another swap.
async function findDeposit(job) {
  const p = providerFor(VITRUVEO_CHAIN_ID);
  const ev = vusdIface.getEvent("Deposited");
  const from = job.claim_block != null ? Number(job.claim_block) : (await p.getBlockNumber()) - 20_000;
  const logs = await p.getLogs({
    address: VUSD,
    topics: [ev.topicHash, ethers.zeroPadValue(relayerAddress(), 32), ethers.zeroPadValue(job.account, 32)],
    fromBlock: Math.max(0, from),
    toBlock: "latest",
  });
  for (const l of logs) {
    const { usdtIn } = vusdIface.parseLog(l).args;
    if (BigInt(usdtIn) !== BigInt(job.amount)) continue;
    const [taken] = await sql`select id from bridge_swaps where deposit_tx = ${l.transactionHash} and id <> ${job.id}`;
    if (!taken) return l.transactionHash;
  }
  return null;
}

// ---- USDT (BSC) -> VUSD ----

async function runToVusd(job) {
  const user = ethers.getAddress(job.account);
  const relay = relayer();
  const block = BigInt(job.escrow_block);

  if (job.state === "new") {
    const esc = await readEscrow("USDT", BSC_CHAIN_ID, user);
    const zeroDone = job.zero_tx && (await providerFor(BSC_CHAIN_ID).getTransactionReceipt(job.zero_tx))?.status === 1;
    if (!zeroDone) {
      if (esc.amount === 0n || esc.blockNumber !== block) {
        if (job.receipt_id) await updateReceipt(job.receipt_id, { status: "void" });
        return save(job.id, { state: "void", error: "The locked USDT was refunded or replaced before the swap ran." });
      }
      if (!job.receipt_id) {
        try {
          await issueReceipt(job, { account: relay.address, sourceChainId: BSC_CHAIN_ID, amount: esc.amount, blockNumber: block });
        } catch (e) {
          if (!e.collision) throw e;
          return save(job.id, { state: "void", error: "This transfer cannot be relayed. Continue it as a normal bridge to receive USDT.b." });
        }
      }
      const zero = await txStep(job, "zero_tx", BSC_CHAIN_ID, "Close the BSC escrow", () => bridge(BSC_CHAIN_ID, bscRelayer()).zeroEscrow(user));
      await updateReceipt(job.receipt_id, { status: "issued", zeroTx: zero.hash });
    }
    Object.assign(job, await save(job.id, { state: "zeroed" }));
  }

  if (job.state === "zeroed") {
    const [r] = await sql`select * from bridge_receipts where id = ${job.receipt_id}`;
    const cr = chainReceipt({ account: r.account, destChainId: r.dest_chain_id, destContract: r.dest_contract, direction: r.direction, amount: String(r.amount), blockNumber: String(r.block_number) });
    let claimBlock = job.claim_block;
    if (!(await isClaimed(cr))) {
      const rc = await txStep(job, "claim_tx", VITRUVEO_CHAIN_ID, "Claim USDT.b", () =>
        bridge(VITRUVEO_CHAIN_ID, relay).claimToken(relay.address, BigInt(r.amount), Number(r.direction), BigInt(r.block_number), r.signature)
      );
      claimBlock = rc.blockNumber;
    }
    await updateReceipt(job.receipt_id, { status: "claimed", claimTx: job.claim_tx });
    Object.assign(job, await save(job.id, { state: "claimed", claimBlock }));
  }

  if (job.state === "claimed") {
    const amount = BigInt(job.amount);
    const adopted = job.deposit_tx ? null : await findDeposit(job);
    if (adopted) Object.assign(job, await save(job.id, { deposit_tx: adopted }));
    else if (!job.deposit_tx) await relayerFunds(amount);
    const usdtb = bridge(VITRUVEO_CHAIN_ID, relay);
    if (BigInt(await usdtb.allowance(relay.address, VUSD)) < amount) {
      const tx = await usdtb.approve(VUSD, ethers.MaxUint256);
      await tx.wait();
    }
    await txStep(job, "deposit_tx", VITRUVEO_CHAIN_ID, "Mint VUSD", () => vusd(relay).depositFor(user, amount));
    Object.assign(job, await save(job.id, { state: "done" }));
  }
  return job;
}

export async function startToVusd(account) {
  const user = ethers.getAddress(account);
  if (!relayer() || !bscRelayer()) throw new Error("Bridge relayer is not configured");
  const esc = await readEscrow("USDT", BSC_CHAIN_ID, user);
  if (esc.amount === 0n) {
    const [open] = await sql`select * from bridge_swaps where account = ${user.toLowerCase()} and kind = 'to_vusd' and state not in ('done', 'void') order by created_at desc limit 1`;
    if (open) return runSwap(open.id);
    throw Object.assign(new Error("No locked USDT on BSC"), { status: 404 });
  }
  const ref = `bsc:${user.toLowerCase()}:${esc.blockNumber}`;
  await sql`
    insert into bridge_swaps (kind, account, source_ref, amount, state, escrow_block)
    values ('to_vusd', ${user.toLowerCase()}, ${ref}, ${String(esc.amount)}, 'new', ${String(esc.blockNumber)})
    on conflict (source_ref) do nothing`;
  const [row] = await sql`select * from bridge_swaps where source_ref = ${ref}`;
  return runSwap(row.id);
}

// ---- VUSD -> USDT (BSC) ----

// USDT.b the user's redeemTo sent to the relayer (from the Redeemed event of that tx), or null.
async function redeemedOut(account, redeemTx) {
  const rc = await providerFor(VITRUVEO_CHAIN_ID).getTransactionReceipt(redeemTx);
  if (!rc) throw Object.assign(new Error("Redeem transaction not found on Vitruveo yet"), { status: 409 });
  if (rc.status !== 1) throw Object.assign(new Error("Redeem transaction reverted"), { status: 400 });
  let out = null;
  for (const l of rc.logs) {
    if (l.address.toLowerCase() !== VUSD.toLowerCase()) continue;
    let ev = null;
    try {
      ev = vusdIface.parseLog(l);
    } catch {}
    if (ev?.name === "Redeemed" && ev.args.burner.toLowerCase() === account.toLowerCase() && ev.args.recipient.toLowerCase() === relayerAddress().toLowerCase()) {
      out = BigInt(ev.args.usdtOut);
    }
  }
  return out;
}

async function runFromVusd(job) {
  const user = ethers.getAddress(job.account);
  const relay = relayer();
  const amount = BigInt(job.amount);

  if (job.state === "new") {
    const vp = providerFor(VITRUVEO_CHAIN_ID);
    let burnBlock = null;
    if (job.burn_tx) {
      const rc = await vp.getTransactionReceipt(job.burn_tx);
      if (rc?.status === 1) burnBlock = rc.blockNumber;
    }
    if (burnBlock == null) {
      if (!job.burn_tx) {
        // The relayer has one escrow slot; another swap's burn must be notarized first.
        const esc = await readEscrow("USDT", VITRUVEO_CHAIN_ID, relay.address);
        if (esc.amount > 0n) throw new Error("The bridge relayer is finishing another transfer. Continue again in a moment.");
        await relayerFunds(amount);
      }
      const rc = await txStep(job, "burn_tx", VITRUVEO_CHAIN_ID, "Send USDT.b to the bridge", () => bridge(VITRUVEO_CHAIN_ID, relay).burnUSDTToken(amount));
      burnBlock = rc.blockNumber;
    }
    // Any fraction the redeem returned cannot be bridged (whole units only): give it back as USDT.b.
    const dust = ((await redeemedOut(user, job.source_ref)) ?? amount) - amount;
    if (dust > 0n && !job.refund_tx) {
      await txStep(job, "refund_tx", VITRUVEO_CHAIN_ID, "Return the remainder", () => bridge(VITRUVEO_CHAIN_ID, relay).transfer(user, dust));
    }
    Object.assign(job, await save(job.id, { state: "burned", escrowBlock: burnBlock }));
  }

  if (job.state === "burned") {
    const block = BigInt(job.escrow_block);
    if (!job.receipt_id) await issueReceipt(job, { account: user, sourceChainId: VITRUVEO_CHAIN_ID, amount, blockNumber: block });
    const esc = await readEscrow("USDT", VITRUVEO_CHAIN_ID, relay.address);
    if (esc.amount > 0n && esc.blockNumber === block) {
      const zero = await txStep(job, "zero_tx", VITRUVEO_CHAIN_ID, "Close the Vitruveo escrow", () => bridge(VITRUVEO_CHAIN_ID, relay).zeroEscrow(relay.address));
      await updateReceipt(job.receipt_id, { status: "issued", zeroTx: zero.hash });
    } else if (!(job.zero_tx && (await providerFor(VITRUVEO_CHAIN_ID).getTransactionReceipt(job.zero_tx))?.status === 1)) {
      throw new Error("The relayer escrow for this transfer is missing; it needs manual review.");
    } else {
      await updateReceipt(job.receipt_id, { status: "issued", zeroTx: job.zero_tx });
    }
    Object.assign(job, await save(job.id, { state: "zeroed" }));
  }

  if (job.state === "zeroed") {
    const [r] = await sql`select * from bridge_receipts where id = ${job.receipt_id}`;
    const cr = chainReceipt({ account: r.account, destChainId: r.dest_chain_id, destContract: r.dest_contract, direction: r.direction, amount: String(r.amount), blockNumber: String(r.block_number) });
    if (!(await isClaimed(cr))) {
      await txStep(job, "claim_tx", BSC_CHAIN_ID, "Release USDT on BSC", () =>
        bridge(BSC_CHAIN_ID, bscRelayer()).claimUSDT(user, BigInt(r.amount), Number(r.direction), BigInt(r.block_number), r.signature)
      );
    }
    await updateReceipt(job.receipt_id, { status: "claimed", claimTx: job.claim_tx });
    Object.assign(job, await save(job.id, { state: "done" }));
  }
  return job;
}

// redeemTx: the user's VUSD.redeemTo(relayer, amount) transaction on Vitruveo.
export async function startFromVusd(account, redeemTx) {
  const user = ethers.getAddress(account);
  if (!relayer() || !bscRelayer()) throw new Error("Bridge relayer is not configured");
  const [existing] = await sql`select * from bridge_swaps where source_ref = ${redeemTx.toLowerCase()}`;
  if (existing) return runSwap(existing.id);

  const out = await redeemedOut(user, redeemTx);
  if (out == null) throw Object.assign(new Error("Not a VUSD redeem from this account to the bridge relayer"), { status: 400 });
  const whole = (out / ONE) * ONE;
  if (whole === 0n) throw Object.assign(new Error("Less than 1 USDT.b was redeemed; nothing to bridge"), { status: 400 });
  await sql`
    insert into bridge_swaps (kind, account, source_ref, amount, state)
    values ('from_vusd', ${user.toLowerCase()}, ${redeemTx.toLowerCase()}, ${String(whole)}, 'new')
    on conflict (source_ref) do nothing`;
  const [row] = await sql`select * from bridge_swaps where source_ref = ${redeemTx.toLowerCase()}`;
  return runSwap(row.id);
}

// ---- runner ----

export async function runSwap(id) {
  const leased = await lease(id);
  if (!leased) return getSwap(id); // another request is running it
  let job = leased;
  try {
    job = job.kind === "to_vusd" ? await runToVusd(job) : await runFromVusd(job);
    return job;
  } catch (e) {
    console.error("relay", id, e);
    return save(id, { error: errMsg(e) });
  } finally {
    await release(id);
  }
}
