"use client";
import React, { useEffect, useState, useRef } from "react";
import PageContainer from "@/app/(pages)/components/container/PageContainer";
import CustomSelect from "@/app/(pages)/components/forms/theme-elements/CustomSelect";
import Link from "next/link";

import { Typography, Box, CardContent, Grid } from "@mui/material";
import InfoBar from "@/app/(pages)/components/widgets/InfoBar";

import { readContract, writeContract } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";

import { ethers } from "ethers";
import VerseStats from "@/app/(pages)/components/verse/Stats";

export default function Dashboard() {
 

  return (
    <PageContainer title="VTRU Scope" description="VTRU Scope by Vitruveo">
  
      <h1 style={{ fontSize: "30px", color: "#fff", marginTop: "40px", marginBottom: "30px" }}>
        Vitruveo Blockchain
      </h1>
      <Grid container spacing={3} style={{  }}>
        <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
          <Box bgcolor={"secondary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="h2"
                fontWeight={600}
              >
                🎉 New<br />Year
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={2}>
          <Box bgcolor={"secondary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="h2"
                fontWeight={600}
              >
                ⛓️ New<br />Chain Upgrade
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
          <Box bgcolor={"secondary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="h2"
                fontWeight={600}
              >
                🪙 New<br/>Tokenomics
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
          <Box bgcolor={"secondary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="h2"
                fontWeight={600}
              >
               ⚡️ New<br />Energy
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                
              </Typography>
            </CardContent>
          </Box>
        </Grid>
      </Grid>

      <h2 style={{width: '100%', marginTop: '30px', lineHeight: '32px'}}>
        The Vitruveo protocol has been upgraded to the Shanghai build. All features are live and all prior wallets and contracts are on-chain. This upgrade features:
        <ul style={{listStyleType: "none"}}>
          <li>✨ 12 unique and innovative built-in protocol contracts for AI and Game developers</li>
          <li>✨ New tokenomics to address circulating supply</li>
          <li>✨ AI-first agentic workflows driven by smart contracts</li>
          <li>✨ Gemini AI chat access to all chain data via custom MCP server</li>
          <li>✨ EVM-first smart contract triggers</li>
          <li>✨ New monetization model for Validators</li>
        </ul>
        Stay tuned for upcoming content updates 🔥
      </h2>

    </PageContainer>
  );
}

Dashboard.layout = "Blank";
