"use client"

import React, { useEffect, useState, useCallback } from "react";
import Breadcrumb from '@/app/(pages)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/(pages)/components/container/PageContainer';

import {
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Chip,
  Collapse,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';

import { Stack } from '@mui/system';
import {
  IconWallet,
  IconPlus,
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconX,
  IconClock,
  IconAlertTriangle,
  IconTrash,
  IconSend,
  IconSignature,
  IconRefresh,
  IconUsers,
  IconWorld,
  IconLock,
  IconCopy,
} from '@tabler/icons-react';

import { readContract, writeContract } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const BLOCKS_PER_DAY = 17280; // ~5 second blocks on Vitruveo
const ERC20_ABI = [
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] }
];

export default function Multisig() {
  const isTestnet = false;
  const network = isTestnet ? 'testnet' : 'mainnet';

  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [blockNumber, setBlockNumber] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Wallet lists
  const [userWallets, setUserWallets] = useState([]);
  const [publicWallets, setPublicWallets] = useState([]);
  const [walletDashboards, setWalletDashboards] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Expanded wallet detail
  const [expandedWallet, setExpandedWallet] = useState(null);
  const [walletSigners, setWalletSigners] = useState({});
  const [walletSignerCounts, setWalletSignerCounts] = useState({});
  const [tokenSymbols, setTokenSymbols] = useState({});
  const [tokenDecimals, setTokenDecimals] = useState({});

  // Create wallet dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWallet, setNewWallet] = useState({
    title: '',
    signers: [''],
    threshold: 1,
    isPublic: false,
    tokenAddress: ZERO_ADDRESS,
    initialFunding: '',
  });

  // Create transaction form
  const [txForm, setTxForm] = useState({
    to: '',
    amount: '',
    timeoutDays: 0,
  });

  // Rescue form
  const [rescueForm, setRescueForm] = useState({
    tokenAddress: ZERO_ADDRESS,
    to: '',
    amount: '',
  });

  // Block number updater
  useEffect(() => {
    function updateBlock() {
      if (provider !== null) {
        provider.getBlockNumber().then((block) => {
          setBlockNumber(block);
        });
      }
    }
    const interval = setInterval(updateBlock, 10000);
    updateBlock();
    return () => clearInterval(interval);
  }, [provider]);

  // Account connection handler
  useAccount({
    onConnect({ address, connector }) {
      const rpcUrl = connector.chains[0].rpcUrls['default']['http'][0];
      setAccount(address);
      setProvider(new ethers.JsonRpcProvider(rpcUrl));
    },
    onDisconnect() {
      setAccount(null);
      setProvider(null);
      setUserWallets([]);
      setWalletDashboards({});
    },
  });

  // Fetch user wallets
  const fetchUserWallets = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    try {
      const wallets = await readContract({
        address: config[network].WalletFactory,
        abi: config.abi.WalletFactory,
        functionName: "getWalletsForUser",
        args: [account]
      });
      setUserWallets(wallets);

      // Fetch dashboard and signer count for each wallet
      const dashboards = {};
      const signerCounts = {};
      const symbols = {};
      const decimals = {};
      for (const walletAddr of wallets) {
        try {
          const [dashboard, signerCount] = await Promise.all([
            readContract({
              address: walletAddr,
              abi: config.abi.MutexWallet,
              functionName: "getWalletDashboard",
              args: [account]
            }),
            readContract({
              address: walletAddr,
              abi: config.abi.MutexWallet,
              functionName: "getSignerCount",
              args: []
            })
          ]);
          dashboards[walletAddr] = dashboard;
          signerCounts[walletAddr] = Number(signerCount);

          // Fetch token symbol and decimals for ERC20 wallets
          if (dashboard.assetToken !== ZERO_ADDRESS) {
            try {
              const [symbol, tokenDec] = await Promise.all([
                readContract({
                  address: dashboard.assetToken,
                  abi: ERC20_ABI,
                  functionName: "symbol",
                  args: []
                }),
                readContract({
                  address: dashboard.assetToken,
                  abi: ERC20_ABI,
                  functionName: "decimals",
                  args: []
                })
              ]);
              symbols[walletAddr] = symbol;
              decimals[walletAddr] = Number(tokenDec);
            } catch (e) {
              console.log('Error fetching token info', e);
              symbols[walletAddr] = 'ERC20';
              decimals[walletAddr] = 18;
            }
          }
        } catch (e) {
          console.log('Error fetching dashboard for', walletAddr, e);
        }
      }
      setWalletDashboards(prev => ({ ...prev, ...dashboards }));
      setWalletSignerCounts(prev => ({ ...prev, ...signerCounts }));
      setTokenSymbols(prev => ({ ...prev, ...symbols }));
      setTokenDecimals(prev => ({ ...prev, ...decimals }));
    } catch (e) {
      console.log('Error fetching user wallets', e);
    }
    setLoading(false);
  }, [account, network]);

  // Fetch public wallets
  const fetchPublicWallets = useCallback(async () => {
    setLoading(true);
    try {
      const wallets = await readContract({
        address: config[network].WalletFactory,
        abi: config.abi.WalletFactory,
        functionName: "getPublicWallets",
        args: []
      });
      setPublicWallets(wallets);

      // Fetch dashboard and signer count for each wallet
      const dashboards = {};
      const signerCounts = {};
      const symbols = {};
      const decimals = {};
      for (const walletAddr of wallets) {
        try {
          const [dashboard, signerCount] = await Promise.all([
            readContract({
              address: walletAddr,
              abi: config.abi.MutexWallet,
              functionName: "getWalletDashboard",
              args: [account || ZERO_ADDRESS]
            }),
            readContract({
              address: walletAddr,
              abi: config.abi.MutexWallet,
              functionName: "getSignerCount",
              args: []
            })
          ]);
          dashboards[walletAddr] = dashboard;
          signerCounts[walletAddr] = Number(signerCount);

          // Fetch token symbol and decimals for ERC20 wallets
          if (dashboard.assetToken !== ZERO_ADDRESS) {
            try {
              const [symbol, tokenDec] = await Promise.all([
                readContract({
                  address: dashboard.assetToken,
                  abi: ERC20_ABI,
                  functionName: "symbol",
                  args: []
                }),
                readContract({
                  address: dashboard.assetToken,
                  abi: ERC20_ABI,
                  functionName: "decimals",
                  args: []
                })
              ]);
              symbols[walletAddr] = symbol;
              decimals[walletAddr] = Number(tokenDec);
            } catch (e) {
              console.log('Error fetching token info', e);
              symbols[walletAddr] = 'ERC20';
              decimals[walletAddr] = 18;
            }
          }
        } catch (e) {
          console.log('Error fetching dashboard for', walletAddr, e);
        }
      }
      setWalletDashboards(prev => ({ ...prev, ...dashboards }));
      setWalletSignerCounts(prev => ({ ...prev, ...signerCounts }));
      setTokenSymbols(prev => ({ ...prev, ...symbols }));
      setTokenDecimals(prev => ({ ...prev, ...decimals }));
    } catch (e) {
      console.log('Error fetching public wallets', e);
    }
    setLoading(false);
  }, [account, network]);

  // Fetch signers for expanded wallet
  const fetchWalletSigners = useCallback(async (walletAddr) => {
    try {
      const signers = await readContract({
        address: walletAddr,
        abi: config.abi.MutexWallet,
        functionName: "getSigners",
        args: []
      });
      setWalletSigners(prev => ({ ...prev, [walletAddr]: signers }));
    } catch (e) {
      console.log('Error fetching signers', e);
    }
  }, []);

  useEffect(() => {
    if (account) {
      fetchUserWallets();
    }
  }, [account, fetchUserWallets]);

  useEffect(() => {
    if (activeTab === 1) {
      fetchPublicWallets();
    }
  }, [activeTab, fetchPublicWallets]);

  // Create wallet handler
  const handleCreateWallet = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const signers = newWallet.signers.filter(s => s && ethers.isAddress(s));
      if (signers.length === 0) {
        alert('At least one valid signer address is required');
        setProcessing(false);
        return;
      }
      const fundingValue = newWallet.tokenAddress === ZERO_ADDRESS && newWallet.initialFunding
        ? BigInt(Math.floor(parseFloat(newWallet.initialFunding) * 1e18))
        : BigInt(0);

      // Ensure tokenAddress is properly formatted
      const tokenAddr = newWallet.tokenAddress && newWallet.tokenAddress !== ZERO_ADDRESS
        ? newWallet.tokenAddress
        : ZERO_ADDRESS;

      await writeContract({
        address: config[network].WalletFactory,
        abi: config.abi.WalletFactory,
        functionName: "createWallet",
        args: [
          newWallet.title,
          signers,
          BigInt(newWallet.threshold),
          newWallet.isPublic,
          tokenAddr
        ],
        value: fundingValue,
      });

      setCreateDialogOpen(false);
      setNewWallet({
        title: '',
        signers: [''],
        threshold: 1,
        isPublic: false,
        tokenAddress: ZERO_ADDRESS,
        initialFunding: '',
      });
      setTimeout(() => {
        fetchUserWallets();
        setProcessing(false);
      }, 6000);
    } catch (e) {
      console.log('Create wallet error', e);
      setProcessing(false);
    }
  };

  // Create transaction handler
  const handleCreateTransaction = async (walletAddr) => {
    if (processing) return;
    setProcessing(true);
    try {
      // Use correct decimals for the wallet's asset
      const dashboard = walletDashboards[walletAddr];
      const isVTRU = dashboard?.assetToken === ZERO_ADDRESS;
      const decimals = isVTRU ? 18 : (tokenDecimals[walletAddr] || 18);
      const amountWei = BigInt(Math.floor(parseFloat(txForm.amount) * Math.pow(10, decimals)));

      // Calculate validUntil block: 0 = use contract default (3 days), otherwise calculate from days
      const validUntilBlock = txForm.timeoutDays > 0
        ? blockNumber + (txForm.timeoutDays * BLOCKS_PER_DAY)
        : 0;

      await writeContract({
        address: walletAddr,
        abi: config.abi.MutexWallet,
        functionName: "createTransaction",
        args: [txForm.to, amountWei, validUntilBlock],
        gas: 500_000,
      });
      setTxForm({ to: '', amount: '', timeoutDays: 0 });
      setTimeout(() => {
        fetchUserWallets();
        setProcessing(false);
      }, 6000);
    } catch (e) {
      console.log('Create transaction error', e);
      setProcessing(false);
    }
  };

  // Sign transaction handler
  const handleSignTransaction = async (walletAddr) => {
    if (processing) return;
    setProcessing(true);
    try {
      await writeContract({
        address: walletAddr,
        abi: config.abi.MutexWallet,
        functionName: "signTransaction",
        args: [],
        gas: 500_000,
      });
      setTimeout(() => {
        fetchUserWallets();
        setProcessing(false);
      }, 6000);
    } catch (e) {
      console.log('Sign transaction error', e);
      setProcessing(false);
    }
  };

  // Purge expired transaction handler
  const handlePurgeExpired = async (walletAddr) => {
    if (processing) return;
    setProcessing(true);
    try {
      await writeContract({
        address: walletAddr,
        abi: config.abi.MutexWallet,
        functionName: "purgeExpired",
        args: [],
        gas: 300_000,
      });
      setTimeout(() => {
        fetchUserWallets();
        setProcessing(false);
      }, 6000);
    } catch (e) {
      console.log('Purge expired error', e);
      setProcessing(false);
    }
  };

  // Rescue handler
  const handleRescue = async (walletAddr) => {
    if (processing) return;
    setProcessing(true);
    try {
      const amountWei = BigInt(Math.floor(parseFloat(rescueForm.amount) * 1e18));
      await writeContract({
        address: walletAddr,
        abi: config.abi.MutexWallet,
        functionName: "rescue",
        args: [rescueForm.tokenAddress, rescueForm.to, amountWei],
        gas: 300_000,
      });
      setRescueForm({ tokenAddress: ZERO_ADDRESS, to: '', amount: '' });
      setTimeout(() => {
        fetchUserWallets();
        setProcessing(false);
      }, 6000);
    } catch (e) {
      console.log('Rescue error', e);
      setProcessing(false);
    }
  };

  // Add signer input field
  const addSignerField = () => {
    if (newWallet.signers.length < 10) {
      setNewWallet(prev => ({
        ...prev,
        signers: [...prev.signers, '']
      }));
    }
  };

  // Remove signer input field
  const removeSignerField = (index) => {
    if (newWallet.signers.length > 1) {
      setNewWallet(prev => ({
        ...prev,
        signers: prev.signers.filter((_, i) => i !== index)
      }));
    }
  };

  // Update signer address
  const updateSigner = (index, value) => {
    setNewWallet(prev => ({
      ...prev,
      signers: prev.signers.map((s, i) => i === index ? value : s)
    }));
  };

  // Format balance with configurable decimals
  const formatBalance = (value, decimals = 18) => {
    if (!value) return '0';
    const num = Number(value) / Math.pow(10, decimals);
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  // Shorten address
  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Handle wallet expand/collapse
  const toggleWalletExpand = (walletAddr) => {
    if (expandedWallet === walletAddr) {
      setExpandedWallet(null);
    } else {
      setExpandedWallet(walletAddr);
      fetchWalletSigners(walletAddr);
    }
  };

  const breadcrumb = [
    { to: '/', title: 'Home' },
    { title: "Multisig" },
  ];

  const wallets = activeTab === 0 ? userWallets : publicWallets;

  return (
    <PageContainer title="VTRU Scope" description="Multisig Wallets">
      <Breadcrumb title="Multisig Wallets" items={breadcrumb} />

      {/* Tabs and Actions */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab icon={<IconUsers size={20} />} iconPosition="start" label={<><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>My </Box>Wallets</>} />
            <Tab icon={<IconWorld size={20} />} iconPosition="start" label={<>Public<Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}> Wallets</Box></>} />
          </Tabs>
          <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', sm: 'flex' } }}>
            <Button
              startIcon={<IconRefresh />}
              onClick={activeTab === 0 ? fetchUserWallets : fetchPublicWallets}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<IconPlus />}
              onClick={() => {
                setNewWallet(prev => ({ ...prev, signers: [account || '', ''] }));
                setCreateDialogOpen(true);
              }}
              disabled={!account}
            >
              Create Wallet
            </Button>
          </Stack>
        </Box>
        {/* Mobile buttons */}
        <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'flex-end', mt: 2, gap: 1 }}>
          <IconButton
            onClick={activeTab === 0 ? fetchUserWallets : fetchPublicWallets}
            disabled={loading}
          >
            <IconRefresh size={20} />
          </IconButton>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<IconPlus size={18} />}
            onClick={() => {
              setNewWallet(prev => ({ ...prev, signers: [account || '', ''] }));
              setCreateDialogOpen(true);
            }}
            disabled={!account}
          >
            Create
          </Button>
        </Box>
      </Box>

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* No wallets message */}
      {!loading && wallets.length === 0 && (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="h6" color="textSecondary">
            {activeTab === 0
              ? (account ? 'No wallets found. Create your first multisig wallet!' : 'Connect your wallet to view your multisig wallets.')
              : 'No public wallets found.'}
          </Typography>
        </Box>
      )}

      {/* Wallet List */}
      {!loading && wallets.map((walletAddr) => {
        const dashboard = walletDashboards[walletAddr];
        const signers = walletSigners[walletAddr] || [];
        const isExpanded = expandedWallet === walletAddr;
        const isVTRU = dashboard?.assetToken === ZERO_ADDRESS;
        const decimals = isVTRU ? 18 : (tokenDecimals[walletAddr] || 18);
        const hasAccidentalDeposit = dashboard && (
          (isVTRU && Number(dashboard.tokenBalance) > 0) ||
          (!isVTRU && Number(dashboard.nativeBalance) > 0)
        );

        return (
          <Box
            key={walletAddr}
            sx={{
              mb: 2,
              border: 1,
              borderColor: dashboard?.isLocked ? 'warning.main' : 'divider',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            {/* Wallet Header */}
            <Box
              sx={{
                p: 2,
                bgcolor: dashboard?.isLocked ? 'warning.light' : 'background.paper',
                cursor: 'pointer',
                '&:hover': { bgcolor: dashboard?.isLocked ? 'warning.light' : 'action.hover' },
              }}
              onClick={() => toggleWalletExpand(walletAddr)}
            >
              <Grid container alignItems="center" spacing={2}>
                <Grid item>
                  <IconWallet size={32} />
                </Grid>
                <Grid item xs>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h5" fontWeight={600}>
                      {dashboard?.walletTitle || 'Loading...'}
                    </Typography>
                    {dashboard?.isLocked && (
                      <Chip
                        size="small"
                        icon={<IconLock size={14} />}
                        label="Pending Tx"
                        color="warning"
                      />
                    )}
                    {hasAccidentalDeposit && (
                      <Chip
                        size="small"
                        icon={<IconAlertTriangle size={14} />}
                        label="Rescue Available"
                        color="error"
                      />
                    )}
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">
                      {shortenAddress(walletAddr)}
                    </Typography>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); copyToClipboard(walletAddr); }}>
                      <IconCopy size={14} />
                    </IconButton>
                    <Chip
                      size="small"
                      label={isVTRU ? 'VTRU' : (tokenSymbols[walletAddr] || 'ERC20')}
                      color={isVTRU ? 'primary' : 'secondary'}
                      variant="outlined"
                    />
                  </Stack>
                </Grid>
                <Grid item>
                  <Typography variant="h4" fontWeight={600} textAlign="right">
                    {formatBalance(dashboard?.availableBalance, decimals)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" textAlign="right">
                    Available Balance
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant="body2" color="textSecondary">
                    {Number(dashboard?.requiredSigs) || '?'} of {walletSignerCounts[walletAddr] || signers.length || '?'} signers
                  </Typography>
                </Grid>
                <Grid item>
                  {isExpanded ? <IconChevronUp /> : <IconChevronDown />}
                </Grid>
              </Grid>
            </Box>

            {/* Expanded Wallet Details */}
            <Collapse in={isExpanded}>
              <Box sx={{ p: 3, bgcolor: 'background.default' }}>
                {/* Balance Summary */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box bgcolor="primary.main" p={2} borderRadius={1}>
                      <Typography variant="subtitle2" color="grey.900">Primary Balance</Typography>
                      <Typography variant="h5" fontWeight={600} color="grey.900">
                        {formatBalance(dashboard?.primaryBalance, decimals)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box bgcolor="success.main" p={2} borderRadius={1}>
                      <Typography variant="subtitle2" color="grey.900">Available</Typography>
                      <Typography variant="h5" fontWeight={600} color="grey.900">
                        {formatBalance(dashboard?.availableBalance, decimals)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box bgcolor={Number(dashboard?.escrowedFunds) > 0 ? "warning.main" : "grey.300"} p={2} borderRadius={1}>
                      <Typography variant="subtitle2" color="grey.900">Escrowed</Typography>
                      <Typography variant="h5" fontWeight={600} color="grey.900">
                        {formatBalance(dashboard?.escrowedFunds, decimals)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Signers List */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    Signers ({Number(dashboard?.requiredSigs)} required)
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {signers.map((signer, idx) => (
                      <Chip
                        key={idx}
                        label={shortenAddress(signer)}
                        color={signer.toLowerCase() === account?.toLowerCase() ? 'primary' : 'default'}
                        variant={signer.toLowerCase() === account?.toLowerCase() ? 'filled' : 'outlined'}
                        onClick={() => copyToClipboard(signer)}
                      />
                    ))}
                  </Stack>
                </Box>

                {/* Pending Transaction */}
                {dashboard?.isLocked && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      <IconClock size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                      Pending Transaction
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="textSecondary">Recipient</Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {shortenAddress(dashboard.to)}
                          <IconButton size="small" onClick={() => copyToClipboard(dashboard.to)}>
                            <IconCopy size={14} />
                          </IconButton>
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="textSecondary">Amount</Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {formatBalance(dashboard.amount, decimals)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="textSecondary">Signatures</Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {Number(dashboard.currentSigs)} / {Number(dashboard.requiredSigs)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(Number(dashboard.currentSigs) / Number(dashboard.requiredSigs)) * 100}
                          sx={{ mt: 1 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="textSecondary">Initiator</Typography>
                        <Typography variant="body1">
                          {shortenAddress(dashboard.initiator)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="textSecondary">Valid Until Block</Typography>
                        <Typography variant="body1">
                          {Number(dashboard.validUntilBlock).toLocaleString()}
                          {dashboard.isExpired && (
                            <Chip size="small" label="EXPIRED" color="error" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Sign / Purge Actions */}
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      {dashboard.userIsSigner && !dashboard.userHasSigned && !dashboard.isExpired && (
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<IconSignature />}
                          onClick={() => handleSignTransaction(walletAddr)}
                          disabled={processing}
                        >
                          Sign Transaction
                        </Button>
                      )}
                      {dashboard.userHasSigned && !dashboard.isExpired && (
                        <Chip icon={<IconCheck />} label="You have signed" color="success" />
                      )}
                      {dashboard.isExpired && dashboard.userIsSigner && (
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<IconTrash />}
                          onClick={() => handlePurgeExpired(walletAddr)}
                          disabled={processing}
                        >
                          Purge Expired
                        </Button>
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Create Transaction Form (only if not locked and user is signer) */}
                {!dashboard?.isLocked && dashboard?.userIsSigner && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      <IconSend size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                      Create Transaction
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={5}>
                        <TextField
                          fullWidth
                          label="Recipient Address"
                          value={txForm.to}
                          onChange={(e) => setTxForm(prev => ({ ...prev, to: e.target.value }))}
                          placeholder="0x..."
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Amount"
                          type="number"
                          value={txForm.amount}
                          onChange={(e) => setTxForm(prev => ({ ...prev, amount: e.target.value }))}
                          placeholder="0.0"
                          size="small"
                          inputProps={{ step: "0.0001" }}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="Timeout (days)"
                          type="number"
                          value={txForm.timeoutDays}
                          onChange={(e) => setTxForm(prev => ({ ...prev, timeoutDays: parseInt(e.target.value) || 0 }))}
                          placeholder="0 = default"
                          size="small"
                          helperText="0 = 3 days"
                          inputProps={{ min: 0, max: 30 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          onClick={() => handleCreateTransaction(walletAddr)}
                          disabled={processing || !txForm.to || !txForm.amount}
                          sx={{ height: '40px' }}
                        >
                          Create
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Rescue Section (for accidental deposits) */}
                {hasAccidentalDeposit && dashboard?.userIsSigner && (
                  <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      <IconAlertTriangle size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                      Rescue Accidental Deposits
                    </Typography>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      {isVTRU
                        ? `This VTRU wallet has ${formatBalance(dashboard.tokenBalance)} in ERC20 tokens that can be rescued.`
                        : `This ERC20 wallet has ${formatBalance(dashboard.nativeBalance)} VTRU that can be rescued.`}
                    </Alert>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Token to Rescue"
                          value={rescueForm.tokenAddress}
                          onChange={(e) => setRescueForm(prev => ({ ...prev, tokenAddress: e.target.value }))}
                          placeholder={isVTRU ? "ERC20 address" : "0x0 for VTRU"}
                          size="small"
                          helperText={isVTRU ? "Enter ERC20 token address" : "Use 0x0...0 for VTRU"}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Recipient"
                          value={rescueForm.to}
                          onChange={(e) => setRescueForm(prev => ({ ...prev, to: e.target.value }))}
                          placeholder="0x..."
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Amount"
                          type="number"
                          value={rescueForm.amount}
                          onChange={(e) => setRescueForm(prev => ({ ...prev, amount: e.target.value }))}
                          placeholder="0.0"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="error"
                          onClick={() => handleRescue(walletAddr)}
                          disabled={processing || !rescueForm.to || !rescueForm.amount}
                          sx={{ height: '40px' }}
                        >
                          Rescue
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        );
      })}

      {/* Create Wallet Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Multisig Wallet</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Wallet Title"
              value={newWallet.title}
              onChange={(e) => setNewWallet(prev => ({ ...prev, title: e.target.value }))}
              placeholder="My Multisig Wallet"
            />

            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Signers</Typography>
              {newWallet.signers.map((signer, idx) => (
                <Stack key={idx} direction="row" spacing={1} sx={{ mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={`Signer ${idx + 1}`}
                    value={signer}
                    onChange={(e) => updateSigner(idx, e.target.value)}
                    placeholder="0x..."
                    error={Boolean(signer && !ethers.isAddress(signer))}
                    helperText={signer && !ethers.isAddress(signer) ? 'Invalid address' : ''}
                  />
                  <IconButton
                    onClick={() => removeSignerField(idx)}
                    disabled={newWallet.signers.length <= 1}
                  >
                    <IconX size={18} />
                  </IconButton>
                </Stack>
              ))}
              <Button
                size="small"
                startIcon={<IconPlus size={16} />}
                onClick={addSignerField}
                disabled={newWallet.signers.length >= 10}
              >
                Add Signer
              </Button>
            </Box>

            <TextField
              fullWidth
              type="number"
              label="Threshold (Required Signatures)"
              value={newWallet.threshold}
              onChange={(e) => setNewWallet(prev => ({
                ...prev,
                threshold: Math.max(1, Math.min(parseInt(e.target.value) || 1, prev.signers.filter(s => ethers.isAddress(s)).length || 1))
              }))}
              inputProps={{ min: 1, max: newWallet.signers.filter(s => ethers.isAddress(s)).length || 1 }}
              helperText={`Between 1 and ${newWallet.signers.filter(s => ethers.isAddress(s)).length || 1}`}
            />

            <TextField
              fullWidth
              label="Token Address (0x0 for VTRU)"
              value={newWallet.tokenAddress}
              onChange={(e) => setNewWallet(prev => ({ ...prev, tokenAddress: e.target.value || ZERO_ADDRESS }))}
              placeholder={ZERO_ADDRESS}
              helperText="Leave as zero address for native VTRU wallet"
            />

            {newWallet.tokenAddress === ZERO_ADDRESS && (
              <TextField
                fullWidth
                type="number"
                label="Initial VTRU Funding (optional)"
                value={newWallet.initialFunding}
                onChange={(e) => setNewWallet(prev => ({ ...prev, initialFunding: e.target.value }))}
                placeholder="0"
                inputProps={{ step: "0.01" }}
              />
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={newWallet.isPublic}
                  onChange={(e) => setNewWallet(prev => ({ ...prev, isPublic: e.target.checked }))}
                />
              }
              label="Make wallet public (visible in public directory)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateWallet}
            disabled={
              processing ||
              !newWallet.title ||
              newWallet.signers.filter(s => ethers.isAddress(s)).length === 0
            }
          >
            {processing ? <CircularProgress size={24} /> : 'Create Wallet'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

Multisig.layout = "Blank";
