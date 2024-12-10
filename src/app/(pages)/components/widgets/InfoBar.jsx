
import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Slider,
  CardContent,
} from '@mui/material';



const InfoBar = ({ items }) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    // Defer visibility to the next render cycle
    const timeout = setTimeout(() => {
      setIsRendered(true);
    }, 1000); // Wait until the next render

    return () => clearTimeout(timeout); // Cleanup on unmount
  }, [items]);

  const palette = [
    "#AF52DE", // Purple
    "#5856D6", // Indigo
    "#5AC8FA", // Light Blue
    "#4CD964", // Green
    "#FFD60A", // Yellow
    "#FF9500", // Orange
    "#8E8E93", // Grey
    "#34C759", // Bright Green
    "#C7C7CC"  // Light Gray
  ];

  
  function formatNumber(num, locale = "en-US") {

    if (num >= 1_000_000) {
      // Format with two decimals for M
      return (
        (num / 1_000_000).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " M"
      );
    } else if (num >= 1_000) {
      // Format without decimals for K
      return (
        (num / 1_000).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " K"
      );
    } else {
      // Format normally with no decimals
      return num.toLocaleString(locale);
    }
  }

  const getRandomColor = (index) => {
    return palette[index % palette.length];
  };

  const handleClick = function(account) {
    window.open(`https://explorer.vitruveo.xyz/address/${account}`);
  }

  let total = items.reduce((a, b) => a + b.amount, 0);

  const getRadius = (index) => {
    switch(index) {
      case 0: return '8px 0px 0px 8px';
      case items.length-1: return'0px 8px 8px 0px'; 
      default: return '0px'; 
    }
  };
  
  items.sort((a,b) => b.amount - a.amount);
  
  return (
    <Box textAlign="center">
    <CardContent px={1} style={{padding: 0}}>   
      <div style={{ 
          visibility: isRendered ? "visible" : "hidden",
          transition: "visibility 0s linear 0.3s, opacity 0.3s ease-in-out",
          opacity: isRendered ? 1 : 0,
          display: "flex", 
          width: "100%", 
          height: "108.5px"}}>
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              flexBasis: `${(item.amount / total) * 100}%`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: getRandomColor(index), 
              color: "#fff",
              textAlign: "center",
              padding: "0px",
              boxSizing: "border-box",
              cursor: "pointer",
              borderRadius: getRadius(index)
              
            }}
            onClick={() => handleClick(item.address)}
          >
                  <Typography
                    color={"grey.900"}
                    fontWeight={600}
                    style={{fontSize: '16px'}}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    color={"grey.900"}
                    fontWeight={600}
                    style={{fontSize: '14px', marginTop: '5px'}}
                  >
                    {formatNumber(item.amount)}
                  </Typography>
          </div>
        ))
        }
      </div>
      </CardContent>
    </Box>
    )
  }

export default InfoBar;
