import * as React from 'react'; 
import Link  from 'next/link';
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


const CoreNFTCard = ({ nft }) => {
  const COMMON_TAB = [
    { value: 0, label: 'Summary', disabled: false },
    { value: 1, label: 'Grant', disabled: false },
    { value: 2, label: 'Vesting', disabled: false },
    { value: 3, label: 'Rebases', disabled: false },
    { value: 4, label: 'Other', disabled: false }
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

  const formatBlock = (n) => {
    return Number(n).toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    });
  }

  const unlocked = Number(nft.grantAmount) * (nft.unlockBasisPoints/10000);
  const monthly = formatBigNum((Number(nft.grantAmount) - unlocked)/nft.vestingMonths);


  const topcards = [];
  topcards[0] = [
    {
      title: "Granted",
      digits: formatBigNum(nft.grantAmount),
      bgcolor: "primary",
    },
    {
      title: "Claimable",
      digits: "0",
      bgcolor: "primary",
    },
    {
      title: "Claim",
      digits: "0",
      bgcolor: "white",
    },
  ];

  topcards[1] = [
    {
      title: "Unlocked",
      digits: formatBigNum(unlocked),
      bgcolor: "primary",
    },
    {
      title: "Claimed",
      digits: formatBigNum(nft.claimedGrantAmount),
      bgcolor: "primary",
    },
    {
      title: "Grant Block",
      digits: formatBlock(nft.grantBlock),
      bgcolor: "primary",
    },
  ];
  topcards[2] = [
    {
      title: "Locked",
      digits: nft.lockMonths + ' mths',
      bgcolor: "primary",
    },
    {
      title: "Vesting",
      digits: nft.vestingMonths + ' mths',
      bgcolor: "primary",
    },
    {
      title: "Vesting/Month",
      digits: monthly,
      bgcolor: "primary",
    }
  ];
  topcards[3] = [
    {
      title: "Rebased",
      digits: "0",
      bgcolor: "primary",
    },
    {
      title: "Claimable",
      digits: "0",
      bgcolor: "primary",
    },
    {
      title: "Claim",
      digits: "0",
      bgcolor: "white",
    },
  ];
  topcards[4] = [
    {
      title: "Share Quota",
      digits: formatBlock(nft.voteCredits * 50),
      bgcolor: "primary",
    },
    {
      title: "Vote Credits",
      digits: nft.voteCredits,
      bgcolor: "primary",
    },
  ];

  
 // console.log(nft)
  
  return (
        <Grid item xs={12} sm={12} md={6} lg={6} key={nft.id}>
          <BlankCard className="hoverCard">
            <>
              <img src={'/images/placeholder.png'} alt="img" style={{width: '100%' }} onLoad={(e) => {e.target.src=`${nft.class.image}`;}} />
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
                                <CardContent>
                                  { 
                                    ((panel.value == 0 || panel.value == 3) && i == 2) ?
                                      <Button color="primary" size="large" disabled fullWidth>
                                        CLAIM
                                      </Button>
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
