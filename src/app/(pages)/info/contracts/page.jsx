"use client";

import React, { useEffect, useState, useRef } from "react";
import Breadcrumb from "@/app/(pages)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/(pages)/components/container/PageContainer";
import { CardContent, Grid, Box, Button, Typography } from "@mui/material";

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
        <Grid item xs={12} sm={12} md={6} lg={6} key={1}>
          <Box bgcolor={"grey.100"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"info.main"}
                variant="subtitle1"
                fontWeight={600}
                style={titleStyle}
              >
                VTRU Token (BSC)
              </Typography>
              <Typography color={"info.main"} fontWeight={600}>
                <p>VTRU token on Binance Smart Chain</p>
                <a
                  style={linkStyle}
                  href="https://bscscan.com/address/0xb08504d245713ca9692c8fa605e76a0a11ed4955"
                  target="_new"
                >
                  0xb08504d245713ca9692c8fa605e76a0a11ed4955
                </a>
              </Typography>
            </CardContent>
          </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={6} lg={6} key={2}>
          <Box bgcolor={"grey.100"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"info.main"}
                variant="subtitle1"
                fontWeight={600}
                style={titleStyle}
              >
                VUSD
              </Typography>
              <Typography color={"info.main"} fontWeight={600}>
                <p>Vitruveo stablecoin</p>
                <a
                  style={linkStyle}
                  href="https://explorer.vitruveo.ai/address/0x1D607d8c617A09c638309bE2Ceb9b4afF42236dA"
                  target="_new"
                >
                  0x1D607d8c617A09c638309bE2Ceb9b4afF42236dA
                </a>
              </Typography>
            </CardContent>
          </Box>
        </Grid>
      </Grid>




      
      <Grid container spacing={3} style={{ marginBottom: "30px" }}>
        <Grid item xs={12} sm={12} md={6} lg={6} key={2}>
          <Box bgcolor={"grey.100"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"info.main"}
                variant="subtitle1"
                fontWeight={600}
                style={titleStyle}
              >
                VIBE
              </Typography>
              <Typography color={"info.main"} fontWeight={600}>
                <p>Vitruveo Income Building Engine token</p>
                <a
                  style={linkStyle}
                  href="https://explorer.vitruveo.ai/address/0x8e7C7f0DF435Be6773641f8cf62C590d7Dde5a8a"
                  target="_new"
                >
                  0x8e7C7f0DF435Be6773641f8cf62C590d7Dde5a8a
                </a>
              </Typography>
            </CardContent>
          </Box>
        </Grid>

          <Grid item xs={12} sm={12} md={6} lg={6} key={3}>
          <Box bgcolor={"grey.100"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"info.main"}
                variant="subtitle1"
                fontWeight={600}
                style={titleStyle}
              >
                Staking
              </Typography>
              <Typography color={"info.main"} fontWeight={600}>
                <p>Vitruveo Core Staking</p>
                <a
                  style={linkStyle}
                  href="https://explorer.vitruveo.ai/address/0xf793A4faD64241c7273b9329FE39e433c2D45d71"
                  target="_new"
                >
                  0xf793A4faD64241c7273b9329FE39e433c2D45d71
                </a>
              </Typography>
            </CardContent>
          </Box>
        </Grid>
      </Grid>

 


    </PageContainer>
  );
}

Contracts.layout = "Blank";
