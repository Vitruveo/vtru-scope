"use client"

import React, { useEffect, useState, useRef } from "react";
import Breadcrumb from '@/app/(pages)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/(pages)/components/container/PageContainer';
import CustomSelect from '@/app/(pages)/components/forms/theme-elements/CustomSelect';

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

import { IconCalendarTime, IconCalendarCheck } from '@tabler/icons-react';
import { Stack } from '@mui/system';

import { readContract, writeContract } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";

import { ethers } from "ethers";
import { useAccount, useBalance } from "wagmi";

export default function Stake () {

  const Capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const DIVISOR = BigInt(String(Math.pow(10,18)));
  const REBASE_DIVISOR = BigInt(String(Math.pow(10,8)));
  const EPOCH = 17280;
  const CURRENT_REBASE = BigInt(100329124);

  const columns = [
    { id: 'stake', label: 'VTRU Staked', minWidth: 100 },
    { id: 'term', label: 'Term/APR', minWidth: 100 },
    { id: 'reward', label: 'Reward', minWidth: 100 },
    { id: 'rebase', label: 'Rebase', minWidth: 100 },
    { id: 'total', label: 'Total', minWidth: 100 },
    { id: 'maturity', label: 'Maturity', minWidth: 100 },
    { id: 'status', label: 'Status', minWidth: 100 },
  ];
  
  const isTestnet = false;//Boolean(process.env.NEXT_PUBLIC_IS_TESTNET) === true;
  const network = isTestnet === true ? 'testnet' : 'mainnet';

  let processing = false;

  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);

  const [blockNumber, setBlockNumber] = useState(0);

  const [buttonMessage, setButtonMessage] = useState('UNSTAKE');
  const [buttonEnabled, setButtonEnabled] = useState(false);

  const [button2Message, setButton2Message] = useState('STAKE');
  const [button2Enabled, setButton2Enabled] = useState(false);

  const [stakes, setStakes] = useState([]);
  const [stakeTerms, setStakeTerms] = useState({});
  const [userTotal, setUserTotal] = useState({
    stake: '',
    reward: '',
    rebase: '',
    all: '',
    unstakeable: '',
    enabled: false
  });

  const [stats, setStats] = useState({
    totalStaked: '',
    totalStakes: '',
    activeStakes: '',
    totalRewards: ''
  })
  const [loadMessage, setLoadMessage] = useState('Scanning account for staking information...');

  const [unlockedBalance, setUnlockedBalance] = useState(0);
  
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
      setStakeTerms({});
      setStakes(arr => []);
      setAccount(address);
      setProvider(new ethers.JsonRpcProvider(rpcUrl));     
       
    },
    onDisconnect() {
      setAccount(null);
      setStakeTerms({});
      setStakes(arr => []);
      setLoadMessage('Account disconnected.');
      setProvider(null);
    },
  });

          
  const termList = [
    {
      value: '6',
      label: '1Y / 15.00%',
    },
    {
      value: '7',
      label: '2Y / 22.50%',
    },
    {
      value: '8',
      label: '3Y / 30.00%',
    },
    {
      value: '9',
      label: '4Y / 45.00%',
    },
    {
      value: '10',
      label: '5Y / 60.00%',
    },
  ];

 const balance = useBalance({
    address: account,
    cacheTime: 15_000,
  });

  useEffect(() => { 
    setUnlockedBalance(Number(Math.trunc(Number(balance?.data?.value)/Math.pow(10,18))));
  }, [balance]);
  const [termsList, setTermsList] = useState([]);
  const [terms, setTerms] = useState('6');

  const handleTermsChange = (event) => {
    setTerms(event.target.value);
  };

  const [stakeAmount, setStakeAmount] = useState(0);
  const [stakeReward, setStakeReward] = useState(0);
  const [slider, setSlider] = useState(0);

  const handleSliderChange = (event) => {
    const percentage = event.target.value;
    setSlider(percentage);
    if (unlockedBalance > 0) {
      setStakeAmount(Number(Math.trunc((unlockedBalance * percentage)/100)));
    }
  };

  useEffect(() => {

    async function getStats() {
      const stats = await readContract({
        address: config[network].CoreStake,
        abi: config.abi.CoreStake,
        functionName: "stats",
        args: []
      });
      setStats({
        totalStaked: Math.trunc(Number(stats[0]/DIVISOR)).toLocaleString(),
        totalStakes: Math.trunc(Number(stats[2])).toLocaleString(),
        activeStakes: Math.trunc(Number(stats[3])).toLocaleString(),
        totalRewards: Math.trunc(Number(stats[1]/DIVISOR)).toLocaleString()
      })
    }

    getStats();

  }, [account, blockNumber]);


  useEffect(() => {

    async function getStakes(connectedOwner) {

//      connectedOwner = "0x41f07238C5096Eb7eb68c50FE8AE5AdDECBBF5C2";
      if (connectedOwner !== null) {
        try {
          const userStakes = await readContract({
            address: config[network].CoreStake,
            abi: config.abi.CoreStake,
            functionName: "getUserStakesInfo",
            args: [connectedOwner]
          });
          const currentStakes = userStakes[0];
          const unclaimTotal = userStakes[1];
          const tmpStakes = [];
          const total = {
            stake: BigInt(0),
            reward: BigInt(0),
            rebase: BigInt(0),
            all: BigInt(0),
            unstakeable: BigInt(0)
          }      
          for(let s=0;s<currentStakes.length;s++) {
            const stakeInfo = currentStakes[s];
            const stake = stakeInfo.amount/DIVISOR;
            if ((stake > 0) && (Object.keys(stakeTerms).length > 0)) {
              const stakeTermId = Number(stakeInfo.stakeTermID);
              const stakeTerm = stakeTerms[stakeTermId];
              let term = 0;
              let termLabel = '';
              if (stakeTerm.epochs >= 365) {
                term = stakeTerm.epochs/365;
                termLabel = `${(stakeTerm.epochs/365).toFixed(0)}Y`;
              } else {
                term = stakeTerm.epochs/30;
                termLabel = `${(stakeTerm.epochs/30).toFixed(0)}M`;
              }
              let epochs = (Number(stakeInfo.endBlock) - Number(blockNumber))/EPOCH;
              let percent;
              let maturity;
              let rebase = BigInt(0);
              if (epochs <= 0) {
                maturity = '';
                percent = 100;
              } else {
                percent = ((stakeTerm.epochs - epochs)/stakeTerm.epochs) * 100;
                let today = new Date();
                maturity = new Date(today.setDate(today.getDate() + epochs)).toLocaleDateString();
                if (epochs >= 365) {
                  rebase = ((stakeInfo.unstakeAmount * CURRENT_REBASE) / REBASE_DIVISOR) - stakeInfo.unstakeAmount;
                }
              }
              tmpStakes.push({
                id: s,
                stake: Math.trunc(Number(stakeInfo.amount/DIVISOR)).toLocaleString(),
                rawStake: Number(stakeInfo.amount/DIVISOR),
                reward: Math.trunc(Number(stakeInfo.reward/DIVISOR)).toLocaleString(),
                rebase: Math.trunc(Number(rebase/DIVISOR)).toLocaleString(),
                total: Math.trunc(Number((stakeInfo.unstakeAmount + rebase)/DIVISOR)).toLocaleString(),
                term,
                termLabel,
                apr: stakeTerm.apr,
                endBlock: stakeInfo.endBlock,
                maturity, 
                percent,
                status: stakeInfo.eligibleToUnstake
              });  

              total.stake += stakeInfo.amount;
              total.reward += stakeInfo.reward;
              total.rebase += rebase;
              total.all += stakeInfo.unstakeAmount + rebase;
              total.unstakeable += stakeInfo.eligibleToUnstake == true ? stakeInfo.unstakeAmount + rebase : BigInt(0);
            }
          }

          tmpStakes.sort((a,b) => {
            if (Number(a.endBlock) === Number(b.endBlock)) {
              return b.rawStake - a.rawStake;
            } 
            return Number(a.endBlock) - Number(b.endBlock);       
          });
          setStakes(tmpStakes);
          setUserTotal({
            stake: Math.trunc(Number(total.stake/DIVISOR)).toLocaleString(),
            reward:  Math.trunc(Number(total.reward/DIVISOR)).toLocaleString(),
            rebase:  Math.trunc(Number(total.rebase/DIVISOR)).toLocaleString(),
            all:  Math.trunc(Number(total.all/DIVISOR)).toLocaleString(),
            unstakeable:  Math.trunc(Number(total.unstakeable/DIVISOR)).toLocaleString(),
            enabled: total.unstakeable > 0
          });
          setButtonEnabled(userTotal.enabled);
        } catch(e) {
          console.log('getStakes Error', e)
        }
      }
     
    }

    getStakes(account);

  }, [account, blockNumber, stakeTerms])

  useEffect(() => {

    async function getStakeTerms() {
      try {
        const terms = await readContract({
          address: config[network].CoreStake,
          abi: config.abi.CoreStake,
          functionName: "getStakeTerms",
          args: []
        });

        const termInfo = {};
        for (let t=0;t<terms.length;t++) {
          if (terms[t].epochs > 0) {
            termInfo[Number(terms[t].id)] = {
              epochs: Number(terms[t].epochs),
              apr: Number(terms[t].aprBasisPoints)/100,
              active: terms[t].active
            }  
          }
        }
        setStakeTerms(termInfo);

      } catch(e) {
        console.log('getStakeTerms Error', e)
      }
    }

    getStakeTerms();

  }, [contract])


  async function handleStake() {
    if (processing) return;
    processing = true;

      // Send transaction
      try {
          await writeContract({
            address: config[network].CoreStake,
            abi: config.abi.CoreStake,
            functionName: "stake",
            args: [Number(terms)],
            gas: 2_500_000,
            value: BigInt(stakeAmount) * DIVISOR
          });
          setTimeout(() => {
              window.location.reload()
          }, 6000)
      
      } catch(e) {
          console.log('***************',e);
          processing = false;
      
      } 
  }


  async function handleUnstake() {
    if (processing) return;
    processing = true;

      // Send transaction
      try {
          await writeContract({
            address: config[network].CoreStake,
            abi: config.abi.CoreStake,
            functionName: "unstake",
            args: [],
            gas: 2_500_000
          });
          setTimeout(() => {
              window.location.reload()
          }, 6000)
      
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
      title: 'VTRU (BETA ... New stake feature coming soon)',
    },
  ];


  const [vtru, setVtru] = useState({ airdrop: [0,0,0,0,0,0]});

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
    setTotalVibe(totalVibe);
    
    setAirdropAllocated(allocated);

    return {vtru: actualVtru, vibe: actualVibe};
  }

  function buttonState(enabled) {
    setButtonEnabled(enabled);
    setButtonMessage('Wait...');
  }

  function button2State(enabled) {
    setButton2Enabled(enabled);
    setButton2Message('Wait...');
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
                              Total Staked Amount
                            </Typography>
                            <Typography
                              color={"info.main"}
                              variant="h1"
                              fontWeight={600}
                            >
                              {stats.totalStaked}                           
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
                              Total Stakes
                            </Typography>
                            <Typography
                              color={"info.main"}
                              variant="h1"
                              fontWeight={600}
                            >
                              {stats.totalStakes}                           
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
                              Active Stakes
                            </Typography>
                            <Typography
                              color={"info.main"}
                              variant="h1"
                              fontWeight={600}
                            >
                              {stats.activeStakes}                          
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
                              Rewards Distributed
                            </Typography>
                            <Typography
                              color={"info.main"}
                              variant="h1"
                              fontWeight={600}
                            >
                              {stats.totalRewards}                        
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>
                



      </Grid>


      <Grid container spacing={3}  style={{marginBottom: '30px'}}>
        <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
          <Box bgcolor={"secondary.main"} textAlign="center">
            <CardContent px={1}>
          
                    <Typography
                      color={"grey.900"}
                      variant="subtitle1"
                      fontWeight={600}
                    >
                      Stake
                    </Typography>
                    <Typography
                      color={"grey.900"}
                      variant="h1"
                      fontWeight={600}
                    >
                       {Number(stakeAmount).toLocaleString()}                         
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
                      Stake {slider}% of {Math.trunc(Number(unlockedBalance)).toLocaleString()}
                    </Typography>
                    <Slider
                      defaultValue={0}
                      step={1}
                      min={0}
                      max={100}
                      onChange={handleSliderChange}
                    />
              </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
          <Box bgcolor={"secondary.main"} textAlign="center">
            <CardContent px={1}>
          
                    <Typography
                      color={"grey.900"}
                      variant="subtitle1"
                      fontWeight={600}
                    >
                      Term/APR
                    </Typography>
                    <CustomSelect
                      value={terms}
                      onChange={handleTermsChange}
                      fullWidth
                      variant="outlined"
                      sx={{ color: "grey.900"}}
                    >
                      {termList.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </CustomSelect>
              </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
          <Box textAlign="center">
            <CardContent px={1}>
              <Button color="primary" size="large" disabled={ stakeAmount == 0 } style={{marginTop: '10px'}} fullWidth onClick={ () => { button2State(false); handleStake(); } }>
                { button2Message }
              </Button>
            </CardContent>
          </Box>
        </Grid>
    </Grid>

    <Grid container spacing={3}  style={stakes.length == 0 ? {display: 'none'} : {}}>
        <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
          
                    <Typography
                      color={"grey.900"}
                      variant="subtitle1"
                      fontWeight={600}
                    >
                      Your Total Staked
                    </Typography>
                    <Typography
                      color={"grey.900"}
                      variant="h1"
                      fontWeight={600}
                    >
                      {userTotal.stake}                            
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
                      Your Total Rewards
                    </Typography>
                    <Typography
                      color={"grey.900"}
                      variant="h1"
                      fontWeight={600}
                    >
                      {userTotal.reward}                            
                    </Typography>
              </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
          <Box bgcolor={userTotal.enabled === true ? "success.main" : "grey.700"} textAlign="center">
            <CardContent px={1}>
          
                    <Typography
                      color={"grey.900"}
                      variant="subtitle1"
                      fontWeight={600}
                    >
                      Available to Unstake
                    </Typography>
                    <Typography
                      color={"grey.900"}
                      variant="h1"
                      fontWeight={600}
                    >
                      {userTotal.unstakeable}                            
                    </Typography>
              </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
          <Box textAlign="center">
            <CardContent px={1}>
              <Button color="primary" size="large" disabled={ !buttonEnabled } style={{marginTop: '10px'}} fullWidth onClick={ () => { buttonState(false); handleUnstake(); } }>
                { buttonMessage }
              </Button>
            </CardContent>
          </Box>
        </Grid>



    </Grid>


            <TableContainer
              sx={{
                maxHeight: 500,
                marginTop: 10
              }}
              style={stakes.length == 0 ? {display: 'none'} : {}}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        style={{ minWidth: column.minWidth }}
                      >
                        <Typography variant="h6" fontWeight="900">
                          {column.label}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stakes.map((row) => {
                    return (
                      <TableRow hover key={row.id}>

                        <TableCell>
                          <Stack spacing={2} direction="row" alignItems="center">
                              <Typography variant="h3">{row.stake}</Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Stack spacing={1}>
                              <Typography variant="h6">{`${row.termLabel} / ${row.apr.toFixed(0)}%`}</Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Stack spacing={2} direction="row" alignItems="center">
                              <Typography variant="h6">{row.reward}</Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Stack spacing={2} direction="row" alignItems="center">
                              <Typography variant="h6">{row.rebase}</Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Stack spacing={1}>
                            {/* <Typography color="textSecondary" variant="subtitle2">
                              Earnings
                            </Typography> */}
                            <Typography variant="h6">≈ {row.total}</Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Stack spacing={1}>
                          <Typography variant="h6">{row.maturity}</Typography>
                            <LinearProgress
                              value={row.percent}
                              variant="determinate" color={'primary'}
                            />                            

                          <Typography color="textSecondary" variant="subtitle2">
                              Block: {Number(row.endBlock).toLocaleString()}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <IconButton>
                            {
                              row.status == true ?
                              <IconCalendarCheck size={40} /> :
                              <IconCalendarTime size={40} />
                            }
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <p style={stakes.length == 0 ? {display: 'none'} : {}}>≈ indicates the value may be rounded up or down for display purposes.</p>

    </PageContainer>
  ); 
};

Stake.layout = "Blank";
