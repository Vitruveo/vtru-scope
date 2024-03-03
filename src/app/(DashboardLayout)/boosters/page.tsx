"use client"

import React from 'react';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';


export default function Boosters () {
  
  const breadcrumb = [
    {
      to: '/',
      title: 'Home',
    },
    {
      title: 'Boosters',
    },
  ];

  return (
    <PageContainer title="Boosters" description="View all Booster NFTs">
      <Breadcrumb title="Boosters" items={breadcrumb} />
      <h3 style={{marginLeft: '20px'}}>Coming Soon!</h3>
    </PageContainer>
  ); 
};

Boosters.layout = "Blank";
