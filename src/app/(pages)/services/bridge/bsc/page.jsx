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

const VITRUVEO_VTRU = config.mainnet.VTRU;
const BSC_VTRU = config.bsc.VTRU;
const USDT_BSC = "0x55d398326f99059fF775485246999027B3197955";
const V3_POOL = "0x76d6B57B2bfD62B8b936a6E72904A8FA40bcB5dD"; // PancakeSwap V3 VTRU/USDT 0.25% pool (matches the contract)
const VTRU_ABI = config.abi.VTRU;

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
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

const vitruveoProvider = new ethers.JsonRpcProvider("https://rpc.vitruveo.ai", VITRUVEO_CHAIN_ID);
const bscProvider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org", BSC_CHAIN_ID);

const CHAIN_NAME = { [VITRUVEO_CHAIN_ID]: "Vitruveo", [BSC_CHAIN_ID]: "Binance Smart Chain" };

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
  <Paper elevation={2} sx={{ p: 3, border: 1, borderColor: "grey.300", backgroundColor: network === "binance" ? "#FFF9C4" : "primary.main" }}>
    <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={2}>
      <Box>
        <Typography variant="caption" color="grey.900" sx={{ textTransform: "uppercase", fontSize: "0.9rem" }}>
          {isFrom ? "FROM" : "TO"}
        </Typography>
        <Typography variant="h4" color="grey.900" fontWeight={600}>
          {tokenSymbol}
        </Typography>
      </Box>
      <Typography variant="h6" color="grey.900">
        Balance: {tokenBalance}
      </Typography>
    </Box>
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
    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
      <Typography variant="body1" color="grey.900">
        Network: {network === "vitruveo" ? "Vitruveo" : "Binance Smart Chain"}
      </Typography>
      {isFrom && (
        <Button
          size="small"
          variant="contained"
          disableElevation
          onClick={() => setValue(max)}
          disabled={disabled}
          sx={{
            fontWeight: 800,
            px: 2,
            backgroundColor: network === "binance" ? "#FFF176" : "#D1C4E9", // light yellow / light purple
            color: network === "binance" ? "#4A3200" : "#3B0A63", // very dark gold / very dark purple
            "&:hover": { backgroundColor: network === "binance" ? "#FFEE58" : "#B39DDB" },
          }}
        >
          MAX
        </Button>
      )}
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
  const [requiredBnb, setRequiredBnb] = useState(0n); // estimated BNB needed for BSC-side gas
  const [fee, setFee] = useState(null); // { feeVtru, feeUsdt, maxFeeUsdt } for the forward direction

  // Detected in-flight state
  const [pending, setPending] = useState(null); // { sourceChainId, amount, blockNumber } — locked/burned, not yet notarized
  const [receipt, setReceipt] = useState(null); // notarized receipt awaiting claim
  const [claimFee, setClaimFee] = useState(null); // { feeVtru, feeUsdt } for the receipt being finished

  const [error, setError] = useState("");

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

  // Balances + in-flight detection (read-only, both chains)
  async function refresh() {
    if (!account) {
      setCoinBalance(0n);
      setTokenBalance(0n);
      setPending(null);
      setReceipt(null);
      return;
    }
    try {
      // Independent settles so one flaky RPC read can't zero out the others.
      const [coin, tok, usdt, bnb, feeData] = await Promise.allSettled([
        vitruveoProvider.getBalance(account),
        new ethers.Contract(BSC_VTRU, ERC20_ABI, bscProvider).balanceOf(account),
        new ethers.Contract(USDT_BSC, ERC20_ABI, bscProvider).balanceOf(account),
        bscProvider.getBalance(account),
        bscProvider.getFeeData(),
      ]);
      if (coin.status === "fulfilled") setCoinBalance(coin.value);
      if (tok.status === "fulfilled") setTokenBalance(tok.value);
      if (usdt.status === "fulfilled") setUsdtBalance(usdt.value);
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
      const vtruEscrow = await new ethers.Contract(VITRUVEO_VTRU, VTRU_ABI, vitruveoProvider).escrow(account);
      if (BigInt(vtruEscrow.amount) > 0n) {
        setPending({ sourceChainId: VITRUVEO_CHAIN_ID, amount: BigInt(vtruEscrow.amount), blockNumber: BigInt(vtruEscrow.blockNumber) });
        return;
      }
      const bscEscrow = await new ethers.Contract(BSC_VTRU, VTRU_ABI, bscProvider).escrow(account);
      if (BigInt(bscEscrow.amount) > 0n) {
        setPending({ sourceChainId: BSC_CHAIN_ID, amount: BigInt(bscEscrow.amount), blockNumber: BigInt(bscEscrow.blockNumber) });
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
  const maxStr = (v) => Math.max(0, Math.trunc(Number(ethers.formatEther(v)))).toFixed(0);
  const fmtUsdt = (v) => parseFloat(ethers.formatUnits(v, 18)).toFixed(4);
  const insufficientUsdt = currentFrom === VITRUVEO && fee && fee.maxFeeUsdt > 0n && usdtBalance < fee.maxFeeUsdt;
  // The forward claim runs on BSC and is paid in BNB gas.
  const insufficientBnb = currentFrom === VITRUVEO && requiredBnb > 0n && bnbBalance < requiredBnb;

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

      setStatus("Confirm the transfer in your wallet…");
      const tx =
        currentFrom === VITRUVEO
          ? await new ethers.Contract(VITRUVEO_VTRU, VTRU_ABI, signer).lockVTRUCoin({ value: amount })
          : await new ethers.Contract(BSC_VTRU, VTRU_ABI, signer).burnVTRUToken(amount);
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
          const atx = await new ethers.Contract(USDT_BSC, ERC20_ABI, signer).approve(BSC_VTRU, maxFeeUsdt);
          setStatus("Waiting for confirmation…");
          await atx.wait();
        }
      }
      setStatus("Confirm in your wallet…");
      const tx = await new ethers.Contract(BSC_VTRU, VTRU_ABI, signer).claimToken(...args, maxFeeUsdt, r.signature);
      setStatus("Waiting for confirmation…");
      await tx.wait();
    } else {
      setStatus("Confirm in your wallet…");
      const tx = await new ethers.Contract(VITRUVEO_VTRU, VTRU_ABI, signer).claimCoin(...args, r.signature);
      setStatus("Waiting for confirmation…");
      await tx.wait();
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
      const c = new ethers.Contract(isVitruveo ? VITRUVEO_VTRU : BSC_VTRU, VTRU_ABI, signer);
      const tx = isVitruveo ? await c.releaseCoinEscrow() : await c.releaseTokenEscrow();
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
    { title: "Services" },
    { title: "Bridge" },
  ];

  const receiptDestName = receipt ? CHAIN_NAME[Number(receipt.destChainId)] : "";
  const pendingSourceName = pending ? CHAIN_NAME[pending.sourceChainId] : "";

  return (
    <PageContainer title="VTRU Bridge" description="Bridge VTRU between Vitruveo and Binance Smart Chain">
      <Breadcrumb title="VTRU Bridge" items={breadcrumb} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={3} />
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent sx={{ p: 4, pt: 2 }}>
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
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Move VTRU between Vitruveo and Binance Smart Chain.
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
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
                    <Box display="flex" justifyContent="center">
                      <IconButton
                        onClick={() => setCurrentFrom(currentFrom === VITRUVEO ? "binance" : VITRUVEO)}
                        disabled={busy}
                        sx={{ border: 1, borderColor: "grey.300" }}
                      >
                        <ArrowDownIcon />
                      </IconButton>
                    </Box>
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
                  <Box mt={3} p={2.5} sx={{ borderRadius: 3, bgcolor: "action.hover" }}>
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
                        <Divider sx={{ my: 1.5 }} />
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="text.secondary">Your BSC USDT</Typography>
                          <Chip
                            size="small"
                            variant="outlined"
                            color={insufficientUsdt ? "error" : "default"}
                            label={`${fmtUsdt(usdtBalance)} USDT`}
                          />
                        </Box>
                        {insufficientUsdt && (
                          <Alert severity="warning" sx={{ mt: 1.5 }}>
                            You need ~{fmtUsdt(fee.feeUsdt)} USDT on BSC (you hold {fmtUsdt(usdtBalance)}). Add USDT, then try again.
                          </Alert>
                        )}
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                          <Typography variant="body2" color="text.secondary">Your BSC BNB (gas)</Typography>
                          <Chip
                            size="small"
                            variant="outlined"
                            color={insufficientBnb ? "error" : "default"}
                            label={`${fmt(bnbBalance)} BNB`}
                          />
                        </Box>
                        {insufficientBnb && (
                          <Alert severity="warning" sx={{ mt: 1.5 }}>
                            You need ~{fmt(requiredBnb)} BNB on BSC for gas (you hold {fmt(bnbBalance)}). Add BNB, then try again.
                          </Alert>
                        )}
                      </>
                    ) : (
                      <Chip size="small" variant="outlined" color="success" label="No fee · BSC → Vitruveo" />
                    )}
                  </Box>

                  <Box mt={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={busy || inputInvalid() || insufficientUsdt || insufficientBnb}
                      onClick={handleBridge}
                      sx={{ py: 1.8, borderRadius: 3, fontSize: "1.05rem", fontWeight: 700, textTransform: "none" }}
                    >
                      {busy ? status || "Processing…" : "Bridge VTRU"}
                    </Button>
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
        <Grid item xs={12} md={3} />
      </Grid>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}

Bsc.layout = "Blank";
