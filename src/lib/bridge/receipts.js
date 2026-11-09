// Receipt store (Neon) plus the chain reconciliation that keeps row status truthful.
import { sql, toReceipt } from "./db";
import { findUnclaimedForward, isClaimed, readEscrow, signReceipt } from "./chain";
import { providerFor } from "./config";

const rowToChainReceipt = (row) => ({
  token: row.token,
  account: row.account,
  destChainId: row.dest_chain_id,
  destContract: row.dest_contract,
  direction: row.direction,
  amount: String(row.amount),
  blockNumber: String(row.block_number),
});

export async function insertReceipt(r, { status, source = "notarize" }) {
  const rows = await sql`
    insert into bridge_receipts
      (token, account, source_chain_id, dest_chain_id, dest_contract, direction, amount, block_number, receipt_hash, signature, status, source)
    values
      (${r.token}, ${r.account.toLowerCase()}, ${r.sourceChainId}, ${r.destChainId}, ${r.destContract}, ${r.direction},
       ${String(r.amount)}, ${String(r.blockNumber)}, ${r.receiptHash}, ${r.signature}, ${status}, ${source})
    on conflict (receipt_hash) do update set
      signature = excluded.signature,
      status = case when bridge_receipts.status in ('issued', 'claimed') then bridge_receipts.status else excluded.status end,
      updated_at = now()
    returning *`;
  return rows[0];
}

export async function getReceipt(id) {
  const rows = await sql`select * from bridge_receipts where id = ${id}`;
  return rows[0] || null;
}

export async function getReceiptByEscrow(token, sourceChainId, account, blockNumber) {
  const rows = await sql`
    select * from bridge_receipts
    where token = ${token} and source_chain_id = ${sourceChainId} and account = ${account.toLowerCase()} and block_number = ${String(blockNumber)}`;
  return rows[0] || null;
}

export async function listReceipts({ account, token, status, limit = 50 }) {
  return sql`
    select * from bridge_receipts
    where (${account ?? null}::text is null or account = ${account ? account.toLowerCase() : null})
      and (${token ?? null}::text is null or token = ${token ?? null})
      and (${status ?? null}::text is null or status = ${status ?? null})
    order by created_at desc
    limit ${limit}`;
}

export async function updateReceipt(id, { status, zeroTx, claimTx }) {
  const rows = await sql`
    update bridge_receipts set
      status = coalesce(${status ?? null}, status),
      zero_tx = coalesce(${zeroTx ?? null}, zero_tx),
      claim_tx = coalesce(${claimTx ?? null}, claim_tx),
      updated_at = now()
    where id = ${id}
    returning *`;
  return rows[0] || null;
}

export async function deleteReceipt(id) {
  const rows = await sql`delete from bridge_receipts where id = ${id} returning id`;
  return rows.length > 0;
}

// Bring one row in line with the chain:
//   pending -> issued  once its zeroEscrow tx succeeded
//   pending -> void    once the escrow is gone without a successful zero (the user cancelled)
//   issued  -> claimed once the destination contract has consumed the receipt
export async function reconcile(row) {
  if (!row) return row;
  if (row.status === "pending") {
    if (row.zero_tx) {
      const rc = await providerFor(row.source_chain_id).getTransactionReceipt(row.zero_tx);
      if (rc?.status === 1) row = await updateReceipt(row.id, { status: "issued" });
    }
    if (row.status === "pending") {
      const esc = await readEscrow(row.token, row.source_chain_id, row.account);
      const sameEscrow = esc.amount > 0n && String(esc.blockNumber) === String(row.block_number);
      // Escrow gone and no confirmed zero: it was cancelled. Give an unconfirmed zero tx a few minutes first.
      const age = Date.now() - new Date(row.updated_at).getTime();
      if (!sameEscrow && (!row.zero_tx || age > 5 * 60 * 1000)) row = await updateReceipt(row.id, { status: "void" });
    }
  }
  if (row.status === "issued" && (await isClaimed(rowToChainReceipt(row)))) {
    row = await updateReceipt(row.id, { status: "claimed" });
  }
  return row;
}

// Re-issue forward VTRU receipts whose escrow the notary zeroed but which never reached BSC and are not in
// the store (e.g. issued before receipts were stored server-side). Idempotent: the same receipt hash maps
// to one row, and the destination contract only ever accepts it once.
export async function recoverForward(account) {
  const lost = await findUnclaimedForward(account);
  const recovered = [];
  for (const u of lost) {
    const existing = await getReceiptByEscrow("VTRU", u.sourceChainId, account, u.blockNumber);
    if (existing && (existing.status === "issued" || existing.status === "claimed")) continue;
    const signed = await signReceipt({ token: "VTRU", account, sourceChainId: u.sourceChainId, amount: u.amount, blockNumber: u.blockNumber });
    let row = await insertReceipt(signed, { status: "issued", source: "recovered" });
    row = await updateReceipt(row.id, { status: "issued", zeroTx: u.zeroTx });
    recovered.push(row);
  }
  return recovered;
}

export { toReceipt };
