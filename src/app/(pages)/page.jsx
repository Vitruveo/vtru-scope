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
        🚀 HOST is LIVE — For the first time ever, a blockchain enables on-chain transactions to make off-chain HTTP POST requests. Smart contracts that don&apos;t just execute—they act.
        <ul style={{listStyleType: "none"}}>
          <li>✅ Trigger AI agents and agentic workflows directly from smart contracts</li>
          <li>✅ No indexers, no polling, no middleware required</li>
          <li>✅ 12 protocol-level smart contract capabilities extending the EVM</li>
          <li>✅ 100% Solidity compatible</li>
        </ul>
      </h2>
       <h2 style={{width: '100%', marginTop: '30px', lineHeight: '32px'}}>
          Interactive Demos
          <ul style={{listStyleType: "none"}}>
            <li>✨ <a href="https://vitruveo.ai/host/scout" target="_new" style={{textDecoration: "underline", color: "white"}}>AI Alpha Scout — Trigger AI research agents from blockchain</a></li>
            <li>✨ <a href="https://vitruveo.ai/host/sheets" target="_new" style={{textDecoration: "underline", color: "white"}}>AI Google Sheets — Log on-chain data to spreadsheets</a></li>
            <li>✨ <a href="https://vitruveo.ai/host/ntfy" target="_new" style={{textDecoration: "underline", color: "white"}}>Ntfy Alerts — Push notifications from smart contracts</a></li>
            <li>✨ <a href="https://vitruveo.ai/host" target="_new" style={{textDecoration: "underline", color: "white"}}>More HOST Demos</a></li>
          </ul>
       </h2>
       <h2 style={{width: '100%', marginTop: '30px', lineHeight: '32px'}}>
          Resources
          <ul style={{listStyleType: "none"}}>
            <li>📄 <a href="https://vitruveo.ai/host-primer" target="_new" style={{textDecoration: "underline", color: "white"}}>HOST Primer</a></li>
            <li>📄 <a href="https://kalyani.com" target="_new" style={{textDecoration: "underline", color: "white"}}>HOST Whitepaper</a></li>
            <li>📄 <a href="https://kalyani.com/trend.html" target="_new" style={{textDecoration: "underline", color: "white"}}>Trend Protocol Yellowpaper</a></li>
            <li>📄 <a href="https://vitruveo.ai/developers/psc" target="_new" style={{textDecoration: "underline", color: "white"}}>Protocol Smart Contracts Documentation</a></li>
          </ul>
       </h2>
    </PageContainer>
  );
}

Dashboard.layout = "Blank";
