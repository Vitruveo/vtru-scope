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


const VerseNFTCard = ({ nft, handleClaim, getBlockNumber }) => {

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


  const formatStandard = (n) => {
    return Number(n).toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    });
  }


  let tabs = [
    { label: 'VERSE Information', disabled: false },
   // { label: 'Claim', disabled: false },
  ];

  let tabPanels = [];
  tabPanels[0] = [
    {
      title: "Units",
      content: formatStandard(nft.units),
      bgcolor: "primary",
    },
  ];


  const loadedImages = [];
  async function fetchImage(tokenId, imgUrl) {
    if (imgUrl.indexOf('nftstorage.link') > -1) {
      const frags = imgUrl.split('/');
      imgUrl = `https://scope.vitruveo.xyz/images/core/${frags[frags.length-1]}`;
    }
    if (loadedImages.indexOf(tokenId) > -1) return;
    const img = document.getElementById(`img-${tokenId}`);
    delete img.onLoad;
    img.src = imgUrl;
    loadedImages.push(tokenId);
  }


  function renderTabContent(nft, panel) {

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
                  panel.content   
            }                               
          </Typography>          
        </>
      );
    
  }

  return (
        <Grid item xs={12} sm={12} md={6} lg={6} key={nft.id} style={{margin: '0 auto'}}>
          <BlankCard className="hoverCard">
            <>

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
              <img src={'https://vitruveo-projects.s3.amazonaws.com/VERSE/eternal.gif'} alt={`Token ID=${nft.id}`} style={{width: '100%' }} id={`img-${nft.id}`}  />

            </>
          </BlankCard>
        </Grid>
      )
  }

export default VerseNFTCard;
