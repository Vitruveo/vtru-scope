"use client"

import React, { useEffect, useState, useRef } from "react";
import Breadcrumb from '@/app/(pages)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/(pages)/components/container/PageContainer';
import { Stack } from '@mui/system';
import {
  Typography,
  Box,
  Avatar,
  LinearProgress,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider,
  CardContent,
  Grid,
  Button
} from '@mui/material';

import { ethers } from "ethers";
import { useAccount, useBalance } from "wagmi";

import Link from "next/link";

import InfoBar from "@/app/(pages)/components/widgets/InfoBar";

import { readContract, writeContract } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";

export default function Tokenomics () {

  const breadcrumb = [
    {
      to: '/',
      title: 'Home',
    }
  ];


  const mainNumberStyle = {color: '#763EBD', fontFamily: 'Courier', fontSize: '30px', lineHeight: '34px'};
  const mainHeadingStyle = {width: '110px', display: 'inline-block', fontSize: '20px', lineHeight: '24px'};
  
    const Capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  
    const DIVISOR = BigInt(String(Math.pow(10, 18)));
    const TOTAL_SUPPLY = 500_000_000;
    const network = "mainnet";
  
    let processing = false;
  
    const provider = new ethers.JsonRpcProvider("https://rpc.vitruveo.ai");
    const BURN_WALLET = "0x000000000000000000000000000000000000dEaD";
    const [totalSupply, setTotalSupply] = useState(TOTAL_SUPPLY);
  
    const [balances, setBalances] = useState([]);
  
    const [treasuryBalance, setTreasuryBalance] = useState(0);
    const [operationsBalance, setOperationsBalance] = useState(0);
    const [ecosystemBalance, setEcosystemBalance] = useState(0);
    const [validatorsBalance, setValidatorsBalance] = useState(0);
    const [liquidityBalance, setLiquidityBalance] = useState(0);
    const [stakedBalance, setStakedBalance] = useState(0);
    const [rewardsBalance, setRewardsBalance] = useState(0);
  
    const [treasuryBalanceMS, setTreasuryBalanceMS] = useState(0);
    const [operationsBalanceMS, setOperationsBalanceMS] = useState(0);
    const [ecosystemBalanceMS, setEcosystemBalanceMS] = useState(0);
    const [validatorsBalanceMS, setValidatorsBalanceMS] = useState(0);
    const [liquidityBalanceMS, setLiquidityBalanceMS] = useState(0);
  
    const [circulatingSupply, setCirculatingSupply] = useState(0);
    const [burnedBalance, setBurnedBalance] = useState(0);
  
    function formatCurrency(amount) {
      if (amount < 10_000) {
        return amount
          ? Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            }).format(amount)
          : "";
      } else {
        return amount
          ? Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(amount)
          : "";
      }
    }
  
    function lower(a) {
      return a.toLowerCase();
    }
  
    function display(n, isCurrency) {
      if (typeof n === "number") {
        return n >= 0
          ? isCurrency == true
            ? formatCurrency(n)
            : Number(n).toLocaleString()
          : "⏳";
      } else {
        return n;
      }
    }
  
    // Sum a wallet's staked principal in the CoreStake contract (same getter the staking page uses).
    async function stakedBalanceFor(addr) {
      try {
        const info = await readContract({
          address: config[network].CoreStake,
          abi: config.abi.CoreStake,
          functionName: "getUserStakesInfo",
          args: [addr],
        });
        const userStakes = info[0];
        let total = BigInt(0);
        for (let s = 0; s < userStakes.length; s++) {
          total += userStakes[s].amount;
        }
        return Number(total / DIVISOR);
      } catch (e) {
        console.log("stakedBalanceFor error", addr, e);
        return 0;
      }
    }

    useEffect(() => {
      async function fetchBalances() {
        const [t, o, e, v, l] = await Promise.all([
          stakedBalanceFor("0xbd48BCc0f11d851448Ef99c2D8189934cE721BC3"),
          stakedBalanceFor("0x30C8A936FA629e351a2AC85a0437814EC50e70c6"),
          stakedBalanceFor("0xEFed6C891FE97c4edD6AeEe6dbdeff385e1dd35C"),
          stakedBalanceFor("0x6A48E58E7e4DDd6cd5E80D964A6AE1969Bbf21c3"),
          stakedBalanceFor("0x8c775D3e535472f56002B6EAeCB2e4d3F64b35C5"),
        ]);
        setTreasuryBalance(t);
        setOperationsBalance(o);
        setEcosystemBalance(e);
        setValidatorsBalance(v);
        setLiquidityBalance(l);

        // Grand total staked principal in the CoreStake contract.
        const totalStaked = await readContract({
          address: config[network].CoreStake,
          abi: config.abi.CoreStake,
          functionName: "totalStaked",
          args: [],
        });
        const totalStakedNum = Number(totalStaked / DIVISOR);
        setStakedBalance(totalStakedNum);

        const response = await fetch(
          "https://explorer.vitruveo.ai/api/v2/addresses",
        );
        const data = await response.json();
        const balances = data.items.map((i) => {
          return {
            account: lower(i.hash),
            balance: Number(BigInt(i.coin_balance) / DIVISOR),
            isContract: i.is_contract,
          };
        });
        let targets = [];
        let contractNative = 0;
        for (let i = 0; i < balances.length; i++) {
          const item = balances[i];
          switch (item.account) {
            case lower(config[network].CoreStake):
              contractNative = item.balance;
              targets.push(i);
              break;
            case lower("0xbd48BCc0f11d851448Ef99c2D8189934cE721BC3"):
              setTreasuryBalanceMS(item.balance);
              targets.push(i);
              break;
            case lower("0x30C8A936FA629e351a2AC85a0437814EC50e70c6"):
              setOperationsBalanceMS(item.balance);
              targets.push(i);
              break;
            case lower("0xEFed6C891FE97c4edD6AeEe6dbdeff385e1dd35C"):
              setEcosystemBalanceMS(item.balance);
              targets.push(i);
              break;
            case lower("0x6A48E58E7e4DDd6cd5E80D964A6AE1969Bbf21c3"):
              setValidatorsBalanceMS(item.balance);
              targets.push(i);
              break;
            case lower("0x8c775D3e535472f56002B6EAeCB2e4d3F64b35C5"):
              setLiquidityBalanceMS(item.balance);
              targets.push(i);
              break;
          }
        }
  
        // The contract's native balance beyond staked principal is the rewards reserve.
        setRewardsBalance(Math.max(0, contractNative - totalStakedNum));

        // Tokens sent to the burn wallet are permanently removed from supply.
        const burned = Number((await provider.getBalance(BURN_WALLET)) / DIVISOR);
        setBurnedBalance(burned);
        const adjustedSupply = TOTAL_SUPPLY - burned;
        setTotalSupply(adjustedSupply);

        // Everything held in the CoreStake contract (staked principal + rewards reserve)
        // is locked; the remainder of supply circulates.
        let locked = contractNative;
        let currentCirculatingSupply = adjustedSupply - locked;
        setCirculatingSupply(currentCirculatingSupply);
      }
  
      fetchBalances();
    }, [stakedBalance]);
  
    const handleClick = function (account) {
      window.open(`https://explorer.vitruveo.ai/address/${account}`);
    };
  
    const multisigBarItems = [
      {
        label: "Treasury",
        amount: treasuryBalanceMS,
        address: "0xbd48BCc0f11d851448Ef99c2D8189934cE721BC3",
      },
      {
        label: "Operations",
        amount: operationsBalanceMS,
        address: "0x30C8A936FA629e351a2AC85a0437814EC50e70c6",
      },
      {
        label: "Ecosystem",
        amount: ecosystemBalanceMS,
        address: "0xEFed6C891FE97c4edD6AeEe6dbdeff385e1dd35C",
      },
      {
        label: "Validators",
        amount: validatorsBalanceMS,
        address: "0x6A48E58E7e4DDd6cd5E80D964A6AE1969Bbf21c3",
      },
      {
        label: "Liquidity",
        amount: liquidityBalanceMS,
        address: "0x8c775D3e535472f56002B6EAeCB2e4d3F64b35C5",
      },
    ];
  
    // Locked bar shows each named wallet's CoreStake staked balance, plus the remainder.
    // "Staked" = total CoreStake balance minus the named wallets' staked balances.
    const lockedNamedItems = [
      { label: "Treasury", amount: treasuryBalance, address: "0xbd48BCc0f11d851448Ef99c2D8189934cE721BC3" },
      { label: "Operations", amount: operationsBalance, address: "0x30C8A936FA629e351a2AC85a0437814EC50e70c6" },
      { label: "Ecosystem", amount: ecosystemBalance, address: "0xEFed6C891FE97c4edD6AeEe6dbdeff385e1dd35C" },
      { label: "Validators", amount: validatorsBalance, address: "0x6A48E58E7e4DDd6cd5E80D964A6AE1969Bbf21c3" },
    ];
    const lockedNamedTotal = lockedNamedItems.reduce((a, b) => a + b.amount, 0);
    const lockedBarItems = [
      ...lockedNamedItems,
      {
        label: "Staked",
        amount: Math.max(0, stakedBalance - lockedNamedTotal),
        address: config[network].CoreStake,
      },
      {
        label: "Rewards",
        amount: rewardsBalance,
        address: config[network].CoreStake,
      },
    ];
  
    const linkStyle = {
      color: "inherit", // Prevent visited link color
      textDecoration: "none", // Optional: No underline
    };

  return (
    <PageContainer title="Vitruveo Tokenomics" description="Vitruveo Tokenomics">
      <Breadcrumb title="Vitruveo Tokenomics" items={breadcrumb} />



        <h1 style={{ fontSize: "30px", color: "#fff" }}>
        Supply
      </h1>
      <Grid container spacing={3} style={{marginBottom: "30px" }}>
        <Grid item xs={12} sm={12} md={4} lg={4} key={3}>
          <Box bgcolor={"success.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Circulating Supply
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(circulatingSupply)}
              </Typography>
              <Typography color={"grey.700"} variant="h5" fontWeight={600}>
                {display((circulatingSupply / totalSupply) * 100)}%
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={4} key={4}>
          <Box bgcolor={"success.main"} textAlign="center" sx={{ cursor: "pointer" }} onClick={() => handleClick(BURN_WALLET)}>
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Burn Wallet
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(burnedBalance)}
              </Typography>
              <Typography color={"grey.700"} variant="h5" fontWeight={600}>
                {display((burnedBalance / TOTAL_SUPPLY) * 100)}%
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={4} key={2}>
          <Box bgcolor={"success.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Total Supply
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(totalSupply)}
              </Typography>
              <Typography color={"grey.700"} variant="h5" fontWeight={600}>
                &nbsp;
              </Typography>
            </CardContent>
          </Box>
        </Grid>
      </Grid>

      <h1 style={{ fontSize: "30px", color: "#fff", marginTop: "40px" }}>
        Locked Balances
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
                Total
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(lockedBarItems.reduce((a, b) => a + b.amount, 0))}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={8} lg={8} key={2}>
          <InfoBar items={lockedBarItems} />
        </Grid>
      </Grid>

      <h1 style={{ fontSize: "30px", color: "#fff", marginTop: "40px" }}>
        Multisig Balances
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
                Total
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(multisigBarItems.reduce((a, b) => a + b.amount, 0))}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={8} lg={8} key={2}>
          <InfoBar items={multisigBarItems} />
        </Grid>
      </Grid>

      <h1 style={{ fontSize: "30px", color: "#fff", marginTop: "40px" }}>
        Trading
      </h1>
      <Grid container spacing={3} style={{ marginBottom: "30px" }}>
        <Grid item xs={12} sm={12} md={6} lg={6} key={1}>
          <Box bgcolor={"secondary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography color={"grey.900"} variant="h3" fontWeight={600}>
                <Link
                  style={linkStyle}
                  target="_new"
                  href="https://pancakeswap.finance/swap?inputCurrency=0xb08504D245713Ca9692C8fA605E76A0A11Ed4955&outputCurrency=0x55d398326f99059fF775485246999027B3197955"
                >
                  VTRU/USDT (BSC)
                </Link>
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={6} lg={6} key={2}>
          <Box bgcolor={"secondary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography color={"grey.900"} variant="h5" fontWeight={600}>
                <Link
                  style={linkStyle}
                  target="_new"
                  href="https://www.dextools.io/app/bnb/pair-explorer/0x76d6b57b2bfd62b8b936a6e72904a8fa40bcb5dd"
                >
                  DEX Tools (BSC)
                </Link>
              </Typography>
            </CardContent>
          </Box>
        </Grid>
      </Grid>

    </PageContainer>
  ); 
};

Tokenomics.layout = "Blank";
