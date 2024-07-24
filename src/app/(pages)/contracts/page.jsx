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

export default function Contracts () {


  const breadcrumb = [
    {
      to: '/',
      title: 'Home',
    },
    {
      title: 'Contracts',
    },
  ];

  const mainNumberStyle = {color: '#763EBD', fontFamily: 'Courier', fontSize: '30px', lineHeight: '34px'};
  const mainHeadingStyle = {width: '110px', display: 'inline-block', fontSize: '20px', lineHeight: '24px'};
  const linkStyle = {fontFamily: 'Courier', color: 'black', fontSize: '18px'};
  const titleStyle = {fontSize: '30px', color: 'white'};

  return (
    <PageContainer title="VTRU Scope" description="Ecosystem smart contracts">
      <Breadcrumb title="Vitruveo Ecosystem Smart Contracts" items={breadcrumb} />

          <Grid container spacing={3} style={{marginBottom: '30px'}}>

                <Grid item xs={12} sm={12} md={6} lg={6} key={1}>
                  <Box bgcolor={"grey.100"} textAlign="center">
                    <CardContent px={1}>                  
                            <Typography
                              color={"info.main"}
                              variant="subtitle1"
                              fontWeight={600}
                              style={titleStyle}
                            >
                              Wrapped VTRU
                            </Typography>
                            <Typography
                              color={"info.main"}
                              fontWeight={600}
                            >
                              <p>Offical wrapped VTRU token for all exchanges</p>
                              <a style={linkStyle} href="https://explorer.vitruveo.xyz/address/0x3ccc3F22462cAe34766820894D04a40381201ef9" target="_new">0x3ccc3F22462cAe34766820894D04a40381201ef9</a>                            
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>


                <Grid item xs={12} sm={12} md={6} lg={6} key={2}>
                <Box bgcolor={"grey.100"} textAlign="center">
                    <CardContent px={1}>                  
                            <Typography
                              color={"info.main"}
                              variant="subtitle1"
                              fontWeight={600}
                              style={titleStyle}
                            >
                              VTRO
                            </Typography>
                            <Typography
                              color={"info.main"}
                              fontWeight={600}
                            >
                              <p>Vitruveo DEX token</p>
                              <a style={linkStyle} href="https://explorer.vitruveo.xyz/address/0xDECAF2f187Cb837a42D26FA364349Abc3e80Aa5D" target="_new">0xDECAF2f187Cb837a42D26FA364349Abc3e80Aa5D</a>                            
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>
                

            </Grid>

          <Grid container spacing={3} style={{marginBottom: '30px'}}>

          <Grid item xs={12} sm={12} md={6} lg={6} key={2}>
                <Box bgcolor={"grey.100"} textAlign="center">
                    <CardContent px={1}>                  
                            <Typography
                              color={"info.main"}
                              variant="subtitle1"
                              fontWeight={600}
                              style={titleStyle}
                            >
                              VIBE
                            </Typography>
                            <Typography
                              color={"info.main"}
                              fontWeight={600}
                            >
                              <p>Vitruveo Income Building Engine token</p>
                              <a style={linkStyle} href="https://explorer.vitruveo.xyz/address/0x8e7C7f0DF435Be6773641f8cf62C590d7Dde5a8a" target="_new">0x8e7C7f0DF435Be6773641f8cf62C590d7Dde5a8a</a>                            
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={6} lg={6} key={1}>
                  <Box bgcolor={"grey.100"} textAlign="center">
                    <CardContent px={1}>                  
                            <Typography
                              color={"info.main"}
                              variant="subtitle1"
                              fontWeight={600}
                              style={titleStyle}
                            >
                              Vortex
                            </Typography>
                            <Typography
                              color={"info.main"}
                              fontWeight={600}
                            >
                              <p>Vortex World gaming token</p>
                              <a style={linkStyle} href="https://explorer.vitruveo.xyz/address/0xABA06E4A2Eb17C686Fc67C81d26701D9b82e3a41" target="_new">0xABA06E4A2Eb17C686Fc67C81d26701D9b82e3a41</a>                            
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid>


            </Grid>

    </PageContainer>
  ); 
};

Contracts.layout = "Blank";
