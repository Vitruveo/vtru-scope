"use client"

import React, { useEffect, useState, useRef } from "react";
import Breadcrumb from '@/app/(pages)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/(pages)/components/container/PageContainer';
import { parseEther } from 'viem';

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
  const [buttonMessage, setButtonMessage] = useState('GO');
  const [buttonEnabled, setButtonEnabled] = useState(true);

  const isTestnet = false;//Boolean(process.env.NEXT_PUBLIC_IS_TESTNET) === true;
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

  const [stats, setStats] = useState({ remaining: 0, staked: 0, shares: 0, tokens: 0});

  async function getStats() {
    stats.remaining = Number(await readContract({
      address: vaultConfig.vibe[network],
      abi: vaultConfig.vibe.abi,
      functionName: "stakeQuota",
      args: []
    })).toLocaleString();

    const locked = await readContract({
      address: vaultConfig.core[network],
      abi: vaultConfig.core.abi,
      functionName: "stakeLockedTotal",
      args: []
    });

    const unlocked = await readContract({
      address: vaultConfig.core[network],
      abi: vaultConfig.core.abi,
      functionName: "stakeUnlockedTotal",
      args: []
    });
    stats.staked = Number(locked + unlocked).toLocaleString();

    const info = await readContract({
      address: vaultConfig.vibe[network],
      abi: vaultConfig.vibe.abi,
      functionName: "stats",
      args: []
    });
    
    stats.tokens = Number(info[0]).toLocaleString();
    stats.shares = Number(info[1]).toLocaleString();
    setStats((stats) => { return {...stats} });
  }

  async function handleStake() {
    if (processing) return;
    processing = true;

    let total = 0;
    for(let t=0;t<vtru.unlocked.length;t++) {
      total += vtru.unlocked[t];
    }
    const inputs = [
      account,
      vaultConfig.vibe[network],
      vtru.unlocked,
      nfts,
      vtru.locked
    ]
    // Send transaction
    try {
        await writeContract({
            address: vaultConfig.core[network],
            abi: vaultConfig.core.abi,
            functionName: "stake",
            gas: 2_500_000,
            value: parseEther(String(total)),
            args: inputs
            });
        setTimeout(() => {
            window.location.reload()
        }, 6000)
    
    } catch(e) {
        console.log('***************',e);
        processing = false;
    
    } 
  }

  async function getAccountNfts(tokens) {
    try {
      let total = 0;
      let tokenIds = [];
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
          tokenIds.push(nft.id);
        }
      }
      setLockedBalance(total);
      setNfts(nfts => [...tokenIds]);
      await getStats();
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
  const [airdropBalance, setAirdropBalance] = useState(0);

  const [lockedAllocated, setLockedAllocated] = useState(0);
  const [unlockedAllocated, setUnlockedAllocated] = useState(0);
  const [airdropAllocated, setAirdropAllocated] = useState(0);

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

  function buttonState(enabled) {
    setButtonEnabled(enabled);
    setButtonMessage('Wait...');
  }

  const mainNumberStyle = {color: '#763EBD', fontFamily: 'Courier', fontSize: '30px', lineHeight: '34px'};
  const mainHeadingStyle = {width: '110px', display: 'inline-block', fontSize: '20px', lineHeight: '24px'};

  return (
    <PageContainer title="VTRU Scope" description="Stake VTRU">
      <Breadcrumb title="VTRU Stake/Swap for VIBE" items={breadcrumb} />
      <Grid container spacing={3} style={{marginBottom: '30px'}}>
                <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
                  <Box bgcolor={"info.light"} textAlign="center">
                    <CardContent px={1}>
                  
                            <Typography
                              color={"info.main"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              VIBE Quota Remaining
                            </Typography>
                            <Typography
                              color={"info.main"}
                              variant="h1"
                              fontWeight={600}
                            >
                              {stats.remaining}                            
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
                              VTRU Staked
                            </Typography>
                            <Typography
                              color={"info.main"}
                              variant="h1"
                              fontWeight={600}
                            >
                              {stats.staked}                            
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
                              VIBE Tokens
                            </Typography>
                            <Typography
                              color={"info.main"}
                              variant="h1"
                              fontWeight={600}
                            >
                              {stats.tokens}                            
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
                              VIBE Shares
                            </Typography>
                            <Typography
                              color={"info.main"}
                              variant="h1"
                              fontWeight={600}
                            >
                              {stats.shares}                            
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>
                



            </Grid>



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
                    <Button color="primary" size="large" disabled={ !buttonEnabled } style={{marginTop: '10px'}} fullWidth onClick={ () => { buttonState(false); handleStake(); } }>
                      { buttonMessage }
                    </Button>
{/*                   
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
                            </Typography> */}
                      </CardContent>
                  </Box>
                </Grid>



            </Grid>
          <Grid container spacing={3} style={{marginTop: '10px'}}>
              <Grid item xs={12} lg={4}>
                <BlankCard>
                    <div style={{padding: '20px', paddingTop: 0}}>
                      <h1 style={{textAlign: 'center'}}>UNLOCKED VTRU</h1>
                      <h2 style={{textAlign: 'center', fontWeight: 100, fontSize: '16px', marginBottom: '40px'}}>Stake: 50/VIBE, Swap: 15/VIBE</h2>
                      <h2><span style={mainHeadingStyle}>Balance:</span> <span style={mainNumberStyle}>{Number(parseInt(unlockedBalance)).toFixed(0)}</span></h2>
                      <h2><span style={mainHeadingStyle}>Allocated:</span> <span style={mainNumberStyle}>{Number(parseInt(unlockedAllocated)).toFixed(0)}</span></h2>
                      <StakeInputForm locked={false} full={true} balance={parseInt(unlockedBalance)} stakeRatio={50} swapRatio={15} onChange={changeHandler}  />
                      </div>
                  </BlankCard>
              </Grid>        
              <Grid item xs={12} lg={4}>
                <BlankCard>
                  <div style={{padding: '20px', paddingTop: 0}}>
                    <h1 style={{textAlign: 'center'}}>LOCKED VTRU</h1>
                    <h2 style={{textAlign: 'center', fontWeight: 100, fontSize: '16px', marginBottom: '40px'}}>Stake: 150/VIBE, Swap: 20/VIBE</h2>
                    <h2><span style={mainHeadingStyle}>Balance:</span> <span style={mainNumberStyle}>{Number(parseInt(lockedBalance)).toFixed(0)}</span></h2>
                    <h2><span style={mainHeadingStyle}>Allocated:</span> <span style={mainNumberStyle}>{Number(parseInt(lockedAllocated)).toFixed(0)}</span></h2>
                    <StakeInputForm locked={true} full={true} balance={parseInt(lockedBalance)} stakeRatio={150} swapRatio={20} onChange={changeHandler} />
                  </div>
                </BlankCard>
              </Grid>
              <Grid item xs={12} lg={4}>
                <BlankCard>
                  <div style={{padding: '20px', paddingTop: 0}}>
                    <h1 style={{textAlign: 'center'}}>STAKED VTRU</h1>
                    <h2 style={{textAlign: 'center', fontWeight: 100, fontSize: '16px', marginBottom: '40px'}}>Stake: 150/VIBE, Swap: 20/VIBE</h2>
                    <h2><span style={mainHeadingStyle}>Balance:</span> <span style={mainNumberStyle}>{Number(parseInt(airdropBalance)).toFixed(0)}</span></h2>
                    <h2><span style={mainHeadingStyle}>Allocated:</span> <span style={mainNumberStyle}>{Number(parseInt(airdropAllocated)).toFixed(0)}</span></h2>
                    <StakeInputForm locked={true} full={false} balance={parseInt(airdropBalance)} stakeRatio={150} swapRatio={20} onChange={changeHandler} />
                  </div>
                </BlankCard>
              </Grid>
            </Grid>
    </PageContainer>
  ); 
};

Stake.layout = "Blank";
