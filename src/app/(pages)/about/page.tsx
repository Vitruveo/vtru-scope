"use client"

import React from 'react';
import PageContainer from '@/app/(pages)/components/container/PageContainer';
import { Box } from '@mui/material';
import Breadcrumb from '@/app/(pages)/layout/shared/breadcrumb/Breadcrumb';
import FormLabel from '@mui/material/FormLabel';
import Typography from '@mui/material/Typography';
import ChildCard from '@/app/(pages)/components/shared/ChildCard';


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
          VTRU Scope is the focal point for all your Vitruveo assets. In a single app you can view and manage coins and tokens.
        </Typography>

          <Box p={3}>
            <FormLabel htmlFor="outlined-multiline-static">
              <Typography variant="h5" mb={2} fontWeight={600} color="text.primary">
                Release Notes
              </Typography>
            </FormLabel>
            <ChildCard>
                  <Typography variant="h6">v0.8.0</Typography>

                  <Typography variant="body1" color="textSecondary">
                    <ul>
                      <li>Added Creator Vault FAQer</li>
                    </ul>
                  </Typography>
            </ChildCard>

            <ChildCard>
                  <Typography variant="h6">v0.7.9</Typography>

                  <Typography variant="body1" color="textSecondary">
                    <ul>
                      <li>Support for airdrop staking for VIBE</li>
                      <li>Equity Pools forms</li>
                      <li>Added CoreStake to contracts</li>
                    </ul>
                  </Typography>
            </ChildCard>

            <ChildCard>
                  <Typography variant="h6">v0.7.8</Typography>

                  <Typography variant="body1" color="textSecondary">
                    <ul>
                      <li>VTRU Suite NFT preview and performance enhancements</li>
                    </ul>
                  </Typography>
            </ChildCard>

            <ChildCard>
                  <Typography variant="h6">v0.7.7</Typography>

                  <Typography variant="body1" color="textSecondary">
                    <ul>
                      <li>Vitruveo Ecosystem Smart Contracts</li>
                    </ul>
                  </Typography>
            </ChildCard>

            <ChildCard>
                  <Typography variant="h6">v0.7.6</Typography>

                  <Typography variant="body1" color="textSecondary">
                    <ul>
                      <li>VIBE Stake/Swap</li>
                    </ul>
                  </Typography>
            </ChildCard>
            <ChildCard>
                  <Typography variant="h6">v0.7.5</Typography>

                  <Typography variant="body1" color="textSecondary">
                    <ul>
                      <li>VIBE Revenue Share</li>
                      <li>VIBE NFTs by denomination</li>
                    </ul>
                  </Typography>
            </ChildCard>
            <ChildCard>
                  <Typography variant="h6">v0.7.3</Typography>

                  <Typography variant="body1" color="textSecondary">
                    <ul>
                      <li>Dark mode</li>
                      <li>Vortex NFT group by rarity</li>
                    </ul>
                  </Typography>
            </ChildCard>
            <ChildCard>
                  <Typography variant="h6">v0.7.1 beta</Typography>

                  <Typography variant="body1" color="textSecondary">
                    <ul>
                      <li>Vortex NFT display</li>
                    </ul>
                  </Typography>
            </ChildCard>
            <ChildCard>
                  <Typography variant="h6">v0.7.0 beta</Typography>

                  <Typography variant="body1" color="textSecondary">
                    <ul>
                      <li>VTRU Suite NFT display</li>
                    </ul>
                  </Typography>
            </ChildCard>
            <ChildCard>
                  <Typography variant="h6">v0.6.6 beta</Typography>

                  <Typography variant="body1" color="textSecondary">
                    <ul>
                      <li>Validator Core NFT Support</li>
                      <li>Real-time block number</li>
                    </ul>
                  </Typography>
            </ChildCard>
            <ChildCard>
                  <Typography variant="h6">v0.6.5 beta</Typography>

                  <Typography variant="body1" color="textSecondary">
                    <ul>
                      <li>Feature to boost any account by address</li>
                      <li>Auto-add Maxim NFT if boosted address does not have Nexus/Maxim NFT</li>
                      <li>Fixed minor issues with claim amount calculations</li>
                      <li>Refactored Core NFT card information tab content</li>
                      <li>Upgraded smart contracts</li>
                    </ul>
                  </Typography>
            </ChildCard>
            <ChildCard>
                  <Typography variant="h6">v0.6.0 beta</Typography>

                  <Typography variant="body1" color="textSecondary">
                    <ul>
                      <li>Claim feature enabled</li>
                      <li>Boost feature enabled</li>
                      <li>Refactored Core NFT information</li>
                      <li>Upgraded smart contracts</li>
                    </ul>
                  </Typography>
            </ChildCard>
            <ChildCard>
                  <Typography variant="h6">v0.5.1 beta</Typography>

                  <Typography variant="body1" color="textSecondary">
                    <ul>
                      <li>Fixes for NFT image rendering</li>
                      <li>Fix for transferred NFTs</li>
                      <li>Display Boosters in account</li>
                    </ul>
                  </Typography>
            </ChildCard>
            <ChildCard>
                  <Typography variant="h6">v0.5.0 beta</Typography>

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
