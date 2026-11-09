import { ethers } from "ethers";
import { DIRECTION, TOKENS, errMsg, otherChain } from "@/lib/bridge/config";
import { isClaimed, verifyReceiptSignature } from "@/lib/bridge/chain";
import { fail, json, preflight } from "@/lib/bridge/http";
import { parseAccount, parseChain } from "@/lib/bridge/params";
import { insertReceipt, listReceipts, toReceipt } from "@/lib/bridge/receipts";

// Bridge receipts.
//   GET  ?account=&token=VTRU|USDT&status=pending|issued|claimed|void&limit=50   list (newest first)
//   POST { token, account, destChainId, destContract, direction, amount, blockNumber, signature }
//        store a notary-signed receipt (e.g. one a browser saved before receipts lived on the server).
//        Accepted only if the signature recovers to the destination contract's notary.
// Signatures are only returned for issued/claimed receipts.
export const OPTIONS = preflight;

const STATUSES = new Set(["pending", "issued", "claimed", "void"]);

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const account = q.get("account") ? parseAccount(q.get("account")) : undefined;
  if (account === null) return fail(req, 400, "Invalid account");
  const token = q.get("token") || undefined;
  if (token && !TOKENS[token]) return fail(req, 400, "Unsupported token");
  const status = q.get("status") || undefined;
  if (status && !STATUSES.has(status)) return fail(req, 400, "Invalid status");
  const limit = Math.min(200, Math.max(1, Number(q.get("limit")) || 50));
  try {
    const rows = await listReceipts({ account, token, status, limit });
    return json(req, { receipts: rows.map(toReceipt) });
  } catch (e) {
    return fail(req, 500, "List failed", errMsg(e));
  }
}

export async function POST(req) {
  try {
    const b = await req.json();
    const token = b.token || "VTRU";
    const account = parseAccount(b.account);
    const destChainId = parseChain(b.destChainId);
    if (!TOKENS[token]) return fail(req, 400, "Unsupported token");
    if (!account || !destChainId) return fail(req, 400, "Invalid account or destChainId");
    const sourceChainId = otherChain(destChainId);
    const destContract = TOKENS[token].address[destChainId];
    if (String(b.destContract || "").toLowerCase() !== destContract.toLowerCase()) return fail(req, 400, "destContract does not match the token");
    if (Number(b.direction) !== DIRECTION[sourceChainId]) return fail(req, 400, "direction does not match the chains");
    if (!ethers.isHexString(b.signature)) return fail(req, 400, "Invalid signature");

    const r = {
      token,
      account,
      sourceChainId,
      destChainId,
      destContract,
      direction: DIRECTION[sourceChainId],
      amount: BigInt(b.amount),
      blockNumber: BigInt(b.blockNumber),
      signature: b.signature,
    };
    if (r.amount <= 0n) return fail(req, 400, "Invalid amount");
    const { hash, valid, signer } = await verifyReceiptSignature(r);
    if (!valid) return fail(req, 422, "Signature is not from the destination notary", signer);

    const status = (await isClaimed(r)) ? "claimed" : "issued";
    const row = await insertReceipt({ ...r, receiptHash: hash }, { status, source: "client" });
    return json(req, toReceipt(row), 201);
  } catch (e) {
    return fail(req, 500, "Create failed", errMsg(e));
  }
}
