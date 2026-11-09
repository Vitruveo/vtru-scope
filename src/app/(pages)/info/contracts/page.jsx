"use client";

import React from "react";
import Breadcrumb from "@/app/(pages)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/(pages)/components/container/PageContainer";
import { CardContent, Grid, Box, Typography } from "@mui/material";

const VIT = "https://explorer.vitruveo.ai/address/";
const BSC = "https://bscscan.com/address/";
const CONTRACTS = [
  ["VTRU Token (BSC)", "VTRU token on Binance Smart Chain", BSC, "0xb08504d245713ca9692c8fa605e76a0a11ed4955"],
  ["VUSD", "Vitruveo stablecoin", VIT, "0xA173E3B4e3cDEBa92C789F1E764A05f0Be4a6652"],
  ["VUSD.1", "Previous Vitruveo stablecoin", VIT, "0x1D607d8c617A09c638309bE2Ceb9b4afF42236dA"],
  ["VIBE", "Vitruveo Income Building Engine token", VIT, "0x8e7C7f0DF435Be6773641f8cf62C590d7Dde5a8a"],
  ["Staking", "Vitruveo Core Staking", VIT, "0x24b0bb73c1d1a6EE11C48cDa1cE35be0F7811881"],
  ["VNS Registrar", "Vitruveo Naming Service registrar", VIT, "0xD974784f0f87301Bdf92292CAee91dF5ff0a1394"],
  ["Burn Wallet", "Dead address where tokens are permanently burned", VIT, "0x000000000000000000000000000000000000dEaD"],
];

export default function Contracts() {
  const breadcrumb = [
    {
      to: "/",
      title: "Home",
    },
    {
      title: "Info",
    },
    {
      title: "Contracts",
    },
  ];

  const mainNumberStyle = {
    color: "#763EBD",
    fontFamily: "Courier",
    fontSize: "30px",
    lineHeight: "34px",
  };
  const mainHeadingStyle = {
    width: "110px",
    display: "inline-block",
    fontSize: "20px",
    lineHeight: "24px",
  };
  const linkStyle = { fontFamily: "Courier", color: "black", fontSize: "18px" };
  const titleStyle = { fontSize: "30px", color: "white" };

  return (
    <PageContainer title="VTRU Scope" description="Ecosystem smart contracts">
      <Breadcrumb
        title="Vitruveo Ecosystem Smart Contracts"
        items={breadcrumb}
      />

      <Grid container spacing={3} style={{ marginBottom: "30px" }}>
        {CONTRACTS.map(([title, desc, url, address]) => (
          <Grid item xs={12} sm={12} md={6} lg={6} key={address}>
            <Box bgcolor={"grey.100"} textAlign="center" height="100%">
              <CardContent px={1}>
                <Typography color={"info.main"} variant="subtitle1" fontWeight={600} style={titleStyle}>
                  {title}
                </Typography>
                <Typography color={"info.main"} fontWeight={600}>
                  <p>{desc}</p>
                  <a style={linkStyle} href={`${url}${address}`} target="_new">
                    {address}
                  </a>
                </Typography>
              </CardContent>
            </Box>
          </Grid>
        ))}
      </Grid>
    </PageContainer>
  );
}

Contracts.layout = "Blank";
