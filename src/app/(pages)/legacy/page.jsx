"use client"

import React, { useEffect, useState } from "react";
import Breadcrumb from '@/app/(pages)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/(pages)/components/container/PageContainer';
import { Typography, Grid, Box, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

import { useAccount } from "wagmi";
import { readContract, writeContract, waitForTransaction } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";

import InfoBar from "@/app/(pages)/components/widgets/InfoBar";

export default function Legacy () {

  const breadcrumb = [
    {
      to: '/',
      title: 'Home',
    },
    {
      title: 'Tokens',
    },
    {
      title: 'Legacy Token Migration',
    },
  ];

  // InfoBar widths are amount / sum(amounts); amounts here are percentages.
  const overallItems = [
    { label: "Other", amount: 80 },
    { label: "VIP (Vitruveo Inspired Pretrend)", amount: 20 },
  ];

  const { address } = useAccount();
  const [hasVip, setHasVip] = useState(false);
  const [isValidator, setIsValidator] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [burnMessage, setBurnMessage] = useState("");
  const [vipTokenId, setVipTokenId] = useState(null);
  const [vipUnits, setVipUnits] = useState(0);

  const VTRO_TOKEN = "0xDECAF2f187Cb837a42D26FA364349Abc3e80Aa5D";
  const ERC20_ABI = [
    { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }] },
    { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
    { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  ];

  async function handleBurn() {
    setBurnMessage("");
    try {
      const [vtroBalance, vtroDecimals] = await Promise.all([
        readContract({ address: VTRO_TOKEN, abi: ERC20_ABI, functionName: "balanceOf", args: [address] }),
        readContract({ address: VTRO_TOKEN, abi: ERC20_ABI, functionName: "decimals", args: [] }),
      ]);
      const oneVtro = BigInt(10) ** BigInt(vtroDecimals);
      if (BigInt(vtroBalance) >= oneVtro) {
        const { hash } = await writeContract({ address: VTRO_TOKEN, abi: ERC20_ABI, functionName: "approve", args: [config.mainnet.VIP, vtroBalance] });
        await waitForTransaction({ hash });
      }
      const { hash: burnHash } = await writeContract({ address: config.mainnet.VIP, abi: config.abi.VIP, functionName: "burnMint", args: [] });
      await waitForTransaction({ hash: burnHash });
      window.location.reload();
    } catch (e) {
      console.log("burnMint error", e);
      setBurnMessage("You have no asset that can be burnt.");
    }
  }

  async function handleClaim() {
    try {
      const { hash } = await writeContract({ address: config.mainnet.VIP, abi: config.abi.VIP, functionName: "mintLegacyValidator", args: [] });
      await waitForTransaction({ hash });
      window.location.reload();
    } catch (e) {
      console.log("mintLegacyValidator error", e);
    }
  }

  useEffect(() => {
    async function load() {
      if (!address) {
        setHasVip(false);
        setIsValidator(false);
        setClaimed(false);
        setVipTokenId(null);
        setVipUnits(0);
        return;
      }
      try {
        const [balance, validator, processed] = await Promise.all([
          readContract({ address: config.mainnet.VIP, abi: config.abi.VIP, functionName: "balanceOf", args: [address] }),
          readContract({ address: config.mainnet.VIP, abi: config.abi.VIP, functionName: "legacyValidators", args: [address] }),
          readContract({ address: config.mainnet.VIP, abi: config.abi.VIP, functionName: "validatorsProcessed", args: [address] }),
        ]);
        const owns = BigInt(balance) > 0n;
        setHasVip(owns);
        setIsValidator(Boolean(validator));
        setClaimed(Boolean(processed));
        if (owns) {
          const nft = await readContract({ address: config.mainnet.VIP, abi: config.abi.VIP, functionName: "getVIPNFTByOwner", args: [address] });
          setVipTokenId(Number(nft.tokenId));
          setVipUnits(Number(nft.units));
        } else {
          setVipTokenId(null);
          setVipUnits(0);
        }
      } catch (e) {
        console.log("Legacy load error", e);
        setHasVip(false);
        setIsValidator(false);
        setClaimed(false);
        setVipTokenId(null);
        setVipUnits(0);
      }
    }
    load();
  }, [address]);

  const unitsStr = vipUnits.toLocaleString();
  // Shrink the number so it always fits the tile, regardless of digit count.
  const unitsFontSize = Math.min(96, Math.round(800 / Math.max(unitsStr.length, 1)));

  return (
    <PageContainer title="Legacy Token Migration" description="Legacy Token Migration">
      <Breadcrumb title="Legacy Token Migration" items={breadcrumb} />

      {!hasVip && (
        <>
          <Typography color={"white"} variant="h5" fontWeight={600}>
            Holders of VTRO, Vortex or VERSE tokens can participate in the future of <a href="https://www.verticalfoundation.net/pretrend" target="_new" style={{color: 'white', textDecoration: 'underline'}}>Pretrend</a>, our flagship project
             by converting their tokens to Vitruveo Inspired Pretrend (VIP). Legacy Validators can claim a VIP token along with 10,000 VTRU for free.
          </Typography>

          <h1 style={{ fontSize: "30px", color: "#fff", marginTop: "40px" }}>
            Overall Distribution
          </h1>
          <Grid container spacing={3} style={{ marginBottom: "30px" }}>
            <Grid item xs={12}>
              <InfoBar items={overallItems} percent />
            </Grid>
          </Grid>
        </>
      )}

      {/* Two tiles below the infobars */}
      <Grid container spacing={3} style={{ marginBottom: "30px" }}>
        {/* Left tile */}
        <Grid item xs={12} md={6}>
          <Box
            component={hasVip ? "a" : "div"}
            href={hasVip ? `https://explorer.vitruveo.ai/token/${config.mainnet.VIP}/instance/${vipTokenId}` : undefined}
            target={hasVip ? "_blank" : undefined}
            rel={hasVip ? "noopener noreferrer" : undefined}
            sx={{
              display: "block",
              height: "100%",
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
              ...(hasVip && {
                animation: "vipGlow 2s ease-in-out infinite",
                "@keyframes vipGlow": {
                  "0%, 100%": { boxShadow: "0 0 8px 0 rgba(118,62,189,0.5)" },
                  "50%": { boxShadow: "0 0 28px 6px rgba(118,62,189,0.9)" },
                },
              }),
            }}
          >
            <Box
              component="img"
              src="/images/VIP.png"
              alt="VIP"
              sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: hasVip ? "none" : "grayscale(100%)" }}
            />
          </Box>
        </Grid>

        {/* Right tile */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Section 1: VIP details when held. The burn section stays visible either way,
                since the contract burns at most 100 tokens per transaction. */}
            {hasVip && (
            <Box sx={{ p: 4, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography sx={{ fontSize: "34px", fontWeight: 800, color: "#fff", mb: 1.5, textAlign: "center" }}>
                VIP Token #{vipTokenId}
              </Typography>
              <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');`}</style>
              <Box sx={{ textAlign: "center", color: "#fff", mt: 5 }}>
                <Typography
                  sx={{ fontSize: `${unitsFontSize}px`, fontWeight: 900, fontFamily: '"Orbitron", "Roboto Mono", monospace', letterSpacing: "2px", lineHeight: 1, mb: 3, whiteSpace: "nowrap" }}
                >
                  {unitsStr}
                </Typography>
                <Typography sx={{ fontSize: "32px", fontWeight: 700, fontFamily: '"Orbitron", "Roboto Mono", monospace', letterSpacing: "1px" }}>
                  units
                </Typography>
              </Box>
            </Box>
            )}
            <Box sx={{ p: 4, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography sx={{ fontSize: "22px", fontWeight: 800, color: "#fff", mb: 1.5 }}>
                Migrate Legacy Tokens
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6, mb: 1.5 }}>
                Clicking Burn will scan your account for legacy tokens and burn them. A Pretrend VIP token
                will be minted to your account with &quot;units&quot; using the following conversion ratios:
              </Typography>
              <Table size="small" sx={{ mb: 2, "& td, & th": { borderColor: "rgba(255,255,255,0.12)", py: 0.25, fontSize: "0.8rem" } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Legacy Token</TableCell>
                    <TableCell align="right" sx={{ color: "#fff", fontWeight: 700 }}>VIP Units Minted</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody sx={{ "& td": { color: "rgba(255,255,255,0.7)" } }}>
                  <TableRow>
                    <TableCell>1 VTRO</TableCell>
                    <TableCell align="right">1</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>1 VERSE Unit</TableCell>
                    <TableCell align="right">5</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>1 Vortex (Common / Rare / Ultra / Epic)</TableCell>
                    <TableCell align="right">600 / 900 / 1200 / 1500</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Typography sx={{ color: "#fff", fontWeight: 700, lineHeight: 1.6, mb: 3 }}>
                THIS ACTION IS NOT REVERSIBLE. YOUR LEGACY TOKENS WILL BE BURNT 100 AT A TIME. BURN MULTIPLE TIMES TO BURN THEM ALL.
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button variant="contained" color="error" sx={{ width: 240 }} onClick={handleBurn}>
                  🔥 Burn Legacy Tokens 🔥
                </Button>
              </Box>
              {burnMessage && (
                <Typography sx={{ color: "error.main", textAlign: "center", mt: 2 }}>
                  {burnMessage}
                </Typography>
              )}
            </Box>

            {/* Section 2: Claim Validator Rewards */}
            <Box sx={{ p: 4 }}>
              <Typography sx={{ fontSize: "22px", fontWeight: 800, color: "#fff", mb: 1.5 }}>
                Claim Validator Rewards
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6, mb: 3 }}>
                Clicking Claim will deliver Legacy Validator rewards to your account.
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button variant="contained" color="primary" sx={{ width: 240 }} disabled={!isValidator || claimed} onClick={handleClaim}>
                  {claimed ? "Claimed" : "Claim"}
                </Button>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

Legacy.layout = "Blank";
