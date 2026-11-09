// Pre-bridge checklist. Every item must pass before the source-chain transaction is allowed to start.
// Same three items for both bridges:
//   VTRU  Vitruveo -> BSC: Vitruveo gas for the lock, BSC gas for approve + claim, USDT on BSC for the fee.
//   VTRU  BSC -> Vitruveo: BSC gas for the burn, Vitruveo gas for the claim (or a notary able to front it), no fee.
//   USDT  BSC -> Vitruveo: BSC gas for approve + lock, USDT on BSC covering the amount (1% fee is taken from it),
//                          Vitruveo gas for the claim (or a notary able to front it).
//   USDT  Vitruveo -> BSC: Vitruveo gas for the burn, BSC gas for the claim, no fee.
// item.state: "ok" | "fail" | "idle"
import { ethers } from "ethers";
import { forwardFee, notaryStatus, notaryWallet } from "./chain";
import {
  BSC_CHAIN_ID,
  BSC_VTRU,
  ERC20_ABI,
  GAS,
  TOKENS,
  USDT_BSC,
  VITRUVEO_CHAIN_ID,
  fmt,
  fmtGas,
  gasPrice,
  providerFor,
} from "./config";

const fmtUsdt = (v) => fmt(v, 6);

export async function readBalances(account) {
  const vp = providerFor(VITRUVEO_CHAIN_ID);
  const bp = providerFor(BSC_CHAIN_ID);
  const [vtruCoin, vtruToken, usdt, usdtb, bnb, vitGas, bscGas] = await Promise.all([
    vp.getBalance(account),
    new ethers.Contract(BSC_VTRU, ERC20_ABI, bp).balanceOf(account),
    new ethers.Contract(USDT_BSC, ERC20_ABI, bp).balanceOf(account),
    new ethers.Contract(TOKENS.USDT.address[VITRUVEO_CHAIN_ID], ERC20_ABI, vp).balanceOf(account),
    bp.getBalance(account),
    gasPrice(VITRUVEO_CHAIN_ID),
    gasPrice(BSC_CHAIN_ID),
  ]);
  return { vtruCoin, vtruToken, usdt, usdtb, bnb, vitGas, bscGas };
}

// 1% USDT bridge fee, taken from the locked amount on BSC.
async function usdtLockFee(amount) {
  const c = new ethers.Contract(TOKENS.USDT.address[BSC_CHAIN_ID], TOKENS.USDT.abi, providerFor(BSC_CHAIN_ID));
  const feeUsdt = (amount * BigInt(await c.feeBps())) / 10000n;
  return { feeUsdt, receive: amount - feeUsdt };
}

// Gas on Vitruveo when Vitruveo is the destination: the claim, fronted by the notary for empty wallets.
function vitruveoClaimItem(b, vitNotary) {
  const need = b.vitGas * GAS.vitClaim;
  if (b.vtruCoin === 0n) {
    const n = vitNotary;
    const notaryBal = n?.configured && !n.error ? BigInt(n.balance) : 0n;
    const ok = !!(n?.configured && !n.error && n.hasRole && notaryBal >= need);
    return {
      key: "vitruveo-gas",
      label: "Gas on Vitruveo",
      state: ok ? "ok" : "fail",
      detail: ok
        ? "Empty wallet: the notary fronts the claim gas"
        : n?.error
        ? `Your wallet holds 0 VTRU and the notary could not be checked: ${n.error}`
        : !n?.configured || !n.hasRole
        ? "Your wallet holds 0 VTRU and the Vitruveo notary is not set up for this bridge. Add VTRU on Vitruveo."
        : `Your wallet holds 0 VTRU and the notary holds ${fmtGas(notaryBal)}, too little to front ~${fmtGas(need)}. Add VTRU on Vitruveo.`,
    };
  }
  const ok = b.vtruCoin >= need;
  return {
    key: "vitruveo-gas",
    label: "Gas on Vitruveo",
    state: ok ? "ok" : "fail",
    detail: ok
      ? `~${fmtGas(need)} VTRU for the claim`
      : `You hold ${fmtGas(b.vtruCoin)} VTRU, the claim needs ~${fmtGas(need)}. The notary only fronts gas to wallets holding 0 VTRU.`,
  };
}

function bscGasItem(b, units, action) {
  const need = b.bscGas * units;
  const ok = b.bnb >= need;
  return {
    key: "bsc-gas",
    label: "Gas on BSC",
    state: ok ? "ok" : "fail",
    detail: ok ? `~${fmtGas(need)} BNB for the ${action}` : `Need ~${fmtGas(need)} BNB, you hold ${fmtGas(b.bnb)}. Add BNB on BSC.`,
  };
}

const noFee = (route) => ({ key: "usdt-fee", label: "USDT fee on BSC", state: "ok", detail: `No fee for ${route}` });
const enterAmount = { key: "usdt-fee", label: "USDT fee on BSC", state: "idle", detail: "Enter an amount" };

// VUSD swaps relayed by the bridge (relay.js): the user sends one transaction, the relayer pays for the rest.
//   USDT (BSC) -> VUSD: user BNB for approve + lock and USDT covering the amount; relayer VTRU for claim + mint,
//                       BSC relayer BNB to close the escrow.
//   VUSD -> USDT (BSC): user VTRU for the redeem; relayer VTRU for burn + zero, BSC relayer BNB for the claim.
async function vusdChecklist({ account, fromChainId, amount }) {
  const fromBsc = fromChainId === BSC_CHAIN_ID;
  const vRelay = notaryWallet(VITRUVEO_CHAIN_ID);
  const bRelay = notaryWallet(BSC_CHAIN_ID);
  const [b, fee, vRelayBal, bRelayBal] = await Promise.all([
    readBalances(account),
    fromBsc && amount > 0n ? usdtLockFee(amount) : Promise.resolve(null),
    vRelay ? providerFor(VITRUVEO_CHAIN_ID).getBalance(vRelay.address) : Promise.resolve(0n),
    bRelay ? providerFor(BSC_CHAIN_ID).getBalance(bRelay.address) : Promise.resolve(0n),
  ]);
  const relayItem = (key, label, have, need, native) =>
    !vRelay || !bRelay
      ? { key, label, state: "fail", detail: "The bridge relayer is not configured." }
      : have >= need
      ? { key, label, state: "ok", detail: "Paid by the bridge" }
      : { key, label, state: "fail", detail: `The bridge relayer holds ${fmtGas(have)} ${native}, needs ~${fmtGas(need)}. Try again later.` };
  const items = [];
  if (fromBsc) {
    items.push(relayItem("vitruveo-gas", "Gas on Vitruveo", vRelayBal, b.vitGas * GAS.relayIn, "VTRU"));
    const bsc = bscGasItem(b, GAS.bscFinish, "approve + lock");
    const relayZero = b.bscGas * GAS.zero;
    items.push(bsc.state === "ok" && bRelayBal < relayZero ? relayItem("bsc-gas", "Gas on BSC", bRelayBal, relayZero, "BNB") : bsc);
    if (amount === 0n) items.push(enterAmount);
    else {
      const ok = b.usdt >= amount;
      items.push({
        key: "usdt-fee",
        label: "USDT fee on BSC",
        state: ok ? "ok" : "fail",
        detail: ok
          ? `~${fmtUsdt(fee.feeUsdt)} USDT, taken from the amount (you hold ${fmtUsdt(b.usdt)})`
          : `Need ${fmtUsdt(amount)} USDT including the ${fmtUsdt(fee.feeUsdt)} fee, you hold ${fmtUsdt(b.usdt)}. Lower the amount or add USDT.`,
      });
    }
  } else {
    const need = b.vitGas * GAS.redeemTo;
    const relayNeed = b.vitGas * GAS.relayOut;
    items.push(
      b.vtruCoin < need
        ? { key: "vitruveo-gas", label: "Gas on Vitruveo", state: "fail", detail: `Need ~${fmtGas(need)} VTRU, you hold ${fmtGas(b.vtruCoin)}. Add VTRU on Vitruveo.` }
        : vRelayBal < relayNeed
        ? relayItem("vitruveo-gas", "Gas on Vitruveo", vRelayBal, relayNeed, "VTRU")
        : { key: "vitruveo-gas", label: "Gas on Vitruveo", state: "ok", detail: `~${fmtGas(need)} VTRU for the redeem` }
    );
    items.push(relayItem("bsc-gas", "Gas on BSC", bRelayBal, b.bscGas * GAS.relayClaimBsc, "BNB"));
    items.push(noFee("VUSD → BSC"));
  }
  return {
    pass: items.every((i) => i.state === "ok"),
    items,
    fee,
    balances: { vtruCoin: b.vtruCoin, vtruToken: b.vtruToken, usdt: b.usdt, usdtb: b.usdtb, bnb: b.bnb },
  };
}

// amount: whole-unit wei (0n when no amount entered yet). token: "VTRU" | "USDT". via: "vusd" for relayed VUSD swaps.
export async function runChecklist({ account, fromChainId, amount, token = "VTRU", via }) {
  if (via === "vusd") return vusdChecklist({ account, fromChainId, amount });
  const fromVitruveo = fromChainId === VITRUVEO_CHAIN_ID;
  const intoVitruveo = !fromVitruveo;
  const [b, fee, vitNotary] = await Promise.all([
    readBalances(account),
    amount > 0n && token === "VTRU" && fromVitruveo
      ? forwardFee(amount)
      : amount > 0n && token === "USDT" && !fromVitruveo
      ? usdtLockFee(amount)
      : Promise.resolve(null),
    intoVitruveo ? notaryStatus(VITRUVEO_CHAIN_ID, token).catch((e) => ({ error: e?.message || String(e) })) : Promise.resolve(null),
  ]);
  const items = [];

  if (token === "USDT") {
    if (fromVitruveo) {
      // Burn USDT.b on Vitruveo, claim USDT on BSC.
      const need = b.vitGas * GAS.burn;
      const ok = b.vtruCoin >= need;
      items.push({
        key: "vitruveo-gas",
        label: "Gas on Vitruveo",
        state: ok ? "ok" : "fail",
        detail: ok ? `~${fmtGas(need)} VTRU for the burn` : `Need ~${fmtGas(need)} VTRU, you hold ${fmtGas(b.vtruCoin)}. Add VTRU on Vitruveo.`,
      });
      items.push(bscGasItem(b, GAS.bscFinish, "claim"));
      items.push(noFee("Vitruveo → BSC"));
    } else {
      // Approve + lock USDT on BSC (fee taken from the amount), claim USDT.b on Vitruveo.
      items.push(vitruveoClaimItem(b, vitNotary));
      items.push(bscGasItem(b, GAS.bscFinish, "approve + lock"));
      if (amount === 0n) items.push(enterAmount);
      else {
        const ok = b.usdt >= amount;
        items.push({
          key: "usdt-fee",
          label: "USDT fee on BSC",
          state: ok ? "ok" : "fail",
          detail: ok
            ? `~${fmtUsdt(fee.feeUsdt)} USDT, taken from the amount (you hold ${fmtUsdt(b.usdt)})`
            : `Need ${fmtUsdt(amount)} USDT including the ${fmtUsdt(fee.feeUsdt)} fee, you hold ${fmtUsdt(b.usdt)}. Lower the amount or add USDT.`,
        });
      }
    }
  } else if (fromVitruveo) {
    // Lock VTRU on Vitruveo, approve the USDT fee + claim on BSC.
    const need = b.vitGas * GAS.lock;
    const ok = b.vtruCoin >= amount + need;
    items.push({
      key: "vitruveo-gas",
      label: "Gas on Vitruveo",
      state: ok ? "ok" : "fail",
      detail: ok
        ? `~${fmtGas(need)} VTRU for the lock`
        : `Need ${fmt(amount)} + ~${fmtGas(need)} VTRU gas, you hold ${fmt(b.vtruCoin)}. Lower the amount.`,
    });
    items.push(bscGasItem(b, GAS.bscFinish, "approve + claim"));
    if (amount === 0n) items.push(enterAmount);
    else if (fee.maxFeeUsdt === 0n) items.push({ key: "usdt-fee", label: "USDT fee on BSC", state: "ok", detail: "No USDT fee" });
    else {
      const ok2 = b.usdt >= fee.maxFeeUsdt;
      items.push({
        key: "usdt-fee",
        label: "USDT fee on BSC",
        state: ok2 ? "ok" : "fail",
        detail: ok2
          ? `~${fmtUsdt(fee.feeUsdt)} USDT (you hold ${fmtUsdt(b.usdt)})`
          : `Need up to ${fmtUsdt(fee.maxFeeUsdt)} USDT, you hold ${fmtUsdt(b.usdt)}. Add USDT on BSC.`,
      });
    }
  } else {
    // Burn VTRU on BSC, claim VTRU on Vitruveo.
    items.push(vitruveoClaimItem(b, vitNotary));
    items.push(bscGasItem(b, GAS.burn, "burn"));
    items.push(noFee("BSC → Vitruveo"));
  }

  // Display order matches on both bridges.
  const order = ["vitruveo-gas", "bsc-gas", "usdt-fee"];
  items.sort((x, y) => order.indexOf(x.key) - order.indexOf(y.key));

  return {
    pass: items.every((i) => i.state === "ok"),
    items,
    fee,
    balances: { vtruCoin: b.vtruCoin, vtruToken: b.vtruToken, usdt: b.usdt, usdtb: b.usdtb, bnb: b.bnb },
  };
}
