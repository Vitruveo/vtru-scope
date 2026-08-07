import { NextResponse } from "next/server";
import { ethers } from "ethers";
import config from "@/app/config/vtru-contracts.json";

// Notary endpoint. Runs server-side only (holds NOTARY_PRIVATE_KEY).
// Given a user's pending escrow on the source chain, it signs a Claim Receipt bound to the
// destination chain, zeroes the source escrow (so the user can no longer cancel), and returns
// the receipt for the user to redeem on the destination chain.

const VITRUVEO_CHAIN_ID = 1490;
const BSC_CHAIN_ID = 56;

const CHAINS = {
  [VITRUVEO_CHAIN_ID]: {
    rpc: process.env.VITRUVEO_RPC || "https://rpc.vitruveo.ai",
    notaryKey: process.env.VITRUVEO_NOTARY_KEY, // NOTARY_ROLE holder on the Vitruveo side
  },
  [BSC_CHAIN_ID]: {
    rpc: process.env.BSC_RPC || "https://bsc-dataseed.binance.org",
    notaryKey: process.env.BSC_NOTARY_KEY, // NOTARY_ROLE holder on the BSC side
  },
};

// Bridgeable tokens. BridgedUSDT is one contract deployed at the same address on both chains.
const TOKENS = {
  VTRU: {
    abi: config.abi.VTRU,
    address: { [VITRUVEO_CHAIN_ID]: config.mainnet.VTRU, [BSC_CHAIN_ID]: config.bsc.VTRU },
  },
  USDT: {
    abi: config.abi.BridgedUSDT,
    address: { [VITRUVEO_CHAIN_ID]: config.mainnet.BridgedUSDT, [BSC_CHAIN_ID]: config.bsc.BridgedUSDT },
  },
};

// Direction enum in the contract: 0 = VitruveoToBsc, 1 = BscToVitruveo
const DIRECTION = { [VITRUVEO_CHAIN_ID]: 0, [BSC_CHAIN_ID]: 1 };

// Gas units the destination claim tx needs; the notary fronts this much native gas
// to wallets that hold none, priced at the live gas price.
const CLAIM_GAS_ESTIMATE = 300000n;

export async function POST(req) {
  try {
    const { account, sourceChainId, token = "VTRU" } = await req.json();

    if (!ethers.isAddress(account)) {
      return NextResponse.json({ error: "Invalid account" }, { status: 400 });
    }

    const tok = TOKENS[token];
    if (!tok) {
      return NextResponse.json({ error: "Unsupported token" }, { status: 400 });
    }

    const srcId = Number(sourceChainId);
    const destId = srcId === VITRUVEO_CHAIN_ID ? BSC_CHAIN_ID : VITRUVEO_CHAIN_ID;
    const src = CHAINS[srcId];
    const dest = CHAINS[destId];
    if (!src || !dest) {
      return NextResponse.json({ error: "Unsupported chain" }, { status: 400 });
    }

    // Source notary zeroes the escrow on the source chain; destination notary signs the receipt
    // (it is verified against NOTARY_ROLE on the destination chain).
    if (!src.notaryKey || !dest.notaryKey) {
      return NextResponse.json({ error: "Notary not configured" }, { status: 500 });
    }

    const srcProvider = new ethers.JsonRpcProvider(src.rpc, srcId);
    const zeroWallet = new ethers.Wallet(src.notaryKey, srcProvider);
    const signWallet = new ethers.Wallet(dest.notaryKey);
    const srcContract = new ethers.Contract(tok.address[srcId], tok.abi, zeroWallet);

    const esc = await srcContract.escrow(account);
    const amount = BigInt(esc.amount ?? esc[0]);
    const blockNumber = BigInt(esc.blockNumber ?? esc[1]);
    if (amount === 0n) {
      return NextResponse.json({ error: "No pending escrow" }, { status: 404 });
    }

    // Bridging into Vitruveo: a fresh wallet holds no VTRU and cannot pay gas for the
    // claim tx, so front it some gas before handing back the receipt. Done before the
    // escrow is zeroed so a failed top-up leaves the transfer cancellable.
    if (destId === VITRUVEO_CHAIN_ID) {
      const destProvider = new ethers.JsonRpcProvider(dest.rpc, destId);
      const balance = await destProvider.getBalance(account);
      if (balance === 0n) {
        const feeData = await destProvider.getFeeData();
        const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas;
        if (!gasPrice) throw new Error("Cannot determine destination gas price");
        const gasTx = await signWallet.connect(destProvider).sendTransaction({
          to: account,
          value: gasPrice * CLAIM_GAS_ESTIMATE,
        });
        await gasTx.wait();
      }
    }

    const direction = DIRECTION[srcId];

    // Receipt is bound to the DESTINATION chain id + contract (domain separation).
    const receiptHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint8", "uint256", "uint256", "address"],
        [account, amount, direction, blockNumber, destId, tok.address[destId]]
      )
    );
    const signature = await signWallet.signMessage(ethers.getBytes(receiptHash));

    // Zero the escrow so the user can no longer release/cancel it (the receipt is now the artifact).
    // Tolerate a concurrent zero: if it's already cleared, the signed receipt is still valid.
    try {
      const tx = await srcContract.zeroEscrow(account);
      await tx.wait();
    } catch (e) {
      const still = await srcContract.escrow(account);
      if (BigInt(still.amount ?? still[0]) !== 0n) throw e;
    }

    return NextResponse.json({
      account,
      amount: amount.toString(),
      direction,
      blockNumber: blockNumber.toString(),
      destChainId: destId,
      destContract: tok.address[destId],
      signature,
    });
  } catch (e) {
    console.error("notarize error", e);
    return NextResponse.json({ error: "Notarize failed", detail: String(e?.message || e) }, { status: 500 });
  }
}
