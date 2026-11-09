// Chain reads and notary operations shared by the bridge API routes.
import { ethers } from "ethers";
import {
  BSC_CHAIN_ID,
  BSC_VTRU,
  CHAINS,
  DIRECTION,
  ERC20_ABI,
  GAS,
  TOKENS,
  USDT_BSC,
  V3_POOL,
  V3_POOL_ABI,
  VITRUVEO_CHAIN_ID,
  VITRUVEO_VTRU,
  VTRU_ABI,
  gasPrice,
  otherChain,
  providerFor,
  receiptHash,
} from "./config";

const Q96 = 2n ** 96n;

// USDT fee + 2% buffer for a forward (VitruveoToBsc) claim, priced off the PancakeSwap V3 pool
// exactly like the contract's _quoteVtruToUsdt.
export async function forwardFee(amount) {
  const p = providerFor(BSC_CHAIN_ID);
  const vtru = new ethers.Contract(BSC_VTRU, VTRU_ABI, p);
  const feeBps = BigInt(await vtru.feeBps());
  const feeVtru = (BigInt(amount) * feeBps) / 10000n;
  if (feeVtru === 0n) return { feeVtru: 0n, feeUsdt: 0n, maxFeeUsdt: 0n };
  const pool = new ethers.Contract(V3_POOL, V3_POOL_ABI, p);
  const [slot0, token0] = await Promise.all([pool.slot0(), pool.token0()]);
  const sp = BigInt(slot0[0]);
  const feeUsdt =
    token0.toLowerCase() === BSC_VTRU.toLowerCase() ? (feeVtru * sp * sp) / (Q96 * Q96) : (feeVtru * Q96 * Q96) / (sp * sp);
  return { feeVtru, feeUsdt, maxFeeUsdt: (feeUsdt * 102n) / 100n };
}

export async function readEscrow(token, chainId, account) {
  const tok = TOKENS[token];
  const c = new ethers.Contract(tok.address[chainId], tok.abi, providerFor(chainId));
  const esc = await c.escrow(account);
  return { amount: BigInt(esc.amount ?? esc[0]), blockNumber: BigInt(esc.blockNumber ?? esc[1]) };
}

export async function isClaimed(r) {
  const tok = TOKENS[r.token || "VTRU"];
  const c = new ethers.Contract(r.destContract, tok.abi, providerFor(Number(r.destChainId)));
  return c.claimed(receiptHash(r));
}

export function notaryWallet(chainId) {
  const key = CHAINS[chainId].notaryKey;
  return key ? new ethers.Wallet(key, providerFor(chainId)) : null;
}

// Receipt for an escrow, signed by the DESTINATION chain's notary and bound to that chain + contract.
export async function signReceipt({ token, account, sourceChainId, amount, blockNumber }) {
  const destChainId = otherChain(sourceChainId);
  const signer = notaryWallet(destChainId);
  if (!signer) throw new Error(`Notary key for ${destChainId} is not configured`);
  const r = {
    token,
    account,
    sourceChainId,
    destChainId,
    destContract: TOKENS[token].address[destChainId],
    direction: DIRECTION[sourceChainId],
    amount: BigInt(amount),
    blockNumber: BigInt(blockNumber),
  };
  const hash = receiptHash(r);
  const signature = await signer.signMessage(ethers.getBytes(hash));
  return { ...r, receiptHash: hash, signature };
}

// Address that produced a receipt signature, and whether it holds NOTARY_ROLE on the destination contract.
export async function verifyReceiptSignature(r) {
  const hash = receiptHash(r);
  const signer = ethers.verifyMessage(ethers.getBytes(hash), r.signature);
  const tok = TOKENS[r.token || "VTRU"];
  const c = new ethers.Contract(r.destContract, tok.abi, providerFor(Number(r.destChainId)));
  let valid;
  if (r.token === "USDT") {
    const expected = await c.notary();
    valid = expected.toLowerCase() === signer.toLowerCase();
  } else {
    valid = await c.hasRole(await c.NOTARY_ROLE(), signer);
  }
  return { hash, signer, valid };
}

// hasRole: the key may notarize on this chain's contract (VTRU: NOTARY_ROLE; BridgedUSDT: equals notary()).
export async function notaryStatus(chainId, token = "VTRU") {
  const w = notaryWallet(chainId);
  if (!w) return { chainId, configured: false };
  const p = providerFor(chainId);
  const tok = TOKENS[token];
  const c = new ethers.Contract(tok.address[chainId], tok.abi, p);
  const [balance, gp, hasRole] = await Promise.all([
    p.getBalance(w.address),
    gasPrice(chainId),
    token === "USDT" ? c.notary().then((a) => a.toLowerCase() === w.address.toLowerCase()) : c.NOTARY_ROLE().then((role) => c.hasRole(role, w.address)),
  ]);
  return {
    chainId,
    configured: true,
    address: w.address,
    hasRole,
    balance: balance.toString(),
    requiredZero: (gp * GAS.zero).toString(),
    // The Vitruveo notary fronts claim gas to empty wallets on BSC -> Vitruveo transfers.
    requiredFront: chainId === VITRUVEO_CHAIN_ID ? (gp * GAS.vitClaim).toString() : "0",
  };
}

// Forward VTRU bridges (Vitruveo -> BSC) that the notary zeroed but that were never claimed on BSC.
// One escrow per user at a time, so each BridgeInitiated is closed by the next EscrowZeroed or EscrowCancelled.
// BSC -> Vitruveo cannot be scanned: the public BSC RPC does not serve eth_getLogs.
export async function findUnclaimedForward(account) {
  const vp = providerFor(VITRUVEO_CHAIN_ID);
  const iface = new ethers.Interface(VTRU_ABI);
  const acctTopic = ethers.zeroPadValue(account, 32);
  const query = (event, topics) =>
    vp.getLogs({ address: VITRUVEO_VTRU, topics: [iface.getEvent(event).topicHash, ...topics], fromBlock: 0, toBlock: "latest" });
  const [initiated, zeroed, cancelled] = await Promise.all([
    query("BridgeInitiated", [null, acctTopic]),
    query("EscrowZeroed", [acctTopic]),
    query("EscrowCancelled", [acctTopic]),
  ]);
  const events = [
    ...initiated.map((l) => ({ kind: "init", log: l, parsed: iface.parseLog(l) })),
    ...zeroed.map((l) => ({ kind: "zero", log: l })),
    ...cancelled.map((l) => ({ kind: "cancel", log: l })),
  ].sort((a, b) => a.log.blockNumber - b.log.blockNumber || a.log.index - b.log.index);

  const closed = [];
  let open = null;
  for (const e of events) {
    if (e.kind === "init") open = e;
    else if (open) {
      if (e.kind === "zero") closed.push({ init: open, zeroLog: e.log });
      open = null;
    }
  }

  const out = [];
  for (const { init, zeroLog } of closed) {
    const r = {
      token: "VTRU",
      account,
      sourceChainId: VITRUVEO_CHAIN_ID,
      destChainId: BSC_CHAIN_ID,
      destContract: BSC_VTRU,
      direction: Number(init.parsed.args.direction),
      amount: BigInt(init.parsed.args.amount),
      blockNumber: BigInt(init.parsed.args.blockNumber),
    };
    if (!(await isClaimed(r))) out.push({ ...r, lockTx: init.log.transactionHash, zeroTx: zeroLog.transactionHash, zeroedBlock: zeroLog.blockNumber });
  }
  return out;
}

export { ERC20_ABI, USDT_BSC };
