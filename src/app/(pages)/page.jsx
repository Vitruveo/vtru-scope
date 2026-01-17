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

      <h2 style={{width: '100%', marginTop: '30px', lineHeight: '32px'}}>
        The Vitruveo protocol has been upgraded to the Shanghai build. All features are live and all prior wallets and contracts are on-chain. This upgrade features:
        <ul style={{listStyleType: "none"}}>
          <li>✅ 12 unique and innovative built-in protocol contracts for AI and Game developers</li>
          <li>✅ New tokenomics to address circulating supply</li>
          <li>✅ AI-first agentic workflows driven by smart contracts</li>
          <li>✅ Gemini AI chat access to all chain data via custom MCP server</li>
          <li>✅ EVM-first smart contract triggers</li>
          <li>✅ Monetization model for Validators</li>
        </ul>
      </h2>
       <h2 style={{width: '100%', marginTop: '30px', lineHeight: '32px'}}>
          What&quot;s New
          <ul style={{listStyleType: "none"}}>
            <li>✨ <a href="/assets/multisig" style={{textDecoration: "underline", color: "white"}}>Custom Vitruveo Multisig Wallet</a></li>
            <li>✨ <a href="https://www.verticalfnd.com" target="_new" style={{textDecoration: "underline", color: "white"}}>Vertical Foundation landing page</a></li>
            <li>✨ <a href="https://kalyani.com" target="_new" style={{textDecoration: "underline", color: "white"}}>HOST (HTTP Outbound Service Trigger) Whitepaper</a></li>
            <li>✨ <a href="https://kalyani.com/trend.html" target="_new" style={{textDecoration: "underline", color: "white"}}>Trend Protocol Yellowpaper</a></li>
          </ul>
       </h2>
    </PageContainer>
  );
}

Dashboard.layout = "Blank";
