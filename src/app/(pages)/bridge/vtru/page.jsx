"use client";

import React, { useEffect, useState } from "react";
import Breadcrumb from "@/app/(pages)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/(pages)/components/container/PageContainer";

import {
  Grid,
  Box,
  Button,
  Typography,
  TextField,
  Card,
  CardContent,
  Alert,
  Snackbar,
  IconButton,
  Paper,
  CircularProgress,
  Chip,
  Stack,
  Divider,
  AlertTitle,
  Link,
} from "@mui/material";
import {
  KeyboardArrowDown as ArrowDownIcon,
  CheckCircleOutline as CheckIcon,
  CheckCircle as PassIcon,
  Cancel as FailIcon,
  RadioButtonUnchecked as IdleIcon,
} from "@mui/icons-material";

import { switchNetwork, getWalletClient, getNetwork } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";
import { ethers } from "ethers";
import { useAccount, useNetwork } from "wagmi";

const VITRUVEO_CHAIN_ID = 1490;
const BSC_CHAIN_ID = 56;

const VITRUVEO_VTRU = config.mainnet.VTRU;
const BSC_VTRU = config.bsc.VTRU;
const USDT_BSC = "0x55d398326f99059fF775485246999027B3197955";
const V3_POOL = "0x76d6B57B2bfD62B8b936a6E72904A8FA40bcB5dD"; // PancakeSwap V3 VTRU/USDT 0.25% pool (matches the contract)
const VTRU_ABI = config.abi.VTRU;

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
];
const V3_POOL_ABI = [
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint32, bool)",
  "function token0() view returns (address)",
];
const Q96 = 2n ** 96n;

// Rough gas units to cover the BSC-side USDT approve + claimToken; used to check the
// user holds enough BNB for gas. Priced at the live BSC gas price.
const BRIDGE_GAS_ESTIMATE = 300000n;
// Gas units for the source-side lock (Vitruveo) / burn (BSC), and the Vitruveo-side claimCoin.
const LOCK_GAS_ESTIMATE = 150000n;
const BURN_GAS_ESTIMATE = 150000n;
const CLAIM_GAS_ESTIMATE = 300000n; // matches the notary's top-up for empty wallets

const vitruveoProvider = new ethers.JsonRpcProvider("https://rpc.vitruveo.ai", VITRUVEO_CHAIN_ID);
const bscProvider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org", BSC_CHAIN_ID);
const providerFor = (chainId) => (chainId === VITRUVEO_CHAIN_ID ? vitruveoProvider : bscProvider);

const CHAIN_NAME = { [VITRUVEO_CHAIN_ID]: "Vitruveo", [BSC_CHAIN_ID]: "BSC" };
const TX_URL = {
  [VITRUVEO_CHAIN_ID]: (h) => `https://explorer.vitruveo.ai/tx/${h}`,
  [BSC_CHAIN_ID]: (h) => `https://bscscan.com/tx/${h}`,
};
const gwei = (v) => parseFloat(ethers.formatUnits(v ?? 0n, "gwei")).toFixed(2);
const ago = (ms) => {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  return s < 120 ? `${s}s` : s < 7200 ? `${Math.round(s / 60)}m` : `${Math.round(s / 3600)}h`;
};
const receiptHashOf = (r) =>
  ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "uint8", "uint256", "uint256", "address"],
      [r.account, BigInt(r.amount), Number(r.direction), BigInt(r.blockNumber), Number(r.destChainId), r.destContract]
    )
  );

// BSC is added to the wagmi config only on the bridge route (see providers.tsx). We switch the
// wallet via wagmi and adapt the connected wallet client (injected OR WalletConnect) to an ethers
// signer, so mobile / WalletConnect wallets work too.
function walletClientToSigner(walletClient) {
  const { account, chain, transport } = walletClient;
  const provider = new ethers.BrowserProvider(transport, { chainId: chain.id, name: chain.name });
  return provider.getSigner(account.address);
}

async function getSigner(chainId) {
  if (getNetwork().chain?.id !== chainId) {
    await switchNetwork({ chainId });
  }
  const walletClient = await getWalletClient({ chainId });
  if (!walletClient) throw new Error("Wallet not connected");
  return walletClientToSigner(walletClient);
}

const SwapInput = ({ isFrom, max, value, setValue, tokenSymbol, tokenBalance, network, disabled }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      borderRadius: 3,
      backgroundColor: network === "binance" ? "#FFF9C4" : "primary.main",
    }}
  >
    <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={0.5}>
      <Typography variant="caption" color="grey.900" sx={{ textTransform: "uppercase", fontSize: "0.9rem" }}>
        {isFrom ? "FROM" : "TO"}
      </Typography>
      <Typography variant="h6" color="grey.900" whiteSpace="nowrap">
        Balance: {tokenBalance}
      </Typography>
    </Box>
    <Typography variant="h4" color="grey.900" fontWeight={600} mb={2} whiteSpace="nowrap">
      {tokenSymbol}
    </Typography>
    <TextField
      fullWidth
      type="number"
      value={value}
      onChange={(e) => setValue(e.target.value.replace(/^0+(?=\d)/, ""))}
      placeholder="0"
      disabled={!isFrom || disabled}
      variant="outlined"
      InputProps={{ style: { fontSize: "1.5rem", color: network === "binance" ? "#757575" : "#212121" } }}
    />
    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
      <Typography variant="body1" color="grey.900" whiteSpace="nowrap">
        Network: {network === "vitruveo" ? "Vitruveo" : "BSC"}
      </Typography>
      <Button
        size="small"
        variant="contained"
        disableElevation
        onClick={() => setValue(max)}
        disabled={!isFrom || disabled}
        sx={{
          fontWeight: 800,
          px: 2,
          minWidth: 64,
          whiteSpace: "nowrap",
          flexShrink: 0,
          backgroundColor: network === "binance" ? "#FFF176" : "#D1C4E9", // light yellow / light purple
          color: network === "binance" ? "#4A3200" : "#3B0A63", // very dark gold / very dark purple
          "&:hover": { backgroundColor: network === "binance" ? "#FFEE58" : "#B39DDB" },
          "&.Mui-disabled": { backgroundColor: "rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.35)" },
        }}
      >
        MAX
      </Button>
    </Box>
  </Paper>
);

export default function Bsc() {
  const VITRUVEO = "vitruveo";

  const [currentFrom, setCurrentFrom] = useState(VITRUVEO);
  const [amountStr, setAmountStr] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const [coinBalance, setCoinBalance] = useState(0n);
  const [tokenBalance, setTokenBalance] = useState(0n);
  const [usdtBalance, setUsdtBalance] = useState(0n);
  const [bnbBalance, setBnbBalance] = useState(0n);
  const [bscGasPrice, setBscGasPrice] = useState(null);
  const [vitGasPrice, setVitGasPrice] = useState(null);
  const [vitNotary, setVitNotary] = useState(null); // Vitruveo notary status, from /api/bridge/status
  const [fee, setFee] = useState(null); // { feeVtru, feeUsdt, maxFeeUsdt } for the forward direction

  // Every unfinished item for this wallet, each with the exact reason it is stalled.
  // { key, severity, title, reasons: string[], links: [{ label, href }], dismissHash? }
  const [pendingItems, setPendingItems] = useState([]);

  // Detected in-flight state
  const [pending, setPending] = useState(null); // { sourceChainId, amount, blockNumber } — locked/burned, not yet notarized
  const [receipt, setReceipt] = useState(null); // notarized receipt awaiting claim
  const [claimFee, setClaimFee] = useState(null); // { feeVtru, feeUsdt } for the receipt being finished

  const [error, setError] = useState("");

  // Contract-level bridge stats (wallet-independent)
  const [lockedBalance, setLockedBalance] = useState(null);
  const [mintedSupply, setMintedSupply] = useState(null);

  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });

  const errMsg = (e) => e?.shortMessage || e?.reason || e?.details || e?.message || String(e);

  // Reactive connection state (works for already-connected wallets, autoConnect, and account switches).
  const { address: account } = useAccount();
  const { chain } = useNetwork();

  const receiptKey = (a) => `vtru-bridge-receipt-${(a || "").toLowerCase()}`;
  const loadReceipt = (a) => {
    try {
      const raw = localStorage.getItem(receiptKey(a));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const saveReceipt = (a, r) => localStorage.setItem(receiptKey(a), JSON.stringify(r));
  const clearReceipt = (a) => localStorage.removeItem(receiptKey(a));

  // Persisted per wallet so stall reasons survive a reload: the last failed step, and every bridge tx
  // broadcast from this page until it is mined successfully.
  const readJson = (k, dflt) => {
    try {
      const raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : dflt;
    } catch {
      return dflt;
    }
  };
  const lastErrorKey = (a) => `vtru-bridge-lasterror-${(a || "").toLowerCase()}`;
  const saveLastError = (message) => localStorage.setItem(lastErrorKey(account), JSON.stringify({ message, at: Date.now() }));
  const clearLastError = () => localStorage.removeItem(lastErrorKey(account));
  const txsKey = (a) => `vtru-bridge-txs-${(a || "").toLowerCase()}`;
  const loadTxs = (a) => readJson(txsKey(a), []);
  const trackTx = (chainId, tx, label) =>
    localStorage.setItem(
      txsKey(account),
      JSON.stringify([...loadTxs(account).filter((t) => t.hash !== tx.hash), { chainId, hash: tx.hash, nonce: tx.nonce, label, at: Date.now() }])
    );
  const untrackTx = (hash) => localStorage.setItem(txsKey(account), JSON.stringify(loadTxs(account).filter((t) => t.hash !== hash)));

  // Send a bridge tx with tracking: it stays in the pending list (with its exact state) until mined OK.
  async function sendTracked(chainId, label, send) {
    const tx = await send();
    trackTx(chainId, tx, label);
    setStatus("Waiting for confirmation…");
    await tx.wait();
    untrackTx(tx.hash);
    return tx;
  }

  // Exact state of a tracked tx: reverted (with reason), dropped/replaced, or why it is still unmined.
  async function diagnoseTx(t) {
    const p = providerFor(t.chainId);
    const chainName = CHAIN_NAME[t.chainId];
    const [tx, rcpt] = await Promise.all([p.getTransaction(t.hash), p.getTransactionReceipt(t.hash)]);
    if (rcpt) {
      if (rcpt.status === 1) return null;
      let reason = "no revert reason returned";
      try {
        await p.call({ to: tx.to, from: tx.from, data: tx.data, value: tx.value, blockTag: rcpt.blockNumber });
      } catch (e) {
        reason = errMsg(e);
      }
      return { severity: "error", title: `${t.label} reverted on ${chainName}`, reasons: [`Reverted in block ${rcpt.blockNumber}: ${reason}`], dismissable: true };
    }
    const latestNonce = await p.getTransactionCount(account, "latest");
    if (!tx && Date.now() - t.at < 60000) {
      return { severity: "warning", title: `${t.label} pending on ${chainName}`, reasons: [`Broadcast ${ago(t.at)} ago, not yet visible on the ${chainName} RPC.`] };
    }
    if (!tx) {
      return t.nonce != null && latestNonce > t.nonce
        ? { severity: "error", title: `${t.label} was replaced on ${chainName}`, reasons: [`Nonce ${t.nonce} was mined by a different transaction (sped up or cancelled in the wallet). This transaction will never confirm.`], dismissable: true }
        : { severity: "error", title: `${t.label} was dropped on ${chainName}`, reasons: [`Not in any block or in the RPC mempool after ${ago(t.at)}; nonce ${t.nonce} is still unused. It was evicted and must be sent again.`], dismissable: true };
    }
    const feeData = await p.getFeeData();
    const txPrice = BigInt(tx.gasPrice ?? tx.maxFeePerGas ?? 0n);
    const netPrice = BigInt(feeData.gasPrice ?? 0n);
    let reason;
    if (tx.nonce > latestNonce) {
      reason = `Blocked by an earlier transaction: this is nonce ${tx.nonce}, but nonce ${latestNonce} has not been mined yet.`;
    } else if (netPrice > 0n && txPrice < netPrice) {
      reason = `Gas price ${gwei(txPrice)} gwei is below the current ${chainName} gas price of ${gwei(netPrice)} gwei. Speed it up in your wallet.`;
    } else {
      reason = `Broadcast ${ago(t.at)} ago, not mined yet (gas price ${gwei(txPrice)} gwei, network ${gwei(netPrice)} gwei).`;
    }
    return { severity: "warning", title: `${t.label} pending on ${chainName}`, reasons: [reason] };
  }

  // Why a signed receipt has not been redeemed on its destination chain. Returns null once it is claimed.
  async function diagnoseReceipt(r, lastError) {
    const destId = Number(r.destChainId);
    const destName = CHAIN_NAME[destId];
    const destVtru = new ethers.Contract(r.destContract, VTRU_ABI, providerFor(destId));
    if (await destVtru.claimed(receiptHashOf(r))) return null;

    const amount = BigInt(r.amount);
    const args = [r.account, amount, Number(r.direction), BigInt(r.blockNumber)];
    const reasons = [];
    let simulate = true;
    if (destId === BSC_CHAIN_ID) {
      const [bnb, usdt, allowance, feeData, { maxFeeUsdt }] = await Promise.all([
        bscProvider.getBalance(r.account),
        new ethers.Contract(USDT_BSC, ERC20_ABI, bscProvider).balanceOf(r.account),
        new ethers.Contract(USDT_BSC, ERC20_ABI, bscProvider).allowance(r.account, BSC_VTRU),
        bscProvider.getFeeData(),
        computeForwardFee(amount),
      ]);
      const needBnb = BigInt(feeData.gasPrice ?? 0n) * BRIDGE_GAS_ESTIMATE;
      if (bnb < needBnb) reasons.push(`Not enough BNB for gas on BSC: you hold ${fmtGas(bnb)}, the claim needs ~${fmtGas(needBnb)}.`);
      if (usdt < maxFeeUsdt) reasons.push(`Not enough USDT for the bridge fee on BSC: you hold ${fmtUsdt(usdt)}, the fee is up to ${fmtUsdt(maxFeeUsdt)}.`);
      if (maxFeeUsdt > 0n && allowance < maxFeeUsdt) {
        simulate = false; // claimToken would revert on transferFrom until the fee is approved
        reasons.push(`USDT fee not approved yet (allowance ${fmtUsdt(allowance)} of ${fmtUsdt(maxFeeUsdt)}); the approve step runs before the claim.`);
      }
      if (simulate) {
        try {
          await destVtru.claimToken.staticCall(...args, maxFeeUsdt, r.signature, { from: r.account });
        } catch (e) {
          reasons.push(`The claim would revert on BSC: ${errMsg(e)}`);
        }
      }
    } else {
      const [bal, feeData] = await Promise.all([vitruveoProvider.getBalance(r.account), vitruveoProvider.getFeeData()]);
      const need = BigInt(feeData.gasPrice ?? 0n) * CLAIM_GAS_ESTIMATE;
      if (bal < need) reasons.push(`Not enough VTRU for gas on Vitruveo: you hold ${fmtGas(bal)}, the claim needs ~${fmtGas(need)}.`);
      try {
        await destVtru.claimCoin.staticCall(...args, r.signature, { from: r.account });
      } catch (e) {
        reasons.push(`The claim would revert on Vitruveo: ${errMsg(e)}`);
      }
    }
    if (lastError) reasons.push(`Last attempt failed ${ago(lastError.at)} ago: ${lastError.message}`);
    if (reasons.length === 0) reasons.push(`Receipt is signed and valid; the claim on ${destName} has not been submitted yet.`);
    return {
      key: `receipt-${r.blockNumber}`,
      severity: "warning",
      title: `${fmt(amount)} VTRU notarized, waiting to be received on ${destName}`,
      reasons,
      links: [],
    };
  }

  // Why an escrow (locked/burned, not notarized) is stuck, from the notary diagnostics + the last failure.
  function diagnoseEscrow(esc, srv, vitBal, lastError) {
    const src = esc.sourceChainId;
    const dest = src === VITRUVEO_CHAIN_ID ? BSC_CHAIN_ID : VITRUVEO_CHAIN_ID;
    const reasons = [];
    if (!srv) {
      reasons.push("Could not reach the bridge status service to check the notary.");
    } else {
      for (const id of [src, dest]) {
        const n = srv.notary?.[id];
        if (!n) continue;
        if (n.error) reasons.push(`Could not read the ${CHAIN_NAME[id]} notary: ${n.error}`);
        else if (!n.configured) reasons.push(`The ${CHAIN_NAME[id]} notary key is not configured on the server, so notarization fails.`);
        else if (!n.hasRole) reasons.push(`Notary ${n.address} does not hold NOTARY_ROLE on the ${CHAIN_NAME[id]} VTRU contract.`);
      }
      const sn = srv.notary?.[src];
      if (sn?.configured && !sn.error && BigInt(sn.balance) < BigInt(sn.requiredZero)) {
        reasons.push(`The ${CHAIN_NAME[src]} notary ${sn.address} holds ${fmtGas(BigInt(sn.balance))}, needs ~${fmtGas(BigInt(sn.requiredZero))} gas to close the escrow.`);
      }
      const vn = srv.notary?.[VITRUVEO_CHAIN_ID];
      if (dest === VITRUVEO_CHAIN_ID && vitBal === 0n && vn?.configured && !vn.error && BigInt(vn.balance) < BigInt(vn.requiredFront) + BigInt(vn.requiredZero)) {
        reasons.push(`Your Vitruveo wallet is empty and the Vitruveo notary ${vn.address} holds ${fmtGas(BigInt(vn.balance))} VTRU, too little to front your claim gas.`);
      }
    }
    if (lastError) reasons.push(`Last attempt failed ${ago(lastError.at)} ago: ${lastError.message}`);
    if (reasons.length === 0) {
      reasons.push(`Locked at ${CHAIN_NAME[src]} block ${esc.blockNumber}, but notarization was never requested (the transfer was interrupted after the lock confirmed). Continue to finish, or cancel to refund.`);
    }
    return {
      key: `escrow-${src}-${esc.blockNumber}`,
      severity: "warning",
      title: `${fmt(esc.amount)} VTRU ${src === VITRUVEO_CHAIN_ID ? "locked" : "burned"} on ${CHAIN_NAME[src]}, not notarized`,
      reasons,
      links: [],
    };
  }

  // Balances + in-flight detection (read-only, both chains)
  async function refresh() {
    if (!account) {
      setCoinBalance(0n);
      setTokenBalance(0n);
      setPending(null);
      setReceipt(null);
      setPendingItems([]);
      return;
    }
    try {
      // Independent settles so one flaky RPC read can't zero out the others.
      const [coin, tok, usdt, bnb, feeData, vitFeeData, srvRes] = await Promise.allSettled([
        vitruveoProvider.getBalance(account),
        new ethers.Contract(BSC_VTRU, ERC20_ABI, bscProvider).balanceOf(account),
        new ethers.Contract(USDT_BSC, ERC20_ABI, bscProvider).balanceOf(account),
        bscProvider.getBalance(account),
        bscProvider.getFeeData(),
        vitruveoProvider.getFeeData(),
        fetch(`/api/bridge/status?account=${account}`).then((r) => (r.ok ? r.json() : null)),
      ]);
      if (coin.status === "fulfilled") setCoinBalance(coin.value);
      if (tok.status === "fulfilled") setTokenBalance(tok.value);
      if (usdt.status === "fulfilled") setUsdtBalance(usdt.value);
      if (bnb.status === "fulfilled") setBnbBalance(bnb.value);
      if (feeData.status === "fulfilled") setBscGasPrice(BigInt(feeData.value.gasPrice ?? feeData.value.maxFeePerGas ?? 3_000_000_000n));
      if (vitFeeData.status === "fulfilled") setVitGasPrice(BigInt(vitFeeData.value.gasPrice ?? vitFeeData.value.maxFeePerGas ?? 0n));
      const srv = srvRes.status === "fulfilled" ? srvRes.value : null;
      setVitNotary(srv?.notary?.[VITRUVEO_CHAIN_ID] ?? null);
      const vitBal = coin.status === "fulfilled" ? coin.value : null;
      const lastError = readJson(lastErrorKey(account), null);

      const items = [];

      // 1. Bridge transactions broadcast from this page that have not mined successfully.
      const tracked = loadTxs(account);
      const trackedPending = { [VITRUVEO_CHAIN_ID]: new Set(), [BSC_CHAIN_ID]: new Set() };
      for (const t of tracked) {
        try {
          const d = await diagnoseTx(t);
          if (!d) {
            untrackTx(t.hash);
            continue;
          }
          if (d.severity === "warning" && t.nonce != null) trackedPending[t.chainId].add(t.nonce);
          items.push({
            key: `tx-${t.hash}`,
            severity: d.severity,
            title: d.title,
            reasons: d.reasons,
            links: [{ label: "View transaction", href: TX_URL[t.chainId](t.hash) }],
            dismissHash: d.dismissable ? t.hash : undefined,
          });
        } catch (e) {
          console.error("diagnoseTx", e);
        }
      }

      // 2. Other wallet transactions sitting in either chain's mempool (sent outside this page).
      for (const id of [VITRUVEO_CHAIN_ID, BSC_CHAIN_ID]) {
        try {
          const p = providerFor(id);
          const [latest, pend] = await Promise.all([p.getTransactionCount(account, "latest"), p.getTransactionCount(account, "pending")]);
          const others = [];
          for (let n = latest; n < pend; n++) if (!trackedPending[id].has(n)) others.push(n);
          if (others.length) {
            items.push({
              key: `mempool-${id}`,
              severity: "warning",
              title: `${others.length} other wallet transaction${others.length > 1 ? "s" : ""} pending on ${CHAIN_NAME[id]}`,
              reasons: [
                `Nonce${others.length > 1 ? "s" : ""} ${others.join(", ")} broadcast but not mined. New ${CHAIN_NAME[id]} transactions from this wallet, including bridge steps, queue behind ${others.length > 1 ? "them" : "it"} until mined, sped up, or cancelled in the wallet.`,
              ],
              links: [],
            });
          }
        } catch (e) {
          console.error("nonce check", e);
        }
      }

      // 3. Signed receipt awaiting redemption, else a raw escrow (locked/burned but not notarized).
      let stored = loadReceipt(account);
      let esc = null;
      if (stored) {
        try {
          const d = await diagnoseReceipt(stored, lastError);
          if (d) items.push(d);
          else {
            clearReceipt(account); // already redeemed on the destination chain
            stored = null;
          }
        } catch (e) {
          console.error("diagnoseReceipt", e);
        }
      }
      if (!stored) {
        const vtruEscrow = await new ethers.Contract(VITRUVEO_VTRU, VTRU_ABI, vitruveoProvider).escrow(account);
        if (BigInt(vtruEscrow.amount) > 0n) {
          esc = { sourceChainId: VITRUVEO_CHAIN_ID, amount: BigInt(vtruEscrow.amount), blockNumber: BigInt(vtruEscrow.blockNumber) };
        } else {
          const bscEscrow = await new ethers.Contract(BSC_VTRU, VTRU_ABI, bscProvider).escrow(account);
          if (BigInt(bscEscrow.amount) > 0n) {
            esc = { sourceChainId: BSC_CHAIN_ID, amount: BigInt(bscEscrow.amount), blockNumber: BigInt(bscEscrow.blockNumber) };
          }
        }
        if (esc) items.push(diagnoseEscrow(esc, srv, vitBal, lastError));
      }

      // 4. Forward bridges the notary zeroed but that were never claimed on BSC and have no saved receipt.
      // Skipped while a transfer is running: between the notary zeroing and the receipt being saved it looks the same.
      for (const u of busy ? [] : srv?.unclaimed || []) {
        if (stored && String(stored.blockNumber) === u.blockNumber) continue;
        items.push({
          key: `unclaimed-${u.blockNumber}`,
          severity: "error",
          title: `${fmt(BigInt(u.amount))} VTRU notarized but never received on BSC`,
          reasons: [
            `The escrow from Vitruveo block ${u.blockNumber} was closed by the notary at block ${u.zeroedBlock}, but the signed receipt is not saved in this browser and nothing was claimed on BSC. It can no longer be cancelled; the receipt has to be re-issued by the notary.`,
          ],
          links: [
            { label: "Lock tx", href: TX_URL[VITRUVEO_CHAIN_ID](u.lockTx) },
            { label: "Notary tx", href: TX_URL[VITRUVEO_CHAIN_ID](u.zeroTx) },
          ],
        });
      }
      if (srv?.unclaimedError) {
        items.push({ key: "unclaimed-error", severity: "info", title: "Could not scan past transfers", reasons: [srv.unclaimedError], links: [] });
      }

      setReceipt(stored);
      setPending(stored ? null : esc);
      setPendingItems(items);
    } catch (e) {
      console.error("refresh error", e);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, busy ? 5000 : 15000);
    return () => clearInterval(id);
  }, [account, busy]);

  useEffect(() => {
    async function loadBridgeStats() {
      const [locked, minted] = await Promise.allSettled([
        vitruveoProvider.getBalance(VITRUVEO_VTRU),
        new ethers.Contract(BSC_VTRU, ERC20_ABI, bscProvider).totalSupply(),
      ]);
      if (locked.status === "fulfilled") setLockedBalance(locked.value);
      if (minted.status === "fulfilled") setMintedSupply(minted.value);
    }
    loadBridgeStats();
    const id = setInterval(loadBridgeStats, 15000);
    return () => clearInterval(id);
  }, []);

  // Recompute the forward-direction (Vitruveo -> BSC) fee when amount/direction changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (currentFrom !== VITRUVEO) {
        setFee(null);
        return;
      }
      const n = Number(amountStr);
      if (!n || n <= 0) {
        setFee(null);
        return;
      }
      try {
        const f = await computeForwardFee(ethers.parseEther(String(Math.trunc(n))));
        if (!cancelled) setFee(f);
      } catch {
        if (!cancelled) setFee(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [amountStr, currentFrom]);

  // Fee for the receipt currently being finished (forward direction only).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!receipt || Number(receipt.destChainId) !== BSC_CHAIN_ID) {
        setClaimFee(null);
        return;
      }
      try {
        const f = await computeForwardFee(BigInt(receipt.amount));
        if (!cancelled) setClaimFee(f);
      } catch {
        if (!cancelled) setClaimFee(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [receipt]);

  const sourceChainId = currentFrom === VITRUVEO ? VITRUVEO_CHAIN_ID : BSC_CHAIN_ID;
  const fmt = (v) => parseFloat(ethers.formatEther(v)).toFixed(4);
  // BNB amounts are small enough that 4 decimals rounds the gas figures to nothing.
  const fmtGas = (v) => parseFloat(ethers.formatEther(v)).toFixed(5);
  const maxStr = (v) => Math.max(0, Math.trunc(Number(ethers.formatEther(v)))).toFixed(0);
  const fmtUsdt = (v) => parseFloat(ethers.formatUnits(v, 18)).toFixed(4);
  // Pre-bridge checklist. Every item must pass before VTRU is accepted on the source chain.
  // state: "ok" | "fail" | "checking" | "idle"
  function evaluateChecklist({ forward, amount, vitBal, bnbBal, usdtBal, vitGas, bscGas, feeQuote, notary }) {
    const items = [];

    if (vitGas == null || vitBal == null) {
      items.push({ key: "vit", label: "Gas on Vitruveo", state: "checking", detail: "Checking…" });
    } else if (forward) {
      const need = vitGas * LOCK_GAS_ESTIMATE;
      const ok = vitBal >= amount + need;
      items.push({
        key: "vit",
        label: "Gas on Vitruveo",
        state: ok ? "ok" : "fail",
        detail: ok
          ? `~${fmtGas(need)} VTRU for the lock`
          : `Need ${fmt(amount)} + ~${fmtGas(need)} VTRU gas, you hold ${fmt(vitBal)}. Lower the amount.`,
      });
    } else if (vitBal === 0n) {
      // Empty wallet: the Vitruveo notary fronts the claim gas, so it must be able to pay it.
      const need = vitGas * CLAIM_GAS_ESTIMATE;
      if (!notary) {
        items.push({ key: "vit", label: "Gas on Vitruveo", state: "checking", detail: "Checking the notary…" });
      } else {
        const notaryBal = notary.configured && !notary.error ? BigInt(notary.balance) : 0n;
        const ok = notary.configured && !notary.error && notary.hasRole && notaryBal >= need;
        items.push({
          key: "vit",
          label: "Gas on Vitruveo",
          state: ok ? "ok" : "fail",
          detail: ok
            ? "Empty wallet: the notary fronts the claim gas"
            : notary.error
            ? `Your wallet holds 0 VTRU and the notary could not be checked: ${notary.error}`
            : !notary.configured || !notary.hasRole
            ? "Your wallet holds 0 VTRU and the Vitruveo notary is not set up to front gas. Add VTRU on Vitruveo."
            : `Your wallet holds 0 VTRU and the notary holds ${fmtGas(notaryBal)}, too little to front ~${fmtGas(need)}. Add VTRU on Vitruveo.`,
        });
      }
    } else {
      const need = vitGas * CLAIM_GAS_ESTIMATE;
      const ok = vitBal >= need;
      items.push({
        key: "vit",
        label: "Gas on Vitruveo",
        state: ok ? "ok" : "fail",
        detail: ok
          ? `~${fmtGas(need)} VTRU for the claim`
          : `You hold ${fmtGas(vitBal)} VTRU, the claim needs ~${fmtGas(need)}. The notary only fronts gas to wallets holding 0 VTRU.`,
      });
    }

    if (bscGas == null || bnbBal == null) {
      items.push({ key: "bsc", label: "Gas on BSC", state: "checking", detail: "Checking…" });
    } else {
      const need = bscGas * (forward ? BRIDGE_GAS_ESTIMATE : BURN_GAS_ESTIMATE);
      const ok = bnbBal >= need;
      items.push({
        key: "bsc",
        label: "Gas on BSC",
        state: ok ? "ok" : "fail",
        detail: ok
          ? `~${fmtGas(need)} BNB for the ${forward ? "approve + claim" : "burn"}`
          : `Need ~${fmtGas(need)} BNB, you hold ${fmtGas(bnbBal)}. Add BNB on BSC.`,
      });
    }

    if (!forward) {
      items.push({ key: "usdt", label: "USDT fee on BSC", state: "ok", detail: "No fee for BSC → Vitruveo" });
    } else if (amount === 0n) {
      items.push({ key: "usdt", label: "USDT fee on BSC", state: "idle", detail: "Enter an amount" });
    } else if (!feeQuote || usdtBal == null) {
      items.push({ key: "usdt", label: "USDT fee on BSC", state: "checking", detail: "Checking…" });
    } else if (feeQuote.maxFeeUsdt === 0n) {
      items.push({ key: "usdt", label: "USDT fee on BSC", state: "ok", detail: "No USDT fee" });
    } else {
      const ok = usdtBal >= feeQuote.maxFeeUsdt;
      items.push({
        key: "usdt",
        label: "USDT fee on BSC",
        state: ok ? "ok" : "fail",
        detail: ok
          ? `~${fmtUsdt(feeQuote.feeUsdt)} USDT (you hold ${fmtUsdt(usdtBal)})`
          : `Need up to ${fmtUsdt(feeQuote.maxFeeUsdt)} USDT, you hold ${fmtUsdt(usdtBal)}. Add USDT on BSC.`,
      });
    }
    return items;
  }

  const amountWei = (() => {
    const n = Math.trunc(Number(amountStr));
    return n > 0 ? ethers.parseEther(String(n)) : 0n;
  })();
  const checklist = account
    ? evaluateChecklist({
        forward: currentFrom === VITRUVEO,
        amount: amountWei,
        vitBal: coinBalance,
        bnbBal: bnbBalance,
        usdtBal: usdtBalance,
        vitGas: vitGasPrice,
        bscGas: bscGasPrice,
        feeQuote: fee,
        notary: vitNotary,
      })
    : [];
  const checklistPass = checklist.length > 0 && checklist.every((i) => i.state === "ok");

  // Same checklist from fresh chain reads, run right before the source-chain transaction.
  async function runPreflight(amount) {
    const forward = currentFrom === VITRUVEO;
    const [vitBal, bnbBal, usdtBal, vitFee, bscFee, feeQuote, srv] = await Promise.all([
      vitruveoProvider.getBalance(account),
      bscProvider.getBalance(account),
      new ethers.Contract(USDT_BSC, ERC20_ABI, bscProvider).balanceOf(account),
      vitruveoProvider.getFeeData(),
      bscProvider.getFeeData(),
      forward ? computeForwardFee(amount) : Promise.resolve(null),
      forward ? Promise.resolve(null) : fetch(`/api/bridge/status?account=${account}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);
    return evaluateChecklist({
      forward,
      amount,
      vitBal,
      bnbBal,
      usdtBal,
      vitGas: BigInt(vitFee.gasPrice ?? vitFee.maxFeePerGas ?? 0n),
      bscGas: BigInt(bscFee.gasPrice ?? bscFee.maxFeePerGas ?? 3_000_000_000n),
      feeQuote,
      notary: srv?.notary?.[VITRUVEO_CHAIN_ID] ?? { error: "bridge status service unreachable" },
    });
  }

  const inputInvalid = () => {
    const n = Number(amountStr);
    const bal = currentFrom === VITRUVEO ? coinBalance : tokenBalance;
    return n <= 0 || n > Math.trunc(Number(ethers.formatEther(bal)));
  };

  // Ask the notary to sign a receipt for the pending escrow and zero it.
  async function notarize(srcChainId) {
    setStatus("Notarizing…");
    const res = await fetch("/api/bridge/notarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account, sourceChainId: srcChainId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ? `${err.error}: ${err.detail}` : err.error || `Notarize failed (HTTP ${res.status})`);
    }
    const r = await res.json();
    saveReceipt(account, r);
    setReceipt(r);
    setPending(null);
    return r;
  }

  // Step 1: lock/burn on the source chain, then notarize.
  async function handleBridge() {
    if (busy) return;
    setBusy(true);
    setError("");
    clearLastError(); // a new transfer starts with a clean failure record
    const srcName = currentFrom === VITRUVEO ? "Vitruveo" : "BSC";
    try {
      const amount = ethers.parseEther(String(Math.trunc(Number(amountStr))));

      setStatus("Running pre-bridge checklist…");
      const failed = (await runPreflight(amount)).filter((i) => i.state !== "ok");
      if (failed.length) {
        throw new Error(`Checklist failed, nothing was sent. ${failed.map((i) => `${i.label}: ${i.detail}`).join(" ")}`);
      }

      if (getNetwork().chain?.id !== sourceChainId) setStatus(`Switching your wallet to ${srcName}…`);
      const signer = await getSigner(sourceChainId);

      setStatus("Confirm the transfer in your wallet…");
      await sendTracked(sourceChainId, currentFrom === VITRUVEO ? "Lock VTRU" : "Burn VTRU", () =>
        currentFrom === VITRUVEO
          ? new ethers.Contract(VITRUVEO_VTRU, VTRU_ABI, signer).lockVTRUCoin({ value: amount })
          : new ethers.Contract(BSC_VTRU, VTRU_ABI, signer).burnVTRUToken(amount)
      );

      // Get the signed receipt and continue straight to the destination finish (no extra button).
      setStatus("Preparing your transfer…");
      const r = await notarize(sourceChainId);
      await finishReceipt(r);
      setReceipt(null);
      setStatus("");
      clearLastError();
      showToast("Transfer complete!");
    } catch (e) {
      console.error(e);
      setError(errMsg(e));
      saveLastError(errMsg(e));
    } finally {
      setBusy(false);
      refresh();
    }
  }

  // Compute the USDT fee + a small buffer for a forward (VitruveoToBsc) claim,
  // priced off the PancakeSwap V3 pool exactly like the contract's _quoteVtruToUsdt.
  async function computeForwardFee(amount) {
    const vtru = new ethers.Contract(BSC_VTRU, VTRU_ABI, bscProvider);
    const feeBps = BigInt(await vtru.feeBps());
    const feeVtru = (amount * feeBps) / 10000n;
    if (feeVtru === 0n) return { feeVtru: 0n, feeUsdt: 0n, maxFeeUsdt: 0n };

    const pool = new ethers.Contract(V3_POOL, V3_POOL_ABI, bscProvider);
    const [slot0, token0] = await Promise.all([pool.slot0(), pool.token0()]);
    const sp = BigInt(slot0[0]); // sqrtPriceX96

    // Both tokens are 18 decimals. USDT per VTRU = (sqrtP/2^96)^2 when token0 is VTRU, else its inverse.
    const feeUsdt =
      token0.toLowerCase() === BSC_VTRU.toLowerCase()
        ? (feeVtru * sp * sp) / (Q96 * Q96)
        : (feeVtru * Q96 * Q96) / (sp * sp);
    const maxFeeUsdt = (feeUsdt * 102n) / 100n; // 2% buffer
    return { feeVtru, feeUsdt, maxFeeUsdt };
  }

  // Finish a receipt on its destination chain: switch, approve the fee if any, then claim.
  // Throws on failure (the receipt stays saved so the user can retry).
  async function finishReceipt(r) {
    const destId = Number(r.destChainId);
    const destName = destId === BSC_CHAIN_ID ? "BSC" : "Vitruveo";
    if (getNetwork().chain?.id !== destId) setStatus(`Switching your wallet to ${destName}…`);
    const signer = await getSigner(destId);

    const amount = BigInt(r.amount);
    const args = [r.account, amount, Number(r.direction), BigInt(r.blockNumber)];

    if (destId === BSC_CHAIN_ID) {
      // Forward finish: approve the USDT fee (if any), then claimToken.
      setStatus("Calculating fees…");
      const { maxFeeUsdt } = await computeForwardFee(amount);
      if (maxFeeUsdt > 0n) {
        const allowance = BigInt(await new ethers.Contract(USDT_BSC, ERC20_ABI, bscProvider).allowance(r.account, BSC_VTRU));
        if (allowance < maxFeeUsdt) {
          setStatus("Approve the USDT fee in your wallet…");
          await sendTracked(BSC_CHAIN_ID, "Approve USDT fee", () => new ethers.Contract(USDT_BSC, ERC20_ABI, signer).approve(BSC_VTRU, maxFeeUsdt));
        }
      }
      setStatus("Confirm in your wallet…");
      await sendTracked(BSC_CHAIN_ID, "Claim VTRU", () => new ethers.Contract(BSC_VTRU, VTRU_ABI, signer).claimToken(...args, maxFeeUsdt, r.signature));
    } else {
      setStatus("Confirm in your wallet…");
      await sendTracked(VITRUVEO_CHAIN_ID, "Claim VTRU", () => new ethers.Contract(VITRUVEO_VTRU, VTRU_ABI, signer).claimCoin(...args, r.signature));
    }
    clearReceipt(r.account);
  }

  // Manual finish (resume / retry after an interrupted auto-finish).
  async function handleClaim() {
    if (busy || !receipt) return;
    setBusy(true);
    setError("");
    try {
      await finishReceipt(receipt);
      setReceipt(null);
      setStatus("");
      clearLastError();
      showToast("Transfer complete!");
    } catch (e) {
      console.error(e);
      setError(errMsg(e));
      saveLastError(errMsg(e));
    } finally {
      setBusy(false);
      refresh();
    }
  }

  // Cancel a pending (not-yet-notarized) escrow: refund on the source chain.
  async function handleCancel() {
    if (busy || !pending) return;
    setBusy(true);
    setError("");
    try {
      const isVitruveo = pending.sourceChainId === VITRUVEO_CHAIN_ID;
      if (getNetwork().chain?.id !== pending.sourceChainId) setStatus(`Switching your wallet to ${isVitruveo ? "Vitruveo" : "BSC"}…`);
      const signer = await getSigner(pending.sourceChainId);
      setStatus("Confirm the refund in your wallet…");
      const c = new ethers.Contract(isVitruveo ? VITRUVEO_VTRU : BSC_VTRU, VTRU_ABI, signer);
      await sendTracked(pending.sourceChainId, "Cancel & refund", () => (isVitruveo ? c.releaseCoinEscrow() : c.releaseTokenEscrow()));
      setStatus("");
      clearLastError();
      showToast("Escrow cancelled and refunded.");
    } catch (e) {
      console.error(e);
      setError(errMsg(e));
      saveLastError(errMsg(e));
    } finally {
      setBusy(false);
      refresh();
    }
  }

  // Continue an interrupted transfer: notarize the pending escrow, then finish on the destination.
  async function handleRetry() {
    if (busy || !pending) return;
    setBusy(true);
    setError("");
    try {
      const r = await notarize(pending.sourceChainId);
      await finishReceipt(r);
      setReceipt(null);
      setStatus("");
      clearLastError();
      showToast("Transfer complete!");
    } catch (e) {
      console.error(e);
      setError(errMsg(e));
      saveLastError(errMsg(e));
    } finally {
      setBusy(false);
      refresh();
    }
  }

  const breadcrumb = [
    { to: "/", title: "Home" },
    { title: "Bridge" },
    { title: "VTRU" },
  ];

  const receiptDestName = receipt ? CHAIN_NAME[Number(receipt.destChainId)] : "";
  const pendingSourceName = pending ? CHAIN_NAME[pending.sourceChainId] : "";

  return (
    <PageContainer title="VTRU Bridge" description="Bridge VTRU between Vitruveo and Binance Smart Chain">
      <Breadcrumb title="VTRU Bridge" items={breadcrumb} />
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={6} lg={6}>
          <Paper elevation={0} sx={{ p: 3, height: "100%", borderRadius: 3, backgroundColor: "primary.main", textAlign: "center" }}>
            <Typography color={"grey.900"} variant="subtitle1" fontWeight={600}>
              Locked VTRU Coin Balance
            </Typography>
            <Typography color={"grey.900"} variant="h2" fontWeight={700} my={1}>
              {lockedBalance === null ? "..." : Math.trunc(Number(ethers.formatEther(lockedBalance))).toLocaleString()}
            </Typography>
            <a
              href={`https://explorer.vitruveo.ai/address/${VITRUVEO_VTRU}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: "Courier", color: "#212121", fontSize: "14px", wordBreak: "break-all" }}
            >
              {VITRUVEO_VTRU}
            </a>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={6}>
          <Paper elevation={0} sx={{ p: 3, height: "100%", borderRadius: 3, backgroundColor: "#FFF9C4", textAlign: "center" }}>
            <Typography color={"grey.900"} variant="subtitle1" fontWeight={600}>
              Minted VTRU Token Balance (BSC)
            </Typography>
            <Typography color={"grey.900"} variant="h2" fontWeight={700} my={1}>
              {mintedSupply === null ? "..." : Math.trunc(Number(ethers.formatEther(mintedSupply))).toLocaleString()}
            </Typography>
            <a
              href={`https://bscscan.com/address/${BSC_VTRU}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: "Courier", color: "#212121", fontSize: "14px", wordBreak: "break-all" }}
            >
              {BSC_VTRU}
            </a>
          </Paper>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={0} sx={{ bgcolor: "transparent", backgroundImage: "none" }}>
            <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
              {account && pendingItems.length > 0 && (
                <Stack spacing={1.5} mb={3}>
                  <Typography variant="h6" fontWeight={700}>
                    Pending transactions ({pendingItems.length})
                  </Typography>
                  {pendingItems.map((it) => (
                    <Alert
                      key={it.key}
                      severity={it.severity}
                      sx={{ wordBreak: "break-word" }}
                      onClose={
                        it.dismissHash
                          ? () => {
                              untrackTx(it.dismissHash);
                              setPendingItems((xs) => xs.filter((x) => x.key !== it.key));
                            }
                          : undefined
                      }
                    >
                      <AlertTitle sx={{ fontWeight: 700 }}>{it.title}</AlertTitle>
                      {busy && status && /^(escrow|receipt)-/.test(it.key) && (
                        <Typography variant="body2" fontWeight={600}>In progress: {status}</Typography>
                      )}
                      {it.reasons.map((r, idx) => (
                        <Typography key={idx} variant="body2">
                          {r}
                        </Typography>
                      ))}
                      {it.links.length > 0 && (
                        <Stack direction="row" spacing={2} mt={0.5}>
                          {it.links.map((l) => (
                            <Link key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" variant="body2">
                              {l.label}
                            </Link>
                          ))}
                        </Stack>
                      )}
                    </Alert>
                  ))}
                </Stack>
              )}
              {!account ? (
                <Typography variant="h6" textAlign="center">
                  Please connect your wallet to bridge VTRU
                </Typography>
              ) : receipt ? (
                // ---- Finish step (signed receipt awaiting redemption on the destination) ----
                <Stack spacing={3} alignItems="center" textAlign="center" py={1}>
                  <CheckIcon color="success" sx={{ fontSize: 52 }} />
                  <Box>
                    <Typography variant="h6" fontWeight={700}>Almost done</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {chain?.id === Number(receipt.destChainId)
                        ? `Receive your VTRU on ${receiptDestName}.`
                        : `Switch to ${receiptDestName} to receive your VTRU.`}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h3" fontWeight={800} lineHeight={1}>
                      {fmt(BigInt(receipt.amount) - (claimFee ? claimFee.feeVtru : 0n))}
                    </Typography>
                    <Typography variant="overline" color="text.secondary">VTRU you receive</Typography>
                  </Box>

                  {Number(receipt.destChainId) === BSC_CHAIN_ID && claimFee && claimFee.feeVtru > 0n && (
                    <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
                      <Chip size="small" variant="outlined" label={`Fee ${fmt(claimFee.feeVtru)} VTRU`} />
                      <Chip size="small" variant="outlined" label={`+ ~${fmtUsdt(claimFee.feeUsdt)} USDT`} />
                    </Stack>
                  )}

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={busy}
                    onClick={handleClaim}
                    sx={{ py: 1.8, borderRadius: 3, fontWeight: 700, textTransform: "none" }}
                  >
                    {busy ? status || "Processing…" : `Receive on ${receiptDestName}`}
                  </Button>
                  <Button
                    color="inherit"
                    size="small"
                    disabled={busy}
                    onClick={() => { clearReceipt(account); setReceipt(null); }}
                    sx={{ textTransform: "none", color: "text.secondary" }}
                  >
                    Start over
                  </Button>
                </Stack>
              ) : pending ? (
                // ---- Pending escrow (locked/burned, not yet notarized) ----
                <Stack spacing={3} textAlign="center" py={1}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>Unfinished transfer</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {parseFloat(ethers.formatEther(pending.amount)).toFixed(0)} VTRU is in progress on {pendingSourceName}.
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={busy}
                      onClick={handleRetry}
                      sx={{ py: 1.6, borderRadius: 3, fontWeight: 700, textTransform: "none" }}
                    >
                      {busy ? status || "Processing…" : "Continue"}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      size="large"
                      disabled={busy}
                      onClick={handleCancel}
                      sx={{ py: 1.6, borderRadius: 3, fontWeight: 700, textTransform: "none" }}
                    >
                      Cancel &amp; refund
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                // ---- Normal bridge form ----
                <Box>
                  <Typography variant="h4" fontWeight={600} mb={3}>
                    Move VTRU between Vitruveo and BSC
                  </Typography>
                  <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={3} alignItems="stretch">
                  <Box flex={2} minWidth={0} display="flex" flexDirection="column" gap={3}>
                  <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={3} flex={1}>
                    <Box flex={1} minWidth={0}>
                      <SwapInput
                        isFrom
                        max={currentFrom === VITRUVEO ? maxStr(coinBalance) : maxStr(tokenBalance)}
                        value={amountStr}
                        setValue={setAmountStr}
                        tokenSymbol={currentFrom === VITRUVEO ? "VTRU Coin" : "VTRU Token"}
                        tokenBalance={currentFrom === VITRUVEO ? fmt(coinBalance) : fmt(tokenBalance)}
                        network={currentFrom === VITRUVEO ? "vitruveo" : "binance"}
                        disabled={busy}
                      />
                    </Box>
                    <Box display="flex" justifyContent="center" alignItems="center">
                      <IconButton
                        onClick={() => setCurrentFrom(currentFrom === VITRUVEO ? "binance" : VITRUVEO)}
                        disabled={busy}
                        sx={{ border: 1, borderColor: "grey.300", width: 64, height: 64 }}
                      >
                        <ArrowDownIcon sx={{ fontSize: 40, transform: { xs: "none", md: "rotate(-90deg)" } }} />
                      </IconButton>
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <SwapInput
                        isFrom={false}
                        max="0"
                        value={amountStr}
                        setValue={setAmountStr}
                        tokenSymbol={currentFrom === VITRUVEO ? "VTRU Token" : "VTRU Coin"}
                        tokenBalance={currentFrom === VITRUVEO ? fmt(tokenBalance) : fmt(coinBalance)}
                        network={currentFrom === VITRUVEO ? "binance" : "vitruveo"}
                        disabled
                      />
                    </Box>
                  </Box>
                  <Box display="flex" justifyContent="center">
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={busy || inputInvalid() || !checklistPass}
                      onClick={handleBridge}
                      sx={{ py: 1.8, borderRadius: 3, fontSize: "1.05rem", fontWeight: 700, textTransform: "none" }}
                    >
                      {busy ? status || "Processing…" : "Bridge VTRU"}
                    </Button>
                  </Box>
                  </Box>
                    <Box flex={1} minWidth={0} p={3} sx={{ borderRadius: 3, bgcolor: "action.hover" }}>
                    {currentFrom === VITRUVEO ? (
                      <>
                        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                          <Typography variant="subtitle2" fontWeight={700}>Bridge fee</Typography>
                          <Chip label="2%" size="small" color="primary" sx={{ fontWeight: 700 }} />
                        </Box>
                        <Stack direction="row" spacing={1} mb={1.5} flexWrap="wrap" useFlexGap>
                          <Chip size="small" variant="outlined" label={fee ? `1% VTRU · ${fmt(fee.feeVtru)}` : "1% VTRU"} />
                          <Chip size="small" variant="outlined" label={fee ? `1% USDT · ~${fmtUsdt(fee.feeUsdt)}` : "1% USDT"} />
                        </Stack>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Seeds permanent VTRU/USDT liquidity on PancakeSwap (position burned).
                        </Typography>
                      </>
                    ) : (
                      <Chip size="small" variant="outlined" color="success" label="No fee · BSC → Vitruveo" />
                    )}
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>Pre-bridge checklist</Typography>
                    <Stack spacing={1.25}>
                      {checklist.map((i) => (
                        <Box key={i.key} display="flex" gap={1} alignItems="flex-start">
                          <Box pt={0.25} lineHeight={0}>
                            {i.state === "ok" ? (
                              <PassIcon color="success" fontSize="small" />
                            ) : i.state === "fail" ? (
                              <FailIcon color="error" fontSize="small" />
                            ) : i.state === "checking" ? (
                              <CircularProgress size={16} />
                            ) : (
                              <IdleIcon color="disabled" fontSize="small" />
                            )}
                          </Box>
                          <Box minWidth={0}>
                            <Typography variant="body2" fontWeight={600}>{i.label}</Typography>
                            <Typography variant="caption" color={i.state === "fail" ? "error" : "text.secondary"} display="block">
                              {i.detail}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                    </Box>
                  </Box>

                </Box>
              )}

              {error ? (
                <Box mt={3}>
                  <Alert severity="error" onClose={() => setError("")} sx={{ wordBreak: "break-word" }}>
                    {error}
                  </Alert>
                </Box>
              ) : busy && status ? (
                <Box mt={3} display="flex" alignItems="center" gap={1.5}>
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    {status}
                  </Typography>
                </Box>
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={3} sx={{ borderRadius: 3, overflow: "hidden", lineHeight: 0 }}>
        <iframe
          title="VTRU/USDT PancakeSwap chart"
          src={`https://www.dextools.io/widget-chart/en/bnb/pe-light/${V3_POOL.toLowerCase()}?theme=dark&chartType=2&chartResolution=30&drawingToolbars=false`}
          width="100%"
          height="500"
          style={{ border: 0 }}
          allow="clipboard-write"
        />
      </Box>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}

Bsc.layout = "Blank";
