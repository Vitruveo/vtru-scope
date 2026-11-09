"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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

import { switchNetwork, getAccount } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";
import { ethers } from "ethers";
import { useAccount, useNetwork } from "wagmi";
import { createBridge, VITRUVEO_CHAIN_ID, BSC_CHAIN_ID, CHAIN_NAME } from "@/lib/bridge/client";

// Same contract address on both chains: locks USDT on BSC, mints USDT.b on Vitruveo.
const BRIDGE = config.mainnet.BridgedUSDT;
const V3_POOL = "0x76d6B57B2bfD62B8b936a6E72904A8FA40bcB5dD"; // PancakeSwap V3 VTRU/USDT 0.25% pool

// Read-only providers for the wallet-independent bridge stats at the top of the page.
const vitruveoProvider = new ethers.JsonRpcProvider("https://rpc.vitruveo.ai", VITRUVEO_CHAIN_ID);
const bscProvider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org", BSC_CHAIN_ID);
const STATS_ABI = ["function totalSupply() view returns (uint256)", "function lockedSupply() view returns (uint256)"];
const SYMBOL = { [VITRUVEO_CHAIN_ID]: "USDT.b", [BSC_CHAIN_ID]: "USDT" };

const big = (v) => BigInt(v ?? 0);
const fmt = (v) => parseFloat(ethers.formatEther(big(v))).toFixed(4);
const maxStr = (v) => Math.max(0, Math.trunc(Number(ethers.formatEther(big(v))))).toFixed(0);

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
      type="text"
      inputMode="numeric"
      value={value}
      // Whole units only: the bridge contracts drop any fraction.
      onChange={(e) => setValue(e.target.value.split(/[.,]/)[0].replace(/\D/g, "").replace(/^0+(?=\d)/, ""))}
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
  const [error, setError] = useState("");

  // From the bridge API: preflight = { pass, items, fee: { feeUsdt, receive }, balances }, state = { escrow, receipt, items }
  const [pre, setPre] = useState(null);
  const [state, setState] = useState(null);

  // Contract-level bridge stats (wallet-independent)
  const [lockedBalance, setLockedBalance] = useState(null);
  const [mintedSupply, setMintedSupply] = useState(null);

  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });

  // Reactive connection state (works for already-connected wallets, autoConnect, and account switches).
  const { address: account } = useAccount();
  const { chain } = useNetwork();

  // BSC is added to the wagmi config only on the bridge route (see providers.tsx). The bridge client sends
  // through the connected connector's EIP-1193 provider (injected OR WalletConnect) and switches via wagmi.
  const bridge = useMemo(
    () =>
      account
        ? createBridge({
            token: "USDT",
            account,
            getProvider: () => getAccount().connector?.getProvider(),
            switchChain: (chainId) => switchNetwork({ chainId }),
            onStatus: setStatus,
          })
        : null,
    [account]
  );

  const fromChainId = currentFrom === VITRUVEO ? VITRUVEO_CHAIN_ID : BSC_CHAIN_ID;

  // Latest preflight request wins (amount typing fires several).
  const preSeq = useRef(0);
  async function loadPreflight() {
    if (!bridge) return setPre(null);
    const seq = ++preSeq.current;
    try {
      const p = await bridge.preflight(fromChainId, Math.trunc(Number(amountStr)) || 0);
      if (seq === preSeq.current) setPre(p);
    } catch (e) {
      console.error("preflight", e);
    }
  }

  async function loadStatus() {
    if (!bridge) return setState(null);
    try {
      setState(await bridge.status());
    } catch (e) {
      console.error("status", e);
    }
  }

  // Pending items refresh on a timer; the checklist has its own timer below.
  const refresh = () => loadStatus();

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, busy ? 5000 : 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridge, busy]);

  // Run the checklist shortly after the amount or direction changes (and once when the wallet connects), then
  // every 15 s. The timer is recreated on every change, so it always checks the current amount and direction.
  useEffect(() => {
    setPre((p) => (p ? { ...p, pass: false, items: p.items.map((i) => ({ ...i, state: "checking", detail: "Checking…" })) } : p));
    const t = setTimeout(loadPreflight, 400);
    const id = setInterval(loadPreflight, 15000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountStr, currentFrom, bridge]);

  useEffect(() => {
    async function loadBridgeStats() {
      const [locked, minted] = await Promise.allSettled([
        new ethers.Contract(BRIDGE, STATS_ABI, bscProvider).lockedSupply(),
        new ethers.Contract(BRIDGE, STATS_ABI, vitruveoProvider).totalSupply(),
      ]);
      if (locked.status === "fulfilled") setLockedBalance(locked.value);
      if (minted.status === "fulfilled") setMintedSupply(minted.value);
    }
    loadBridgeStats();
    const id = setInterval(loadBridgeStats, 15000);
    return () => clearInterval(id);
  }, []);

  const balances = pre?.balances ?? {};
  const usdtBalance = big(balances.usdt); // USDT on BSC
  const usdtbBalance = big(balances.usdtb); // USDT.b on Vitruveo
  const fee = pre?.fee ?? null;
  const checklist = account ? pre?.items ?? [
    { key: "vitruveo-gas", label: "Gas on Vitruveo", state: "checking", detail: "Checking…" },
    { key: "bsc-gas", label: "Gas on BSC", state: "checking", detail: "Checking…" },
    { key: "usdt-fee", label: "USDT fee on BSC", state: "checking", detail: "Checking…" },
  ] : [];
  const checklistPass = !!pre?.pass;

  const receipt = state?.receipt ?? null;
  const pending = state?.escrow ?? null;
  const pendingItems = state?.items ?? [];

  const inputInvalid = () => {
    const n = Number(amountStr);
    const bal = currentFrom === VITRUVEO ? usdtbBalance : usdtBalance;
    return n <= 0 || n > Math.trunc(Number(ethers.formatEther(bal)));
  };

  // Run a bridge client action with the page's busy / error / toast handling.
  async function run(fn, success) {
    if (busy || !bridge) return;
    setBusy(true);
    setError("");
    try {
      await fn();
      showToast(success);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setStatus("");
      setBusy(false);
      refresh();
    }
  }

  const handleBridge = () => run(() => bridge.bridge({ from: fromChainId, amount: Math.trunc(Number(amountStr)) }), "Transfer complete!");
  const handleClaim = () => run(() => bridge.finish(receipt), "Transfer complete!");
  const handleRetry = () => run(() => bridge.resume(), "Transfer complete!");
  const handleCancel = () => run(() => bridge.cancel(), "Escrow cancelled and refunded.");

  const breadcrumb = [
    { to: "/", title: "Home" },
    { title: "Bridge" },
    { title: "USDT" },
  ];

  const receiptDestName = receipt ? CHAIN_NAME[Number(receipt.destChainId)] : "";
  const receiptDestSymbol = receipt ? SYMBOL[Number(receipt.destChainId)] : "";
  const pendingSourceName = pending ? CHAIN_NAME[pending.sourceChainId] : "";
  const pendingSourceSymbol = pending ? SYMBOL[pending.sourceChainId] : "";

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
                          ? async () => {
                              await bridge.dismissTx(it.dismissHash).catch(() => {});
                              loadStatus();
                            }
                          : undefined
                      }
                    >
                      <AlertTitle sx={{ fontWeight: 700 }}>{it.title}</AlertTitle>
                      {busy && status && (it.kind === "escrow" || it.kind === "receipt") && (
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
                      {fmt(receipt.amount)}
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
                </Stack>
              ) : pending ? (
                // ---- Pending escrow (locked/burned, not yet notarized) ----
                <Stack spacing={3} textAlign="center" py={1}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>Unfinished transfer</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {parseFloat(ethers.formatEther(big(pending.amount))).toFixed(0)} {pendingSourceSymbol} is in progress on {pendingSourceName}.
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
                      disabled={busy || inputInvalid() || !checklistPass}
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

Usdt.layout = "Blank";
