// Unsigned wallet transactions for each bridge action, so any client (ethers, viem, raw EIP-1193) can send them.
// step: { label, chainId, tx: { to, data, value } }  (value is a hex quantity)
// token "VTRU": VTRU contract on each chain. token "USDT": BridgedUSDT, one address on both chains (it is also
// the USDT.b token on Vitruveo).
import { ethers } from "ethers";
import { forwardFee, readEscrow } from "./chain";
import { BSC_CHAIN_ID, BSC_VTRU, ERC20_ABI, TOKENS, USDT_BSC, VITRUVEO_CHAIN_ID, VITRUVEO_VTRU, VTRU_ABI, VUSD, VUSD_ABI, providerFor } from "./config";
import { relayerAddress } from "./relay";

const vtru = new ethers.Interface(VTRU_ABI);
const busdt = new ethers.Interface(TOKENS.USDT.abi);
const erc20 = new ethers.Interface(ERC20_ABI);
const vusdIface = new ethers.Interface(VUSD_ABI);
const hex = (v) => ethers.toQuantity(BigInt(v));
const USDT_BRIDGE = TOKENS.USDT.address;

const allowance = (owner, spender) =>
  new ethers.Contract(USDT_BSC, ERC20_ABI, providerFor(BSC_CHAIN_ID)).allowance(owner, spender).then(BigInt);

// Source-chain transaction(s) for a whole-unit amount.
//   VTRU: lock (Vitruveo) or burn (BSC).
//   USDT: approve (if short) + lock on BSC, or burn USDT.b on Vitruveo.
//   USDT via "vusd" (relayed VUSD swap): the same lock on BSC, or VUSD.redeemTo(relayer) on Vitruveo.
export async function startSteps(fromChainId, amount, token = "VTRU", account, via = null) {
  if (via === "vusd" && fromChainId === VITRUVEO_CHAIN_ID) {
    const relay = relayerAddress();
    if (!relay) throw new Error("Bridge relayer is not configured");
    const bal = BigInt(await new ethers.Contract(VUSD, ERC20_ABI, providerFor(VITRUVEO_CHAIN_ID)).balanceOf(account));
    if (bal < amount) throw Object.assign(new Error(`You hold ${ethers.formatEther(bal)} VUSD`), { status: 409 });
    return [{ label: "Send VUSD to the bridge", chainId: VITRUVEO_CHAIN_ID, tx: { to: VUSD, data: vusdIface.encodeFunctionData("redeemTo", [relay, amount]), value: "0x0" } }];
  }
  if (token === "USDT") {
    if (fromChainId === BSC_CHAIN_ID) {
      const bridge = USDT_BRIDGE[BSC_CHAIN_ID];
      const steps = [];
      if ((await allowance(account, bridge)) < amount) {
        steps.push({ label: "Approve USDT", chainId: BSC_CHAIN_ID, tx: { to: USDT_BSC, data: erc20.encodeFunctionData("approve", [bridge, amount]), value: "0x0" } });
      }
      steps.push({ label: "Lock USDT", chainId: BSC_CHAIN_ID, tx: { to: bridge, data: busdt.encodeFunctionData("lockUSDT", [amount]), value: "0x0" } });
      return steps;
    }
    return [
      { label: "Burn USDT.b", chainId: VITRUVEO_CHAIN_ID, tx: { to: USDT_BRIDGE[VITRUVEO_CHAIN_ID], data: busdt.encodeFunctionData("burnUSDTToken", [amount]), value: "0x0" } },
    ];
  }
  if (fromChainId === VITRUVEO_CHAIN_ID) {
    return [{ label: "Lock VTRU", chainId: VITRUVEO_CHAIN_ID, tx: { to: VITRUVEO_VTRU, data: vtru.encodeFunctionData("lockVTRUCoin"), value: hex(amount) } }];
  }
  return [{ label: "Burn VTRU", chainId: BSC_CHAIN_ID, tx: { to: BSC_VTRU, data: vtru.encodeFunctionData("burnVTRUToken", [amount]), value: "0x0" } }];
}

// Redeem an issued receipt on its destination chain (VTRU forward claims approve the USDT fee first when needed).
export async function finishSteps(r) {
  const destId = Number(r.destChainId);
  const args = [r.account, BigInt(r.amount), Number(r.direction), BigInt(r.blockNumber)];
  if (r.token === "USDT") {
    const fn = destId === VITRUVEO_CHAIN_ID ? "claimToken" : "claimUSDT";
    const label = destId === VITRUVEO_CHAIN_ID ? "Claim USDT.b" : "Claim USDT";
    return [{ label, chainId: destId, tx: { to: r.destContract, data: busdt.encodeFunctionData(fn, [...args, r.signature]), value: "0x0" } }];
  }
  if (destId === BSC_CHAIN_ID) {
    const { maxFeeUsdt } = await forwardFee(BigInt(r.amount));
    const steps = [];
    if (maxFeeUsdt > 0n && (await allowance(r.account, BSC_VTRU)) < maxFeeUsdt) {
      steps.push({ label: "Approve USDT fee", chainId: BSC_CHAIN_ID, tx: { to: USDT_BSC, data: erc20.encodeFunctionData("approve", [BSC_VTRU, maxFeeUsdt]), value: "0x0" } });
    }
    steps.push({
      label: "Claim VTRU",
      chainId: BSC_CHAIN_ID,
      tx: { to: BSC_VTRU, data: vtru.encodeFunctionData("claimToken", [...args, maxFeeUsdt, r.signature]), value: "0x0" },
    });
    return steps;
  }
  return [{ label: "Claim VTRU", chainId: VITRUVEO_CHAIN_ID, tx: { to: VITRUVEO_VTRU, data: vtru.encodeFunctionData("claimCoin", [...args, r.signature]), value: "0x0" } }];
}

// Cancel the account's open escrow and refund it on the source chain.
export async function cancelSteps(account, token = "VTRU") {
  const release =
    token === "USDT"
      ? { [VITRUVEO_CHAIN_ID]: [USDT_BRIDGE[VITRUVEO_CHAIN_ID], busdt, "releaseTokenEscrow"], [BSC_CHAIN_ID]: [USDT_BRIDGE[BSC_CHAIN_ID], busdt, "releaseLockEscrow"] }
      : { [VITRUVEO_CHAIN_ID]: [VITRUVEO_VTRU, vtru, "releaseCoinEscrow"], [BSC_CHAIN_ID]: [BSC_VTRU, vtru, "releaseTokenEscrow"] };
  for (const chainId of [VITRUVEO_CHAIN_ID, BSC_CHAIN_ID]) {
    if ((await readEscrow(token, chainId, account)).amount > 0n) {
      const [to, iface, fn] = release[chainId];
      return [{ label: "Cancel & refund", chainId, tx: { to, data: iface.encodeFunctionData(fn), value: "0x0" } }];
    }
  }
  return [];
}
