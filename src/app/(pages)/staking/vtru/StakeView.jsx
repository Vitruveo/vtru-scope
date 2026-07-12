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
  Button,
  Chip
} from '@mui/material';

import { IconCalendarTime, IconCalendarCheck } from '@tabler/icons-react';
import { Stack } from '@mui/system';

import { readContract, writeContract } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";

import { ethers } from "ethers";
import { useAccount, useBalance } from "wagmi";

const READ_RPC_URL = "https://rpc.vitruveo.ai";

export default function StakeView ({ viewAddress = null }) {

  const isView = Boolean(viewAddress);

  const Capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const DIVISOR = BigInt(String(Math.pow(10,18)));
  const EPOCH = 17280;

  const columns = [
    { id: 'stake', label: 'VTRU Staked', minWidth: 100 },
    { id: 'term', label: 'Term/APR', minWidth: 100 },
    { id: 'reward', label: 'Reward', minWidth: 100 },
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

  // Address whose stakes are displayed: the URL address in view mode, else the connected wallet.
  const targetAddress = viewAddress || account;

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

  // In view mode there is no wallet connection, so set up a read-only provider
  // to drive block updates, contract reads, and stake-term loading.
  useEffect(() => {
    if (isView && provider === null) {
      setProvider(new ethers.JsonRpcProvider(READ_RPC_URL));
    }
  }, [isView, provider]);

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
      setContract(new ethers.Contract(config[network].CoreStakeV2, config.abi.CoreStakeV2, provider));
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
      setProvider(isView ? new ethers.JsonRpcProvider(READ_RPC_URL) : null);
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


  const [currentStaked, setCurrentStaked] = useState(0);
  const contractBalance = useBalance({
    address: config[network].CoreStakeV2,
    cacheTime: 15_000,
  });

  useEffect(() => {
    setCurrentStaked(Number(Math.trunc(Number(contractBalance?.data?.value)/Math.pow(10,18))).toLocaleString());
  }, [contractBalance]);


  const [termsList, setTermsList] = useState([]);
  const [terms, setTerms] = useState('6');

  const handleTermsChange = (event) => {
    setTerms(event.target.value);
  };

  const [stakeAmountSlider, setStakeAmountSlider] = useState(0);
  const [stakeAmountInput, setStakeAmountInput] = useState(0);
  const [stakeAmount, setStakeAmount] = useState(0);
  const [stakeReward, setStakeReward] = useState(0);
  const [slider, setSlider] = useState(0);

  const handleSliderChange = (event) => {
    const percentage = event.target.value;
    setSlider(percentage);
    if (unlockedBalance > 0) {
      const amount = Number(Math.trunc((unlockedBalance * percentage)/100));
      setStakeAmountInput(amount);
      setStakeAmount(amount);
    }
  };


  const handleStakeAmountInputChange = (event) => {
    const amount = event.target.value;
    if (amount <= Math.trunc(Number(unlockedBalance))) {
      setStakeAmountInput(amount);
      setStakeAmount(amount);
      console.log(amount);
    }
  }

  useEffect(() => {

    async function getStats() {
      const stats = await readContract({
        address: config[network].CoreStakeV2,
        abi: config.abi.CoreStakeV2,
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

      if (connectedOwner !== null && connectedOwner !== undefined) {
        try {
          const userStakes = await readContract({
            address: config[network].CoreStakeV2,
            abi: config.abi.CoreStakeV2,
            functionName: "getUserStakesInfo",
            args: [connectedOwner]
          });
          const currentStakes = userStakes[0];
          const unclaimTotal = userStakes[1];
          const tmpStakes = [];
          const total = {
            stake: BigInt(0),
            reward: BigInt(0),
            all: BigInt(0),
            unstakeable: BigInt(0)
          }
          for(let s=0;s<currentStakes.length;s++) {
            const stakeInfo = currentStakes[s];
            const stake = stakeInfo.amount/DIVISOR;
            if (stake > 0) {
              const stakeTermId = Number(stakeInfo.stakeTermID);
              const stakeTerm = stakeTerms[stakeTermId]; // undefined for lock terms (not in getStakeTerms)
              // Term length comes from the contract's start/end blocks; lock-safe, no term lookup.
              const totalEpochs = (Number(stakeInfo.endBlock) - Number(stakeInfo.startBlock))/EPOCH;
              const apr = stakeTerm ? stakeTerm.apr : 0; // lock terms have no APR
              let term = 0;
              let termLabel = '';
              if (totalEpochs >= 365) {
                term = totalEpochs/365;
                termLabel = `${(totalEpochs/365).toFixed(0)}Y`;
              } else {
                term = totalEpochs/30;
                termLabel = `${(totalEpochs/30).toFixed(0)}M`;
              }
              let epochs = (Number(stakeInfo.endBlock) - Number(blockNumber))/EPOCH;
              let percent;
              let maturity;
              if (epochs <= 0) {
                maturity = '';
                percent = 100;
              } else {
                percent = ((totalEpochs - epochs)/totalEpochs) * 100;
                let today = new Date();
                maturity = new Date(today.setDate(today.getDate() + epochs)).toLocaleDateString();
              }
              tmpStakes.push({
                id: s,
                stake: Math.trunc(Number(stakeInfo.amount/DIVISOR)).toLocaleString(),
                rawStake: Number(stakeInfo.amount/DIVISOR),
                reward: Math.trunc(Number(stakeInfo.reward/DIVISOR)).toLocaleString(),
                total: Math.trunc(Number(stakeInfo.unstakeAmount/DIVISOR)).toLocaleString(),
                term,
                termLabel,
                apr: apr,
                endBlock: stakeInfo.endBlock,
                maturity,
                percent,
                status: stakeInfo.eligibleToUnstake
              });

              total.stake += stakeInfo.amount;
              total.reward += stakeInfo.reward;
              total.all += stakeInfo.unstakeAmount;
              total.unstakeable += stakeInfo.eligibleToUnstake == true ? stakeInfo.unstakeAmount : BigInt(0);
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

    getStakes(targetAddress);

  }, [account, viewAddress, blockNumber, stakeTerms])

  useEffect(() => {

    async function getStakeTerms() {
      try {
        const terms = await readContract({
          address: config[network].CoreStakeV2,
          abi: config.abi.CoreStakeV2,
          functionName: "getStakeTerms",
          args: []
        });

        const termInfo = {};
        for (let t=0;t<terms.length;t++) {
            termInfo[Number(terms[t].id)] = {
              epochs: Number(terms[t].epochs),
              apr: Number(terms[t].aprBasisPoints)/100,
              active: terms[t].active
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
            address: config[network].CoreStakeV2,
            abi: config.abi.CoreStakeV2,
            functionName: "stake",
            args: [Number(terms)],
            gas: 20_500_000,
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
            address: config[network].CoreStakeV2,
            abi: config.abi.CoreStakeV2,
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

  const shortenAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

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


                <Grid item xs={12} sm={12} md={6} lg={6} key={2}>
                  <Box bgcolor={"info.light"} textAlign="center">
                    <CardContent px={1}>

                            <Typography
                              color={"info.main"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Staked Contract Balance
                            </Typography>
                            <Typography
                              color={"info.main"}
                              variant="h1"
                              fontWeight={600}
                            >
                              {currentStaked}
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={6} lg={6} key={3}>
                  <Box bgcolor={"info.light"} textAlign="center">
                    <CardContent px={1}>

                            <Typography
                              color={"info.main"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Currently Active Stakes
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


      </Grid>

      {isView && (
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h4" fontWeight={700}>Viewing stakes for</Typography>
          <Chip
            label={shortenAddress(viewAddress)}
            onClick={() => window.open(`https://explorer.vitruveo.ai/address/${viewAddress}`, '_blank')}
            sx={{
              bgcolor: 'grey.700',
              color: 'common.white',
              fontFamily: '"Roboto Mono", monospace',
              fontSize: '1.1rem',
              height: 'auto',
              py: 1,
              px: 1,
              '& .MuiChip-label': { px: 1.5 },
            }}
          />
        </Box>
      )}

    <Grid container spacing={3}  style={stakes.length == 0 ? {display: 'none'} : {}}>
        <Grid item xs={12} sm={12} md={6} lg={6} key={1}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>

                    <Typography
                      color={"grey.900"}
                      variant="subtitle1"
                      fontWeight={600}
                    >
                      {isView ? 'Total Staked' : 'Your Total Staked'}
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

        <Grid item xs={12} sm={12} md={6} lg={6} key={2}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>

                    <Typography
                      color={"grey.900"}
                      variant="subtitle1"
                      fontWeight={600}
                    >
                      {isView ? 'Total Rewards' : 'Your Total Rewards'}
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

        {!isView && (
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
        )}

        {!isView && (
        <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
          <Box textAlign="center">
            <CardContent px={1}>
              <Button color="primary" size="large" disabled={ !buttonEnabled } style={{marginTop: '10px'}} fullWidth onClick={ () => { buttonState(false); handleUnstake(); } }>
                { buttonMessage }
              </Button>
            </CardContent>
          </Box>
        </Grid>
        )}


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

StakeView.layout = "Blank";
