"use client"

import React from 'react';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import { Box } from '@mui/material';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import FormLabel from '@mui/material/FormLabel';
import Typography from '@mui/material/Typography';
import ChildCard from '@/app/(DashboardLayout)/components/shared/ChildCard';


export default function CoreNft () {
  
  const breadcrumb = [
    {
      to: '/',
      title: 'Home',
    },
    {
      title: 'About',
    },
  ];


  const releaseNotes = [
    {
      version: "v0.5 Beta (March 3, 2024)",
      notes: 
`
These are the release notes:

`
    }
  ]
  return (
    <PageContainer title="About" description="Release information about VTRU Scope">
      <Breadcrumb title="About" items={breadcrumb} />
      <Box sx={{ height: { lg: 'calc(100vh - 250px)', sm: '100vh' }, maxHeight: '700px' }}>
        <Typography  variant="subtitle2">
          VTRU Scope is the focal point for all your Vitruveo assets. In a single app you can view and manage coins and tokens. The initial release of the 
          app has functionality for Core NFTs. Future releases will have additional functionality including analytics and calculators.
        </Typography>

          <Box p={3}>
            <FormLabel htmlFor="outlined-multiline-static">
              <Typography variant="h5" mb={2} fontWeight={600} color="text.primary">
                Release Notes
              </Typography>
            </FormLabel>
            <ChildCard>
                  <Typography variant="h6">v0.51 beta</Typography>

                  <Typography variant="body1" color="textSecondary">
                    <ul>
                      <li>Fixes for NFT image rendering</li>
                      <li>Fix for transferred NFTs</li>
                      <li>Display Boosters in account</li>
                    </ul>
                  </Typography>
            </ChildCard>
            <ChildCard>
                  <Typography variant="h6">v0.5 beta</Typography>

                  <Typography variant="body1" color="textSecondary">
                    <ul>
                      <li>View Core NFT and its data</li>
                      <li>Claim functionality is not fully functional in this release</li>
                      <li>Switching accounts is not supported; you must disconnect/reconnect</li>
                    </ul>
                  </Typography>
            </ChildCard>

          </Box>
      </Box>
    </PageContainer>
  ); 
};

CoreNft.layout = "Blank";
