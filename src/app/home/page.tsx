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

export default function Dashboard() {
  const [isLoading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <PageContainer title="Dashboard" description="this is Dashboard">
      <Box mt={3}>
        <Grid container spacing={3}>
          {/* column */}
          <Grid item xs={12} lg={6}>
            <RevenueUpdates isLoading={isLoading} />
          </Grid>

          {/* column */}
          <Grid item xs={12} lg={6}>
            <EmployeeSalary isLoading={isLoading} />
          </Grid>

          {/* column */}
          <Grid item xs={12} lg={12}>
            <WeeklyStats isLoading={isLoading} />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}
