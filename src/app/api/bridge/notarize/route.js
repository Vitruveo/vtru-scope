import { ethers } from "ethers";
import { CHAINS, GAS, TOKENS, VITRUVEO_CHAIN_ID, errMsg, gasPrice, otherChain, providerFor } from "@/lib/bridge/config";
import { notaryWallet, readEscrow, signReceipt } from "@/lib/bridge/chain";
import { getReceiptByEscrow, insertReceipt, listReceipts, reconcile, toReceipt, updateReceipt } from "@/lib/bridge/receipts";
import { fail, json, preflight } from "@/lib/bridge/http";

// Notary endpoint. Runs server-side only (holds the notary keys).
// Given a user's pending escrow on the source chain, it signs a Claim Receipt bound to the destination chain,
// stores it, zeroes the source escrow (so the user can no longer cancel), and returns the receipt.
// The receipt row is written BEFORE the escrow is zeroed, so a zeroed escrow always has a stored receipt.

export const OPTIONS = preflight;

const wire = toReceipt;

export async function POST(req) {
  try {
    const { account, sourceChainId, token = "VTRU" } = await req.json();
    if (!ethers.isAddress(account)) return fail(req, 400, "Invalid account");
    if (!TOKENS[token]) return fail(req, 400, "Unsupported token");
    const srcId = Number(sourceChainId);
    if (!CHAINS[srcId]) return fail(req, 400, "Unsupported chain");
    const destId = otherChain(srcId);
    const acct = ethers.getAddress(account);

    const zeroWallet = notaryWallet(srcId);
    if (!zeroWallet || !notaryWallet(destId)) return fail(req, 500, "Notary not configured");

    const esc = await readEscrow(token, srcId, acct);
    if (esc.amount === 0n) {
      // Nothing to notarize. If a receipt was already issued for this account, hand it back (resume).
      const issued = (await listReceipts({ account: acct, token, status: "issued" })).find((r) => r.source_chain_id === srcId);
      return issued ? json(req, wire(issued)) : fail(req, 404, "No pending escrow");
    }

    // Already notarized (e.g. a retry after the response was lost)?
    let row = await reconcile(await getReceiptByEscrow(token, srcId, acct, esc.blockNumber));
    if (row?.status === "issued" || row?.status === "claimed") return json(req, wire(row));

    // Bridging into Vitruveo: a fresh wallet holds no VTRU and cannot pay gas for the claim tx, so front it
    // some gas first. Done before the escrow is zeroed so a failed top-up leaves the transfer cancellable.
    if (destId === VITRUVEO_CHAIN_ID) {
      const destProvider = providerFor(destId);
      if ((await destProvider.getBalance(acct)) === 0n) {
        const gp = await gasPrice(destId);
        if (!gp) throw new Error("Cannot determine destination gas price");
        const gasTx = await notaryWallet(destId).sendTransaction({ to: acct, value: gp * GAS.vitClaim });
        await gasTx.wait();
      }
    }

    // Sign and store (pending: not exposed until the escrow is zeroed).
    const signed = await signReceipt({ token, account: acct, sourceChainId: srcId, amount: esc.amount, blockNumber: esc.blockNumber });
    row = await insertReceipt(signed, { status: "pending" });

    // Zero the escrow so the user can no longer release/cancel it (the receipt is now the artifact).
    const tok = TOKENS[token];
    const srcContract = new ethers.Contract(tok.address[srcId], tok.abi, zeroWallet);
    try {
      const tx = await srcContract.zeroEscrow(acct);
      await updateReceipt(row.id, { zeroTx: tx.hash });
      await tx.wait();
      row = await updateReceipt(row.id, { status: "issued" });
    } catch (e) {
      // A concurrent request may have zeroed it with its own tx; reconcile decides issued / void / still pending.
      row = await reconcile(await getReceiptByEscrow(token, srcId, acct, esc.blockNumber));
      if (row?.status !== "issued") {
        const still = await readEscrow(token, srcId, acct);
        if (still.amount > 0n) await updateReceipt(row.id, { status: "void" });
        throw e;
      }
    }
    return json(req, wire(row));
  } catch (e) {
    console.error("notarize error", e);
    return fail(req, 500, "Notarize failed", errMsg(e));
  }
}
