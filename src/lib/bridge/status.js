// Everything unfinished for a wallet on one bridge (VTRU or USDT), each item with the exact reason it is stalled.
// item: { key, kind, severity, title, reasons: string[], links: [{ label, href }], dismissHash?, receiptId? }
import { ethers } from "ethers";
import { forwardFee, notaryStatus, readEscrow } from "./chain";
import {
  BSC_CHAIN_ID,
  CHAIN_NAME,
  ERC20_ABI,
  GAS,
  TOKENS,
  TX_URL,
  USDT_BSC,
  VITRUVEO_CHAIN_ID,
  VTRU_ABI,
  ago,
  errMsg,
  fmt,
  fmtGas,
  gasPrice,
  gwei,
  otherChain,
  providerFor,
  BSC_VTRU,
} from "./config";
import { sql } from "./db";
import { listReceipts, reconcile, recoverForward, toReceipt } from "./receipts";
import { listOpenSwaps } from "./relay";

// Where an unfinished relayed VUSD swap stopped, in the user's terms.
const SWAP_STAGE = {
  to_vusd: {
    new: "Your USDT is locked on BSC; the bridge has not closed the escrow yet.",
    zeroed: "The bridge closed the BSC escrow; it has not claimed the USDT.b on Vitruveo yet.",
    claimed: "The bridge claimed the USDT.b; it has not minted your VUSD yet.",
  },
  from_vusd: {
    new: "Your VUSD was redeemed to the bridge; it has not sent the USDT.b across yet.",
    burned: "The bridge sent the USDT.b across; it has not notarized the transfer yet.",
    zeroed: "The transfer is notarized; the bridge has not released your USDT on BSC yet.",
  },
};

// Unit shown for each token on each chain.
const UNIT = {
  VTRU: { [VITRUVEO_CHAIN_ID]: "VTRU", [BSC_CHAIN_ID]: "VTRU" },
  USDT: { [VITRUVEO_CHAIN_ID]: "USDT.b", [BSC_CHAIN_ID]: "USDT" },
};

// ---- tracked bridge transactions ----

export async function trackTx({ account, chainId, hash, label, token = "VTRU" }) {
  const tx = await providerFor(chainId).getTransaction(hash);
  if (tx && tx.from.toLowerCase() !== account.toLowerCase()) throw new Error("Transaction was not sent by this account");
  await sql`
    insert into bridge_txs (hash, account, chain_id, label, nonce, token)
    values (${hash}, ${account.toLowerCase()}, ${chainId}, ${label}, ${tx ? tx.nonce : null}, ${token})
    on conflict (hash) do nothing`;
}

export const untrackTx = (account, hash) => sql`delete from bridge_txs where hash = ${hash} and account = ${account.toLowerCase()}`;

// A tx broadcast through the wallet's own RPC (or a private relay) can take a while to reach the public RPC
// this server reads. Until this long after broadcast, an invisible tx is reported as pending, never dropped.
const VISIBILITY_GRACE_MS = 3 * 60 * 1000;

// A tx younger than this is simply in progress (the client shows its own progress). Nonce diagnostics on it
// are noise: public RPCs behind load balancers can briefly report a stale nonce, so it is not listed yet.
const IN_PROGRESS_MS = 30 * 1000;

// State of a tracked tx, using the broadcast time and nonce recorded when it was tracked. Fills in the nonce
// once the tx becomes visible (it is often not visible yet when the client tracks it).
export async function trackedTxState(chainId, hash) {
  const [row] = await sql`select * from bridge_txs where hash = ${hash}`;
  const s = await txState(chainId, hash, row ? { nonce: row.nonce != null ? Number(row.nonce) : null, at: row.created_at, account: row.account } : {});
  if (row && row.nonce == null && s.nonce != null) await sql`update bridge_txs set nonce = ${s.nonce} where hash = ${hash}`;
  return s;
}

// Lifecycle of one tx: { state: pending|success|reverted|replaced|dropped, ... }
export async function txState(chainId, hash, { nonce, at, account } = {}) {
  const p = providerFor(chainId);
  const chainName = CHAIN_NAME[chainId];
  const [tx, rcpt] = await Promise.all([p.getTransaction(hash), p.getTransactionReceipt(hash)]);
  if (rcpt) {
    if (rcpt.status === 1) return { state: "success", blockNumber: rcpt.blockNumber };
    let reason = "no revert reason returned";
    try {
      await p.call({ to: tx.to, from: tx.from, data: tx.data, value: tx.value, blockTag: rcpt.blockNumber });
    } catch (e) {
      reason = errMsg(e);
    }
    return { state: "reverted", blockNumber: rcpt.blockNumber, reason: `Reverted in block ${rcpt.blockNumber}: ${reason}` };
  }
  const from = tx?.from || account;
  const n = tx ? tx.nonce : nonce;
  // Unknown broadcast time: nothing to judge "dropped" against, so it stays pending.
  if (!tx && (!at || Date.now() - new Date(at).getTime() < VISIBILITY_GRACE_MS)) {
    return { state: "pending", reason: `${at ? `Broadcast ${ago(at)} ago, n` : "N"}ot yet visible on the public ${chainName} RPC.` };
  }
  const latestNonce = from ? await p.getTransactionCount(from, "latest") : null;
  if (!tx) {
    return n != null && latestNonce != null && latestNonce > n
      ? { state: "replaced", reason: `Nonce ${n} was mined by a different transaction (sped up or cancelled in the wallet). This transaction will never confirm.` }
      : { state: "dropped", reason: `Not in any block or in the RPC mempool${at ? ` after ${ago(at)}` : ""}; nonce ${n ?? "?"} is still unused. It was evicted and must be sent again.` };
  }
  const txPrice = BigInt(tx.gasPrice ?? tx.maxFeePerGas ?? 0n);
  const netPrice = await gasPrice(chainId);
  let reason;
  if (latestNonce != null && tx.nonce > latestNonce) {
    reason = `Blocked by an earlier transaction: this is nonce ${tx.nonce}, but nonce ${latestNonce} has not been mined yet.`;
  } else if (netPrice > 0n && txPrice < netPrice) {
    reason = `Gas price ${gwei(txPrice)} gwei is below the current ${chainName} gas price of ${gwei(netPrice)} gwei. Speed it up in your wallet.`;
  } else {
    reason = `Broadcast${at ? ` ${ago(at)} ago` : ""}, not mined yet (gas price ${gwei(txPrice)} gwei, network ${gwei(netPrice)} gwei).`;
  }
  return { state: "pending", reason, nonce: tx.nonce };
}

// ---- receipts / escrows ----

// USDT receipts: claimToken mints USDT.b on Vitruveo, claimUSDT releases USDT on BSC. No fee on the claim.
async function diagnoseUsdtReceipt(r) {
  const destId = Number(r.destChainId);
  const destName = CHAIN_NAME[destId];
  const p = providerFor(destId);
  const amount = BigInt(r.amount);
  const c = new ethers.Contract(r.destContract, TOKENS.USDT.abi, p);
  const fn = destId === VITRUVEO_CHAIN_ID ? "claimToken" : "claimUSDT";
  const [bal, gp] = await Promise.all([p.getBalance(r.account), gasPrice(destId)]);
  const need = gp * (destId === VITRUVEO_CHAIN_ID ? GAS.vitClaim : GAS.bscFinish);
  const native = destId === VITRUVEO_CHAIN_ID ? "VTRU" : "BNB";
  const reasons = [];
  if (bal < need) reasons.push(`Not enough ${native} for gas on ${destName}: you hold ${fmtGas(bal)}, the claim needs ~${fmtGas(need)}.`);
  try {
    await c[fn].staticCall(r.account, amount, Number(r.direction), BigInt(r.blockNumber), r.signature, { from: r.account });
  } catch (e) {
    reasons.push(`The claim would revert on ${destName}: ${errMsg(e)}`);
  }
  if (reasons.length === 0) reasons.push(`Receipt is signed and valid; the claim on ${destName} has not been submitted yet.`);
  return {
    item: {
      key: `receipt-${r.id}`,
      kind: "receipt",
      receiptId: r.id,
      severity: "warning",
      title: `${fmt(amount)} ${UNIT.USDT[destId]} notarized, waiting to be received on ${destName}`,
      reasons,
      links: r.zeroTx ? [{ label: "Notary tx", href: TX_URL[r.sourceChainId](r.zeroTx) }] : [],
    },
    fee: null,
  };
}

async function diagnoseReceipt(r) {
  if (r.token === "USDT") return diagnoseUsdtReceipt(r);
  const destId = Number(r.destChainId);
  const destName = CHAIN_NAME[destId];
  const destVtru = new ethers.Contract(r.destContract, VTRU_ABI, providerFor(destId));
  const amount = BigInt(r.amount);
  const args = [r.account, amount, Number(r.direction), BigInt(r.blockNumber)];
  const reasons = [];
  let fee = null;
  if (destId === BSC_CHAIN_ID) {
    const bp = providerFor(BSC_CHAIN_ID);
    const [bnb, usdt, allowance, gp, f] = await Promise.all([
      bp.getBalance(r.account),
      new ethers.Contract(USDT_BSC, ERC20_ABI, bp).balanceOf(r.account),
      new ethers.Contract(USDT_BSC, ERC20_ABI, bp).allowance(r.account, BSC_VTRU),
      gasPrice(BSC_CHAIN_ID),
      forwardFee(amount),
    ]);
    fee = f;
    const needBnb = gp * GAS.bscFinish;
    if (bnb < needBnb) reasons.push(`Not enough BNB for gas on BSC: you hold ${fmtGas(bnb)}, the claim needs ~${fmtGas(needBnb)}.`);
    if (usdt < f.maxFeeUsdt) reasons.push(`Not enough USDT for the bridge fee on BSC: you hold ${fmt(usdt, 6)}, the fee is up to ${fmt(f.maxFeeUsdt, 6)}.`);
    if (f.maxFeeUsdt > 0n && allowance < f.maxFeeUsdt) {
      reasons.push(`USDT fee not approved yet (allowance ${fmt(allowance, 6)} of ${fmt(f.maxFeeUsdt, 6)}); the approve step runs before the claim.`);
    } else {
      try {
        await destVtru.claimToken.staticCall(...args, f.maxFeeUsdt, r.signature, { from: r.account });
      } catch (e) {
        reasons.push(`The claim would revert on BSC: ${errMsg(e)}`);
      }
    }
  } else {
    const vp = providerFor(VITRUVEO_CHAIN_ID);
    const [bal, gp] = await Promise.all([vp.getBalance(r.account), gasPrice(VITRUVEO_CHAIN_ID)]);
    const need = gp * GAS.vitClaim;
    if (bal < need) reasons.push(`Not enough VTRU for gas on Vitruveo: you hold ${fmtGas(bal)}, the claim needs ~${fmtGas(need)}.`);
    try {
      await destVtru.claimCoin.staticCall(...args, r.signature, { from: r.account });
    } catch (e) {
      reasons.push(`The claim would revert on Vitruveo: ${errMsg(e)}`);
    }
  }
  if (r.source === "recovered") reasons.push("This receipt was re-issued by the notary from the on-chain lock and zero events.");
  if (reasons.length === 0) reasons.push(`Receipt is signed and valid; the claim on ${destName} has not been submitted yet.`);
  return {
    item: {
      key: `receipt-${r.id}`,
      kind: "receipt",
      receiptId: r.id,
      severity: "warning",
      title: `${fmt(amount)} VTRU notarized, waiting to be received on ${destName}`,
      reasons,
      links: r.zeroTx ? [{ label: "Notary tx", href: TX_URL[r.sourceChainId](r.zeroTx) }] : [],
    },
    fee,
  };
}

function diagnoseEscrow(esc, notary, vitBal, token) {
  const src = esc.sourceChainId;
  const dest = otherChain(src);
  const reasons = [];
  for (const id of [src, dest]) {
    const n = notary[id];
    if (!n) continue;
    if (n.error) reasons.push(`Could not read the ${CHAIN_NAME[id]} notary: ${n.error}`);
    else if (!n.configured) reasons.push(`The ${CHAIN_NAME[id]} notary key is not configured on the server, so notarization fails.`);
    else if (!n.hasRole) {
      reasons.push(
        token === "USDT"
          ? `Notary ${n.address} is not the notary of the ${CHAIN_NAME[id]} BridgedUSDT contract.`
          : `Notary ${n.address} does not hold NOTARY_ROLE on the ${CHAIN_NAME[id]} VTRU contract.`
      );
    }
  }
  const sn = notary[src];
  if (sn?.configured && !sn.error && BigInt(sn.balance) < BigInt(sn.requiredZero)) {
    reasons.push(`The ${CHAIN_NAME[src]} notary ${sn.address} holds ${fmtGas(BigInt(sn.balance))}, needs ~${fmtGas(BigInt(sn.requiredZero))} gas to close the escrow.`);
  }
  const vn = notary[VITRUVEO_CHAIN_ID];
  if (dest === VITRUVEO_CHAIN_ID && vitBal === 0n && vn?.configured && !vn.error && BigInt(vn.balance) < BigInt(vn.requiredFront)) {
    reasons.push(`Your Vitruveo wallet is empty and the Vitruveo notary ${vn.address} holds ${fmtGas(BigInt(vn.balance))} VTRU, too little to front your claim gas.`);
  }
  if (reasons.length === 0) {
    reasons.push(
      `Locked at ${CHAIN_NAME[src]} block ${esc.blockNumber}, but notarization was never completed (the transfer was interrupted after the lock confirmed). Continue to finish, or cancel to refund.`
    );
  }
  return {
    key: `escrow-${src}-${esc.blockNumber}`,
    kind: "escrow",
    severity: "warning",
    title: `${fmt(esc.amount)} ${UNIT[token][src]} ${(token === "USDT") === (src === BSC_CHAIN_ID) ? "locked" : "burned"} on ${CHAIN_NAME[src]}, not notarized`,
    reasons,
    links: [],
  };
}

// ---- full status ----

export async function bridgeStatus(account, token = "VTRU") {
  const acct = ethers.getAddress(account);
  const items = [];

  // Re-issue any forward VTRU receipt that was zeroed on chain but never stored or claimed (idempotent).
  let recoverError = null;
  if (token === "VTRU") await recoverForward(acct).catch((e) => (recoverError = errMsg(e)));

  const [notaryV, notaryB, vitBal, escV, escB, rows, tracked] = await Promise.all([
    notaryStatus(VITRUVEO_CHAIN_ID, token).catch((e) => ({ error: errMsg(e) })),
    notaryStatus(BSC_CHAIN_ID, token).catch((e) => ({ error: errMsg(e) })),
    providerFor(VITRUVEO_CHAIN_ID).getBalance(acct),
    readEscrow(token, VITRUVEO_CHAIN_ID, acct),
    readEscrow(token, BSC_CHAIN_ID, acct),
    listReceipts({ account: acct, token }),
    sql`select * from bridge_txs where account = ${acct.toLowerCase()} and token = ${token} order by created_at`,
  ]);
  const notary = { [VITRUVEO_CHAIN_ID]: notaryV, [BSC_CHAIN_ID]: notaryB };

  // 1. Bridge transactions broadcast by a bridge client that have not mined successfully.
  const trackedPending = { [VITRUVEO_CHAIN_ID]: new Set(), [BSC_CHAIN_ID]: new Set() };
  const inProgress = { [VITRUVEO_CHAIN_ID]: false, [BSC_CHAIN_ID]: false };
  for (const t of tracked) {
    try {
      const s = await trackedTxState(t.chain_id, t.hash);
      if (s.state === "success") {
        await untrackTx(acct, t.hash);
        continue;
      }
      if (s.state === "pending" && (s.nonce ?? t.nonce) != null) trackedPending[t.chain_id].add(Number(s.nonce ?? t.nonce));
      if (s.state === "pending" && Date.now() - new Date(t.created_at).getTime() < IN_PROGRESS_MS) {
        inProgress[t.chain_id] = true;
        continue;
      }
      const chainName = CHAIN_NAME[t.chain_id];
      items.push({
        key: `tx-${t.hash}`,
        kind: "tx",
        severity: s.state === "pending" ? "warning" : "error",
        title: `${t.label} ${s.state === "pending" ? "pending" : s.state} on ${chainName}`,
        reasons: [s.reason],
        links: [{ label: "View transaction", href: TX_URL[t.chain_id](t.hash) }],
        dismissHash: s.state === "pending" ? undefined : t.hash,
      });
    } catch (e) {
      console.error("txState", e);
    }
  }

  // 2. Other wallet transactions sitting in either chain's mempool. Skipped on a chain where a bridge tx was
  //    just sent: its nonce may not be known yet, so it would be miscounted as an "other" transaction.
  for (const id of [VITRUVEO_CHAIN_ID, BSC_CHAIN_ID]) {
    if (inProgress[id]) continue;
    try {
      const p = providerFor(id);
      const [latest, pend] = await Promise.all([p.getTransactionCount(acct, "latest"), p.getTransactionCount(acct, "pending")]);
      const others = [];
      for (let n = latest; n < pend; n++) if (!trackedPending[id].has(n)) others.push(n);
      if (others.length) {
        const many = others.length > 1;
        items.push({
          key: `mempool-${id}`,
          kind: "mempool",
          severity: "warning",
          title: `${others.length} other wallet transaction${many ? "s" : ""} pending on ${CHAIN_NAME[id]}`,
          reasons: [
            `Nonce${many ? "s" : ""} ${others.join(", ")} broadcast but not mined. New ${CHAIN_NAME[id]} transactions from this wallet, including bridge steps, queue behind ${many ? "them" : "it"} until mined, sped up, or cancelled in the wallet.`,
          ],
          links: [],
        });
      }
    } catch (e) {
      console.error("nonce check", e);
    }
  }

  // 3. Issued receipts awaiting redemption (reconciled against the chain first).
  let receipt = null;
  let receiptFee = null;
  for (const row of rows) {
    if (row.status !== "issued" && row.status !== "pending") continue;
    if (row.source === "relay") continue; // part of a relayed VUSD swap: reported with the swap below
    const fresh = await reconcile(row);
    if (fresh.status !== "issued") continue;
    const r = toReceipt(fresh);
    const { item, fee } = await diagnoseReceipt(r);
    items.push(item);
    if (!receipt) {
      receipt = r;
      receiptFee = fee;
    }
  }

  // 4. Raw escrow (locked/burned, not notarized).
  let escrow = null;
  if (escV.amount > 0n) escrow = { sourceChainId: VITRUVEO_CHAIN_ID, ...escV };
  else if (escB.amount > 0n) escrow = { sourceChainId: BSC_CHAIN_ID, ...escB };
  if (escrow) items.push(diagnoseEscrow(escrow, notary, vitBal, token));

  // 5. Relayed VUSD swaps that stopped part way (USDT bridge only). One still running quietly is not listed.
  if (token === "USDT") {
    for (const sw of await listOpenSwaps(acct)) {
      const quiet = !sw.error && Date.now() - new Date(sw.updated_at).getTime() < 2 * 60 * 1000;
      if (quiet) continue;
      const amount = fmt(BigInt(sw.amount));
      const reasons = [SWAP_STAGE[sw.kind]?.[sw.state] || `Stopped at step "${sw.state}".`];
      if (sw.error) reasons.push(`Last attempt: ${sw.error}`);
      reasons.push("Continue to let the bridge finish it.");
      items.push({
        key: `swap-${sw.id}`,
        kind: "swap",
        swapId: String(sw.id),
        severity: "warning",
        title: sw.kind === "to_vusd" ? `${amount} USDT → VUSD not finished` : `${amount} VUSD → USDT not finished`,
        reasons,
        links: [],
      });
    }
  }

  if (recoverError) {
    items.push({ key: "recover-error", kind: "info", severity: "info", title: "Could not scan past transfers", reasons: [recoverError], links: [] });
  }

  return { account: acct, token, escrow, receipt, receiptFee, items };
}
