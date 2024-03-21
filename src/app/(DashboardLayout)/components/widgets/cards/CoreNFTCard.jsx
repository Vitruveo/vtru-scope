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


const CoreNFTCard = ({ nft, handleClaim }) => {
  const router = useRouter();
  const [buttonMessage, setButtonMessage] = useState('CLAIM');
  const [buttonEnabled, setButtonEnabled] = useState(nft.grantClaimableAmount + nft.rebaseClaimableAmount > 0);

  const COMMON_TAB = [
    { value: 0, label: 'Summary', disabled: false },
    { value: 1, label: 'Grant', disabled: false },
    { value: 2, label: 'Info', disabled: false },
    { value: 3, label: 'Claim', disabled: false },
  ];
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
  const monthly = (Number(formatBigNum(((Number(nft.grantAmount) - unlocked)/nft.vestingMonths))) + nft.boostBasisPoints/100).toFixed(2);


  const topcards = [];
  topcards[0] = [
    {
      title: "Granted",
      digits: formatBigNum(nft.grantAmount),
      bgcolor: "primary",
    },
    {
      title: "Grant Avail.",
      digits: formatBigNum(nft.grantClaimableAmount),
      bgcolor: "primary",
    },
    {
      title: "Rebase Avail.",
      digits: formatBigNum(nft.rebaseClaimableAmount),
      bgcolor: "primary",
    },
  ];
  topcards[1] = [
    {
      title: "Lock Months",
      digits: nft.lockMonths ,
      bgcolor: "primary",
    },
    {
      title: "Vesting Months",
      digits: nft.vestingMonths,
      bgcolor: "primary",
    },
    {
      title: "Vesting/Month",
      digits: monthly,
      bgcolor: "primary",
    }
  ];

  topcards[2] = [
    {
      title: "Grant Block",
      digits: formatStandard(nft.grantBlock),
      bgcolor: "primary",
    },
    {
      title: "Elapsed Months",
      digits: formatStandard(nft.elapsedMonths),
      bgcolor: "primary",
    },
    {
      title: "Vote Credits",
      digits: nft.voteCredits,
      bgcolor: "primary",
    }
  ];

  topcards[3] = [
    {
      title: "Claimed",
      digits: formatBigNum(nft.claimedGrantAmount + nft.claimedRebaseAmount),
      bgcolor: "primary",
    },
    {
      title: "Claimable",
      digits: formatBigNum(nft.grantClaimableAmount + nft.rebaseClaimableAmount),
      bgcolor: "primary",
    },
    {
      title: "Claim",
      digits: "0",
      bgcolor: "white",
    },
  ];

  if ( nft.classId == 1 ) {
    COMMON_TAB.push({ value: 4, label: 'Boost', disabled: false });
    topcards[4] = [
      {
        title: "Boosts",
        digits: formatStandard(nft.boosts),
        bgcolor: "primary",
      },
      {
        title: "Acceleration %",
        digits: (nft.boostBasisPoints/100).toFixed(2),
        bgcolor: "primary",
      },
      {
        title: "Boost",
        digits: "0",
        bgColor: "white",
      }
    ];
  }

  async function fetchImage(tokenId, imgUrl) {
    const img = document.getElementById(`img-${tokenId}`);
    delete img.onLoad;
    img.src = imgUrl;
  }

  function buttonState(enabled) {
    setButtonEnabled(enabled);
    setButtonMessage('Wait...');
  }

  return (
        <Grid item xs={12} sm={12} md={6} lg={6} key={nft.id}>
          <BlankCard className="hoverCard">
            <>
              <img src={'/images/placeholder.png'} alt="img" style={{width: '100%' }} id={`img-${nft.id}`} onLoad={(e) => {fetchImage(`${nft.id}`, `${nft.class.image}`);}}  onError={(e) => {e.target.src=`/images/placeholder.png`;}} />
              <CardContent>
                {/*
                  <Chip label={nft.class.name} size="small"></Chip>
                */}
                <TabContext value={value}>
                  <Box>
                      <TabList onChange={handleChange}>
                        {COMMON_TAB.map((tab, index) => (
                          <Tab key={tab.value} label={tab.label} value={String(index + 1)} />
                        ))}
                      </TabList>
                    </Box>
                    <Divider />
                    <Box>
                      {COMMON_TAB.map((panel, index) => (
                        <TabPanel key={panel.value} value={String(index + 1)} sx={{ m:0, mt:3, p:0}}>
                          <Grid container spacing={1}>
                            {topcards[panel.value].map((topcard, i) => (
                            <Grid item xs={12} sm={12} md={4} lg={4} key={i}>
                              <Box bgcolor={topcard.bgcolor + ".light"} textAlign="center">
                                <CardContent px={1}>
                                  { 
                                    ((panel.value == 3 || panel.value == 4) && i == 2) ?
                                        (
                                          panel.value == 4 ?
                                          (
                                             nft.classId == 1 ?
                                              <Button color="primary" size="large" fullWidth onClick={() => router.push(`/boosters?boost=${nft.id}`)}>
                                                BOOST
                                              </Button>
                                              :
                                              <></>
                                          )
                                            :
                                              <Button color="primary" size="large" disabled={ !buttonEnabled } fullWidth onClick={ () => { buttonState(false); handleClaim(nft.id); } }>
                                                { buttonMessage }
                                              </Button>
                                        )
                                      :
                                      <>
                                          <Typography
                                          color={topcard.bgcolor + ".main"} 
                                          variant="subtitle1"
                                          fontWeight={600}
                                          >
                                            {topcard.title}
                                          </Typography>
                                          <Typography
                                          color={"grey.900"}
                                          variant="h5"
                                          fontWeight={600}
                                          >
                                            {topcard.digits}
                                    
                                          </Typography>
                                      </>
                                  }           
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
