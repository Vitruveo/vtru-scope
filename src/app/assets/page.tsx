"use client";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

import PageContainer from "@/app/home/components/container/PageContainer";
// components
import YearlyBreakup from "@/app/home/components/dashboards/modern/YearlyBreakup";
import MonthlyEarnings from "@/app/home/components/dashboards/modern/MonthlyEarnings";
import TopCards from "@/app/home/components/dashboards/modern/TopCards";
import RevenueUpdates from "@/app/home/components/dashboards/modern/RevenueUpdates";
import EmployeeSalary from "@/app/home/components/dashboards/modern/EmployeeSalary";
import Customers from "@/app/home/components/dashboards/modern/Customers";
import Projects from "@/app/home/components/dashboards/modern/Projects";
import Social from "@/app/home/components/dashboards/modern/Social";
import SellingProducts from "@/app/home/components/dashboards/modern/SellingProducts";
import WeeklyStats from "@/app/home/components/dashboards/modern/WeeklyStats";
import TopPerformers from "@/app/home/components/dashboards/modern/TopPerformers";
import AccountTab from "@/app/home/components/pages/account-setting/AccountTab";
import AssetsTabs from "@/app/home/components/forms/form-vertical/AssetsTabs";
import FolderList from "@/app/home/components/ui-components/lists/FolderList";
import PageHeading from "./components/shared/PageHeading";
import { Typography } from "@mui/material";
import SingleDetailListItem from "../home/components/ui-components/lists/SingleDetailListItem";
const configTestnet = require("../../../contracts/vt_contract_testnet");
const configMainnet = require("../../../contracts/vt_contract_mainnet");
var config: any

if (process.env.NEXT_PUBLIC_IS_TESTNET == "true") {
  config = configTestnet.config
} else {
  config = configMainnet.config
}

import { readContract, writeContract, waitForTransaction } from "@wagmi/core";
import { useWalletClient, useAccount } from "wagmi";



export default function Dashboard() {
  const [isLoading, setLoading] = useState(true);
  const { address, isDisconnected, isConnected } = useAccount();
  const data = useWalletClient();

  
  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <PageContainer title="Dashboard" description="this is Dashboard">
      {/* <Box mt={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <RevenueUpdates isLoading={isLoading} />
          </Grid>

          <Grid item xs={12} lg={6}>
            <EmployeeSalary isLoading={isLoading} />
          </Grid>

          <Grid item xs={12} lg={12}>
            <WeeklyStats isLoading={isLoading} />
          </Grid>
        </Grid>
      </Box> */}
      <PageHeading title="Maxim" />
      <SingleDetailListItem
        imageSrc="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCTuSpR_FwEIFFf0C8vSnQ4kMVW7KO4iNdYgjdUok3Ew&s"
        heading="Asset Name"
        descriptions={[
          'Summary Information',
          'Summary Information',
          'Summary Information',
        ]}
        headingFontSize="20px"
        descriptionFontSize="16px"
      />
      <AssetsTabs />
    </PageContainer>
  );
}
