"use client"

import React, { useEffect, useState, useRef } from "react";
import Breadcrumb from '@/app/(pages)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/(pages)/components/container/PageContainer';

import BlankCard from '@/app/(pages)/components/shared/BlankCard';
import {
  CardContent,
  Grid,
  Box,
  Button,
  Typography,
} from '@mui/material';

import { readContract, writeContract } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";

import { ethers } from "ethers";
import { useAccount, useBalance } from "wagmi";

export default function Stake () {

  const isTestnet = false;//Boolean(process.env.NEXT_PUBLIC_IS_TESTNET) === true;
  const network = isTestnet === true ? 'testnet' : 'mainnet';
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);

  let processing = false;

  const [buttonMessage, setButtonMessage] = useState('GO');
  const [buttonEnabled, setButtonEnabled] = useState(true);

  const [stakes, setStakes] = useState([]);
  const [loadMessage, setLoadMessage] = useState('Scanning account for staking information...');
  const [blockNumber, setBlockNumber] = useState(0);

  
  useEffect(() => {
      function updateBlock() {
        if (provider !== null) {
          provider.getBlockNumber().then((block) => { 
            setBlockNumber(block);
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
      setContract(new ethers.Contract(config[network].CoreStake, config.abi.CoreStake, provider));
    }
  }, [provider]);

  useAccount({
      onConnect({ address, connector, isReconnected }) {
      const rpcUrl = connector.chains[0].rpcUrls['default']['http'][0];
      setStakes(arr => []);
      setAccount(address);
      setProvider(new ethers.JsonRpcProvider(rpcUrl));     
       
    },
    onDisconnect() {
      setAccount(null);
      setStakes(arr => []);
      setLoadMessage('Account disconnected.');
      setProvider(null);
    },
  });

 const balance = useBalance({
    address: account,
    cacheTime: 15_000,
  });


  useEffect(() => {

    async function getStakes(connectedOwner) {
//      connectedOwner = "0x41f07238C5096Eb7eb68c50FE8AE5AdDECBBF5C2";
      console.log(connectedOwner)
      let currentStakes = [];
      let totalStaked = BigInt(0);
      if (connectedOwner !== null) {
        try {
          currentStakes = await readContract({
            address: config[network].CoreStake,
            abi: config.abi.CoreStake,
            functionName: "getUserStakesInfo",
            args: [connectedOwner, true]
          });
          currentStakes.forEach((stakeInfo) => {
            console.log(stakeInfo); 
            totalStaked += BigInt(stakeInfo.unstakeAmount);
          });
        } catch(e) {

        }
      }
      setAirdropBalance(Number(totalStaked)/Math.pow(10,18));
      console.log(currentStakes.length, Number(totalStaked)/Math.pow(10,18));
    }
    
    getStakes(account);

  }, [contract, account ])

  function getBlockNumber() {
    return blockNumber;
  }


  async function handleStake() {
    if (processing) return;
    processing = true;

    let total = 0;
    for(let t=0;t<vtru.airdrop.length;t++) {
      total += vtru.airdrop[t];
    }
    if (total > 0) {
      const inputs = [
        account,
        vtru.airdrop
      ]
      // Send transaction
      try {
          await writeContract({
              address: vaultConfig.core[network],
              abi: vaultConfig.core.abi,
              functionName: "stake",
              gas: 2_500_000,
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

  const breadcrumb = [
    {
      to: '/',
      title: 'Home',
    },
    {
      title: "Staking"
    },
    {
      title: 'VTRU',
    },
  ];


  const [vtru, setVtru] = useState({ airdrop: [0,0,0,0,0,0]});
  const [staked, setStaked] = useState(0);

  const changeHandler = (isLocked, period, vtruInput) => {
    const balance = parseInt(airdropBalance);

    const cost = period === 0 ? 20 : 150;
    const actualVtru = parseInt(vtruInput / cost) * cost;
    const actualVibe = (actualVtru/cost) * (period === 0 ? 1 : period);

    const key = 'airdrop';

    let before = 0;
    vtru[key].forEach(i => before += i);

    vtru[key][period] = actualVtru;

    let allocated = 0; 
    vtru[key].forEach(i => allocated += i);

    if (allocated == before || allocated > balance) return {vtru: 0, vibe: 0};

    vibe[key][period] = actualVibe;

    let staked = 0;
    for(let l=1; l<6; l++) {
      staked += vtru['airdrop'][l];
    }

    let swapped = vtru['airdrop'][0];

    let totalVibe = 0;
    for(let l=0; l<6; l++) {
      totalVibe += vibe['airdrop'][l];
    }

    setVtru({...vtru });
    setVibe({...vibe});
    setStaked(staked);
    setSwapped(swapped);
    setTotalVibe(totalVibe);
    
    setAirdropAllocated(allocated);

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
      <Breadcrumb title="VTRU Staking" items={breadcrumb} />
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
                              stats.remaining                            
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
                              stats.staked                            
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
                              stats.tokens                           
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
                              stats.shares                          
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
                      staked                            
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
                      swapped                            
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
                      totalVibe                            
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
            </CardContent>
          </Box>
        </Grid>



    </Grid>

    </PageContainer>
  ); 
};

Stake.layout = "Blank";
