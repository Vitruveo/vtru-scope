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
        Please be patient as we complete the Vitruveo protocol upgrade during the week of Jan. 1, 2026. The chain has been upgraded from the London build to the Shanghai build and we have to test and modify features for an optimal user experience.
      </h2>

    </PageContainer>
  );
}

Dashboard.layout = "Blank";
