"use client"

import React, { useEffect, useState, useRef } from "react";
import Breadcrumb from '@/app/(pages)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/(pages)/components/container/PageContainer';

import BlankCard from '@/app/(pages)/components/shared/BlankCard';
import StakeInputForm from '@/app/(pages)/components/widgets/cards/StakeInputForm';
import {
  CardContent,
  Grid,
  Box,
  Button,
  Typography,
} from '@mui/material';

import { readContract, writeContract } from "@wagmi/core";
import vaultConfig from "@/app/config/vault-config.json";
import { useAccount, useBalance } from "wagmi";
import { ethers } from "ethers";

export default function Stake () {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loadMessage, setLoadMessage] = useState('Scanning account for Core NFTs...');
  const [blockNumber, setBlockNumber] = useState(0);
  const [blocksRemaining, setBlocksRemaining] = useState(0);
  const [provider, setProvider] = useState(null);
  let processing = false;

  const isTestnet = process.env.NEXT_PUBLIC_IS_TESTNET === true;
  const network = isTestnet === true ? 'testnet' : 'mainnet';

  useEffect(() => {
      function updateBlock() {
        if (provider !== null) {
          provider.getBlockNumber().then((block) => { 
            setBlockNumber(block);
            const remaining = Math.max(4654487 - blockNumber, 0);
            setBlocksRemaining(remaining);            
          });
        }
      }
      const interval = setInterval(() => {
        updateBlock();
      }, 4000);

      updateBlock();
      return () => clearInterval(interval);
  }, [blockNumber, provider]);


  useEffect(() => {
    if (provider !== null) {
      setContract(new ethers.Contract(vaultConfig.core[network], vaultConfig.core.abi, provider));
    }
  }, [provider]);

  useAccount({
      onConnect({ address, connector, isReconnected }) {
      const rpcUrl = connector.chains[0].rpcUrls['default']['http'][0];
      setNfts(arr => []);
      setAccount(address);
      setProvider(new ethers.JsonRpcProvider(rpcUrl));      
    },
    onDisconnect() {
      setAccount(null);
      setNfts(arr => []);
      setLoadMessage('Account disconnected.');
      setProvider(null);
    },
  });

 const balance = useBalance({
    address: account,
    cacheTime: 15_000,
  });

  useEffect(() => { 
    setUnlockedBalance(Number(balance?.data?.value)/Math.pow(10,18));
  }, [balance]);

  useEffect(() => {

    async function getTokens(connectedOwner) {
    //     connectedOwner = '0xd07D220d7e43eCa35973760F8951c79dEebe0dcc';
    // connectedOwner = '0xABBA32cF845256A4284cdbA91D82C96CbB13dc59';
//     connectedOwner = '0xC0ee5bb36aF2831baaE1d31f358ccA46dAa6a4e8';
//connectedOwner = '0xaD78De2EFaAb615956f7c4Cb26ADeB108199F86a';
      if (connectedOwner !== null) {
        const transfers = contract?.filters?.Transfer(null, connectedOwner, null);
        if (transfers) {
          const logEvents = await contract.queryFilter(transfers);
          const tokens = [];
          for(let l=0; l<logEvents.length; l++) {
            const log = logEvents[l];
            const info = contract.interface.parseLog(log);
            const tokenId = info.args.tokenId;
            const currentOwner = await readContract({
                                    address: vaultConfig.core[network],
                                    abi: vaultConfig.core.abi,
                                    functionName: "ownerOf",
                                    args: [tokenId]
                                  });
            if (currentOwner.toLowerCase() == connectedOwner.toLowerCase()) {
              tokens.push(Number(tokenId));
            }
          }
          await getAccountNfts(tokens);
        }  
      } else {
        setNfts(arr => []);
      }
    }

    getTokens(account);

  }, [contract, account ])

  function getBlockNumber() {
    return blockNumber;
  }

  async function handleClaim(tokenId) {
  //   if (processing) return;
  //   processing = true;
  //   // Send transaction
  //   try {
  //       await writeContract({
  //           address: config.core[network],
  //           abi: config.core.abi,
  //           functionName: "claim",
  //           args: [tokenId]
  //           });
  //       setTimeout(() => {
  //           window.location.reload()
  //       }, 5000)
    
  //   } catch(e) {
  //       console.log('***************',e);
  //       processing = false;
    
  //   } 
  }

  async function getAccountNfts(tokens) {
    try {
      let total = 0;
      for(let t=0; t<tokens.length; t++) {
        let token = tokens[t];
        const nft = await readContract({
                      address: vaultConfig.core[network],
                      abi: vaultConfig.core.abi,
                      functionName: "getCoreTokenInfo",
                      args: [token]
                    });
                    
        if ((Number(nft.classId) !== 3) && (Number(nft.classId) !== 6)) {
          const granted = Number(nft.grantAmount)/Math.pow(10,18);
          const claimed = Number(nft.claimedGrantAmount)/Math.pow(10,18);
          total += Math.max(granted-claimed);  
        }
      }
      setLockedBalance(total);

    } catch (error) {
        console.log(error);
    }

  }

  const breadcrumb = [
    {
      to: '/',
      title: 'Home',
    },
    {
      title: 'Stake',
    },
  ];

  const [lockedBalance, setLockedBalance] = useState(0);
  const [unlockedBalance, setUnlockedBalance] = useState(0);

  const [lockedAllocated, setLockedAllocated] = useState(0);
  const [unlockedAllocated, setUnlockedAllocated] = useState(0);

  const [vtru, setVtru] = useState({ locked: [0,0,0,0,0,0], unlocked: [0,0,0,0,0,0]});
  const [vibe, setVibe] = useState({ locked: [0,0,0,0,0,0], unlocked: [0,0,0,0,0,0]});
  const [staked, setStaked] = useState(0);
  const [swapped, setSwapped] = useState(0);
  const [totalVibe, setTotalVibe] = useState(0);

  const changeHandler = (isLocked, period, vtruInput, current) => {
    const balance = parseInt(isLocked === true ? lockedBalance : unlockedBalance);

    const cost = isLocked === true ? (period === 0 ? 20 : 150) : (period === 0 ? 15 : 50);
    const actualVtru = parseInt(vtruInput / cost) * cost;
    const actualVibe = (actualVtru/cost) * (period === 0 ? 1 : period);

    const key = isLocked === true ? 'locked' : 'unlocked';

    let before = 0;
    vtru[key].forEach(i => before += i);

    vtru[key][period] = actualVtru;

    let allocated = 0; 
    vtru[key].forEach(i => allocated += i);

    if (allocated == before || allocated > balance) return {vtru: 0, vibe: 0};

    vibe[key][period] = actualVibe;

    let staked = 0;
    for(let l=1; l<6; l++) {
      staked += vtru['locked'][l] + vtru['unlocked'][l];
    }

    let swapped = vtru['locked'][0] + vtru['unlocked'][0];

    let totalVibe = 0;
    for(let l=0; l<6; l++) {
      totalVibe += vibe['locked'][l] + vibe['unlocked'][l];
    }

    setVtru({...vtru });
    setVibe({...vibe});
    setStaked(staked);
    setSwapped(swapped);
    setTotalVibe(totalVibe);

    if (isLocked === true) {
      setLockedAllocated(allocated);
    } else {
      setUnlockedAllocated(allocated);
    }

    return {vtru: actualVtru, vibe: actualVibe};
  }


  const mainNumberStyle = {color: '#763EBD', fontFamily: 'Courier', fontSize: '30px', lineHeight: '34px'};
  const mainHeadingStyle = {width: '110px', display: 'inline-block', fontSize: '20px', lineHeight: '24px'};

  return (
    <PageContainer title="VTRU Scope" description="Stake VTRU">
      <Breadcrumb title="VTRU Stake/Swap for VIBE (Preview — Staking NOT Enabled)" items={breadcrumb} />
            <Grid container spacing={3}>
                <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
                  <Box bgcolor={"primary.main"} textAlign="center">
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              VTRU Stake Request
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h1"
                              fontWeight={600}
                            >
                              {staked}                            
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
                              VTRU Swap Request
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h1"
                              fontWeight={600}
                            >
                              {swapped}                            
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
                  <Box bgcolor={"success.main"} textAlign="center">
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              VIBE Share Request
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h1"
                              fontWeight={600}
                            >
                              {totalVibe}                            
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
                  <Box textAlign="center">
                    <CardContent px={1}>
                  
                            <Typography
                              color={"primary.main"} 
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              {blockNumber}
                            </Typography>
                            <Typography
                              color={"white"}
                              variant="h1"
                              fontWeight={600}
                            >
                              {blocksRemaining}                             
                            </Typography>
                            <Typography
                              color={"primary.main"} 
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Blocks Remaining
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>



            </Grid>
          <Grid container spacing={3} style={{marginTop: '10px'}}>
              <Grid item xs={12} lg={6}>
                <BlankCard>
                    <div style={{padding: '20px', paddingTop: 0}}>
                      <h1 style={{textAlign: 'center'}}>UNLOCKED VTRU</h1>
                      <h2 style={{textAlign: 'center', fontWeight: 100, fontSize: '16px', marginBottom: '40px'}}>Stake: 50/VIBE, Swap: 15/VIBE</h2>
                      <h2><span style={mainHeadingStyle}>Balance:</span> <span style={mainNumberStyle}>{Number(parseInt(unlockedBalance)).toFixed(0)}</span></h2>
                      <h2><span style={mainHeadingStyle}>Allocated:</span> <span style={mainNumberStyle}>{Number(parseInt(unlockedAllocated)).toFixed(0)}</span></h2>
                      <StakeInputForm locked={false} balance={parseInt(unlockedBalance)} stakeRatio={50} swapRatio={15} onChange={changeHandler}  />
                      </div>
                  </BlankCard>
              </Grid>        
              <Grid item xs={12} lg={6}>
                <BlankCard>
                  <div style={{padding: '20px', paddingTop: 0}}>
                    <h1 style={{textAlign: 'center'}}>LOCKED VTRU</h1>
                    <h2 style={{textAlign: 'center', fontWeight: 100, fontSize: '16px', marginBottom: '40px'}}>Stake: 150/VIBE, Swap: 20/VIBE</h2>
                    <h2><span style={mainHeadingStyle}>Balance:</span> <span style={mainNumberStyle}>{Number(parseInt(lockedBalance)).toFixed(0)}</span></h2>
                    <h2><span style={mainHeadingStyle}>Allocated:</span> <span style={mainNumberStyle}>{Number(parseInt(lockedAllocated)).toFixed(0)}</span></h2>
                    <StakeInputForm locked={true} balance={parseInt(lockedBalance)} stakeRatio={150} swapRatio={20} onChange={changeHandler} />
                  </div>
                </BlankCard>
              </Grid>
            </Grid>
    </PageContainer>
  ); 
};

Stake.layout = "Blank";
