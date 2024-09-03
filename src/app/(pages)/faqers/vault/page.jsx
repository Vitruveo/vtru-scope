"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  CardContent,
  Grid,
  Box,
  Button,
  Typography,
} from '@mui/material';
import Breadcrumb from "@/app/(pages)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/(pages)/components/container/PageContainer";
import CustomTextField from '../../components/forms/theme-elements/CustomTextField';
import { readContract, writeContract } from "@wagmi/core";

import { useAccount } from "wagmi";
import { ethers } from "ethers";
import config from "@/app/config/vtru-contracts.json";

export default function Faqers_Vault() {
  const isTestnet = process.env.NEXT_PUBLIC_IS_TESTNET === true;
  const network = isTestnet === true ? "testnet" : "mainnet";
  const [buttonMessage, setButtonMessage] = useState('GO');
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [info, setInfo] = useState({
    buyLimit: 0,
    buyUsed: 0,
    countLimit: 0,
    countUsed: 0
  });
  const [balance, setBalance] = useState({
    grant: 0,
    nonGrant: 0
  });

  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [vault, setVault] = useState('');

  let processing = false;

  useAccount({
    onConnect({ address, connector, isReconnected }) {
      const rpcUrl = connector.chains[0].rpcUrls["default"]["http"][0];
      setProvider(new ethers.JsonRpcProvider(rpcUrl));
      setAccount(address);
    },
    onDisconnect() {
      setAccount(null);
    },
  });

  useEffect(() => {
    async function initAccountView(connectedOwner) {}

    if (account) initAccountView(account);
  }, [account, network, provider]);

  const breadcrumb = [
    {
      to: "/",
      title: "Home",
    },
    {
      title: "FAQers",
    },
    {
      title: "Vault",
    },
  ];

  const getInfo = async() => {
    const info = await readContract({
      address: config[network].VUSD,
      abi: config.abi.VUSD,
      functionName: "getAccountVaultInfo",
      args: [account, vault]
    });
    setInfo({
      buyLimit: Number(Number(info[0])/100).toLocaleString(undefined, {minimumFractionDigits: 2}),
      buyUsed: Number(Number(info[1])/100).toLocaleString(undefined, {minimumFractionDigits: 2}),
      countLimit: Number(info[2]),
      countUsed: Number(info[3])  
    });

    const balances = await readContract({
      address: config[network].VUSD,
      abi: config.abi.VUSD,
      functionName: "getBalancesInCents",
      args: [account]
    });
    setBalance({
      grant: Number(Number(balances[0])/100).toLocaleString(undefined, {minimumFractionDigits: 2}),
      nonGrant: Number(Number(balances[1])/100).toLocaleString(undefined, {minimumFractionDigits: 2}),
    });
  }

  const inputHandler = (e) => {    
    try {
      const input = ethers.getAddress(e.target.value);
      if (input.toLowerCase() !== account.toLowerCase()) {
        setButtonEnabled(true);
        setVault(input);
      }
    } catch(e) {
      setButtonEnabled(false);
      setButtonMessage('GO');
    }
  }

  function buttonState(enabled) {
    setButtonEnabled(enabled);
    setButtonMessage('Wait...');
  }

  async function handleClick() {
    if (processing) return;
    processing = true;

    buttonState(false);
    console.log(await getInfo());
    processing = false;
    setButtonMessage('GO');
  }

  const rowStyle = {marginBottom: '20px'};
  const labelStyle = {display: 'inline-block', marginTop: '20px', fontSize: '14px'};

  return (
    <PageContainer title="VTRU Scope" description="Interactive FAQ Answers">
      <Breadcrumb title="Interactive FAQ Answers" items={breadcrumb} />

      <p style={{marginBottom: '30px', marginLeft: '10px'}}>This FAQer provides information on account Grant Limits for a Creator Vault. Grant limits for a Vault are account-specific.<br/><br/>The Vault address for a Creator can be found on any Store listing page by following the link labeled &ldquo;Consigned to Vault.&rdquo;</p>

      <Grid container spacing={3} style={{ marginBottom: "30px" }}>
        <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
          <Box bgcolor={"info.light"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"info.main"}
                variant="subtitle1"
                fontWeight={600}
              >
                Vault Grant $ Limit
              </Typography>
              <Typography color={"info.main"} variant="h1" fontWeight={600}>
                {info.buyLimit}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={2}>
          <Box bgcolor={"info.light"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"info.main"}
                variant="subtitle1"
                fontWeight={600}
              >
                Vault Grant $ Used
              </Typography>
              <Typography color={"info.main"} variant="h1" fontWeight={600}>
                {info.buyUsed}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Account Grant $ Available
              </Typography>
              <Typography color={"grey.900"} variant="h1" fontWeight={600}>
                {balance.grant}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
        <Grid item xs={12} style={rowStyle}>
          <span style={labelStyle}>Creator Vault Address:</span>
          <CustomTextField id="vault-input" style={{width: '100%', fontSize: '10px'}} placeholder="0x00" onChange={(value) => inputHandler(value)}/>
        </Grid>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
          <Box bgcolor={"info.light"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"info.main"}
                variant="subtitle1"
                fontWeight={600}
              >
                Vault Grant Count Limit
              </Typography>
              <Typography color={"info.main"} variant="h1" fontWeight={600}>
                {info.countLimit}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={2}>
          <Box bgcolor={"info.light"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"info.main"}
                variant="subtitle1"
                fontWeight={600}
              >
                Vault Grant Count Used
              </Typography>
              <Typography color={"info.main"} variant="h1" fontWeight={600}>
                {info.countUsed}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Account $ Available
              </Typography>
              <Typography color={"grey.900"} variant="h1" fontWeight={600}>
                {balance.nonGrant}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
          <Box textAlign="center">
            <CardContent px={1}>
              <Button
                color="primary"
                size="large"
                disabled={!buttonEnabled}
                style={{ marginTop: "10px" }}
                fullWidth
                onClick={() => {
                  handleClick();
                }}
              >
                {buttonMessage}
              </Button>
            </CardContent>
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
}

Faqers_Vault.layout = "Blank";
