"use client";

import React, { useEffect, useState } from "react";
import Breadcrumb from "@/app/(pages)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/(pages)/components/container/PageContainer";

import {
  Grid,
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";

import { switchNetwork, getWalletClient, getNetwork } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

const VITRUVEO_CHAIN_ID = 1490;
const VIBE_WALLET = config.mainnet.VIBE;
const vitruveoProvider = new ethers.JsonRpcProvider("https://rpc.vitruveo.ai", VITRUVEO_CHAIN_ID);

// Adapt the connected wallet client (injected or WalletConnect) to an ethers signer.
function walletClientToSigner(walletClient) {
  const { account, chain, transport } = walletClient;
  const provider = new ethers.BrowserProvider(transport, { chainId: chain.id, name: chain.name });
  return provider.getSigner(account.address);
}

export default function Reflect() {
  const { address: account } = useAccount();

  const [balance, setBalance] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ open: false, message: "" });

  const errMsg = (e) => e?.shortMessage || e?.reason || e?.details || e?.message || String(e);
  const fmt = (v) =>
    v == null ? "—" : parseFloat(ethers.formatEther(v)).toLocaleString(undefined, { maximumFractionDigits: 4 });

  async function refresh() {
    if (!account) {
      setBalance(null);
      return;
    }
    try {
      setBalance(await vitruveoProvider.getBalance(account));
    } catch (e) {
      console.error("balance refresh error", e);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [account]);

  async function handleReflect() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (getNetwork().chain?.id !== VITRUVEO_CHAIN_ID) {
        setStatus("Switching your wallet to Vitruveo…");
        await switchNetwork({ chainId: VITRUVEO_CHAIN_ID });
      }
      const walletClient = await getWalletClient({ chainId: VITRUVEO_CHAIN_ID });
      if (!walletClient) throw new Error("Wallet not connected");
      const signer = await walletClientToSigner(walletClient);

      setStatus("Confirm the 1 VTRU transfer in your wallet…");
      const tx = await signer.sendTransaction({ to: VIBE_WALLET, value: ethers.parseEther("1") });
      setStatus("Waiting for confirmation…");
      await tx.wait();

      setStatus("");
      setToast({ open: true, message: "Sent! Your account will be indexed shortly." });
      refresh();
    } catch (e) {
      console.error(e);
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  const breadcrumb = [
    { to: "/", title: "Home" },
    { title: "Reflect" },
  ];

  return (
    <PageContainer title="Reflect" description="Index your account on the Vitruveo Explorer">
      <Breadcrumb title="Reflect" items={breadcrumb} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={3} />
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent sx={{ p: 4 }}>
              {!account ? (
                <Typography variant="h6" textAlign="center">
                  Please connect your wallet
                </Typography>
              ) : (
                <>
                  <Typography variant="body1" color="text.secondary" mb={2}>
                    The Vitruveo blockchain was upgraded, which removed all prior logs. The Explorer
                    only indexes an account once it has at least one transaction — so many accounts
                    don&apos;t show a balance even though the funds are there.
                  </Typography>
                  <Typography variant="body1" color="text.secondary" mb={3}>
                    Reflect sends <strong>1 VTRU</strong> from your account to the VIBE wallet. That
                    single transaction lets the Explorer index your account so your balance appears
                    again.
                  </Typography>

                  <Box textAlign="center" p={3} sx={{ borderRadius: 3, bgcolor: "action.hover", mb: 3 }}>
                    <Typography variant="overline" color="text.secondary" display="block">
                      Your true balance
                    </Typography>
                    <Typography variant="h3" fontWeight={800} lineHeight={1.1}>
                      {fmt(balance)} VTRU
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={busy}
                    onClick={handleReflect}
                    sx={{ py: 1.8, borderRadius: 3, fontWeight: 700, textTransform: "none" }}
                  >
                    {busy ? status || "Processing…" : "Send 1 VTRU to VIBE"}
                  </Button>
                </>
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
        <Alert onClose={() => setToast({ ...toast, open: false })} severity="success" sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}

Reflect.layout = "Blank";
