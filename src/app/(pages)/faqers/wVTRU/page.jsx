"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  CardContent,
  Grid,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Breadcrumb from "@/app/(pages)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/(pages)/components/container/PageContainer";
import { readContract, writeContract } from "@wagmi/core";
import { Stack } from '@mui/system';
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import config from "@/app/config/vtru-contracts.json";
import './progressbar.css';

const useTokenPrices = (N) => {
  const [prices, setPrices] = useState([]);

  const addPrice = (newPrice) => {
    setPrices((prevPrices) => {
      const updatedPrices = [newPrice, ...prevPrices]; // Add new price to the top
      if (updatedPrices.length > N) {
        updatedPrices.pop(); // Remove the oldest price if the length exceeds N
      }
      return updatedPrices;
    });
  };

  return [prices, addPrice];
};

export default function Faqers_wVTRU() {
  const [blockNumber, setBlockNumber] = useState(0);
  const [lastPrice, setLastPrice] = useState(0);
  const [delay, setDelay] = useState(1000);
  const [progress, setProgress] = useState(0);

  const PANCAKE_ABI = [
    {
      "inputs": [],
      "name": "getReserves",
      "outputs": [
        {
          "internalType": "uint112",
          "name": "_reserve0",
          "type": "uint112"
        },
        {
          "internalType": "uint112",
          "name": "_reserve1",
          "type": "uint112"
        },
        {
          "internalType": "uint32",
          "name": "_blockTimestampLast",
          "type": "uint32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const provider = new ethers.JsonRpcProvider('https://rpc.vitruveo.xyz');

  function formatPrice(price) {
    return (price ? Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(price) :
    '')
  }

  let processing = false;


  useEffect(() => {
    // Increment progress every second
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          if (delay == 1000) setDelay(15000);
          if (!processing) {
            processing = true;
            provider.getBlockNumber().then((block) => {
              setBlockNumber(block);
              readContract({
                address: '0x8B3808260a058ECfFA9b1d0eaA988A1b4167DDba',
                abi: PANCAKE_ABI,
                functionName: "getReserves",
                args: []
              }).then((info) => {
                const wVTRUReserve = info[0];
                const usdcReserve = info[1];
                const price = Number((usdcReserve * BigInt(Math.pow(10, 18)) / wVTRUReserve)) / Math.pow(10, 6);
                let color = 0;
                if (lastPrice !== 0) {
                  if (Number(price.toFixed(4)) < lastPrice) {
                    color = -1;
                  } else if (Number(price.toFixed(4)) > lastPrice) {
                    color = 1;
                  }
                }
                setLastPrice(Number(price.toFixed(4)));
                addPrice({block, price: price.toFixed(4), color });
                processing = false;
              });
          });
          }
          return 0;
         } // Reset after reaching 100%
        return prevProgress + 10; // Increment by 10%
      });
    }, delay/10);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [blockNumber, delay, lastPrice]);


  const [prices, addPrice] = useTokenPrices(10); // Keep last 10 prices

  const breadcrumb = [
    {
      to: "/",
      title: "Home",
    },
    {
      title: "FAQers",
    },
    {
      title: "wVTRU",
    },
  ];


  const columns = [
    { id: 'block', label: 'Block', minWidth: 100 },
    { id: 'price', label: 'Price', minWidth: 100 },
  ];

  const rowStyle = {marginBottom: '20px'};
  const labelStyle = {display: 'inline-block', marginTop: '20px', fontSize: '14px'};


  return (
    <PageContainer title="VTRU Scope" description="Interactive FAQ Answers">
      <Breadcrumb title="Interactive FAQ Answers" items={breadcrumb} />

      <p style={{marginBottom: '30px', marginLeft: '10px'}}>This FAQer provides information on current wVTRU price from <a style={{color: 'white', textDecoration: 'underline'}} href='https://swap.vitruveo.xyz' target='_new'>https://swap.vitruveo.xyz</a></p>

     <h2 style={prices.length == 0 ? {marginLeft: '10px'} : {display: 'none'}}>Fetching current wVTRU price...</h2>

      <Grid container spacing={3} style={prices.length == 0 ? {display: 'none'} : {marginBottom: "30px"}}>
        <Grid item xs={12} sm={12} md={6} lg={6} key={1}>
          <Box bgcolor={"info.light"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"info.main"}
                variant="subtitle1"
                fontWeight={600}
              >
                Current Block
              </Typography>
              <Typography color={"info.main"} variant="h1" fontWeight={600}>
                {prices[0] ? Number(prices[0].block).toLocaleString() : ''}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={6} lg={6} key={2}>
          <Box bgcolor={"info.light"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"info.main"}
                variant="subtitle1"
                fontWeight={600}
              >
                Current wVTRU Price
              </Typography>
              <Typography color={"info.main"} variant="h1" fontWeight={600}>
                    {prices[0] ? formatPrice(prices[0].price) : ''}
                  </Typography>
            </CardContent>
          </Box>
        </Grid>

      </Grid>
      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <TableContainer
              sx={{
                maxHeight: 660,
                marginTop: 2
              }}
              style={prices.length == 0 ? {display: 'none'} : {}}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        style={{ minWidth: column.minWidth }}
                      >
                        <Typography variant="h6" fontWeight="900">
                          {column.label}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prices.map((row) => {
                    return (
                      <TableRow hover key={row.id}>

                        <TableCell>
                          <Stack spacing={2} direction="row" alignItems="center">
                              <Typography variant="h3">{Number(row.block).toLocaleString()}</Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Stack spacing={1}>
                              <Typography variant="h3">
                                {
                                  row.color == 0 ?
                                    <span>
                                      {formatPrice(row.price)}
                                    </span> :
                                    (
                                      row.color == -1 ? 
                                      <span style={{color: '#FF4D4F'}}>
                                        {formatPrice(row.price)}
                                      </span> :
                                      <span style={{color: '#4CAF50'}}>
                                        {formatPrice(row.price)}
                                      </span>
                                    )
                                 }
                              </Typography>
                          </Stack>
                        </TableCell>

                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

    </PageContainer>
  );
}

Faqers_wVTRU.layout = "Blank";
