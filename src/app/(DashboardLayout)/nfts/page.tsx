"use client"

import React from 'react';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';


export default function Nfts () {
  
  const breadcrumb = [
    {
      to: '/',
      title: 'Home',
    },
    {
      title: 'NFTs',
    },
  ];

  return (
    <PageContainer title="VTRU Scope" description="View all your NFTs">
      <Breadcrumb title="NFTs" items={breadcrumb} />
      <h3 style={{marginLeft: '20px'}}>Coming Soon!</h3>
    </PageContainer>
  ); 
};

Nfts.layout = "Blank";
