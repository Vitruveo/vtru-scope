import dynamic from "next/dynamic";
import { IconGridDots } from "@tabler/icons-react";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from "@mui/material/styles";

import DashboardCard from "../../shared/DashboardCard";
import SkeletonEmployeeSalaryCard from "../skeleton/EmployeeSalaryCard";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import { useChartsContext } from "@/app/context/charts";

interface EmployeeSalaryCardProps {
  isLoading: boolean;
}

const EmployeeSalary = ({ isLoading }: EmployeeSalaryCardProps) => {
  // chart color
  const theme = useTheme();
  const { slidersValues, createChartData } = useChartsContext();
  const primary = theme.palette.primary.main;
  const primarylight = theme.palette.grey[100];
  const error = theme.palette.error.main;
  const secondary = theme.palette.success.main;
  const errorlight = theme.palette.error.light;
  const secondarylight = theme.palette.success.light;

  // chart
  const optionscolumnchart: any = {
    chart: {
      type: "bar",
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: "#adb0bb",
      toolbar: {
        show: false,
      },
      height: 280,
    },
    colors: [
      primarylight,
      primarylight,
      primary,
      primarylight,
      primarylight,
      primarylight,
    ],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "45%",
        endingShape: "rounded",
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    grid: {
      yaxis: {
        lines: {
          show: false,
        },
      },
    },
    xaxis: {
      categories: [["Apr"], ["May"], ["June"], ["July"], ["Aug"], ["Sept"]],
      axisBorder: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        show: false,
      },
    },
    tooltip: {
      theme: theme.palette.mode === "dark" ? "dark" : "light",
    },
  };
  const seriescolumnchart = [
    {
      name: "salary",
      color: primary,
      data: createChartData({ value: slidersValues.salary }),
    },
    {
      name: "marketing",
      color: secondary,
      data: createChartData({ value: slidersValues.marketing }),
    },
    {
      name: "others",
      color: error,
      data: createChartData({ value: slidersValues.others }),
    },
  ];

  const stats = [
    {
      title: "Salary",
      subtitle: "Johnathan Doe",
      percent: "68",
      color: primary,
      lightcolor: primarylight,
      icon: <IconGridDots width={18} />,
    },
    {
      title: "Marketing",
      subtitle: "Footware",
      percent: "45",
      color: secondary,
      lightcolor: secondarylight,
      icon: <IconGridDots width={18} />,
    },
    {
      title: "Others",
      subtitle: "Fashionware",
      percent: "14",
      color: error,
      lightcolor: errorlight,
      icon: <IconGridDots width={18} />,
    },
  ];

  return (
    <>
      {isLoading ? (
        <SkeletonEmployeeSalaryCard />
      ) : (
        <DashboardCard title="Expenses Details" subtitle="Every month">
          <>
            <Box height={342}>
              <Chart
                options={optionscolumnchart}
                series={seriescolumnchart}
                type="bar"
                height={280}
                width={"100%"}
              />
            </Box>

            <Stack direction="row" display="flex" spacing={3} mt={3}>
              {stats.map((stat, i) => (
                <Stack
                  direction="row"
                  spacing={2}
                  justifyContent="space-between"
                  alignItems="center"
                  key={i}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar
                      variant="rounded"
                      sx={{
                        bgcolor: stat.lightcolor,
                        color: stat.color,
                        width: 40,
                        height: 40,
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" mb="4px">
                        {stat.title}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </>
        </DashboardCard>
      )}
    </>
  );
};

export default EmployeeSalary;
