"use client"

import React from 'react';
import PageContainer from '@/app/(pages)/components/container/PageContainer';

// components
import Banner from '@/app/(pages)/components/landingpage/banner/Banner';


export default function Dashboard () {
  return (
    <PageContainer title="VTRU Scope" description="VTRU Scope by Vitruveo">
      <Banner />
    </PageContainer>
  ); 
};

Dashboard.layout = "Blank";
