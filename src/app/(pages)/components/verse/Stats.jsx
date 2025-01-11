"use client";

import React, { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import config from "@/app/config/vtru-contracts.json";
import {
    Typography,
    Box,
    CardContent,
    Grid,
  } from "@mui/material";

const VerseStats = ({verseAddress, verseAbi, provider}) => {

const [verseContract, setVerseContract] = useState(null);
const [vtroContract, setVtroContract] = useState(null);
const [vtroUnits, setVtroUnits] = useState(0);

const [stats, setStats] = useState({
    allocatedUnits: 5_000_000,
    eternalUnits: 0,
    elasticUnits: 0,
    availableUnits: 5_000_000,
    vtruStakedUnits: 0,
});

const vtroAddress = "0xDECAF2f187Cb837a42D26FA364349Abc3e80Aa5D";
const vtroAbi = [
    {
      inputs: [
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "balanceOf",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    }
];

useEffect(() => {
    if (provider !== null) {
      setVerseContract(new ethers.Contract(verseAddress, config.abi.VERSE, provider));
      setVtroContract(new ethers.Contract(vtroAddress, vtroAbi, provider));
    }
}, [provider]);

useEffect(() => {
    async function getStats() {
      if (verseContract == null || vtroUnits == 0) return;

      const rawStats = await verseContract.stats();

      setStats({
        allocatedUnits: 5_000_000,
        eternalUnits: Number(rawStats[1]),
        elasticUnits: 0,
        availableUnits: 5_000_000 - Number(rawStats[1]),
        vtruStakedUnits: Number(rawStats[1]) - vtroUnits,
      });
    }

    getStats();
}, [provider, verseContract, vtroUnits]);

useEffect(() => {
    async function getVtroBalances() {
      if (vtroContract == null) return;

      const rawContractBalance = await vtroContract.balanceOf(verseAddress);
      const contractVTROBalance = Number(rawContractBalance) / Math.pow(10, 18);
      setVtroUnits(contractVTROBalance / 10);
    }

    getVtroBalances();
}, [vtroContract]);

return (
    <Grid container spacing={3} style={{ marginBottom: "30px" }}>
      <Grid item xs={12} sm={12} md={3} lg={3} key={2}>
        <Box bgcolor={"info.light"} textAlign="center">
          <CardContent px={1}>
            <Typography
              color={"info.main"}
              variant="subtitle1"
              fontWeight={600}
            >
              Total Allocated Units
            </Typography>
            <Typography color={"info.main"} variant="h1" fontWeight={600}>
              {stats.allocatedUnits.toLocaleString()}
            </Typography>
          </CardContent>
        </Box>
      </Grid>

      <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
        <Box bgcolor={"info.light"} textAlign="center">
          <CardContent px={1}>
            <Typography
              color={"info.main"}
              variant="subtitle1"
              fontWeight={600}
            >
              Remaining Units
            </Typography>
            <Typography color={"info.main"} variant="h1" fontWeight={600}>
              {stats.availableUnits.toLocaleString()}
            </Typography>
          </CardContent>
        </Box>
      </Grid>

      <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
        <Box bgcolor={"info.light"} textAlign="center">
          <CardContent px={1}>
            <Typography
              color={"info.main"}
              variant="subtitle1"
              fontWeight={600}
            >
              Eternal Units Minted
            </Typography>
            <Typography color={"info.main"} variant="h1" fontWeight={600}>
              {stats.eternalUnits.toLocaleString()}
            </Typography>
          </CardContent>
        </Box>
      </Grid>

      <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
        <Box bgcolor={"info.light"} textAlign="center">
          <CardContent px={1}>
            <Typography
              color={"info.main"}
              variant="subtitle1"
              fontWeight={600}
            >
              VTRU Staked for VERSE
            </Typography>
            <Typography color={"info.main"} variant="h1" fontWeight={600}>
              {stats.vtruStakedUnits.toLocaleString()}
            </Typography>
          </CardContent>
        </Box>
      </Grid>
    </Grid>
  );
};

export default VerseStats;
