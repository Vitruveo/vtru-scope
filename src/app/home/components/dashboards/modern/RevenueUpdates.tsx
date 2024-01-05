import React from "react";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from "@mui/material/styles";
import {
  MenuItem,
  Grid,
  Stack,
  Typography,
  Button,
  Avatar,
  Box,
} from "@mui/material";
import { IconGridDots } from "@tabler/icons-react";
import DashboardCard from "../../shared/DashboardCard";
import CustomSelect from "../../forms/theme-elements/CustomSelect";
import SkeletonRevenueUpdatesTwoCard from "../skeleton/RevenueUpdatesTwoCard";
import { useChartsContext } from "@/app/context/charts";

interface RevenueupdatestwoCardProps {
  isLoading: boolean;
}

const RevenueUpdates = ({ isLoading }: RevenueupdatestwoCardProps) => {
  const [month, setMonth] = React.useState("1");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMonth(event.target.value);
  };

  // chart color
  const theme = useTheme();
  const { slidersValues, createChartData } = useChartsContext();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;

  // chart
  const optionscolumnchart: any = {
    chart: {
      type: "bar",
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: "#adb0bb",
      toolbar: {
        show: true,
      },
      height: 390,
      stacked: true,
    },
    colors: [primary, secondary],
    plotOptions: {
      bar: {
        horizontal: false,
        barHeight: "60%",
        columnWidth: "20%",
        borderRadius: [6],
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "all",
      },
    },

    stroke: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    grid: {
      borderColor: "rgba(0,0,0,0.1)",
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
    yaxis: {
      min: -100,
      max: 100,
      tickAmount: 4,
    },
    xaxis: {
      categories: [
        "16/08",
        "17/08",
        "18/08",
        "19/08",
        "20/08",
        "21/08",
        "22/08",
      ],
      axisBorder: {
        show: false,
      },
    },
    tooltip: {
      theme: theme.palette.mode === "dark" ? "dark" : "light",
      fillSeriesColor: false,
    },
  };

  const seriescolumnchart = [
    {
      name: "Eanings this month",
      data: createChartData({ value: slidersValues.earningsThisMonth }),
    },
    {
      name: "Expense this month",
      data: createChartData({
        value: slidersValues.expenseThisMonth,
        negative: true,
      }),
    },
  ];

  return (
    <>
      {isLoading ? (
        <SkeletonRevenueUpdatesTwoCard />
      ) : (
        <DashboardCard title="Revenue Updates" subtitle="Overview of Profit">
          <Grid container spacing={3}>
            {/* column */}
            <Grid item xs={12} sm={12}>
              <Box className="rounded-bars">
                <Chart
                  options={optionscolumnchart}
                  series={seriescolumnchart}
                  type="bar"
                  height={390}
                  width={"100%"}
                />
              </Box>
            </Grid>
          </Grid>
        </DashboardCard>
      )}
    </>
  );
};

export default RevenueUpdates;
