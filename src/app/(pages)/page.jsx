"use client"
import React, { useEffect, useState, useRef } from "react";
import PageContainer from '@/app/(pages)/components/container/PageContainer';
import CustomSelect from '@/app/(pages)/components/forms/theme-elements/CustomSelect';

import {
  Typography,
  Box,
  CardContent,
  Grid,
} from '@mui/material';


import { readContract, writeContract } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";

import { ethers } from "ethers";
import { useAccount, useBalance } from "wagmi";
export default function Dashboard () {
  const Capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const DIVISOR = BigInt(String(Math.pow(10,18)));
  const TOTAL_SUPPLY = 250_000_000;
  const INITIAL_CIRCULATING_SUPPLY = 60_000_000;
  const network = 'mainnet';

  let processing = false;

  const provider = new ethers.JsonRpcProvider('https://rpc.vitruveo.xyz');
  const [circulatingSupply] = useState(INITIAL_CIRCULATING_SUPPLY);
  const [blockNumber, setBlockNumber] = useState(0);

  const PANCAKE_ABI = [
    {
      "inputs": [],
      "name": "getReserves",
      "outputs": [
        {
          "internalType": "uint112",
          "name": "_reserve0",
          "type": "uint112"
        },
        {
          "internalType": "uint112",
          "name": "_reserve1",
          "type": "uint112"
        },
        {
          "internalType": "uint32",
          "name": "_blockTimestampLast",
          "type": "uint32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];
  const [stakedBalance, setStakedBalance] = useState(0);
  const [vestingBalance, setVestingBalance] = useState(0);
  const [vibeBalance, setVibeBalance] = useState(0);
  const [veoBalance, setVeoBalance] = useState(0);
  const [vusdBalance, setVusdBalance] = useState(0);
  const [wvtruBalance, setWvtruBalance] = useState(0);
  const [perksBalance, setPerksBalance] = useState(0);
  const [vipBalance, setVipBalance] = useState(0);
  const [partnerBalance, setPartnerBalance] = useState(0);
  const [boosterBalance, setBoosterBalance] = useState(0);
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  const [activeSupply, setActiveSupply] = useState(0);
  const [whaleCount, setWhaleCount] = useState(0);
  const [whaleTotal, setWhaleTotal] = useState(0);
  const [whaleMax, setWhaleMax] = useState(0);
  const [whaleMin, setWhaleMin] = useState(0);
  const [lastPrice, setLastPrice] = useState(0);
  const [priceColor, setPriceColor] = useState(0);
  const [tvl, setTvl] = useState(0);
  const [mcap, setMcap] = useState(0);

  const [stats, setStats] = useState({
    totalStaked: 0,
    totalStakes: 0,
    activeStakes: 0,
    totalRewards: 0
  })

  useEffect(() => {
      function updateBlock() {
        if (!processing) {
          provider.getBlockNumber().then((block) => { 
            setBlockNumber(block);
            readContract({
              address: '0x8B3808260a058ECfFA9b1d0eaA988A1b4167DDba',
              abi: PANCAKE_ABI,
              functionName: "getReserves",
              args: []
            }).then((info) => {
              const wVTRUReserve = info[0];
              const usdcReserve = info[1];
              const price = Number((usdcReserve * BigInt(Math.pow(10, 18)) / wVTRUReserve)) / Math.pow(10, 6);
             
              if (lastPrice !== 0) {
                if (Number(price.toFixed(4)) < lastPrice) {
                  setPriceColor(-1);
                } else if (Number(price.toFixed(4)) > lastPrice) {
                  setPriceColor(1);
                }
              }
              setLastPrice(Number(price.toFixed(4)));
              processing = false;
          });
        });
      }
    }
    const interval = setInterval(() => {
      updateBlock();
    }, 15000);

    updateBlock();
    return () => clearInterval(interval);
  }, [blockNumber, provider]);


  function formatCurrency(amount) {
    if (amount < 1_000_000) {
      return (amount ? Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }).format(amount) :
      '')
    } else {
      return (amount ? Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount) :
      '')
    }
  }


  function lower(a) {
    return a.toLowerCase();
  }

  function display(n, isCurrency) {
    if (typeof n === 'number') {
      return n > 0 ? 
       (isCurrency == true ? formatCurrency(n) : Number(n).toLocaleString()) : '⏳';
    } else {
      return n;
    }
  }
  
  useEffect(() => {
    setTvl((stakedBalance + vestingBalance) * lastPrice);
    setMcap(INITIAL_CIRCULATING_SUPPLY * lastPrice);
  }, [lastPrice, stakedBalance, vestingBalance])
  
  useEffect(() => {

    async function getStats() {
      const stats = await readContract({
        address: config[network].CoreStake,
        abi: config.abi.CoreStake,
        functionName: "stats",
        args: []
      });
      setStats({
        totalStaked: Math.trunc(Number(stats[0]/DIVISOR)),
        totalStakes: Math.trunc(Number(stats[2])),
        activeStakes: Math.trunc(Number(stats[3])),
        totalRewards: Math.trunc(Number(stats[1]/DIVISOR))
      })
    }

    async function fetchBalances() {
      console.log('Fetching balance...');
      const response = await fetch('https://explorer.vitruveo.xyz/api/v2/addresses?page=1');
      const data = await response.json();
      const balances = data.items.map((i) => { return {account: lower(i.hash), balance: Number(BigInt(i.coin_balance)/DIVISOR), isContract: i.is_contract }});
      let targets = [];
      for(let i=0; i<balances.length; i++) {
        const item = balances[i];
        switch(item.account) {
          case lower(config[network].CoreStake): setStakedBalance(item.balance); targets.push(i); break;
          case lower(config[network].CoreVestV2): setVestingBalance(item.balance); targets.push(i); break;
          case lower(config[network].VIBE): setVibeBalance(item.balance); targets.push(i); break;
          case lower(config[network].VEO): setVeoBalance(item.balance); targets.push(i); break;
          case lower(config[network].VUSD): setVusdBalance(item.balance); targets.push(i); break;
          case lower(config[network].wVTRU): setWvtruBalance(item.balance); targets.push(i); break;
          case lower('0xCA01dDbEacFcEF7456C4f291BE2F216F8fd81Ea6'): setTreasuryBalance(item.balance); targets.push(i); break;
          case lower('0xCA0216cE0F48c0b9595597634B17a3C7Ef12F4d4'): setPerksBalance(item.balance); targets.push(i); break;
          case lower('0xCA03830833702561926b34F65e9C822959B2Ccf5'): setVipBalance(item.balance); targets.push(i); break;
          case lower('0xCA0552B00450DC23EEe813486e75154c48791218'): setPartnerBalance(item.balance); targets.push(i); break;
          case lower('0xCA06ecC58c9EB5237270d3360bD36f3Bf04CcC9c'): setBoosterBalance(item.balance); targets.push(i); break;

        }
      }

      const KNOWN = 11;

      for(let t=0; t<KNOWN; t++) {
        balances[targets[t]] = null;
      }

      const WHALE_BALANCE = 50_000;

      let tempWhaleTotal = 0;
      let tempWhaleCount = 0;
      let tempWhaleMax = 0;
      let tempWhaleMin = 100_000_000;

      for(let i=0; i<balances.length; i++) {
        const item = balances[i];
        if (item !== null && item.balance >= WHALE_BALANCE) {
          tempWhaleTotal += item.balance;
          tempWhaleCount ++;
          if (item.balance > tempWhaleMax) tempWhaleMax = item.balance;
          if (item.balance < tempWhaleMin) tempWhaleMin = item.balance;
        }
      }

      setWhaleCount(tempWhaleCount);
      setWhaleTotal(tempWhaleTotal);
      setWhaleMax(tempWhaleMax);
      setWhaleMin(tempWhaleMin);

      await getStats();

      if (targets.length == KNOWN) {
        let currentActiveSupply = circulatingSupply - (
                    wvtruBalance + veoBalance + vibeBalance + vusdBalance 
                  + vestingBalance + stakedBalance + perksBalance + vipBalance
                  + partnerBalance + boosterBalance + treasuryBalance
                )
        setActiveSupply(currentActiveSupply);
      }

    }

    fetchBalances();

  }, [blockNumber, stakedBalance]);

  const handleClick = function(account) {
    window.open(`https://explorer.vitruveo.xyz/address/${account}`);
  }

  return (
    <PageContainer title="VTRU Scope" description="VTRU Scope by Vitruveo">

<h1 style={{fontSize: '30px', color: '#fff', marginTop: '40px'}}>Current</h1>
      <Grid container spacing={3} style={{marginBottom: '30px'}}>
                <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
                  <Box bgcolor={"secondary.main"} textAlign="center">
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Block
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h2"
                              fontWeight={600}
                            >
                              {display(blockNumber)}                           
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={3} lg={3} key={2}>
                  <Box bgcolor={"secondary.main"} textAlign="center">
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              wVTRU Price
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h2"
                              fontWeight={600}
                            >
                                {
                                  priceColor == 0 ?
                                    <span>
                                      {display(lastPrice, true)}
                                    </span> :
                                    (
                                      priceColor == -1 ? 
                                      <span style={{color: '#FF4D4F'}}>
                                        {display(lastPrice, true)}
                                      </span> :
                                      <span style={{color: '#008000'}}>
                                        {display(lastPrice, true)}
                                      </span>
                                    )
                                 }
                              </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
                  <Box bgcolor={"secondary.main"} textAlign="center" style={{cursor: 'pointer'}} onClick={() => handleClick('0xCA01dDbEacFcEF7456C4f291BE2F216F8fd81Ea6')}>
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Total Value Locked (TVL)
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h2"
                              fontWeight={600}
                            >
                              {display(tvl, true)}                          
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
                  <Box bgcolor={"secondary.main"} textAlign="center" style={{cursor: 'pointer'}} onClick={() => handleClick('0xCA01dDbEacFcEF7456C4f291BE2F216F8fd81Ea6')}>
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Market Capitalization
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h2"
                              fontWeight={600}
                            >
                              {display(mcap, true)}                          
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>
      </Grid>

      <h1 style={{fontSize: '30px', color: '#fff', marginTop: '40px'}}>Supply</h1>
      <Grid container spacing={3} style={{marginBottom: '30px'}}>
                <Grid item xs={12} sm={12} md={4} lg={4} key={1}>
                  <Box bgcolor={"secondary.main"} textAlign="center">
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Total Supply
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h2"
                              fontWeight={600}
                            >
                              {display(TOTAL_SUPPLY)}                           
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={4} lg={4} key={2}>
                  <Box bgcolor={"secondary.main"} textAlign="center">
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Circulating Supply
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h2"
                              fontWeight={600}
                            >
                             {display(circulatingSupply)}                        
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={4} lg={4} key={3}>
                  <Box bgcolor={"secondary.main"} textAlign="center">
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Active Supply
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h2"
                              fontWeight={600}
                            >
                              {display(activeSupply)}                          
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

      </Grid>
      <h4 style={{color: 'white'}}>Note: Active Supply = Circulating Supply - (Treasury + Staked + Vesting + Contract Balances + Reserved Balances). It includes new claims from VIBE and Vesting contracts, Validator VIP airdrops and Creator Vault balances.</h4>

      <h1 style={{fontSize: '30px', color: '#fff', marginTop: '40px'}}>Staked/Vesting/Treasury</h1>
      <Grid container spacing={3} style={{marginBottom: '30px'}}>
  

                <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
                  <Box bgcolor={"primary.main"} textAlign="center" style={{cursor: 'pointer'}} onClick={() => handleClick('0xf793A4faD64241c7273b9329FE39e433c2D45d71')}>
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Current Staked &#x2B08;
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h2"
                              fontWeight={600}
                            >
                              { display(stakedBalance) }                        
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={3} lg={3} key={2}>
                  <Box bgcolor={"primary.main"} textAlign="center">
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Active Stakes
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h2"
                              fontWeight={600}
                            >
                              {display(stats.activeStakes)}                          
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
                  <Box bgcolor={"primary.main"} textAlign="center" style={{cursor: 'pointer'}} onClick={() => handleClick('0xaEf0a72A661B82CB1d871FCA5117486C664EeF13')}>
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Current Vesting &#x2B08;
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h2"
                              fontWeight={600}
                            >
                              { display(vestingBalance) }                        
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>
                

                <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
                  <Box bgcolor={"primary.main"} textAlign="center" style={{cursor: 'pointer'}} onClick={() => handleClick('0xCA01dDbEacFcEF7456C4f291BE2F216F8fd81Ea6')}>
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Treasury &#x2B08;
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h2"
                              fontWeight={600}
                            >
                              {display(treasuryBalance)}                          
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>
                


      </Grid>

      <h1 style={{fontSize: '30px', color: '#fff', marginTop: '40px'}}>Contract Balances</h1>
      <Grid container spacing={3} style={{marginBottom: '30px'}}>
                <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
                  <Box bgcolor={"info.light"} textAlign="center" style={{cursor: 'pointer'}} onClick={() => handleClick('0x8e7C7f0DF435Be6773641f8cf62C590d7Dde5a8a')}>
                    <CardContent px={1}>
                  
                            <Typography
                              color={"info.main"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              VIBE &#x2B08;
                            </Typography>
                            <Typography
                              color={"info.main"}
                              variant="h2"
                              fontWeight={600}
                            >
                              {vibeBalance.toLocaleString()}                           
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={3} lg={3} key={2}>
                  <Box bgcolor={"info.light"} textAlign="center" style={{cursor: 'pointer'}} onClick={() => handleClick('0x4D5B24179c656A88087eF4369887fD58AB5e8EF3')}>
                    <CardContent px={1}>
                  
                            <Typography
                              color={"info.main"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              VEO &#x2B08;
                            </Typography>
                            <Typography
                              color={"info.main"}
                              variant="h2"
                              fontWeight={600}
                            >
                              { veoBalance.toLocaleString() }                        
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
                  <Box bgcolor={"info.light"} textAlign="center" style={{cursor: 'pointer'}} onClick={() => handleClick('0x1D607d8c617A09c638309bE2Ceb9b4afF42236dA')}>
                    <CardContent px={1}>
                  
                            <Typography
                              color={"info.main"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              VUSD &#x2B08;
                            </Typography>
                            <Typography
                              color={"info.main"}
                              variant="h2"
                              fontWeight={600}
                            >
                              {vusdBalance.toLocaleString()}                          
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
                  <Box bgcolor={"info.light"} textAlign="center" style={{cursor: 'pointer'}} onClick={() => handleClick('0x3ccc3F22462cAe34766820894D04a40381201ef9')}>
                    <CardContent px={1}>
                  
                            <Typography
                              color={"info.main"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              wVTRU &#x2B08;
                            </Typography>
                            <Typography
                              color={"info.main"}
                              variant="h2"
                              fontWeight={600}
                            >
                              { wvtruBalance.toLocaleString() }                        
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

      </Grid>

      <h1 style={{fontSize: '30px', color: '#fff', marginTop: '40px'}}>Reserved Balances</h1>
      <Grid container spacing={3} style={{marginBottom: '30px'}}>
                <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
                  <Box bgcolor={"info.light"} textAlign="center" style={{cursor: 'pointer'}} onClick={() => handleClick('0xCA0216cE0F48c0b9595597634B17a3C7Ef12F4d4')}>
                    <CardContent px={1}>
                  
                            <Typography
                              color={"info.main"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              OG Perks &#x2B08;
                            </Typography>
                            <Typography
                              color={"info.main"}
                              variant="h2"
                              fontWeight={600}
                            >
                              {display(perksBalance)}                           
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={3} lg={3} key={2}>
                  <Box bgcolor={"info.light"} textAlign="center" style={{cursor: 'pointer'}} onClick={() => handleClick('0xCA03830833702561926b34F65e9C822959B2Ccf5')}>
                    <CardContent px={1}>
                  
                            <Typography
                              color={"info.main"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Validator VIP &#x2B08;
                            </Typography>
                            <Typography
                              color={"info.main"}
                              variant="h2"
                              fontWeight={600}
                            >
                              { display(vipBalance) }                        
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
                  <Box bgcolor={"info.light"} textAlign="center" style={{cursor: 'pointer'}} onClick={() => handleClick('0xCA06ecC58c9EB5237270d3360bD36f3Bf04CcC9c')}>
                    <CardContent px={1}>
                  
                            <Typography
                              color={"info.main"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Boosters &#x2B08;
                            </Typography>
                            <Typography
                              color={"info.main"}
                              variant="h2"
                              fontWeight={600}
                            >
                              {display(boosterBalance)}                          
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
                  <Box bgcolor={"info.light"} textAlign="center" style={{cursor: 'pointer'}} onClick={() => handleClick('0xCA0552B00450DC23EEe813486e75154c48791218')}>
                    <CardContent px={1}>
                  
                            <Typography
                              color={"info.main"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Partners &#x2B08;
                            </Typography>
                            <Typography
                              color={"info.main"}
                              variant="h2"
                              fontWeight={600}
                            >
                              { display(partnerBalance) }                        
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

      </Grid>


      <h1 style={{fontSize: '30px', color: '#fff', marginTop: '40px'}}>Whales</h1>
      <Grid container spacing={3} style={{marginBottom: '30px'}}>
                <Grid item xs={12} sm={12} md={4} lg={4} key={1}>
                  <Box bgcolor={"grey.700"} textAlign="center">
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Count (&gt; 50K)
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h2"
                              fontWeight={600}
                            >
                              {display(whaleCount)}                           
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={4} lg={4} key={2}>
                  <Box bgcolor={"grey.700"} textAlign="center">
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Total
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h2"
                              fontWeight={600}
                            >
                              { display(whaleTotal) }                        
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={4} lg={4} key={3}>
                  <Box bgcolor={"grey.700"} textAlign="center">
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Max
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h2"
                              fontWeight={600}
                            >
                              {display(whaleMax)}                          
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                {/* <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
                  <Box bgcolor={"grey.700"} textAlign="center">
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Min
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h2"
                              fontWeight={600}
                            >
                              { display(whaleMin) }                        
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid> */}

      </Grid>

    </PageContainer>
  ); 
};

Dashboard.layout = "Blank";
