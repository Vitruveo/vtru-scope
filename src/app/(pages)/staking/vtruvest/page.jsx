"use client"

import React, { useEffect, useState, useRef } from "react";
import Breadcrumb from '@/app/(pages)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/(pages)/components/container/PageContainer';
import { parseEther } from 'viem';

import BlankCard from '@/app/(pages)/components/shared/BlankCard';
import StakeInputForm from '@/app/(pages)/components/widgets/cards/StakeInputForm';
import SwapInputForm from '@/app/(pages)/components/widgets/cards/SwapInputForm';
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

export default function VTRUVest () {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loadMessage, setLoadMessage] = useState('Scanning account for Core NFTs...');
  const [provider, setProvider] = useState(null);

  let processing = false;
  const [buttonMessage, setButtonMessage] = useState('STAKE');
  const [buttonEnabled, setButtonEnabled] = useState(false);

  const isTestnet = false;//Boolean(process.env.NEXT_PUBLIC_IS_TESTNET) === true;
  const network = isTestnet === true ? 'testnet' : 'mainnet';
  

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

 
  async function handleStake() {

    const DECIMALS = BigInt(Math.pow(10,18));
    if (processing) return;
    processing = true;

    let total = BigInt(0);
    for(let t=0;t<vtru.locked.length;t++) {
      total += BigInt(vtru.locked[t]) * DECIMALS;
    }
    if (total > BigInt(0)) {
      const inputs = [
        nfts,
        BigInt(vtru.locked[5]) * DECIMALS,
        BigInt(vtru.locked[4]) * DECIMALS,
        BigInt(vtru.locked[3]) * DECIMALS,
        BigInt(vtru.locked[2]) * DECIMALS,
      ]

      console.log(inputs);
      // Send transaction
      try {
          await writeContract({
              address: vaultConfig.core[network],
              abi: vaultConfig.core.abi,
              functionName: "stake",
              gas: 20_500_000,
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
        const granted = Number(nft.grantAmount)/Math.pow(10,18);
        const claimed = Number(nft.claimedGrantAmount)/Math.pow(10,18);
        total += Math.max(granted-claimed);  
        tokenIds.push(nft.id);
      }
      console.log(total);
      setLockedBalance(total);
      setNfts(nfts => [...tokenIds]);
      console.log(tokenIds)
      
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
      title: "Staking"
    },
    {
      title: 'VTRU (Vesting)',
    },
  ];

  const [lockedBalance, setLockedBalance] = useState(0);


  const [lockedAllocated, setLockedAllocated] = useState(0);
  

  const [vtru, setVtru] = useState({ locked: [0,0,0,0,0,0]});
  const [vibe, setVibe] = useState({ locked: [0,0,0,0,0,0]});
  const [staked, setStaked] = useState(0);
  const [totalVibe, setTotalVibe] = useState(0);

  const changeHandler = (isLocked, period, vtruInput) => {
    const balance = parseInt(lockedBalance);

    const costs = [1000, 1000, 300, 250, 200, 150];
    const actualVtru = parseInt(vtruInput);
    const actualVibe = parseInt(actualVtru/costs[period]);

    const key = 'locked';

    let before = 0;
    vtru[key].forEach(i => before += i);

    vtru[key][period] = actualVtru;

    let allocated = 0; 
    vtru[key].forEach(i => allocated += i);

    if (allocated == before || allocated > balance) return {vtru: 0, vibe: 0};

    vibe[key][period] = actualVibe;

    let staked = 0;
    for(let l=1; l<6; l++) {
      staked += vtru['locked'][l];
    }

    let totalVibe = 0;
    for(let l=0; l<6; l++) {
      totalVibe += vibe['locked'][l];
    }

    setVtru({...vtru });
    setVibe({...vibe});
    setStaked(staked);
    setTotalVibe(totalVibe);
    
    setLockedAllocated(allocated);

    return {vtru: actualVtru, vibe: actualVibe};
  }

  function buttonState(enabled) {
    setButtonEnabled(enabled);
    setButtonMessage('Wait...');
  }

  const mainNumberStyle = {color: '#763EBD', fontFamily: 'Courier', fontSize: '30px', lineHeight: '24px', marginRight: '110px'};
  const mainHeadingStyle = {width: '110px', display: 'inline-block', fontSize: '20px', lineHeight: '24px'};

  return (
    <PageContainer title="VTRU Scope" description="Stake VTRU">
      <Breadcrumb title="VTRU Stake/Swap for VIBE" items={breadcrumb} />
      
    <Grid container spacing={3} style={{marginTop: '10px'}}>

          <Grid item xs={12} lg={12}>
            <h2 style={{marginBottom: '40px', fontSize: '20px', fontWeight: 200, lineHeight: '40px'}}>You can stake 100% of the VTRU that is currently vesting in any Core NFTs you hold such as Nexus, Maxim, Dreamer etc. It is not possible 
              to stake a partial amount. You can either stake all or none of your vesting VTRU.</h2>
            <BlankCard>
              <div style={{padding: '20px', paddingTop: 0}}>
                <h2 style={{marginBottom: '40px'}}>
                  <span style={mainHeadingStyle}>Available:</span> <span style={mainNumberStyle}>{Number(parseInt(lockedBalance)).toFixed(0)}</span>
                  <span style={mainHeadingStyle}>Allocated:</span> <span style={mainNumberStyle}>{Number(parseInt(lockedAllocated)).toFixed(0)}</span>
                  <span style={mainHeadingStyle}>Remaining:</span> <span style={mainNumberStyle}>{Number(parseInt(lockedBalance-lockedAllocated)).toFixed(0)}</span>
                </h2>
                <StakeInputForm locked={true} full={false} balance={parseInt(lockedBalance)} stakeRatio={250} onChange={changeHandler} />
              </div>
            </BlankCard>
            <CardContent px={1}>
              <Button color="primary" size="large" disabled={ lockedAllocated == 0 } style={{marginTop: '10px'}} fullWidth onClick={ () => { buttonState(false); handleStake(); } }>
                { buttonMessage }
              </Button>
            </CardContent>

          </Grid>
    </Grid>
    </PageContainer>
  ); 
};

VTRUVest.layout = "Blank";
