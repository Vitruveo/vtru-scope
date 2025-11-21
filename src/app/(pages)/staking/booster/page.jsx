"use client"

import React, { useEffect, useState, useRef } from "react";
import Breadcrumb from '@/app/(pages)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/(pages)/components/container/PageContainer';
import { parseEther } from 'viem';
import { waitForTransaction } from '@wagmi/core';

import BlankCard from '@/app/(pages)/components/shared/BlankCard';
import {
  CardContent,
  Grid,
  Box,
  Button,
  Typography,
} from '@mui/material';

import { readContract, writeContract } from "@wagmi/core";
import perksConfig from "@/app/config/boosterperks.json";
import { useAccount, useBalance } from "wagmi";
import { ethers } from "ethers";

export default function Booster () {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [loadMessage, setLoadMessage] = useState('Scanning account for Core NFTs...');
  const [provider, setProvider] = useState(null);

  let processing = false;
  const [buttonMessage, setButtonMessage] = useState('CLAIM & STAKE');
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [claimAmount, setClaimAmount] = useState(0);
  const [quarterAmount, setQuarterAmount] = useState(0);


  useEffect(() => {
    if (provider !== null) {
      setContract(new ethers.Contract(perksConfig.contractAddress, perksConfig.abi, provider));
    }
  }, [provider]);

  useAccount({
      onConnect({ address, connector, isReconnected }) {
        const rpcUrl = 'https://rpc.vitruveo.xyz';
        setProvider(new ethers.JsonRpcProvider(rpcUrl));     

      setAccount(address);
//        setAccount('0x9be7eA83Dc7CE2bD7cE5D2c19E141186ddF08785');
       
    },
    onDisconnect() {
      setAccount(null);
      setLoadMessage('Account disconnected.');
      setProvider(null);
    },
  });

  useEffect(() => {

    async function getClaim() {
      if ((account !== null) && (contract !== null)) {
          const claimsObj = await contract.claims(account);
          const amount = Number(claimsObj[0]);
          setClaimAmount(amount);
          setQuarterAmount(Math.trunc((amount/4)/Math.pow(10,18)));
      }
    }

    getClaim();
    

  }, [contract, account ])

 
  async function handleStake() {

    if (processing) return;
    processing = true;
      // Send transaction
      try {
          const { hash } = await writeContract({
              address: perksConfig.contractAddress,
              abi: perksConfig.abi,
              functionName: "claim",
              gas: 1_000_000,
              args: []
              });

            await waitForTransaction({ hash });
            window.location = '/staking/vtru';      
      } catch(e) {
          console.log('***************',e);
          processing = false;
      
      } 
  }
  

  const breadcrumb = [
    {
      to: '/',
      title: 'Home',
    },
    {
      title: "Staking"
    },
    {
      title: 'Booster Perks',
    },
  ];


  function buttonState(enabled) {
    setButtonEnabled(enabled);
    setButtonMessage('Wait...');
  }

  const mainNumberStyle = {color: '#763EBD', fontFamily: 'Courier', fontSize: '30px', lineHeight: '24px', marginRight: '150px'};
  const mainHeadingStyle = {width: '110px', display: 'inline-block', fontSize: '20px', lineHeight: '24px', marginTop: '10px'};

  return (
    <PageContainer title="Booster Perks" description="Claim and auto-stake your Booster Perks">
      <Breadcrumb title="Booster Perks Claim/Auto-stake" items={breadcrumb} />
      
    <Grid container spacing={3} style={{marginTop: '10px'}}>

          <Grid item xs={12} lg={12}>
            <h2 style={{paddingLeft: '20px', paddingRight: '20px', fontSize: '20px', fontWeight: 200, lineHeight: '40px'}}>
              If you are eligible for Booster Perks, the button will be enabled. Claimed 
              Perks are auto-staked (0% APR).
            </h2>
            
            <Grid container spacing={3} style={{textAlign: 'center'}}>
              <Grid item xs={12} lg={3} key={1}>
                <h2>One-Year Stake</h2>
                <h1>{ quarterAmount }</h1>
              </Grid>
              <Grid item xs={12} lg={3} key={2}>
                <h2>Two-Year Stake</h2>
                <h1>{ quarterAmount }</h1>
              </Grid>
              <Grid item xs={12} lg={3} key={3}>
                <h2>Three-Year Stake</h2>
                <h1>{ quarterAmount }</h1>
              </Grid>
              <Grid item xs={12} lg={3} key={4}>
                <h2>Four-Year Stake</h2>
                <h1>{ quarterAmount }</h1>
              </Grid>
            </Grid>
              <Button color="primary" size="large" disabled={ claimAmount == 0 } style={{marginTop: '10px', fontSize: '1.5em', padding: '20px'}} fullWidth onClick={ () => { buttonState(false); handleStake(); } }>
                { buttonMessage }
              </Button>
            

          </Grid>
    </Grid>
    </PageContainer>
  ); 
};

Booster.layout = "Blank";
