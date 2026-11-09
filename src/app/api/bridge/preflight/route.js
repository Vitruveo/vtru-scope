import { runChecklist } from "@/lib/bridge/checklist";
import { errMsg } from "@/lib/bridge/config";
import { fail, json, preflight } from "@/lib/bridge/http";
import { parseAccount, parseChain, parseToken, parseVia, parseWhole } from "@/lib/bridge/params";

// GET /api/bridge/preflight?account=0x...&from=1490|56&amount=100&token=VTRU|USDT[&via=vusd]
// Pre-bridge checklist (gas on both chains, USDT fee on BSC), the fee quote, and the wallet's balances.
export const OPTIONS = preflight;

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const account = parseAccount(q.get("account"));
  const from = parseChain(q.get("from"));
  if (!account) return fail(req, 400, "Invalid account");
  if (!from) return fail(req, 400, "Invalid from chain");
  const token = parseToken(q.get("token"));
  if (!token) return fail(req, 400, "Unsupported token");
  const via = parseVia(token, q.get("via"));
  if (via === undefined) return fail(req, 400, "Unsupported via");
  try {
    return json(req, await runChecklist({ account, fromChainId: from, amount: parseWhole(q.get("amount")), token, via }));
  } catch (e) {
    console.error("bridge preflight", e);
    return fail(req, 500, "Preflight failed", errMsg(e));
  }
}
