// Server-side bridge configuration shared by the /api/bridge/* routes.
import { ethers } from "ethers";
import config from "@/app/config/vtru-contracts.json";

export const VITRUVEO_CHAIN_ID = 1490;
export const BSC_CHAIN_ID = 56;

export const CHAIN_NAME = { [VITRUVEO_CHAIN_ID]: "Vitruveo", [BSC_CHAIN_ID]: "BSC" };
export const TX_URL = {
  [VITRUVEO_CHAIN_ID]: (h) => `https://explorer.vitruveo.ai/tx/${h}`,
  [BSC_CHAIN_ID]: (h) => `https://bscscan.com/tx/${h}`,
};

export const CHAINS = {
  [VITRUVEO_CHAIN_ID]: {
    rpc: process.env.VITRUVEO_RPC || "https://rpc.vitruveo.ai",
    notaryKey: process.env.VITRUVEO_NOTARY_KEY, // NOTARY_ROLE holder on the Vitruveo side
  },
  [BSC_CHAIN_ID]: {
    rpc: process.env.BSC_RPC || "https://bsc-dataseed.binance.org",
    notaryKey: process.env.BSC_NOTARY_KEY, // NOTARY_ROLE holder on the BSC side
  },
};

const providers = {};
export function providerFor(chainId) {
  if (!providers[chainId]) providers[chainId] = new ethers.JsonRpcProvider(CHAINS[chainId].rpc, chainId, { staticNetwork: true });
  return providers[chainId];
}

// Bridgeable tokens. BridgedUSDT is one contract deployed at the same address on both chains.
export const TOKENS = {
  VTRU: {
    abi: config.abi.VTRU,
    address: { [VITRUVEO_CHAIN_ID]: config.mainnet.VTRU, [BSC_CHAIN_ID]: config.bsc.VTRU },
  },
  USDT: {
    abi: config.abi.BridgedUSDT,
    address: { [VITRUVEO_CHAIN_ID]: config.mainnet.BridgedUSDT, [BSC_CHAIN_ID]: config.bsc.BridgedUSDT },
  },
};

// VUSD: 1:1 wrapper over USDT.b on Vitruveo. depositFor / redeemTo let the bridge relayer mint and redeem on a
// user's behalf, so VUSD swaps need no USDT.b approval or Vitruveo claim from the user.
export const VUSD = config.mainnet.VUSD;
export const VUSD_ABI = config.abi.VUSD;

export const VTRU_ABI = config.abi.VTRU;
export const VITRUVEO_VTRU = config.mainnet.VTRU;
export const BSC_VTRU = config.bsc.VTRU;
export const USDT_BSC = "0x55d398326f99059fF775485246999027B3197955";
export const V3_POOL = "0x76d6B57B2bfD62B8b936a6E72904A8FA40bcB5dD"; // PancakeSwap V3 VTRU/USDT 0.25% pool (matches the contract)

export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
];
export const V3_POOL_ABI = [
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint32, bool)",
  "function token0() view returns (address)",
];

// Direction enum in the contract: 0 = VitruveoToBsc, 1 = BscToVitruveo
export const DIRECTION = { [VITRUVEO_CHAIN_ID]: 0, [BSC_CHAIN_ID]: 1 };
export const otherChain = (id) => (id === VITRUVEO_CHAIN_ID ? BSC_CHAIN_ID : VITRUVEO_CHAIN_ID);

// Gas unit estimates, priced at the live gas price of each chain.
export const GAS = {
  lock: 150000n, // Vitruveo lockVTRUCoin
  burn: 150000n, // BSC burnVTRUToken
  bscFinish: 300000n, // BSC USDT approve + claimToken
  vitClaim: 300000n, // Vitruveo claimCoin; also what the notary fronts to empty wallets
  zero: 100000n, // notary zeroEscrow
  redeemTo: 120000n, // Vitruveo VUSD.redeemTo (user, VUSD -> USDT route)
  relayIn: 450000n, // Vitruveo relayer: claimToken + approve (first time) + depositFor
  relayOut: 250000n, // Vitruveo relayer: burnUSDTToken + zeroEscrow
  relayClaimBsc: 200000n, // BSC relayer: claimUSDT for the user
};

export async function gasPrice(chainId) {
  const fd = await providerFor(chainId).getFeeData();
  return BigInt(fd.gasPrice ?? fd.maxFeePerGas ?? (chainId === BSC_CHAIN_ID ? 3_000_000_000n : 0n));
}

export const receiptHash = ({ account, amount, direction, blockNumber, destChainId, destContract }) =>
  ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "uint8", "uint256", "uint256", "address"],
      [account, BigInt(amount), Number(direction), BigInt(blockNumber), Number(destChainId), destContract]
    )
  );

export const errMsg = (e) => e?.shortMessage || e?.reason || e?.details || e?.message || String(e);

export const fmt = (v, d = 4) => parseFloat(ethers.formatEther(v)).toFixed(d);
export const fmtGas = (v) => fmt(v, 5);
export const gwei = (v) => parseFloat(ethers.formatUnits(v ?? 0n, "gwei")).toFixed(2);
export const ago = (date) => {
  const s = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 1000));
  return s < 120 ? `${s}s` : s < 7200 ? `${Math.round(s / 60)}m` : `${Math.round(s / 3600)}h`;
};
