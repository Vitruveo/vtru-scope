import { runChecklist } from "@/lib/bridge/checklist";
import { errMsg } from "@/lib/bridge/config";
import { fail, json, preflight } from "@/lib/bridge/http";
import { parseAccount, parseChain, parseToken, parseVia, parseWhole } from "@/lib/bridge/params";
import { getReceipt, reconcile, toReceipt } from "@/lib/bridge/receipts";
import { cancelSteps, finishSteps, startSteps } from "@/lib/bridge/steps";

// POST /api/bridge/steps  -> { steps: [{ label, chainId, tx: { to, data, value } }] }
//   { action: "start",  token, account, from: 1490|56, amount, via? }  lock/burn (via "vusd": lock, or redeemTo
//                                                                      the relayer); refused unless the checklist passes
//   { action: "finish", account, receiptId }                     claim (VTRU forward: USDT fee approve first if needed)
//   { action: "cancel", token, account }                         refund the open escrow
// token: "VTRU" (default) | "USDT"
export const OPTIONS = preflight;

export async function POST(req) {
  try {
    const body = await req.json();
    const account = parseAccount(body.account);
    if (!account) return fail(req, 400, "Invalid account");
    const token = parseToken(body.token);
    if (!token) return fail(req, 400, "Unsupported token");
    const via = parseVia(token, body.via);
    if (via === undefined) return fail(req, 400, "Unsupported via");

    if (body.action === "start") {
      const from = parseChain(body.from);
      const amount = parseWhole(body.amount);
      if (!from) return fail(req, 400, "Invalid from chain");
      if (amount === 0n) return fail(req, 400, `Minimum bridge amount is 1 ${token}`);
      const check = await runChecklist({ account, fromChainId: from, amount, token, via });
      if (!check.pass) {
        const failed = check.items.filter((i) => i.state !== "ok");
        return json(req, { error: "Checklist failed", detail: failed.map((i) => `${i.label}: ${i.detail}`).join(" "), checklist: check.items }, 409);
      }
      return json(req, { steps: await startSteps(from, amount, token, account, via), checklist: check.items });
    }

    if (body.action === "finish") {
      if (!/^\d+$/.test(String(body.receiptId ?? ""))) return fail(req, 400, "Invalid receiptId");
      const row = await reconcile(await getReceipt(body.receiptId));
      if (!row || row.account !== account.toLowerCase()) return fail(req, 404, "Receipt not found");
      if (row.status !== "issued") return fail(req, 409, `Receipt is ${row.status}`);
      return json(req, { steps: await finishSteps(toReceipt(row)) });
    }

    if (body.action === "cancel") {
      const steps = await cancelSteps(account, token);
      return steps.length ? json(req, { steps }) : fail(req, 404, "No open escrow");
    }

    return fail(req, 400, "Unknown action");
  } catch (e) {
    if (e?.status) return fail(req, e.status, errMsg(e));
    console.error("bridge steps", e);
    return fail(req, 500, "Steps failed", errMsg(e));
  }
}
