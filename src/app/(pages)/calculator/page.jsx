"use client"
import React, { useEffect, useState, useRef } from "react";
import Breadcrumb from '@/app/(pages)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/(pages)/components/container/PageContainer';
import CustomSelect from '@/app/(pages)/components/forms/theme-elements/CustomSelect';
import GrowthCard from '../components/calculator/GrowthCard';
import InputCard from '../components/calculator/InputCard';

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
import { Stack } from '@mui/system';

import Calculator from './Calculator';

import { readContract, writeContract } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";

import { ethers } from "ethers";
import { useAccount, useBalance } from "wagmi";

export default function CalculatorApp () {

  let processing = false;

  const [provider, setProvider] = useState(null);
  const [stakeContract, setStakeContract] = useState(null);
  const [vibeContract, setVibeContract] = useState(null);
  const [vtroContract, setVtroContract] = useState(null);
  const [account, setAccount] = useState(null);

  const [vtruBalance, setVtruBalance] = useState(null);
  const [vtroBalance, setVtroBalance] = useState(null);
  const [vibeBalance, setVibeBalance] = useState(null);
  const [verseBalance, setVerseBalance] = useState(1000);
  const [stake1, setStake1] = useState(null);
  const [stake2, setStake2] = useState(null);
  const [stake3, setStake3] = useState(null);
  const [stake4, setStake4] = useState(null);
  const [stake5, setStake5] = useState(null);

  const [projections, setProjections] = useState(null);

  const calculator = new Calculator();


  const vtroAbi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "vtroAmount",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "vtroAmount",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  useAccount({
    onConnect({ address, connector, isReconnected }) {
    const rpcUrl = connector.chains[0].rpcUrls['default']['http'][0];
    setAccount(address);
    setProvider(new ethers.JsonRpcProvider(rpcUrl));    
     
  },
  onDisconnect() {
    setAccount(null);
    setLoadMessage('Account disconnected.');
    setProvider(null);
  },
});


const trunc18 = (n) => Math.trunc(Number(n)/Math.pow(10,18));

const [assumptionsModel, setAssumptionsModel] = useState({
  revenue: {
    arts: { start:150_000_000, growth: 200, revShare: 0.05 },
    gaming: { start: 50_000_000, growth: 200, revShare: 0.10 },
    entertainment: { start: 50_000_000, growth: 200, revShare: 0.10 },
  },
  price: {
    vtru: { start: 0.20, growth: 10 },
    vtro: { start: 0.02, growth: 5 },
  },
  supply: {
    verse: {start: 250_000_000, growth: 300 }
  }
});

const updateGrowth = (key, value) => {

  const model = {...assumptionsModel }; 
  switch(key) {
    case 'vtruprice': model.price.vtru.growth = value; updatePage(); break;
    case 'vtroprice': model.price.vtro.growth = value; updatePage(); break;
    case 'artsrevenue': model.revenue.arts.growth = value; updatePage(); break;
    case 'gamingrevenue': model.revenue.gaming.growth = value; updatePage(); break;
    case 'entertainmentrevenue': model.revenue.entertainment.growth = value; updatePage(); break;
    case 'versesupply': model.supply.verse.growth = value; updatePage(); break;
  }
  setAssumptionsModel(model);
}

useEffect(() => {
  async function getStakes() {

    try {
        const userStakes = await stakeContract.getUserStakesInfo(account);
        const currentStakes = userStakes[0];
     
        const stakes = [0,0,0,0,0];
        for(let s=0;s<currentStakes.length;s++) {
          const stakeInfo = currentStakes[s];
          const stake = trunc18(stakeInfo.amount);
          const stakeTermId = Number(stakeInfo.stakeTermID) - 6;
          if ((stake > 0) && (stakeTermId >= 0)) {
              stakes[stakeTermId] += stake;
          }
        }
        setStake1(stakes[0]);
        setStake2(stakes[1]);
        setStake3(stakes[2]);
        setStake4(stakes[3]);
        setStake5(stakes[4]);

      } catch(e) {
        console.log('getStakes Error', e)
      }
    
  }

  async function setup() {

    const vtruBal = await provider.getBalance(account); 
    setVtruBalance(trunc18(vtruBal));

    const vtroBal = await vtroContract.balanceOf(account);
    setVtroBalance(trunc18(vtroBal));  

    const vibeShares = await vibeContract.getVibeNFTSharesByOwner(account);
  
    setVibeBalance(Number(vibeShares));

    //setVerseBalance(0);

    getStakes();
  }

  if (vtroContract !== null && vibeContract !== null && stakeContract !== null && account !== null && provider !== null) {
    setup();
  }

}, [provider, account, vtroContract, vibeContract]);

useEffect(() => {
    if (provider !== null) {
      setVibeContract(new ethers.Contract(config['mainnet'].VIBE, config.abi.VIBE, provider));
      setStakeContract(new ethers.Contract(config['mainnet'].CoreStake, config.abi.CoreStake, provider));
      setVtroContract(new ethers.Contract('0xDECAF2f187Cb837a42D26FA364349Abc3e80Aa5D', vtroAbi, provider));
    }
}, [provider]);



  const columns = [
    { id: 'label', label: 'Item', minWidth: 35 },
    { id: '2025', label: '2025',  minWidth: 35 },
    { id: '2026', label: '2026',  minWidth: 35 },
    { id: '2027', label: '2027',  minWidth: 35 },
    { id: '2028', label: '2028',  minWidth: 35 },
    { id: '2029', label: '2029',  minWidth: 35 },
  ];

  const labels = {
    revenue: 'REVENUE $',
    artsRevenue: 'Arts',
    gamingRevenue: 'Gaming',
    entertainmentRevenue: 'Entertainment',
    income: 'INCOME',
    vibeIncome: 'VIBE',
    verseIncome: 'VERSE',
    stakingIncome: 'Staking',
    price: 'PRICE ($)',
    vtruPrice: 'VTRU',
    vtroPrice: 'VTRO',
    vtru: 'VTRU',
    startWalletVTRU: 'Wallet (Start)',
    unstakedVTRU: 'Unstaked',
    endWalletVTRU: 'Wallet (End)',
    vtro: 'VTRO',
    walletVTRO: 'Wallet VTRO',
    walletVTROUSD: 'Wallet VTRO $',
    rebased: 'REBASED',
    rebasedWalletVTRU: 'Wallet VTRU',
    rebasedWalletVTRUUSD: 'Wallet VTRU $',
    total: 'TOTAL',
    totalWalletUSD: 'Wallet $'
  }

  const updatePage = () => {

    let results  = calculator.calculateProjections(2025, {
        vtru: vtruBalance,
        vtro: vtroBalance,
        vibe: vibeBalance,
        verse: verseBalance,
        vtruStaked: [stake1, stake2, stake3, stake4, stake5],
      },
      assumptionsModel
  );
  setProjections(results);
}
  
useEffect(() => {

  updatePage();
                  
}, [assumptionsModel]);

  useEffect(() => {

    updatePage();
                                            
  }, [vtruBalance, vtroBalance, vibeBalance, verseBalance, stake1, stake2, stake3, stake4, stake5]);
 


  const breadcrumb = [
    {
      to: '/',
      title: 'Home',
    },
    {
      title: "Calculator"
    },
  ];

  const gap = '24px';

  return (
<PageContainer title="VTRU Scope" description="Calculator">
      <Breadcrumb title="Calculator" items={breadcrumb} />
      {/* <Grid container spacing={3} style={{marginBottom: '30px'}}>
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
                              stats.totalStaked                           
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
                              stats.totalStakes                           
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
                              stats.activeStakes                          
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
                              stats.totalRewards                        
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>
                



      </Grid> */}

      <h1 style={{color: '#cc0000', marginBottom: '35px'}}>BETA RELEASE! Values not accurate. Currently only for testing and feedback!</h1>
      <h2>Current Portfolio</h2>
      <Grid container spacing={3}  style={{marginBottom: '10px'}}>
        <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
          <InputCard value={vtruBalance} item={{defaultValue: vtruBalance, title: 'VTRU', handleInputChange: (e) => console.log(e.target.value)}} />
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={2}>
          <InputCard value={vtroBalance} item={{defaultValue: vtroBalance, title: 'VTRO', handleInputChange: (e) => console.log(e.target.value)}} />
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
          <InputCard value={vibeBalance} item={{defaultValue: vibeBalance, title: 'VIBE', handleInputChange: (e) => console.log(e.target.value)}} />
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
          <InputCard value={verseBalance} item={{defaultValue: 0, title: 'VERSE', handleInputChange: (e) => console.log(e.target.value)}} />
        </Grid>

      </Grid>


      <Grid container spacing={3}  style={{marginBottom: '30px'}}>
        <Grid item xs={12} sm={12} md={9} lg={7} key={1}>
          <h2>Projected Holdings and Income</h2>
          
          <TableContainer
              sx={{
                maxHeight: 1500
              }}
              style={projections == null? {display: 'none'} : {}}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        style={{ backgroundColor: '#95CFD5', color: '#000', minWidth: column.minWidth }}
                      >
                        <Typography variant="h4" fontWeight="900">
                          {column.label}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                    projections == null ?
                    <></> :                    
                    Object.keys(projections).map((row, index) => {
                    return (
                      <TableRow hover key={index}>
                        <TableCell style={typeof projections[row][0] == 'number' ? {} : {color: '#000', backgroundColor: '#B7A8FD'}}>
                          <Stack spacing={2} direction="row" alignItems="center">
                              <Typography variant="h6">{labels[row]}</Typography>
                          </Stack>
                        </TableCell>

                        <TableCell style={typeof projections[row][0] == 'number' ? {} : {color: '#000', backgroundColor: '#B7A8FD'}}>
                          <Stack spacing={2} direction="row" alignItems="center">
                              <Typography variant="h6">{typeof projections[row][0] == 'number' ? projections[row][0].toLocaleString() : projections[row][0]}</Typography>
                          </Stack>
                        </TableCell>

                        <TableCell style={typeof projections[row][0] == 'number' ? {} : {color: '#000', backgroundColor: '#B7A8FD'}}>
                          <Stack spacing={1}>
                              <Typography variant="h6">{typeof projections[row][1] == 'number' ? projections[row][1].toLocaleString() : projections[row][1]}</Typography>
                          </Stack>
                        </TableCell>

                        <TableCell style={typeof projections[row][0] == 'number' ? {} : {color: '#000', backgroundColor: '#B7A8FD'}}>
                          <Stack spacing={2} direction="row" alignItems="center">
                              <Typography variant="h6">{typeof projections[row][2] == 'number' ? projections[row][2].toLocaleString() : projections[row][2]}</Typography>
                          </Stack>
                        </TableCell>

                        <TableCell style={typeof projections[row][0] == 'number' ? {} : {color: '#000', backgroundColor: '#B7A8FD'}}>
                          <Stack spacing={2} direction="row" alignItems="center">
                              <Typography variant="h6">{typeof projections[row][3] == 'number' ? projections[row][3].toLocaleString() : projections[row][3]}</Typography>
                          </Stack>
                        </TableCell>

                        <TableCell style={typeof projections[row][0] == 'number' ? {} : {color: '#000', backgroundColor: '#B7A8FD'}}>
                          <Stack spacing={1}>
                            <Typography variant="h6">{typeof projections[row][4] == 'number' ? projections[row][4].toLocaleString() : projections[row][4]}</Typography>
                          </Stack>
                        </TableCell>

                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
        </Grid>

        <Grid item xs={12} sm={12} md={9} lg={2} key={2}>
          <h2 style={{textAlign: 'center'}}>VTRU Stakes</h2>
          <InputCard value={stake1} item={{defaultValue: stake1, title: '1Y / 15%', handleInputChange: (e) => console.log(e.target.value)}}  key={1}/>
          <InputCard value={stake2} item={{defaultValue: stake2, title: '2Y / 15%', handleInputChange: (e) => console.log(e.target.value)}} key={2} />
          <InputCard value={stake3} item={{defaultValue: stake3, title: '3Y / 23%', handleInputChange: (e) => console.log(e.target.value)}}  key={3}/>
          <InputCard value={stake4} item={{defaultValue: stake4, title: '4Y/ 45%', handleInputChange: (e) => console.log(e.target.value)}}  key={4}/>
          <InputCard value={stake5} item={{defaultValue: stake5, title: '5Y / 60%', handleInputChange: (e) => console.log(e.target.value)}}  key={5}/>
        </Grid>


        <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
          <h2 style={{textAlign: 'center'}}>5Y Growth Projection</h2>
          <GrowthCard item={{defaultValue: 10, unit: '$', title: 'VTRU Price', min: 1, max: 50, step: 1, default: 10, handleSliderChange: (e) => updateGrowth('vtruprice', e)}} key={1}/>
          <GrowthCard item={{defaultValue: 5, unit: '$', title: 'VTRO Price', min: 1, max: 20, step: 1, default: 5, handleSliderChange: (e) => updateGrowth('vtroprice', e)}}   key={2}/>
          <GrowthCard item={{defaultValue: 200, unit: '%', title: 'Arts Revenue', min: 0, max: 1000, step: 10, default: 200, handleSliderChange: (e) => updateGrowth('artsrevenue', e)}}   key={3}/>
          <GrowthCard item={{defaultValue: 200, unit: '%', title: 'Gaming Revenue', min: 0, max: 1000, step: 10, default: 200, handleSliderChange: (e) => updateGrowth('gamingrevenue', e)}}   key={4}/>
          <GrowthCard item={{defaultValue: 200, unit: '%', title: 'Entertainment Revenue', min: 0, max: 1000, step: 10, default: 200, handleSliderChange: (e) => updateGrowth('entertainmentrevenue', e)}}   key={5}/>
        </Grid>
      </Grid>



    </PageContainer>
  ); 
};

CalculatorApp.layout = "Blank";
