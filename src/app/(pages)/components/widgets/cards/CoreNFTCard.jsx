import React, { useEffect, useState, useRef } from "react";
import Link  from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CardContent,
  Grid,
  Divider,
  CardMedia,
  Stack,
  Tooltip,
  Chip,
  Box,
  Button,
  Typography,
} from '@mui/material';
import BlankCard from '../../shared/BlankCard';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';

import Image from "next/image";


const CoreNFTCard = ({ nft, handleClaim, getBlockNumber }) => {
  const router = useRouter();
  const [buttonMessage, setButtonMessage] = useState('CLAIM');
  const [buttonEnabled, setButtonEnabled] = useState(nft.grantClaimableAmount + nft.rebaseClaimableAmount > 0);

  const [value, setValue] = React.useState('1');

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const digits = (n) => {
    if (n < 0) {
      return 6;
    } else if (n < 100000) {
      return 2;
    } else {
      return 0;
    }
  }
  const formatBigNum = (n) => {
    const converted = Number(n) / Math.pow(10, 18); 
    const decimals = digits(converted);
    return converted.toLocaleString(undefined, { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  }

  const formatQuota = (n) => {
    const converted = Number(n) / Math.pow(10, 18); 
    return converted.toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    });
  }

  const formatStandard = (n) => {
    return Number(n).toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    });
  }

  const unlocked = Number(nft.grantAmount) * (nft.unlockBasisPoints/10000);
  const annualAmount = ((Number(nft.grantAmount) - unlocked)); 
  const monthlyPercentage = nft.vestingMonths == 0 ? 0 : 1/nft.vestingMonths + nft.boostBasisPoints/10000; 
  const monthly = ((annualAmount * monthlyPercentage)/Math.pow(10,18)).toFixed(2);

  // const byMonth = [];
  // let runningTotal = 0;
  // let stop = false;
  // for(let i=0;i<nft.vestingMonths;i++) {
  //     let currVal = (annualAmount * monthlyPercentage)/Math.pow(10,18);
  //     if (runningTotal + currVal > annualAmount) {
  //       currVal = AnnualAmount - runningTotal;
  //       stop = true;
  //     }
  //     byMonth.push(currVal);
  //     if (stop) break;
  // }

  let tabs = [
    { label: 'Summary', disabled: false },
    { label: 'Grant', disabled: false },
    { label: 'Blocks', disabled: false },
    { label: 'Claim', disabled: false },
  ];

  let tabPanels = [];
  tabPanels[0] = [
    {
      title: "Granted",
      content: formatBigNum(nft.grantAmount),
      bgcolor: "primary",
    },
    {
      title: "Grant Avail.",
      content: formatBigNum(nft.grantClaimableAmount),
      bgcolor: "primary",
    },
    {
      title: "Rebase Avail.",
      content: formatBigNum(nft.rebaseClaimableAmount),
      bgcolor: "primary",
    },
  ];
  tabPanels[1] = [
    {
      title: "Lock/Vest Mths",
      content: `${nft.lockMonths}/${nft.vestingMonths}` ,
      bgcolor: "primary",
    },
    {
      title: "Elapsed Mths",
      content: `${nft.elapsedMonths}`,
      bgcolor: "primary",
    },
    {
      title: "Vesting/Month",
      content: monthly,
      bgcolor: "primary",
    },
  ];

  tabPanels[2] = [
    {
      title: "Grant Block",
      content: formatStandard(nft.grantBlock),
      bgcolor: "primary",
    },
    {
      title: "Current Block",
      content: 'CLAIM_BLOCK', // 17280 blocks per day * 30 days
      bgcolor: "primary",
    },
    {
      title: "Next Claim",
      content: nft.elapsedMonths > nft.vestingMonths || nft.vestingMonths == 0 ? 'N/A' : formatStandard(Number(nft.grantBlock) + ((Number(nft.elapsedMonths) + 1) * 518400)),
      bgcolor: "primary",
    }
  ];

  tabPanels[3] = [
    {
      title: "Claimed",
      content: formatBigNum(nft.claimedGrantAmount + nft.claimedRebaseAmount),
      bgcolor: "primary",
    },
    {
      title: "Claimable",
      content: formatBigNum(nft.grantClaimableAmount + nft.rebaseClaimableAmount),
      bgcolor: "primary",
    },
    {
      title: "CLAIM_BUTTON",
      content: "0",
      bgcolor: "white",
    },
  ];

  if ( nft.classId == 1 || nft.classId == 2) {
    tabs.push({ label: 'Boost', disabled: false });
    tabPanels[4] = [
      {
        title: "Boosts",
        content: formatStandard(nft.boosts),
        bgcolor: "primary",
      },
      {
        title: "Acceleration %",
        content: (nft.boostBasisPoints/100).toFixed(2),
        bgcolor: "primary",
      },
      {
        title: "BOOST_BUTTON",
        content: "0",
        bgColor: "white",
      }
    ];
  }

  if (nft.classId == 3) {
    tabs.push({ label: 'KYC', disabled: false });
    tabPanels[4] = [
      {
        title: "Status",
        content: nft.isKyc ? '✅' : '❌',
        bgcolor: "primary",
      },
      {
        title: "KYC_BUTTON",
        content: "0",
        bgColor: "white",
      }
    ];
  }
  const loadedImages = [];
  async function fetchImage(tokenId, imgUrl) {
    if (loadedImages.indexOf(tokenId) > -1) return;
    const img = document.getElementById(`img-${tokenId}`);
    delete img.onLoad;
    img.src = imgUrl;
    loadedImages.push(tokenId);
  }

  function buttonState(enabled) {
    setButtonEnabled(enabled);
    setButtonMessage('Wait...');
  }

  function renderTabContent(nft, panel) {
    switch(panel.title) {
      case 'CLAIM_BUTTON':
        return  (
          <Button color="primary" size="large" disabled={ !buttonEnabled } fullWidth onClick={ () => { buttonState(false); handleClaim(nft.id); } }>
            { buttonMessage }
          </Button>
        );
      case 'BOOST_BUTTON':
        return (
          <Button color="primary" size="large" fullWidth onClick={() => router.push(`/boosters?boost=${nft.id}`)}>
            BOOST
          </Button>
        );
      case 'KYC_BUTTON':
        if (!nft.isKyc) {
          return (
            <Button color="primary" size="large" fullWidth disabled>
              REQUEST KYC
            </Button>
          );  
        } else {
          return <></>
        }
      default:
        return (
        <>
          <Typography
            color={panel.bgcolor + ".main"} 
            variant="subtitle1"
            fontWeight={600}
          >
            {panel.title}
          </Typography>
          <Typography
            color={"grey.900"}
            variant="h5"
            fontWeight={600}
          >
            { 
                panel.content == 'CLAIM_BLOCK' ?
                  formatStandard(getBlockNumber())
                  :
                  panel.content   
            }                               
          </Typography>
        </>
      );
    }
  }

  return (
        <Grid item xs={12} sm={12} md={6} lg={6} key={nft.id}>
          <BlankCard className="hoverCard">
            <>

              <img src={'/images/placeholder.png'} alt={`Token ID=${nft.id}`} style={{width: '100%' }} id={`img-${nft.id}`} onLoad={(e) => {fetchImage(`${nft.id}`, `${nft.class.image}`);}}  onError={(e) => {e.target.src=`/images/placeholder.png`;}} />
              <CardContent>
                <TabContext value={value}>
                  <Box>

                      <TabList onChange={handleChange}>
                        {tabs.map((tab, tabIndex) => (
                          <Tab key={tabIndex} label={tab.label} value={String(tabIndex + 1)} />
                        ))}
                      </TabList>
                    </Box>
                    <Divider />
                    <Box>
                      {tabs.map((tab, tabIndex) => (
                        <TabPanel key={tabIndex} value={String(tabIndex + 1)} sx={{ m:0, mt:3, p:0}}>
                          <Grid container spacing={1}>
                            {tabPanels[tabIndex].map((panel, panelIndex) => (
                            <Grid item xs={12} sm={12} md={4} lg={4} key={panelIndex}>
                              <Box bgcolor={panel.bgcolor + ".light"} textAlign="center">
                                <CardContent px={1}>
                                  { renderTabContent(nft, panel) }     
                                </CardContent>
                              </Box>
                            </Grid>
                            ))}
                          </Grid>
                         
                        </TabPanel>
                      ))}
                  </Box>
                </TabContext>
              </CardContent>
            </>
          </BlankCard>
        </Grid>
      )
  }

export default CoreNFTCard;
