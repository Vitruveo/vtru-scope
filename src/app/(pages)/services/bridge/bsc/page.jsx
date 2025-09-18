"use client";

import React, { useEffect, useState, useRef } from "react";
import Breadcrumb from "@/app/(pages)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/(pages)/components/container/PageContainer";

import {
  Grid,
  Box,
  Button,
  Typography,
  TextField,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Paper
} from "@mui/material";
import { KeyboardArrowDown as ArrowDownIcon } from "@mui/icons-material";

import { writeContract } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";
import { ethers } from "ethers";
import { useAccount, useBalance } from "wagmi";

// Import your constants
import { 
  BINANCE_CHAIN, 
  VITRUVEO_CHAIN, 
  BINANCE_VTRU_TOKEN_CONTRACT, 
  VITRUVEO_VTRU_TOKEN_CONTRACT, 
  VTRU_ABI 
} from "../../details";

// Swap Input Component
const SwapInput = ({ 
  isFrom,
  max, 
  value, 
  setValue, 
  tokenSymbol, 
  tokenBalance, 
  network,
  disabled 
}) => {
  return (
    <Paper 
      elevation={2}
      sx={{ 
        p: 3, 
        border: 1, 
        borderColor: 'grey.300',
        backgroundColor: network === 'binance' ? '#FFF9C4' : 'primary.main'
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={2}>
        <Box>
          <Typography variant="caption" color="grey.900" sx={{ textTransform: 'uppercase', fontSize: '0.9rem' }}>
            {isFrom ? 'FROM' : 'TO'}
          </Typography>
          <Typography variant="h4" color="grey.900" fontWeight={600}>
            {tokenSymbol}
          </Typography>
        </Box>
        <Typography variant="h6" color="grey.900">
          Balance: {tokenBalance}
        </Typography>
      </Box>
      
      <TextField
        fullWidth
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="0"
        disabled={!isFrom || disabled}
        variant="outlined"
        InputProps={{
          style: { 
            fontSize: '1.5rem', 
            color: network === 'binance' ? '#757575' : '#212121',
            backgroundColor: 'transparent'
          }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'transparent',
            '& fieldset': {
              borderWidth: '3px',
              borderColor: network === 'binance' ? '#757575' : '#212121',
            },
            '&:hover fieldset': {
              borderColor: network === 'binance' ? '#757575' : '#212121',
            },
            '&.Mui-focused fieldset': {
              borderColor: network === 'binance' ? '#757575' : '#212121',
            },
          },
        }}
      />
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
        <Typography variant="body1" color="grey.900">
          Network: {network === 'vitruveo' ? 'Vitruveo' : 'Binance Smart Chain'}
        </Typography>
        <Button 
          size="medium" 
          onClick={() => setValue(max)}
          disabled={!isFrom || disabled}
          sx={{ 
            color: network === 'binance' ? '#8B4513' : 'grey.900', 
            backgroundColor: network === 'binance' ? '#F0E68C' : 'transparent',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: network === 'binance' ? '#E6D85C' : 'rgba(0,0,0,0.04)',
            },
            '&:disabled': {
              color: network === 'binance' ? '#D2B48C' : 'rgba(0,0,0,0.26)',
              backgroundColor: network === 'binance' ? '#F5F5DC' : 'transparent',
            }
          }}
        >
          MAX
        </Button>
      </Box>
    </Paper>
  );
};

export default function Bsc() {
  const DECIMALS = BigInt(String(Math.pow(10, 18)));
  const VITRUVEO = "vitruveo";
  let processing = false;

  const [account, setAccount] = useState(null);
  const [currentFrom, setCurrentFrom] = useState(VITRUVEO);
  const [loading, setLoading] = useState(false);
  const [vtruCoinBalance, setVtruCoinBalance] = useState(BigInt(0));
  const [vtruBinanceTokenBalance, setVtruBinanceTokenBalance] = useState(BigInt(0));
  const [vtruBinanceTokenAllowance, setVtruBinanceTokenAllowance] = useState(BigInt(0));
  const [vtruCoinValue, setVtruCoinValue] = useState("0");
  
  // Toast state
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const rpcUrl = 'https://rpc.vitruveo.xyz';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const binanceProvider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');

  useAccount({
    onConnect({ address, connector, isReconnected }) {
      setAccount(address);
    },
    onDisconnect() {
      setAccount(null);
    },
  });

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  // Fetch balances from both networks
  useEffect(() => {
    async function fetchBalances() {
      if (!account) {
        setVtruCoinBalance(BigInt(0));
        setVtruBinanceTokenBalance(BigInt(0));
        return;
      }

      try {
        // Vitruveo balance
        const coinBalance = await provider.getBalance(account);
        setVtruCoinBalance(coinBalance);

        // Binance token balance
        const binanceContract = new ethers.Contract(
          BINANCE_VTRU_TOKEN_CONTRACT,
          JSON.parse(VTRU_ABI),
          binanceProvider
        );
        
        const tokenBalance = await binanceContract.balanceOf(account);
        const allowance = await binanceContract.allowance(account, BINANCE_VTRU_TOKEN_CONTRACT);
        
        setVtruBinanceTokenBalance(tokenBalance);
        setVtruBinanceTokenAllowance(allowance);

      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    }

    const interval = setInterval(() => {
      fetchBalances();
    }, loading ? 5000 : 15000);

    fetchBalances();

    return () => clearInterval(interval);
  }, [account, loading]);

  // Helper functions
  const toDisplay = (value) => {
    return parseFloat(ethers.formatEther(value)).toFixed(4);
  };

  const toMaxDisplay = (value) => {
    const formatted = parseFloat(ethers.formatEther(value));
    return Math.max(0, formatted >= 1 ? formatted - 1 : 0).toFixed(0);
  };

  const inputInvalid = () => {
    if (currentFrom === VITRUVEO) {
      return Number(vtruCoinValue) > Math.trunc(Number(ethers.formatEther(vtruCoinBalance))) || Number(vtruCoinValue) === 0;
    } else {
      return Number(vtruCoinValue) > Math.trunc(Number(ethers.formatEther(vtruBinanceTokenBalance))) || Number(vtruCoinValue) === 0;
    }
  };

  // Bridge execution using wagmi
  const executeBridge = async () => {
    if (processing) return;
    processing = true;
    setLoading(true);
    
    try {
      const amount = ethers.parseEther(vtruCoinValue);

      if (currentFrom === VITRUVEO) {
        // Bridge from Vitruveo to Binance
        await writeContract({
          address: VITRUVEO_VTRU_TOKEN_CONTRACT,
          abi: JSON.parse(VTRU_ABI),
          functionName: 'lockVTRUCoin',
          args: [BINANCE_CHAIN.chainId],
          value: amount
        });

        showToast('Coin Bridge Successful! Funds will arrive in 2-3 mins.', 'success');
        
      } else {
        // Bridge from Binance to Vitruveo
        // Check and approve if needed
        if (vtruBinanceTokenAllowance < amount) {
          await writeContract({
            address: BINANCE_VTRU_TOKEN_CONTRACT,
            abi: JSON.parse(VTRU_ABI),
            functionName: 'approve',
            args: [BINANCE_VTRU_TOKEN_CONTRACT, amount]
          });
        }

        await writeContract({
          address: BINANCE_VTRU_TOKEN_CONTRACT,
          abi: JSON.parse(VTRU_ABI),
          functionName: 'burnVTRUToken',
          args: [VITRUVEO_CHAIN.chainId, amount]
        });

        showToast('Token Bridge Successful! Funds will arrive in 2-3 mins.', 'success');
      }

    } catch (error) {
      console.error('Bridge error:', error);
      showToast('Bridge Failed. Please try again.', 'error');
    } finally {
      setLoading(false);
      processing = false;
    }
  };

  const breadcrumb = [
    {
      to: "/",
      title: "Home",
    },
    {
      title: "Services",
    },
    {
      title: "Bridge",
    },
  ];

  return (
    <PageContainer title="VTRU Bridge" description="Bridge VTRU between Vitruveo and Binance Smart Chain">
      <Breadcrumb
        title="VTRU Bridge"
        items={breadcrumb}
      />
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          {/* Left spacer */}
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent sx={{ p: 4, pt: 2 }}>
              <Typography variant="h6" mb={2}>
                The Vitruveo VTRU Bridge is a fast and easy way to bridge the VTRU coin on Vitruveo to/from the VTRU token on BSC.
              </Typography>

              <Box display="flex" flexDirection="column" gap={2}>
                <SwapInput
                  isFrom={true}
                  max={currentFrom === VITRUVEO ? toMaxDisplay(vtruCoinBalance) : toMaxDisplay(vtruBinanceTokenBalance)}
                  value={String(Math.trunc(Number(vtruCoinValue)).toFixed(0))}
                  setValue={setVtruCoinValue}
                  tokenSymbol={currentFrom === VITRUVEO ? "VTRU Coin" : "VTRU Token"}
                  tokenBalance={currentFrom === VITRUVEO ? toDisplay(vtruCoinBalance) : toDisplay(vtruBinanceTokenBalance)}
                  network={currentFrom === VITRUVEO ? "vitruveo" : "binance"}
                  disabled={loading}
                />

                <Box display="flex" justifyContent="center">
                  <IconButton
                    onClick={() =>
                      currentFrom === VITRUVEO
                        ? setCurrentFrom("binance")
                        : setCurrentFrom(VITRUVEO)
                    }
                    disabled={loading}
                    sx={{ 
                      border: 1, 
                      borderColor: 'grey.300',
                      backgroundColor: 'background.paper'
                    }}
                  >
                    <ArrowDownIcon />
                  </IconButton>
                </Box>

                <SwapInput
                  isFrom={false}
                  max={currentFrom === VITRUVEO ? toMaxDisplay(vtruBinanceTokenBalance) : toMaxDisplay(vtruCoinBalance)}
                  value={String(Math.trunc(Number(vtruCoinValue)).toFixed(0))}
                  setValue={setVtruCoinValue}
                  tokenSymbol={currentFrom === VITRUVEO ? "VTRU Token" : "VTRU Coin"}
                  tokenBalance={currentFrom === VITRUVEO ? toDisplay(vtruBinanceTokenBalance) : toDisplay(vtruCoinBalance)}
                  network={currentFrom === VITRUVEO ? "binance" : "vitruveo"}
                  disabled={loading}
                />
              </Box>

              <Box mt={4}>
                {account ? (
                  <Button 
                    color="primary" 
                    size="large" 
                    disabled={loading || inputInvalid()} 
                    onClick={executeBridge}
                    fullWidth
                    sx={{ 
                      py: 2, 
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}
                  >
                    {loading ? 'Processing...' : `Bridge ${currentFrom === VITRUVEO ? 'Coin' : 'Token'}`}
                  </Button>
                ) : (
                  <Typography variant="h6" textAlign="center">
                    Please connect your wallet to bridge tokens
                  </Typography>
                )}
              </Box>

              <Typography variant="body2" textAlign="center" mt={2} color="text.secondary">
                Bridge fee of $1/transaction currently waived.
              </Typography>

              <Typography variant="body2" textAlign="center" mt={2}>
                View in-flight bridge transactions at{' '}
                <a 
                  href="https://scan.vialabs.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'underline', color: 'white' }}
                >
                  https://scan.vialabs.io
                </a>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          {/* Right spacer */}
        </Grid>
      </Grid>

      <Typography 
        variant="caption" 
        display="block" 
        textAlign="center" 
        mt={2}
        color="text.secondary"
      >
        Powered by{' '}
        <a href="https://vialabs.io/" target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>
          VIA Labs
        </a>
      </Typography>

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert 
          onClose={() => setToast({ ...toast, open: false })} 
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}

Bsc.layout = "Blank";200