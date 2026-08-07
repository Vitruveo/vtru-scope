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
} from "@mui/material";
import {
  KeyboardArrowDown as ArrowDownIcon,
  CheckCircleOutline as CheckIcon,
} from "@mui/icons-material";

import { switchNetwork, getWalletClient, getNetwork } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";
import { ethers } from "ethers";
import { useAccount, useNetwork } from "wagmi";

const VITRUVEO_CHAIN_ID = 1490;
const BSC_CHAIN_ID = 56;

// Same contract address on both chains: locks USDT on BSC, mints USDT.b on Vitruveo.
const BRIDGE = config.mainnet.BridgedUSDT;
const USDT_BSC = "0x55d398326f99059fF775485246999027B3197955";
const BRIDGE_ABI = config.abi.BridgedUSDT;

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
];

const V3_POOL = "0x76d6B57B2bfD62B8b936a6E72904A8FA40bcB5dD"; // PancakeSwap V3 VTRU/USDT 0.25% pool

// Rough gas units to cover the BSC-side approve + lock/claim; used to check the
// user holds enough BNB for gas. Priced at the live BSC gas price.
const BRIDGE_GAS_ESTIMATE = 300000n;

const vitruveoProvider = new ethers.JsonRpcProvider("https://rpc.vitruveo.ai", VITRUVEO_CHAIN_ID);
const bscProvider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org", BSC_CHAIN_ID);

const CHAIN_NAME = { [VITRUVEO_CHAIN_ID]: "Vitruveo", [BSC_CHAIN_ID]: "BSC" };

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

export default function Usdt() {
  const VITRUVEO = "vitruveo";
  const BINANCE = "binance";

  // Primary flow is USDT (BSC) -> USDT.b (Vitruveo).
  const [currentFrom, setCurrentFrom] = useState(BINANCE);
  const [amountStr, setAmountStr] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const [usdtBalance, setUsdtBalance] = useState(0n); // USDT on BSC
  const [usdtbBalance, setUsdtbBalance] = useState(0n); // USDT.b on Vitruveo
  const [bnbBalance, setBnbBalance] = useState(0n);
  const [requiredBnb, setRequiredBnb] = useState(0n); // estimated BNB needed for BSC-side gas
  const [fee, setFee] = useState(null); // { feeUsdt, receive } for the BSC -> Vitruveo direction

  // Detected in-flight state
  const [pending, setPending] = useState(null); // { sourceChainId, amount, blockNumber } — locked/burned, not yet notarized
  const [receipt, setReceipt] = useState(null); // notarized receipt awaiting claim

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

  const receiptKey = (a) => `usdt-bridge-receipt-${(a || "").toLowerCase()}`;
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

  // Balances + in-flight detection (read-only, both chains)
  async function refresh() {
    if (!account) {
      setUsdtBalance(0n);
      setUsdtbBalance(0n);
      setPending(null);
      setReceipt(null);
      return;
    }
    try {
      // Independent settles so one flaky RPC read can't zero out the others.
      const [usdt, usdtb, bnb, feeData] = await Promise.allSettled([
        new ethers.Contract(USDT_BSC, ERC20_ABI, bscProvider).balanceOf(account),
        new ethers.Contract(BRIDGE, ERC20_ABI, vitruveoProvider).balanceOf(account),
        bscProvider.getBalance(account),
        bscProvider.getFeeData(),
      ]);
      if (usdt.status === "fulfilled") setUsdtBalance(usdt.value);
      if (usdtb.status === "fulfilled") setUsdtbBalance(usdtb.value);
      if (bnb.status === "fulfilled") setBnbBalance(bnb.value);
      if (feeData.status === "fulfilled") {
        const gasPrice = feeData.value.gasPrice ?? feeData.value.maxFeePerGas ?? 3_000_000_000n;
        setRequiredBnb(BigInt(gasPrice) * BRIDGE_GAS_ESTIMATE);
      }

      const stored = loadReceipt(account);
      if (stored) {
        setReceipt(stored);
        setPending(null);
        return;
      }
      setReceipt(null);

      // No receipt yet — is there a raw escrow (locked/burned but not notarized)?
      const bscEscrow = await new ethers.Contract(BRIDGE, BRIDGE_ABI, bscProvider).escrow(account);
      if (BigInt(bscEscrow.amount) > 0n) {
        setPending({ sourceChainId: BSC_CHAIN_ID, amount: BigInt(bscEscrow.amount), blockNumber: BigInt(bscEscrow.blockNumber) });
        return;
      }
      const vtruEscrow = await new ethers.Contract(BRIDGE, BRIDGE_ABI, vitruveoProvider).escrow(account);
      if (BigInt(vtruEscrow.amount) > 0n) {
        setPending({ sourceChainId: VITRUVEO_CHAIN_ID, amount: BigInt(vtruEscrow.amount), blockNumber: BigInt(vtruEscrow.blockNumber) });
        return;
      }
      setPending(null);
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
        new ethers.Contract(BRIDGE, BRIDGE_ABI, bscProvider).lockedSupply(),
        new ethers.Contract(BRIDGE, ERC20_ABI, vitruveoProvider).totalSupply(),
      ]);
      if (locked.status === "fulfilled") setLockedBalance(locked.value);
      if (minted.status === "fulfilled") setMintedSupply(minted.value);
    }
    loadBridgeStats();
    const id = setInterval(loadBridgeStats, 15000);
    return () => clearInterval(id);
  }, []);

  // The 1% fee is charged on BSC when bridging USDT to Vitruveo; nothing on the way back.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (currentFrom !== BINANCE) {
        setFee(null);
        return;
      }
      const n = Number(amountStr);
      if (!n || n <= 0) {
        setFee(null);
        return;
      }
      try {
        const amount = ethers.parseEther(String(Math.trunc(n)));
        const feeBps = BigInt(await new ethers.Contract(BRIDGE, BRIDGE_ABI, bscProvider).feeBps());
        const feeUsdt = (amount * feeBps) / 10000n;
        if (!cancelled) setFee({ feeUsdt, receive: amount - feeUsdt });
      } catch {
        if (!cancelled) setFee(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [amountStr, currentFrom]);

  const sourceChainId = currentFrom === VITRUVEO ? VITRUVEO_CHAIN_ID : BSC_CHAIN_ID;
  const fmt = (v) => parseFloat(ethers.formatEther(v)).toFixed(4);
  // BNB amounts are small enough that 4 decimals rounds the gas figures to nothing.
  const fmtGas = (v) => parseFloat(ethers.formatEther(v)).toFixed(5);
  const maxStr = (v) => Math.max(0, Math.trunc(Number(ethers.formatEther(v)))).toFixed(0);
  // Both source actions and the return claim touch BSC, so BNB gas is always required.
  const insufficientBnb = requiredBnb > 0n && bnbBalance < requiredBnb;

  const inputInvalid = () => {
    const n = Number(amountStr);
    const bal = currentFrom === VITRUVEO ? usdtbBalance : usdtBalance;
    return n <= 0 || n > Math.trunc(Number(ethers.formatEther(bal)));
  };

  // Ask the notary to sign a receipt for the pending escrow and zero it.
  async function notarize(srcChainId) {
    setStatus("Notarizing…");
    const res = await fetch("/api/bridge/notarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account, sourceChainId: srcChainId, token: "USDT" }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Notarize failed");
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
    const srcName = currentFrom === VITRUVEO ? "Vitruveo" : "BSC";
    try {
      const amount = ethers.parseEther(String(Math.trunc(Number(amountStr))));

      if (getNetwork().chain?.id !== sourceChainId) setStatus(`Switching your wallet to ${srcName}…`);
      const signer = await getSigner(sourceChainId);

      let tx;
      if (currentFrom === VITRUVEO) {
        setStatus("Confirm the transfer in your wallet…");
        tx = await new ethers.Contract(BRIDGE, BRIDGE_ABI, signer).burnUSDTToken(amount);
      } else {
        // Lock on BSC: the bridge pulls USDT, so it needs an allowance first.
        const allowance = BigInt(await new ethers.Contract(USDT_BSC, ERC20_ABI, bscProvider).allowance(account, BRIDGE));
        if (allowance < amount) {
          setStatus("Approve USDT in your wallet…");
          const atx = await new ethers.Contract(USDT_BSC, ERC20_ABI, signer).approve(BRIDGE, amount);
          setStatus("Waiting for confirmation…");
          await atx.wait();
        }
        setStatus("Confirm the transfer in your wallet…");
        tx = await new ethers.Contract(BRIDGE, BRIDGE_ABI, signer).lockUSDT(amount);
      }
      setStatus("Waiting for confirmation…");
      await tx.wait();

      // Get the signed receipt and continue straight to the destination finish (no extra button).
      setStatus("Preparing your transfer…");
      const r = await notarize(sourceChainId);
      await finishReceipt(r);
      setReceipt(null);
      setStatus("");
      showToast("Transfer complete!");
    } catch (e) {
      console.error(e);
      setError(errMsg(e));
    } finally {
      setBusy(false);
      refresh();
    }
  }

  // Finish a receipt on its destination chain: switch, then claim.
  // Throws on failure (the receipt stays saved so the user can retry).
  async function finishReceipt(r) {
    const destId = Number(r.destChainId);
    const destName = CHAIN_NAME[destId];
    if (getNetwork().chain?.id !== destId) setStatus(`Switching your wallet to ${destName}…`);
    const signer = await getSigner(destId);

    const args = [r.account, BigInt(r.amount), Number(r.direction), BigInt(r.blockNumber), r.signature];

    setStatus("Confirm in your wallet…");
    const bridge = new ethers.Contract(BRIDGE, BRIDGE_ABI, signer);
    // Mint USDT.b on Vitruveo; release the locked USDT on BSC. No fee on the claim itself.
    const tx = destId === VITRUVEO_CHAIN_ID ? await bridge.claimToken(...args) : await bridge.claimUSDT(...args);
    setStatus("Waiting for confirmation…");
    await tx.wait();
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
      showToast("Transfer complete!");
    } catch (e) {
      console.error(e);
      setError(errMsg(e));
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
      const c = new ethers.Contract(BRIDGE, BRIDGE_ABI, signer);
      const tx = isVitruveo ? await c.releaseTokenEscrow() : await c.releaseLockEscrow();
      setStatus("Waiting for confirmation…");
      await tx.wait();
      setStatus("");
      showToast("Escrow cancelled and refunded.");
    } catch (e) {
      console.error(e);
      setError(errMsg(e));
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
      showToast("Transfer complete!");
    } catch (e) {
      console.error(e);
      setError(errMsg(e));
    } finally {
      setBusy(false);
      refresh();
    }
  }

  const breadcrumb = [
    { to: "/", title: "Home" },
    { title: "Bridge" },
    { title: "USDT" },
  ];

  const receiptDestName = receipt ? CHAIN_NAME[Number(receipt.destChainId)] : "";
  const receiptDestSymbol = receipt ? (Number(receipt.destChainId) === VITRUVEO_CHAIN_ID ? "USDT.b" : "USDT") : "";
  const pendingSourceName = pending ? CHAIN_NAME[pending.sourceChainId] : "";
  const pendingSourceSymbol = pending ? (pending.sourceChainId === VITRUVEO_CHAIN_ID ? "USDT.b" : "USDT") : "";

  return (
    <PageContainer title="USDT Bridge" description="Bridge USDT between BSC and Vitruveo">
      <Breadcrumb title="USDT Bridge" items={breadcrumb} />
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={6} lg={6}>
          <Paper elevation={0} sx={{ p: 3, height: "100%", borderRadius: 3, backgroundColor: "#FFF9C4", textAlign: "center" }}>
            <Typography color={"grey.900"} variant="subtitle1" fontWeight={600}>
              Locked USDT Balance (BSC)
            </Typography>
            <Typography color={"grey.900"} variant="h2" fontWeight={700} my={1}>
              {lockedBalance === null ? "..." : Math.trunc(Number(ethers.formatEther(lockedBalance))).toLocaleString()}
            </Typography>
            <a
              href={`https://bscscan.com/address/${BRIDGE}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: "Courier", color: "#212121", fontSize: "14px", wordBreak: "break-all" }}
            >
              {BRIDGE}
            </a>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={6}>
          <Paper elevation={0} sx={{ p: 3, height: "100%", borderRadius: 3, backgroundColor: "primary.main", textAlign: "center" }}>
            <Typography color={"grey.900"} variant="subtitle1" fontWeight={600}>
              Minted USDT.b Balance (Vitruveo)
            </Typography>
            <Typography color={"grey.900"} variant="h2" fontWeight={700} my={1}>
              {mintedSupply === null ? "..." : Math.trunc(Number(ethers.formatEther(mintedSupply))).toLocaleString()}
            </Typography>
            <a
              href={`https://explorer.vitruveo.ai/address/${BRIDGE}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: "Courier", color: "#212121", fontSize: "14px", wordBreak: "break-all" }}
            >
              {BRIDGE}
            </a>
          </Paper>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={0} sx={{ bgcolor: "transparent", backgroundImage: "none" }}>
            <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
              {!account ? (
                <Typography variant="h6" textAlign="center">
                  Please connect your wallet to bridge USDT
                </Typography>
              ) : receipt ? (
                // ---- Finish step (signed receipt awaiting redemption on the destination) ----
                <Stack spacing={3} alignItems="center" textAlign="center" py={1}>
                  <CheckIcon color="success" sx={{ fontSize: 52 }} />
                  <Box>
                    <Typography variant="h6" fontWeight={700}>Almost done</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {chain?.id === Number(receipt.destChainId)
                        ? `Receive your ${receiptDestSymbol} on ${receiptDestName}.`
                        : `Switch to ${receiptDestName} to receive your ${receiptDestSymbol}.`}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h3" fontWeight={800} lineHeight={1}>
                      {fmt(BigInt(receipt.amount))}
                    </Typography>
                    <Typography variant="overline" color="text.secondary">{receiptDestSymbol} you receive</Typography>
                  </Box>

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
                      {parseFloat(ethers.formatEther(pending.amount)).toFixed(0)} {pendingSourceSymbol} is in progress on {pendingSourceName}.
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
                    Move USDT between BSC and Vitruveo
                  </Typography>
                  <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={3} alignItems="stretch">
                  <Box flex={2} minWidth={0} display="flex" flexDirection="column" gap={3}>
                  <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={3} flex={1}>
                    <Box flex={1} minWidth={0}>
                      <SwapInput
                        isFrom
                        max={currentFrom === VITRUVEO ? maxStr(usdtbBalance) : maxStr(usdtBalance)}
                        value={amountStr}
                        setValue={setAmountStr}
                        tokenSymbol={currentFrom === VITRUVEO ? "USDT.b" : "USDT"}
                        tokenBalance={currentFrom === VITRUVEO ? fmt(usdtbBalance) : fmt(usdtBalance)}
                        network={currentFrom === VITRUVEO ? "vitruveo" : "binance"}
                        disabled={busy}
                      />
                    </Box>
                    <Box display="flex" justifyContent="center" alignItems="center">
                      <IconButton
                        onClick={() => setCurrentFrom(currentFrom === VITRUVEO ? BINANCE : VITRUVEO)}
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
                        tokenSymbol={currentFrom === VITRUVEO ? "USDT" : "USDT.b"}
                        tokenBalance={currentFrom === VITRUVEO ? fmt(usdtBalance) : fmt(usdtbBalance)}
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
                      disabled={busy || inputInvalid() || insufficientBnb}
                      onClick={handleBridge}
                      sx={{ py: 1.8, borderRadius: 3, fontSize: "1.05rem", fontWeight: 700, textTransform: "none" }}
                    >
                      {busy ? status || "Processing…" : "Bridge USDT"}
                    </Button>
                  </Box>
                  </Box>
                    <Box flex={1} minWidth={0} p={3} sx={{ borderRadius: 3, bgcolor: "action.hover" }}>
                    {currentFrom === BINANCE ? (
                      <>
                        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                          <Typography variant="subtitle2" fontWeight={700}>Bridge fee</Typography>
                          <Chip label="1%" size="small" color="primary" sx={{ fontWeight: 700 }} />
                        </Box>
                        <Stack direction="row" spacing={1} mb={1.5} flexWrap="wrap" useFlexGap>
                          <Chip size="small" variant="outlined" label={fee ? `Fee ${fmt(fee.feeUsdt)} USDT` : "1% USDT"} />
                          {fee && <Chip size="small" variant="outlined" label={`You receive ~${fmt(fee.receive)} USDT.b`} />}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Charged on BSC when bridging USDT to Vitruveo.
                        </Typography>
                      </>
                    ) : (
                      <Chip size="small" variant="outlined" color="success" label="No fee · Vitruveo → BSC" />
                    )}
                    <Divider sx={{ my: 1.5 }} />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Your BSC BNB (gas)</Typography>
                      <Chip
                        size="small"
                        variant="outlined"
                        color={insufficientBnb ? "error" : "default"}
                        label={`${fmtGas(bnbBalance)} BNB`}
                      />
                    </Box>
                    {insufficientBnb && (
                      <Alert severity="warning" sx={{ mt: 1.5 }}>
                        You need ~{fmtGas(requiredBnb)} BNB on BSC for gas (you hold {fmtGas(bnbBalance)}). Add BNB, then try again.
                      </Alert>
                    )}
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

Usdt.layout = "Blank";
