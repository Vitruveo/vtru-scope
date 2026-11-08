import { NextResponse } from "next/server";
import { ethers } from "ethers";
import config from "@/app/config/vtru-contracts.json";

// Read-only bridge diagnostics for the VTRU bridge page. Reports whether each chain's notary can do its
// part (configured, holds NOTARY_ROLE, has gas) and finds forward bridges whose escrow was zeroed by the
// notary but whose receipt was never redeemed on BSC (receipt lost before claim).
// Only addresses and balances are returned; notary keys never leave the server.

const VITRUVEO_CHAIN_ID = 1490;
const BSC_CHAIN_ID = 56;

// Gas units the notary spends: zeroEscrow on the source chain, and the claim-gas top-up it fronts to
// empty wallets on Vitruveo (must match CLAIM_GAS_ESTIMATE in notarize/route.js).
const ZERO_GAS_ESTIMATE = 100000n;
const CLAIM_GAS_ESTIMATE = 300000n;

const CHAINS = {
  [VITRUVEO_CHAIN_ID]: {
    name: "Vitruveo",
    rpc: process.env.VITRUVEO_RPC || "https://rpc.vitruveo.ai",
    notaryKey: process.env.VITRUVEO_NOTARY_KEY,
    vtru: config.mainnet.VTRU,
  },
  [BSC_CHAIN_ID]: {
    name: "BSC",
    rpc: process.env.BSC_RPC || "https://bsc-dataseed.binance.org",
    notaryKey: process.env.BSC_NOTARY_KEY,
    vtru: config.bsc.VTRU,
  },
};

async function notaryStatus(chainId) {
  const c = CHAINS[chainId];
  if (!c.notaryKey) return { chainId, configured: false };
  const provider = new ethers.JsonRpcProvider(c.rpc, chainId);
  const address = new ethers.Wallet(c.notaryKey).address;
  const vtru = new ethers.Contract(c.vtru, config.abi.VTRU, provider);
  const [role, balance, feeData] = await Promise.all([vtru.NOTARY_ROLE(), provider.getBalance(address), provider.getFeeData()]);
  const hasRole = await vtru.hasRole(role, address);
  const gasPrice = BigInt(feeData.gasPrice ?? feeData.maxFeePerGas ?? 0n);
  const requiredZero = gasPrice * ZERO_GAS_ESTIMATE;
  // Vitruveo notary also fronts claim gas to empty wallets on BSC -> Vitruveo transfers.
  const requiredFront = chainId === VITRUVEO_CHAIN_ID ? gasPrice * CLAIM_GAS_ESTIMATE : 0n;
  return {
    chainId,
    configured: true,
    address,
    hasRole,
    balance: balance.toString(),
    requiredZero: requiredZero.toString(),
    requiredFront: requiredFront.toString(),
  };
}

// Forward bridges (Vitruveo -> BSC) that the notary zeroed but that were never claimed on BSC.
// One escrow per user at a time, so each BridgeInitiated is closed by the next EscrowZeroed or EscrowCancelled.
// BSC -> Vitruveo is not covered: the public BSC RPC does not serve eth_getLogs.
async function findUnclaimedForward(account) {
  const v = CHAINS[VITRUVEO_CHAIN_ID];
  const b = CHAINS[BSC_CHAIN_ID];
  const vProvider = new ethers.JsonRpcProvider(v.rpc, VITRUVEO_CHAIN_ID);
  const bProvider = new ethers.JsonRpcProvider(b.rpc, BSC_CHAIN_ID);
  const iface = new ethers.Interface(config.abi.VTRU);
  const acctTopic = ethers.zeroPadValue(account, 32);

  const query = (event, topics) =>
    vProvider.getLogs({ address: v.vtru, topics: [iface.getEvent(event).topicHash, ...topics], fromBlock: 0, toBlock: "latest" });
  const [initiated, zeroed, cancelled] = await Promise.all([
    query("BridgeInitiated", [null, acctTopic]),
    query("EscrowZeroed", [acctTopic]),
    query("EscrowCancelled", [acctTopic]),
  ]);

  const events = [
    ...initiated.map((l) => ({ kind: "init", log: l, parsed: iface.parseLog(l) })),
    ...zeroed.map((l) => ({ kind: "zero", log: l })),
    ...cancelled.map((l) => ({ kind: "cancel", log: l })),
  ].sort((a, c) => a.log.blockNumber - c.log.blockNumber || a.log.index - c.log.index);

  const zeroedBridges = [];
  let open = null;
  for (const e of events) {
    if (e.kind === "init") {
      open = e;
    } else if (open) {
      if (e.kind === "zero") zeroedBridges.push({ init: open, zeroedBlock: e.log.blockNumber, zeroTx: e.log.transactionHash });
      open = null;
    }
  }

  const bVtru = new ethers.Contract(b.vtru, config.abi.VTRU, bProvider);
  const coder = ethers.AbiCoder.defaultAbiCoder();
  const results = await Promise.all(
    zeroedBridges.map(async ({ init, zeroedBlock, zeroTx }) => {
      const amount = BigInt(init.parsed.args.amount);
      const blockNumber = BigInt(init.parsed.args.blockNumber);
      const direction = Number(init.parsed.args.direction);
      const hash = ethers.keccak256(
        coder.encode(
          ["address", "uint256", "uint8", "uint256", "uint256", "address"],
          [account, amount, direction, blockNumber, BSC_CHAIN_ID, b.vtru]
        )
      );
      const claimed = await bVtru.claimed(hash);
      return claimed
        ? null
        : {
            sourceChainId: VITRUVEO_CHAIN_ID,
            amount: amount.toString(),
            blockNumber: blockNumber.toString(),
            lockTx: init.log.transactionHash,
            zeroedBlock,
            zeroTx,
          };
    })
  );
  return results.filter(Boolean);
}

export async function GET(req) {
  const account = new URL(req.url).searchParams.get("account");
  if (!account || !ethers.isAddress(account)) {
    return NextResponse.json({ error: "Invalid account" }, { status: 400 });
  }
  const [vNotary, bNotary, unclaimed] = await Promise.allSettled([
    notaryStatus(VITRUVEO_CHAIN_ID),
    notaryStatus(BSC_CHAIN_ID),
    findUnclaimedForward(ethers.getAddress(account)),
  ]);
  const settle = (r) => (r.status === "fulfilled" ? r.value : { error: String(r.reason?.shortMessage || r.reason?.message || r.reason) });
  return NextResponse.json({
    notary: { [VITRUVEO_CHAIN_ID]: settle(vNotary), [BSC_CHAIN_ID]: settle(bNotary) },
    unclaimed: unclaimed.status === "fulfilled" ? unclaimed.value : [],
    unclaimedError: unclaimed.status === "rejected" ? String(unclaimed.reason?.message || unclaimed.reason) : null,
  });
}
