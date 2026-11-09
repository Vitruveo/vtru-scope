import { errMsg } from "@/lib/bridge/config";
import { fail, isAdmin, json, preflight } from "@/lib/bridge/http";
import { deleteReceipt, getReceipt, reconcile, toReceipt, updateReceipt } from "@/lib/bridge/receipts";

// One bridge receipt.
//   GET                                   read
//   PATCH  {}                             re-check against the chain (pending -> issued/void, issued -> claimed)
//   PATCH  { status, claimTx }            admin only (X-Api-Key): set fields directly
//   DELETE                                admin only (X-Api-Key)
export const OPTIONS = preflight;

const STATUSES = new Set(["pending", "issued", "claimed", "void"]);
const validId = (id) => /^\d+$/.test(String(id));

export async function GET(req, { params }) {
  if (!validId(params.id)) return fail(req, 400, "Invalid id");
  const row = await getReceipt(params.id);
  return row ? json(req, toReceipt(row)) : fail(req, 404, "Receipt not found");
}

export async function PATCH(req, { params }) {
  if (!validId(params.id)) return fail(req, 400, "Invalid id");
  try {
    const body = await req.json().catch(() => ({}));
    let row = await getReceipt(params.id);
    if (!row) return fail(req, 404, "Receipt not found");
    if (body.status !== undefined || body.claimTx !== undefined) {
      if (!isAdmin(req)) return fail(req, 401, "Admin key required");
      if (body.status !== undefined && !STATUSES.has(body.status)) return fail(req, 400, "Invalid status");
      row = await updateReceipt(row.id, { status: body.status, claimTx: body.claimTx });
    } else {
      row = await reconcile(row);
    }
    return json(req, toReceipt(row));
  } catch (e) {
    return fail(req, 500, "Update failed", errMsg(e));
  }
}

export async function DELETE(req, { params }) {
  if (!validId(params.id)) return fail(req, 400, "Invalid id");
  if (!isAdmin(req)) return fail(req, 401, "Admin key required");
  return (await deleteReceipt(params.id)) ? json(req, { ok: true }) : fail(req, 404, "Receipt not found");
}
