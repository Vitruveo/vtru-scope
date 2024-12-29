"use client"
import React, { useEffect, useState, useRef } from "react";
import Breadcrumb from '@/app/(pages)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/(pages)/components/container/PageContainer';

import {
  Typography,
  Box,
  Grid,
  Button,
  CardContent,
  Slider,
} from '@mui/material';
import { Stack } from '@mui/system';
import InputCard from '../components/calculator/InputCard';

import Rebase from './Rebase';

import { readContract, writeContract } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";

import { ethers, isHexString, toBigInt } from "ethers";
import { useAccount, useBalance } from "wagmi";

export default function RebaseApp () {

  let processing = false;

  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [epochs, setEpochs] = useState(0);
  const [displayPeriod, setDisplayPeriod] = useState('')
  const [multiplier, setMultiplier] = useState(100000000);
  const [vtru, setVtru] = useState(null);
  const [rebasedVtru, setRebasedVtru] = useState(0);
  const [totalVtru, setTotalVtru] = useState(0);

  // Precompiled contract address for rebase info
  const precompiledAddress = "0x00000000000000000000000000000000000000ff";


  const rebase = new Rebase();  

  useAccount({
    onConnect({ address, connector, isReconnected }) {
    const rpcUrl = connector.chains[0].rpcUrls['default']['http'][0];
    setAccount(address);
    setProvider(new ethers.JsonRpcProvider(rpcUrl));    
  },

  onDisconnect() {
    setAccount(null);
    setLoadMessage('Account disconnected.');
    setProvider(null);
  },
});


const trunc18 = (n) => Math.trunc(Number(n)/Math.pow(10,18));

const recalcVtru = () => {
  setRebasedVtru(Number((((vtru * multiplier)/Math.pow(10, 8)) - vtru).toFixed(4)));
  setTotalVtru(Number(((vtru * multiplier)/Math.pow(10, 8)).toFixed(4)));
}

const updatePeriod = (period) => {
  setEpochs(period);
  setDisplayPeriod(rebase.formatDays(period));
  setMultiplier(rebase.rebaseTable[period]);  
}

const handleSlider = (e) => {
  updatePeriod(e.target.value);
}

const handleBalanceChange = (key, value) => {
  setVtru(value);
}

useEffect(() => {
  recalcVtru();
}, [vtru, multiplier]);

useEffect(() => {

    async function setup() {
      if (provider == null) return;
      const vtruBal = await provider.getBalance(account); 
      setVtru(trunc18(vtruBal));

      try {
        // Call the precompiled contract directly
        const rawResult = await provider.call({
          to: precompiledAddress,
          data: "0x", // No input data for the `Run` function
        });
    
        // Debug log the raw result
       // console.log("Raw result:", rawResult);
    
        // Validate the raw result
        if (!rawResult || !isHexString(rawResult)) {
          throw new Error("Invalid response from precompiled contract");
        }
    
        // Decode the raw result as BigInt
        const result = toBigInt(rawResult); // Converts raw bytes to a BigInt
       // console.log("Result from Run():", result.toString());
      } catch (err) {
        console.error("Error calling Run():", err);
      }  
    }


    updatePeriod(0);
    setup();
  
}, [provider, account]);

  const breadcrumb = [
    {
      to: '/',
      title: 'Home',
    },
    {
      title: "Rebase Projector"
    },
  ];

  return (
<PageContainer title="VTRU Scope" description="Rebase Projector">
      <Breadcrumb title="Rebase Projector" items={breadcrumb} />
      
      
      <h1 style={{ fontSize: "30px", color: "#fff", marginTop: "40px" }}>
        Rebase Analysis
      </h1>
      <Grid container spacing={3} style={{ marginBottom: "30px" }}>
        <Grid item xs={12} sm={12} md={4} lg={4} key={1}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Period
              </Typography>
              <Typography color={"grey.900"} variant="h3" fontWeight={600}>
                {displayPeriod}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={4} key={2}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Interest Multiplier
              </Typography>
              <Typography color={"grey.900"} variant="h3" fontWeight={600}>
                {(multiplier/Math.pow(10,8)).toFixed(8)}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={4} key={3}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Total Supply
              </Typography>
              <Typography color={"grey.900"} variant="h3" fontWeight={600}>
                {Math.trunc((60000000 * multiplier)/Math.pow(10,8)).toLocaleString()}
              </Typography>
            </CardContent>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={3} style={{ marginBottom: "10px" }}>

        <Grid item xs={12} sm={12} md={4} lg={4} key={1}>
          <InputCard value={vtru ?? ''} item={{defaultValue: 0, title: 'VTRU Balance', handleInputChange: handleBalanceChange, key: 'Balance'}} />
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={4} key={2}>
          <Box bgcolor={"secondary.main"} textAlign="center" style={{height: '110px'}}>
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Rebased VTRU
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {rebasedVtru.toLocaleString()}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={4} key={3}>
          <Box bgcolor={"secondary.main"} textAlign="center" style={{height: '110px'}}>
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Total VTRU
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {totalVtru.toLocaleString()}
              </Typography>
            </CardContent>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={3}  style={{marginBottom: '10px'}}>
        <Grid item xs={12} sm={12} md={12} lg={12} key={1}>
          <h2 style={{marginBottom: '10px'}}>Select Rebase Period</h2>
          <Slider
              defaultValue={0}
              step={1}
              min={0}
              max={1628}
              onChange={handleSlider}
              sx={{color: "white"}}
            />
        </Grid>
      </Grid>

      <h1 style={{ fontSize: "30px", color: "#fff", marginTop: "40px" }}>
        Rebase Information
      </h1>
      <Grid container spacing={3}  style={{marginBottom: '10px'}}>
        <Grid item xs={12} sm={12} md={12} lg={12} key={1}>
          <p style={{fontSize: '1.3em', marginBottom: '10px'}}>Vitruveo is a Rebasing protocol. VTRU coin balances in Wallets and Contracts automatically earn a compounded 32% APR Interest on Epochs (days) 
            that a Rebase occurs. This happens if the Epoch transaction goal is met. The goal is initially 500 transactions, and increases by 500 each time a Rebase happens.</p>
          <p style={{fontSize: '1.3em', marginBottom: '30px'}}>VTRU coins stored in your Wallet Rebase in your wallet.
          VTRU coins stored in a Contract on your behalf (example: staking) also Rebase, but it's up to the Contract creator to let you claim the Rebase.
          VTRU tokens (which are actually bridged VTRU coins) do not Rebase.</p>
        </Grid>
      </Grid>



    </PageContainer>
  ); 
};
RebaseApp.layout = "Blank";
