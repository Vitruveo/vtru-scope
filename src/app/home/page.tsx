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
import FormTabs from "@/app/home/components/forms/form-vertical/FormTabs";
import PageHeading from "./components/shared/PageHeading";
import AssetsList from "@/app/home/components/ui-components/lists/AssetsList";

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
  useEffect(() => {
    setLoading(false);
  }, []);
  
  const { address, isDisconnected, isConnected } = useAccount();
  const data = useWalletClient();
  const [boosters, setBoosters] = useState<any>([]);

  useEffect(() => {
    console.log("address", address)
    if (address && data?.data?.chain?.id == 1490) {
      setLoading(true)
      getContractData();
    } else {
      setLoading(false)
      setBoosters([]);
    }
  }, [address, data?.data?.chain?.id]);

  async function getContractData() {
    setLoading(true);
    try {
      const mintedBoosters = await readContract({
        address: config?.contractAddress,
        abi: config?.abi,
        functionName: "getMintedBoosters",
        // args: [address]
        args: ["0x26a9268CC3312613A3a2e304127A8511E9529026"],
      });
      const details = await readContract({
        address: config?.contractAddress,
        abi: config?.abi,
        functionName: "getMintedBoosters",
        // args: [address]
        args: ["0x26a9268CC3312613A3a2e304127A8511E9529026"],
      });
      console.log("mintedBoosters: ", mintedBoosters)
      // let boosters = [];
      // for (let i = 0; i < mintedBoosters.length; i++) {
      //   let resp = await getData(mintedBoosters[i].toString());
      //   boosters.push(resp);
      // }
      setBoosters(mintedBoosters);
      setLoading(false);
    } catch (error) {
      console.log(error)
      setLoading(false);
      setBoosters([]);
      console.log(error);
    }
  }

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
      <PageHeading title="Assets" />
      <AssetsList />
    </PageContainer>
  );
}
