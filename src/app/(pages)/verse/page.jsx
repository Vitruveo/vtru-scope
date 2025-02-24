"use client"
import React, { useEffect, useState, useRef } from "react";
import Breadcrumb from '@/app/(pages)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/(pages)/components/container/PageContainer';
import CustomSelect from '@/app/(pages)/components/forms/theme-elements/CustomSelect';
import SuccessRate from '../components/calculator/SuccessRate';
import InputCard from '../components/calculator/InputCard2';
import InfoCard from '../components/calculator/InfoCard';

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

import Calculator from './Verse';

import { readContract, writeContract } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";

import { ethers } from "ethers";
import { useAccount, useBalance } from "wagmi";

export default function CalculatorApp () {

  let processing = false;

  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);

  const [vtruBalance, setVtruBalance] = useState(null);
  const [vtroBalance, setVtroBalance] = useState(null);
  const [vibeBalance, setVibeBalance] = useState(null);
  const [verseBalance, setVerseBalance] = useState(null);
  const [stake1, setStake1] = useState(0);
  const [stake2, setStake2] = useState(0);
  const [stake3, setStake3] = useState(0);
  const [stake4, setStake4] = useState(0);
  const [stake5, setStake5] = useState(0);

  const [defaultValues, setDefaultValues] = useState({
    vtru: null,
    vtro: null,
    vibe: null,
    verse: null,
    vtruStaked: [null, null, null, null, null]
  });

  const [projections, setProjections] = useState(null);
  const [income, setIncome] = useState([0,0,0,0,0]);

  const calculator = new Calculator();


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
  beginningUnits: 2_000_000,
  unitPrices: [0.5, 4, 8, 12, 20],
  vtruStaked: 10_000,
  vtroSwapped: 0,
  initialProjects: 15, 
  initialProjectFunding: 600_000,
  newCommunityUnits: 11_123_000,
  operationsMultiplier: 150_000,
  projectSuccessRate: {
    fail: 25,
    breakeven: 28,
    moderate: 44,
    blockbuster: 3
  },
  verseRevenueShare: 5000,
  verseRevenueShareAnnualIncrease: 500,
  vibeRevenueShare: 1000,
  moderateRevenueMultiplier: 4,
  blockbusterRevenueMultiplier: 50,
  newProjectsUnitsMultiplier: 100_000,
});

const updateSuccessRate = (key, value) => {
  const model = { ...assumptionsModel };

  // Get the old value of the key being changed
  const oldValue = model.projectSuccessRate[key];

  // Calculate the difference
  const difference = value - oldValue;

  if (difference > 0) {
    // Slider is being increased: subtract from 'fail'
    if (model.projectSuccessRate.fail - difference < 0) {
      // Disallow change if 'fail' cannot decrease further
      //alert("Cannot increase this value further as 'Fail' cannot be reduced.");
      return;
    }
    model.projectSuccessRate.fail -= difference;
  } else if (difference < 0) {
    // Slider is being decreased: add to 'fail'
    if (model.projectSuccessRate.fail - difference > 100) {
      // Disallow change if 'fail' cannot increase further
     // alert("Cannot decrease this value further as 'Fail' cannot be increased.");
      return;
    }
    model.projectSuccessRate.fail -= difference; // Add the absolute difference
  }

  // Update the selected slider value
  model.projectSuccessRate[key] = value;

  // Ensure the total remains exactly 100
  const total = Object.values(model.projectSuccessRate).reduce((sum, v) => sum + v, 0);
  if (total !== 100) {
    // Adjust 'fail' to fix any rounding errors
    model.projectSuccessRate.fail += 100 - total;
  }

  // Update the assumptions model state
  setAssumptionsModel(model);
};

useEffect(() => {

  async function setup() {

  }

  if (account !== null && provider !== null) {
    setup();
  }

}, [provider, account]);



  const columns = [
    { id: 'label', label: 'Item', minWidth: 35 },
    { id: '2025', label: '2025',  minWidth: 35 },
    { id: '2026', label: '2026',  minWidth: 35 },
    { id: '2027', label: '2027',  minWidth: 35 },
    { id: '2028', label: '2028',  minWidth: 35 },
    { id: '2029', label: '2029',  minWidth: 35 },
  ];

  const labels = {
    verseUnitsTitle: 'VERSE UNITS',
    marketCapTitle: 'FUNDING',
    projectFundingTitle: 'MOVIE PROJECTS CAPITAL',
    projectSuccessRateTitle: 'PROJECT SUCCESS RATE',
    revenueTitle: 'REVENUES',
    expensesTitle: 'EXPENSES',
    incomeTitle: 'INCOME',
    revenueShareTitle: 'REVENUE SHARE',
    cashFlowTitle: 'CASH FLOW',
    beginningUnits: 'Beginning Units',
    //unitPrice: 'VERSE Unit Price',
    publicSaleUnits: '+ Public Sale Units',
    publicFunding: 'Funding',
    newCommunityUnits: '+ Community Units',
    newProjectUnits: '+ Project Units',
    endingUnits: 'Ending Units',
    //marketCap: 'Market Cap',
    projects: 'Projects',
    averageFunding: 'Average Capital',
    failProjects: 'Fail Projects',
    breakevenProjects: 'Break-even Projects',
    moderateProjects: 'Moderate Projects',
    blockbusterProjects: 'Blockbuster Projects',
    moderateRevenue: 'Moderate Revenue',
    blockbusterRevenue: 'Blockbuster Revenue',
    totalRevenue: 'Total Revenue',
    projectFunding: 'Projects Capital',
    operations: 'Operations',
    totalExpenses: 'Total Expenses',
    totalProfit: 'Total Income',
    verseRevenueShare: 'VERSE Revenue Share',
    vibeRevenueShare: 'VIBE Revenue Share',
    revenueSharePerVerseUnit: 'Income/Unit',
    cashFlowBeginning: 'Beginning Funds',
    cashFlowEnding: 'Ending Funds',

  }

  const updatePage = () => {

    let { annual, detail } = calculator.calculateProjections(2025, assumptionsModel);
    setProjections(detail);
    if (annual) {
      setIncome(annual);
    }
}
  
const updateWhatIf = (key, value) => {
  const model = { ...assumptionsModel };
  switch(key) {
    case 'vtruStaked': model.vtruStaked = value; break;
    case 'vtroSwapped': model.vtroSwapped = value; break;
    case 'initialProjects': model.initialProjects = value; break;
    case 'initialProjectFunding': model.initialProjectFunding = value; break;
    case 'newCommunityUnits': model.newCommunityUnits = value; break;
  }  
  setAssumptionsModel(model);
}

useEffect(() => {

  updatePage();
                  
}, [assumptionsModel]);

useEffect(() => {

  updatePage();
                                          
}, [vtruBalance, vtroBalance, vibeBalance, verseBalance, stake1, stake2, stake3, stake4, stake5]);


const formatNumber = (key, amount) => {
  if (key.indexOf('Title') > 0) return '';
  if (amount == 0) return '';
  if (key == 'revenueSharePerVerseUnit' || key.indexOf('total') == 0 || key.indexOf('cash') == 0 || key.indexOf('Cap') > -1 || key.indexOf('Funding') > -1 || key.indexOf('Price') > -1 || key.indexOf('operations') > -1 || key.indexOf('Revenue') > -1) {
    return (amount ? Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: key.indexOf('Price') > 0 || key == 'revenueSharePerVerseUnit' ? 2 : 0,
      maximumFractionDigits: key.indexOf('Price') > 0 || key == 'revenueSharePerVerseUnit' ? 2 : 0,
    }).format(amount) :
    '');
  } else {
    return (typeof amount == 'number' ? amount.toLocaleString() : '');

  }
}

const cellStyle = (key) => {
  let color = '#ffffff';
  let backgroundColor = '';
  if (key == 'revenueSharePerVerseUnit') {
    backgroundColor = '#00aa00';
  } else if (key.indexOf('total') == 0)  {
    color = '#000000';
    backgroundColor = '#9286CA';
  }else {
    if (typeof projections[key][0] !== 'number') {
      color = '#000000';
      backgroundColor = '#B7A8FD'
    }
  }
  return {color, backgroundColor, borderTop: key.indexOf('Title') > 0 ? '30px solid #171c23' : ''}
}

const typeStyle = (key, col) => {
  return {
    fontSize: typeof projections[key][0] !== 'number' || key == 'revenueSharePerVerseUnit' ? (key == 'revenueSharePerVerseUnit' ? '22px' : '18px') : '14px',
    fontWeight: key.indexOf('total') == 0 ? 'bold' : '', 
    width: '100%', 
    textAlign: col > -1 ? 'right' : ''}
}

  
  const breadcrumb = [
    {
      to: '/',
      title: 'Home',
    },
    {
      title: "VERSE Projector"
    },
  ];

  return (
<PageContainer title="VTRU Scope" description="VERSE Projector">
      <Breadcrumb title="VERSE Projector" items={breadcrumb} />
  

      <Grid container spacing={3}  style={{marginBottom: '30px'}} key={1}>
          <h2 style={{paddingLeft: '20px'}}>Projector Inputs</h2>
          <div style={{display: 'flex', justifyContent: 'space-between', paddingLeft: '20px', width: '100%'}}>
            <InputCard value={assumptionsModel.vtruStaked ?? ''} item={{defaultValue: assumptionsModel.vtruStaked, title: 'VERSE Units', handleInputChange: updateWhatIf, key: 'vtruStaked'}} key={1}/>
            {/* <InputCard value={assumptionsModel.vtroSwapped ?? ''} item={{defaultValue: assumptionsModel.vtroSwapped, title: '10 Staked VTRO \n= 1 VERSE Unit', handleInputChange: updateWhatIf, key: 'vtroSwapped'}} key={2} /> */}
            <InputCard value={assumptionsModel.initialProjects ?? ''} item={{defaultValue: assumptionsModel.initialProjects, title: 'Initial Projects', handleInputChange: updateWhatIf, key: 'initialProjects'}} key={3} />
            <InputCard value={assumptionsModel.initialProjectFunding ?? ''} item={{defaultValue: assumptionsModel.initialProjectFunding, title: 'Initial Project Funding', handleInputChange:  updateWhatIf, key: 'initialProjectFunding'}} key={4} />
            <InputCard value={assumptionsModel.newCommunityUnits ?? ''} item={{defaultValue: assumptionsModel.newCommunityUnits, title: 'Community VERSE Units', handleInputChange: updateWhatIf, key: 'newCommunityUnits'}} key={5} />
          </div>
          {/* <h2 style={{marginLeft: '20px', marginTop: '10px', fontSize: '14px'}}>Note: Stake term for VTRU and VTRO is 3 years, 0% APR. During the Stake term rebases can be claimed for the staked VTRU.</h2> */}
      </Grid>

      <Grid container spacing={3}  style={{marginBottom: '30px'}} key={2}>
          <h2 style={{paddingLeft: '20px', width: '100%'}}>Projected VERSE Income</h2>
          <div style={{display: 'flex', justifyContent: 'space-between', paddingLeft: '20px', width: '100%'}}>
            <InfoCard value={income[0] ?? ''} title={columns[1].label} key={1}/>
            <InfoCard value={income[1] ?? ''} title={columns[2].label} key={2} />
            <InfoCard value={income[2] ?? ''} title={columns[3].label} key={3} />
            <InfoCard value={income[3] ?? ''} title={columns[4].label} key={4} />
            <InfoCard value={income[4] ?? ''} title={columns[5].label} key={5} />
          </div>
        </Grid>


      <Grid container spacing={3}  style={{marginBottom: '30px'}} key={3}>
        <Grid item xs={12} sm={12} md={9} lg={9} key={1}>
          <h2>Income Worksheet</h2>
          
          <TableContainer
              sx={{
                maxHeight: 2500
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
                        <Typography variant="h4" fontWeight="900" style={{width: '100%', textAlign: 'right'}}>
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
                        <TableCell colSpan={row.indexOf('Title') < 0 ? 1: 6} style={cellStyle(row)}>
                              <Typography variant="h6" style={typeStyle(row, -1)}>{labels[row]}</Typography>
                        </TableCell>

                       {
                        row.indexOf('Title') < 0 ?
                        <>
                          <TableCell style={cellStyle(row)}>
                                <Typography variant="h6" style={typeStyle(row, 0)}>{formatNumber(row, projections[row][0])}</Typography>
                          </TableCell>

                          <TableCell style={cellStyle(row)}>
                                <Typography variant="h6" style={typeStyle(row, 1)}>{formatNumber(row, projections[row][1])}</Typography>
                          </TableCell>

                          <TableCell style={cellStyle(row)}>
                                <Typography variant="h6" style={typeStyle(row, 2)}>{formatNumber(row, projections[row][2])}</Typography>
                          </TableCell>

                          <TableCell style={cellStyle(row)}>
                                <Typography variant="h6" style={typeStyle(row, 3)}>{formatNumber(row, projections[row][3])}</Typography>
                          </TableCell>

                          <TableCell style={cellStyle(row)}>
                              <Typography variant="h6" style={typeStyle(row, 4)}>{formatNumber(row, projections[row][4])}</Typography>
                          </TableCell>
                        </>
                        :
                        <></>
                      }

                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
        </Grid>


        <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
          <h2 style={{textAlign: 'center'}}>Project Success Allocator</h2>
          <SuccessRate item={{value: assumptionsModel.projectSuccessRate.fail, unit: '%', title: 'Fail', min: 0, max: 100, step: 1, handleSliderChange: (e) => updateSuccessRate('fail', e)}}   key={1}/>
          <SuccessRate item={{value: assumptionsModel.projectSuccessRate.breakeven, unit: '%', title: 'Break-even', min: 0, max: 100, step: 1, handleSliderChange: (e) => updateSuccessRate('breakeven', e)}}   key={2}/>
          <SuccessRate item={{value: assumptionsModel.projectSuccessRate.moderate, unit: '%', title: 'Moderate', min: 0, max: 100, step: 1, handleSliderChange: (e) => updateSuccessRate('moderate', e)}}   key={3}/>
          <SuccessRate item={{value: assumptionsModel.projectSuccessRate.blockbuster, unit: '%', title: 'Blockbuster', min: 0, max: 100, step: 1, handleSliderChange: (e) => updateSuccessRate('blockbuster', e)}}   key={4}/>
        </Grid>
      </Grid>

    </PageContainer>
  ); 
};

CalculatorApp.layout = "Blank";
