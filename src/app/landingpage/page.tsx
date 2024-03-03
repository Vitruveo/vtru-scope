"use client"

import React from 'react';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';

// components
import Banner from '@/app/(DashboardLayout)/components/landingpage/banner/Banner';
import LpHeader from '@/app/(DashboardLayout)/components/landingpage/header/Header';

export default function Landingpage () {
  return (
    <PageContainer title="VTRU Scope" description="VTRU Scope is the focal point for tracking all Vitruveo assets">
      <LpHeader />
      <Banner />
    </PageContainer>
  ); 
};

Landingpage.layout = "Blank";
