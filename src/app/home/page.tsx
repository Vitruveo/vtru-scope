"use client"

import React from 'react';
import PageContainer from '@/app/(pages)/components/container/PageContainer';

// components
import Banner from '@/app/(pages)/components/landingpage/banner/Banner';
import LpHeader from '@/app/(pages)/components/landingpage/header/Header';

export default function Landingpage () {
  return (
    <PageContainer title="VTRU Scope" description="VTRU Scope is the focal point for tracking all Vitruveo assets">
      <LpHeader />
      <Banner />
    </PageContainer>
  ); 
};

Landingpage.layout = "Blank";
