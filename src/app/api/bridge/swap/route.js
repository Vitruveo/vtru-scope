import { ethers } from "ethers";
import { errMsg } from "@/lib/bridge/config";
import { fail, json, preflight } from "@/lib/bridge/http";
import { parseAccount } from "@/lib/bridge/params";
import { getSwap, listOpenSwaps, runSwap, startFromVusd, startToVusd, toSwap } from "@/lib/bridge/relay";

// VUSD swaps relayed by the bridge (see src/lib/bridge/relay.js).
//   POST { action: "to_vusd",   account }            after the user's USDT lock on BSC confirms
//   POST { action: "from_vusd", account, redeemTx }  after the user's VUSD.redeemTo(relayer) confirms
//   POST { action: "resume",    account, id }        continue an interrupted swap
//   GET  ?id=  |  ?account=                          one swap, or the account's unfinished swaps
// A POST runs the swap to completion when it can and returns it: { id, kind, state, done, error, txs, ... }.
// done=false with an error means it stopped at a step; resume continues from there.
export const OPTIONS = preflight;
export const maxDuration = 300;

export async function POST(req) {
  try {
    const body = await req.json();
    const account = parseAccount(body.account);
    if (!account) return fail(req, 400, "Invalid account");
    let row;
    if (body.action === "to_vusd") row = await startToVusd(account);
    else if (body.action === "from_vusd") {
      if (!ethers.isHexString(body.redeemTx, 32)) return fail(req, 400, "Invalid redeemTx");
      row = await startFromVusd(account, body.redeemTx);
    } else if (body.action === "resume") {
      const own = /^\d+$/.test(String(body.id ?? "")) ? await getSwap(body.id) : null;
      if (!own || own.account !== account.toLowerCase()) return fail(req, 404, "Swap not found");
      row = await runSwap(own.id);
    } else return fail(req, 400, "Unknown action");
    return json(req, toSwap(row));
  } catch (e) {
    if (e?.status) return fail(req, e.status, errMsg(e));
    console.error("bridge swap", e);
    return fail(req, 500, "Swap failed", errMsg(e));
  }
}

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  try {
    if (q.get("id")) {
      if (!/^\d+$/.test(q.get("id"))) return fail(req, 400, "Invalid id");
      const row = await getSwap(q.get("id"));
      return row ? json(req, toSwap(row)) : fail(req, 404, "Swap not found");
    }
    const account = parseAccount(q.get("account"));
    if (!account) return fail(req, 400, "Invalid account");
    return json(req, { swaps: (await listOpenSwaps(account)).map(toSwap) });
  } catch (e) {
    return fail(req, 500, "Lookup failed", errMsg(e));
  }
}
