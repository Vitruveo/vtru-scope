import { ethers } from "ethers";
import { errMsg } from "@/lib/bridge/config";
import { fail, json, preflight } from "@/lib/bridge/http";
import { parseAccount, parseChain, parseToken } from "@/lib/bridge/params";
import { trackTx, trackedTxState, untrackTx } from "@/lib/bridge/status";

// Tracked bridge transactions (shown in status until mined successfully).
//   POST   { account, chainId, hash, label, token }   start tracking a broadcast tx (token VTRU|USDT, default VTRU)
//   GET    ?chainId=&hash=                      current state: pending | success | reverted | replaced | dropped
//   DELETE ?account=&hash=                      stop tracking (dismiss a reverted/dropped tx)
export const OPTIONS = preflight;

const isHash = (h) => typeof h === "string" && ethers.isHexString(h, 32);

export async function POST(req) {
  try {
    const { account, chainId, hash, label, token } = await req.json();
    const acct = parseAccount(account);
    const chain = parseChain(chainId);
    const tok = parseToken(token);
    if (!acct || !chain || !isHash(hash) || !tok) return fail(req, 400, "Invalid account, chainId, hash or token");
    await trackTx({ account: acct, chainId: chain, hash, label: String(label || "Bridge transaction").slice(0, 64), token: tok });
    return json(req, { ok: true });
  } catch (e) {
    return fail(req, 400, "Track failed", errMsg(e));
  }
}

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const chain = parseChain(q.get("chainId"));
  const hash = q.get("hash");
  if (!chain || !isHash(hash)) return fail(req, 400, "Invalid chainId or hash");
  try {
    return json(req, await trackedTxState(chain, hash));
  } catch (e) {
    return fail(req, 500, "Lookup failed", errMsg(e));
  }
}

export async function DELETE(req) {
  const q = new URL(req.url).searchParams;
  const acct = parseAccount(q.get("account"));
  const hash = q.get("hash");
  if (!acct || !isHash(hash)) return fail(req, 400, "Invalid account or hash");
  await untrackTx(acct, hash);
  return json(req, { ok: true });
}
