// Neon Postgres access for bridge receipts and tracked bridge transactions.
import { neon } from "@neondatabase/serverless";

let _sql;

// Neon's HTTP driver makes one fetch per query and does not retry. A dropped connection or a compute waking
// from autosuspend surfaces as "Error connecting to database: TypeError: fetch failed", so connection errors
// are retried (query errors are not).
const RETRIES = 3;
const isConnectionError = (e) => /fetch failed|Error connecting to database|ECONNRESET|ETIMEDOUT|socket hang up/i.test(e?.message || "");

export async function sql(strings, ...values) {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    _sql = neon(process.env.DATABASE_URL);
  }
  for (let attempt = 0; ; attempt++) {
    try {
      return await _sql(strings, ...values);
    } catch (e) {
      if (attempt >= RETRIES || !isConnectionError(e)) throw e;
      await new Promise((r) => setTimeout(r, 250 * 2 ** attempt));
    }
  }
}

// Receipt lifecycle:
//   pending  signed, source escrow not yet confirmed zeroed. Never exposed: the user could still cancel the escrow.
//   issued   escrow zeroed on the source chain; the receipt is the only way to receive the funds.
//   claimed  redeemed on the destination chain.
//   void     never issued (zeroing failed and the escrow was cancelled or is still open).
export const SCHEMA = [
  `create table if not exists bridge_receipts (
    id bigserial primary key,
    token text not null default 'VTRU',
    account text not null,
    source_chain_id integer not null,
    dest_chain_id integer not null,
    dest_contract text not null,
    direction smallint not null,
    amount numeric(78, 0) not null,
    block_number bigint not null,
    receipt_hash text not null unique,
    signature text not null,
    status text not null check (status in ('pending', 'issued', 'claimed', 'void')),
    zero_tx text,
    claim_tx text,
    source text not null default 'notarize',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (token, source_chain_id, account, block_number)
  )`,
  `create index if not exists bridge_receipts_account_idx on bridge_receipts (account, status)`,
  `create table if not exists bridge_txs (
    hash text primary key,
    account text not null,
    chain_id integer not null,
    label text not null,
    nonce bigint,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists bridge_txs_account_idx on bridge_txs (account)`,
  `alter table bridge_txs add column if not exists token text not null default 'VTRU'`,
  // VUSD swaps relayed by the bridge (see relay.js). One row per swap; each step's tx hash is stored before it is
  // awaited, so an interrupted swap resumes without repeating a step. locked_until is a lease that keeps two
  // requests from running the same swap at once.
  //   to_vusd   user locked USDT on BSC -> receipt to relayer -> zero -> relayer claims USDT.b -> depositFor(user)
  //   from_vusd user redeemTo(relayer) -> relayer burns USDT.b -> receipt to user -> zero -> relayer claimUSDT(user)
  `create table if not exists bridge_swaps (
    id bigserial primary key,
    kind text not null check (kind in ('to_vusd', 'from_vusd')),
    account text not null,
    source_ref text not null unique,
    amount numeric(78, 0) not null,
    state text not null,
    escrow_block bigint,
    receipt_id bigint,
    zero_tx text,
    claim_tx text,
    claim_block bigint,
    deposit_tx text,
    burn_tx text,
    refund_tx text,
    error text,
    locked_until timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `create index if not exists bridge_swaps_account_idx on bridge_swaps (account, state)`,
  `alter table bridge_swaps add column if not exists refund_tx text`,
];

// Public shape of a receipt row. The signature is only revealed once the source escrow is zeroed.
export function toReceipt(row) {
  if (!row) return null;
  const exposed = row.status === "issued" || row.status === "claimed";
  return {
    id: String(row.id),
    token: row.token,
    account: row.account,
    sourceChainId: row.source_chain_id,
    destChainId: row.dest_chain_id,
    destContract: row.dest_contract,
    direction: row.direction,
    amount: String(row.amount),
    blockNumber: String(row.block_number),
    receiptHash: row.receipt_hash,
    signature: exposed ? row.signature : null,
    status: row.status,
    zeroTx: row.zero_tx,
    claimTx: row.claim_tx,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
