"use client";

import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { SliderValueLabelProps } from "@mui/material/Slider";
import { SliderThumb } from "@mui/material/Slider";
import { Slider } from "@mui/material";
import Typography from "@mui/material/Typography";
import ParentCard from "@/app/home/components/shared/ParentCard";
import ChildCard from "@/app/home/components/shared/ChildCard";
import Breadcrumb from "@/app/home/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/home/components/container/PageContainer";
import CustomRangeSlider from "@/app/home/components/forms/theme-elements/CustomRangeSlider";
import CustomSlider from "@/app/home/components/forms/theme-elements/CustomSlider";
import { IconVolume, IconVolume2 } from "@tabler/icons-react";
import { Stack } from "@mui/system";
import { SlidersValues, useChartsContext } from "@/app/context/charts";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Slider",
  },
];

const valuetext = (value: any) => `${value}°C`;

function valuetext2(value: any) {
  return `${value}°C`;
}

function AirbnbThumbComponent(props: SliderValueLabelProps) {
  const { children, ...other } = props;

  return (
    <SliderThumb {...other}>
      {children}
      <Box
        sx={{
          height: 9,
          width: "2px",
          backgroundColor: "#fff",
        }}
      />
      <Box
        sx={{
          height: "14px",
          width: "2px",
          backgroundColor: "#fff",
          ml: "2px",
        }}
      />
      <Box
        sx={{
          height: 9,
          width: "2px",
          backgroundColor: "#fff",
          ml: "2px",
        }}
      />
    </SliderThumb>
  );
}

const MuiSlider = ({ chartKey }: { chartKey: keyof SlidersValues }) => {
  const { slidersValues, setSlidersValues } = useChartsContext();

  const handleChange2 = (_: Event, newValue2: any) => {
    setSlidersValues((prev) => ({ ...prev, [chartKey]: newValue2 }));
  };

  return (
    <Grid container>
      <Grid item xs={12} lg={12} sm={6} display="flex" alignItems="stretch">
        <Slider onChange={handleChange2} value={slidersValues[chartKey]} />
      </Grid>
    </Grid>
  );
};

export default MuiSlider;
