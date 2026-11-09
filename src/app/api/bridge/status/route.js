import { bridgeStatus } from "@/lib/bridge/status";
import { errMsg } from "@/lib/bridge/config";
import { fail, json, preflight } from "@/lib/bridge/http";
import { parseAccount, parseToken } from "@/lib/bridge/params";

// GET /api/bridge/status?account=0x...&token=VTRU|USDT
// Open escrow, issued receipt awaiting redemption, and every pending item with the exact reason it is stalled.
// VTRU only: also re-issues forward receipts that were zeroed on chain but never stored (idempotent).
export const OPTIONS = preflight;

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const account = parseAccount(q.get("account"));
  if (!account) return fail(req, 400, "Invalid account");
  const token = parseToken(q.get("token"));
  if (!token) return fail(req, 400, "Unsupported token");
  try {
    return json(req, await bridgeStatus(account, token));
  } catch (e) {
    console.error("bridge status", e);
    return fail(req, 500, "Status failed", errMsg(e));
  }
}
