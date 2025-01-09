
import React, { useState } from "react";
import {
  Typography,
  Box,
  Slider,
  CardContent,
} from '@mui/material';



const SuccessRate = ({ item }) => {


  const handleSlider = (e) => {
    item.handleSliderChange(e.target.value);
  }

  return (
    <Box bgcolor={"primary.main"} textAlign="center">
    <CardContent px={1} style={{padding: '15px', marginBottom: '10px', height: '110px'}}>
  
            <Typography
              color={"grey.900"}
              variant="h4"
              fontWeight={600}
            >
              {Math.trunc(Number(item.value)).toLocaleString()} ({item.unit})
            </Typography>
            <Slider
              value={item.value}
              step={item.step}
              min={item.min}
              max={item.max}
              onChange={handleSlider}
              sx={{color: "grey.900"}}
            />
            <Typography
              color={"grey.900"}
              variant="h5"
              fontWeight={600}
            >
              {item.title}
            </Typography>
      </CardContent>
    </Box>
      )
  }

export default SuccessRate;
