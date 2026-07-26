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
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  IconExternalLink,
} from '@tabler/icons-react';

import { readContract, writeContract } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const BLOCKS_PER_DAY = 17280; // ~5 second blocks on Vitruveo
const CHIP_BLACK_TEXT = { '& .MuiChip-label': { color: 'common.black' }, '& .MuiChip-icon': { color: 'common.black' } };
const BUTTON_BLACK_TEXT = { color: 'common.black' };
const ERC20_ABI = [
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "transfer", type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] }
];

export default function Multisig() {
  const router = useRouter();
  const isTestnet = false;
  const network = isTestnet ? 'testnet' : 'mainnet';

  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [blockNumber, setBlockNumber] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    setIsLocalhost(window.location.hostname === 'localhost');
  }, []);

  // Wallet lists
  const [userWallets, setUserWallets] = useState([]);
  const [publicWallets, setPublicWallets] = useState([]);
  const [walletDashboards, setWalletDashboards] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(1);

  // Expanded wallet detail
  const [expandedWallet, setExpandedWallet] = useState(null);
  const [walletSigners, setWalletSigners] = useState({});
  const [walletSignerCounts, setWalletSignerCounts] = useState({});
  const [tokenSymbols, setTokenSymbols] = useState({});
  const [tokenDecimals, setTokenDecimals] = useState({});
  const [walletTxHistory, setWalletTxHistory] = useState({});

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
  const [newWalletIsToken, setNewWalletIsToken] = useState(false);
  const [newWalletTokenSymbol, setNewWalletTokenSymbol] = useState('');
  const [newWalletTokenDecimals, setNewWalletTokenDecimals] = useState(18);
  const [newWalletTokenBalance, setNewWalletTokenBalance] = useState(BigInt(0));
  const [userVtruBalance, setUserVtruBalance] = useState(BigInt(0));

  // Create transaction form
  const [txForm, setTxForm] = useState({
    to: '',
    amount: '',
    timeoutDays: 3,
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

  // Fetch transaction history for a wallet
  const fetchWalletTxHistory = useCallback(async (walletAddr) => {
    if (!provider) return;
    try {
      const contract = new ethers.Contract(walletAddr, config.abi.MutexWallet, provider);

      // Query events from last ~30 days of blocks (30 * 17280 blocks)
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 30 * BLOCKS_PER_DAY);

      // Fetch all relevant events
      const [createdEvents, executedEvents, signedEvents] = await Promise.all([
        contract.queryFilter(contract.filters.TransactionCreated(), fromBlock),
        contract.queryFilter(contract.filters.TransactionExecuted(), fromBlock),
        contract.queryFilter(contract.filters.TransactionSigned(), fromBlock),
      ]);

      // Combine and format events
      const allEvents = [
        ...createdEvents.map(e => ({
          type: 'Created',
          txHash: e.transactionHash,
          blockNumber: e.blockNumber,
          initiator: e.args[0],
          to: e.args[1],
          amount: e.args[2],
        })),
        ...executedEvents.map(e => ({
          type: 'Executed',
          txHash: e.transactionHash,
          blockNumber: e.blockNumber,
          to: e.args[0],
          amount: e.args[1],
        })),
        ...signedEvents.map(e => ({
          type: 'Signed',
          txHash: e.transactionHash,
          blockNumber: e.blockNumber,
          signer: e.args[0],
          currentSigs: Number(e.args[1]),
        })),
      ].sort((a, b) => b.blockNumber - a.blockNumber);

      setWalletTxHistory(prev => ({ ...prev, [walletAddr]: allEvents }));
    } catch (e) {
      console.log('Error fetching tx history', e);
    }
  }, [provider]);

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

      // Ensure tokenAddress is properly formatted
      const tokenAddr = newWallet.tokenAddress && newWallet.tokenAddress !== ZERO_ADDRESS
        ? newWallet.tokenAddress
        : ZERO_ADDRESS;

      const isTokenWallet = tokenAddr !== ZERO_ADDRESS;
      const hasTokenFunding = isTokenWallet && newWallet.initialFunding && parseFloat(newWallet.initialFunding) > 0;

      // For VTRU wallets, initial funding is sent as msg.value
      const fundingValue = !isTokenWallet && newWallet.initialFunding
        ? BigInt(Math.floor(parseFloat(newWallet.initialFunding) * 1e18))
        : BigInt(0);

      // Create the wallet
      const txHash = await writeContract({
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

      // If token wallet with initial funding, wait for receipt and transfer tokens
      if (hasTokenFunding) {
        const tokenFundingAmount = BigInt(Math.floor(parseFloat(newWallet.initialFunding) * Math.pow(10, newWalletTokenDecimals)));

        // Wait for the transaction to be mined using the provider
        // txHash may be a string or object depending on wagmi version
        const hash = typeof txHash === 'string' ? txHash : txHash.hash;
        const receipt = await provider.waitForTransaction(hash);

        // Parse the WalletCreated event to get the new wallet address
        // Event signature: WalletCreated(address indexed wallet, address indexed implementation, uint256 version, string title, bool isPublic)
        const walletCreatedTopic = ethers.id("WalletCreated(address,address,uint256,string,bool)");
        const walletCreatedLog = receipt.logs.find(log => log.topics[0] === walletCreatedTopic);

        if (walletCreatedLog && walletCreatedLog.topics[1]) {
          // The wallet address is the first indexed parameter (topics[1])
          const newWalletAddress = '0x' + walletCreatedLog.topics[1].slice(26);

          // Transfer tokens to the new wallet
          await writeContract({
            address: tokenAddr,
            abi: ERC20_ABI,
            functionName: "transfer",
            args: [newWalletAddress, tokenFundingAmount]
          });
        }
      }

      setCreateDialogOpen(false);
      setNewWallet({
        title: '',
        signers: [''],
        threshold: 1,
        isPublic: false,
        tokenAddress: ZERO_ADDRESS,
        initialFunding: '',
      });
      setNewWalletIsToken(false);
      setNewWalletTokenSymbol('');
      setNewWalletTokenDecimals(18);
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
      setTxForm({ to: '', amount: '', timeoutDays: 3 });
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

  // Handle token address input for new wallet
  const handleNewWalletTokenAddress = async (address) => {
    setNewWallet(prev => ({ ...prev, tokenAddress: address }));
    setNewWalletTokenSymbol('');
    setNewWalletTokenDecimals(18);
    setNewWalletTokenBalance(BigInt(0));
    if (address && ethers.isAddress(address) && address !== ZERO_ADDRESS && account) {
      try {
        const [symbol, decimals, balance] = await Promise.all([
          readContract({
            address: address,
            abi: ERC20_ABI,
            functionName: "symbol",
            args: []
          }),
          readContract({
            address: address,
            abi: ERC20_ABI,
            functionName: "decimals",
            args: []
          }),
          readContract({
            address: address,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [account]
          })
        ]);
        setNewWalletTokenSymbol(symbol);
        setNewWalletTokenDecimals(Number(decimals));
        setNewWalletTokenBalance(balance);
      } catch (e) {
        console.log('Error fetching token info', e);
      }
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
      fetchWalletTxHistory(walletAddr);
    }
  };

  // Handle refresh - refreshes wallets and expanded wallet details
  const handleRefresh = async () => {
    if (activeTab === 0) {
      await fetchUserWallets();
    } else {
      await fetchPublicWallets();
    }
    // Also refresh expanded wallet's tx history
    if (expandedWallet) {
      fetchWalletTxHistory(expandedWallet);
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
              onClick={handleRefresh}
              disabled={Boolean(loading)}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<IconPlus />}
              onClick={async () => {
                setNewWallet(prev => ({ ...prev, signers: [account || '', ''], tokenAddress: ZERO_ADDRESS }));
                setNewWalletIsToken(false);
                setNewWalletTokenSymbol('');
                setNewWalletTokenBalance(BigInt(0));
                setCreateDialogOpen(true);
                // Fetch VTRU balance
                if (provider && account) {
                  const balance = await provider.getBalance(account);
                  setUserVtruBalance(balance);
                }
              }}
              disabled={Boolean(!account)}
              sx={BUTTON_BLACK_TEXT}
            >
              Create Wallet
            </Button>
          </Stack>
        </Box>
        {/* Mobile buttons */}
        <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'flex-end', mt: 2, gap: 1 }}>
          <IconButton
            onClick={handleRefresh}
            disabled={Boolean(loading)}
          >
            <IconRefresh size={20} />
          </IconButton>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<IconPlus size={18} />}
            onClick={async () => {
              setNewWallet(prev => ({ ...prev, signers: [account || '', ''], tokenAddress: ZERO_ADDRESS }));
              setNewWalletIsToken(false);
              setNewWalletTokenSymbol('');
              setNewWalletTokenBalance(BigInt(0));
              setCreateDialogOpen(true);
              // Fetch VTRU balance
              if (provider && account) {
                const balance = await provider.getBalance(account);
                setUserVtruBalance(balance);
              }
            }}
            disabled={Boolean(!account)}
            sx={BUTTON_BLACK_TEXT}
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
                bgcolor: dashboard?.isLocked ? 'info.dark' : 'background.paper',
                color: dashboard?.isLocked ? 'common.white' : 'inherit',
                cursor: 'pointer',
                '&:hover': { bgcolor: dashboard?.isLocked ? 'info.dark' : 'action.hover' },
              }}
              onClick={() => toggleWalletExpand(walletAddr)}
            >
              <Grid container alignItems="center" spacing={2}>
                <Grid item>
                  <IconWallet size={32} color={dashboard?.isLocked ? 'white' : 'inherit'} />
                </Grid>
                <Grid item xs>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h5" fontWeight={600} sx={{ color: dashboard?.isLocked ? 'common.white' : 'inherit' }}>
                      {dashboard?.walletTitle || 'Loading...'}
                    </Typography>
                    {dashboard?.isLocked && (
                      <Chip
                        size="small"
                        icon={<IconLock size={14} />}
                        label="Pending Tx"
                        color="warning"
                        sx={CHIP_BLACK_TEXT}
                      />
                    )}
                    {hasAccidentalDeposit && (
                      <Chip
                        size="small"
                        icon={<IconAlertTriangle size={14} />}
                        label="Rescue Available"
                        color="error"
                        sx={CHIP_BLACK_TEXT}
                      />
                    )}
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                    <Typography variant="body2" sx={{ color: dashboard?.isLocked ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
                      {shortenAddress(walletAddr)}
                    </Typography>
                    <IconButton size="small" sx={{ color: dashboard?.isLocked ? 'common.white' : 'inherit' }} onClick={(e) => { e.stopPropagation(); copyToClipboard(walletAddr); }}>
                      <IconCopy size={14} />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{ color: dashboard?.isLocked ? 'common.white' : 'inherit' }}
                      onClick={(e) => { e.stopPropagation(); window.open(`https://explorer.vitruveo.ai/address/${walletAddr}?tab=txs`, '_blank'); }}
                    >
                      <IconExternalLink size={14} />
                    </IconButton>
                    <Chip
                      size="small"
                      label={isVTRU ? 'VTRU' : (tokenSymbols[walletAddr] || 'ERC20')}
                      sx={dashboard?.isLocked
                        ? { bgcolor: 'rgba(255,255,255,0.2)', color: 'common.white' }
                        : { bgcolor: 'grey.700', color: 'common.white' }
                      }
                    />
                    {isVTRU && (
                      <Chip
                        size="small"
                        clickable
                        label="Stakes"
                        onClick={(e) => { e.stopPropagation(); router.push(`/staking/vtru/${walletAddr}`); }}
                        sx={{ bgcolor: 'primary.main', color: 'common.black' }}
                      />
                    )}
                  </Stack>
                </Grid>
                <Grid item>
                  <Typography variant="h4" fontWeight={600} textAlign="right" sx={{ color: dashboard?.isLocked ? 'common.white' : 'inherit' }}>
                    {formatBalance(dashboard?.availableBalance, decimals)}
                  </Typography>
                  <Typography variant="body2" textAlign="right" sx={{ color: dashboard?.isLocked ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
                    Available Balance
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant="body2" sx={{ color: dashboard?.isLocked ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
                    {Number(dashboard?.requiredSigs) || '?'} of {walletSignerCounts[walletAddr] || signers.length || '?'} signers
                  </Typography>
                </Grid>
                <Grid item sx={{ color: dashboard?.isLocked ? 'common.white' : 'inherit' }}>
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
                        onClick={() => copyToClipboard(signer)}
                        sx={signer.toLowerCase() === account?.toLowerCase()
                          ? { bgcolor: 'primary.main', color: 'common.black' }
                          : { bgcolor: 'grey.700', color: 'common.white' }
                        }
                      />
                    ))}
                  </Stack>
                </Box>

                {/* Pending Transaction */}
                {dashboard?.isLocked && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'info.dark', borderRadius: 1, color: 'common.white' }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'common.white' }}>
                      <IconClock size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                      Pending Transaction
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Recipient</Typography>
                        <Typography variant="body1" fontWeight={500} sx={{ color: 'common.white' }}>
                          {shortenAddress(dashboard.to)}
                          <IconButton size="small" sx={{ color: 'common.white' }} onClick={() => copyToClipboard(dashboard.to)}>
                            <IconCopy size={14} />
                          </IconButton>
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Amount</Typography>
                        <Typography variant="body1" fontWeight={500} sx={{ color: 'common.white' }}>
                          {formatBalance(dashboard.amount, decimals)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Signatures</Typography>
                        <Typography variant="body1" fontWeight={500} sx={{ color: 'common.white' }}>
                          {Number(dashboard.currentSigs)} / {Number(dashboard.requiredSigs)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(Number(dashboard.currentSigs) / Number(dashboard.requiredSigs)) * 100}
                          sx={{ mt: 1 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Initiator</Typography>
                        <Typography variant="body1" sx={{ color: 'common.white' }}>
                          {shortenAddress(dashboard.initiator)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Valid Until Block</Typography>
                        <Typography variant="body1" sx={{ color: 'common.white' }}>
                          {Number(dashboard.validUntilBlock).toLocaleString()}
                          {dashboard.isExpired && (
                            <Chip size="small" label="EXPIRED" color="error" sx={{ ml: 1, ...CHIP_BLACK_TEXT }} />
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
                          disabled={Boolean(processing)}
                          sx={BUTTON_BLACK_TEXT}
                        >
                          Sign Transaction
                        </Button>
                      )}
                      {dashboard.userHasSigned && !dashboard.isExpired && (
                        <Chip icon={<IconCheck />} label="You have signed" color="success" sx={CHIP_BLACK_TEXT} />
                      )}
                      {dashboard.isExpired && dashboard.userIsSigner && (
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<IconTrash />}
                          onClick={() => handlePurgeExpired(walletAddr)}
                          disabled={Boolean(processing)}
                          sx={BUTTON_BLACK_TEXT}
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
                          InputProps={{ sx: { fontFamily: '"Roboto Mono", monospace' } }}
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
                          onChange={(e) => setTxForm(prev => ({ ...prev, timeoutDays: Math.max(1, parseInt(e.target.value) || 3) }))}
                          size="small"
                          helperText="1-30 days"
                          inputProps={{ min: 1, max: 30 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          onClick={() => handleCreateTransaction(walletAddr)}
                          disabled={Boolean(processing || !txForm.to || !txForm.amount)}
                          sx={{ height: '40px', ...BUTTON_BLACK_TEXT }}
                        >
                          Create
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Transaction History */}
                {walletTxHistory[walletAddr] && walletTxHistory[walletAddr].length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      Transaction History
                    </Typography>
                    <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Details</TableCell>
                            <TableCell>Block</TableCell>
                            <TableCell align="right">Explorer</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {walletTxHistory[walletAddr].map((event, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={event.type}
                                  color={
                                    event.type === 'Executed' ? 'success' :
                                    event.type === 'Created' ? 'primary' :
                                    event.type === 'Signed' ? 'info' : 'default'
                                  }
                                  sx={CHIP_BLACK_TEXT}
                                />
                              </TableCell>
                              <TableCell sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.8rem' }}>
                                {event.type === 'Created' && (
                                  <>{formatBalance(event.amount, decimals)} {isVTRU ? 'VTRU' : tokenSymbols[walletAddr]} to {shortenAddress(event.to)}</>
                                )}
                                {event.type === 'Executed' && (
                                  <>{formatBalance(event.amount, decimals)} {isVTRU ? 'VTRU' : tokenSymbols[walletAddr]} sent to {shortenAddress(event.to)}</>
                                )}
                                {event.type === 'Signed' && (
                                  <>{shortenAddress(event.signer)} signed ({event.currentSigs} total)</>
                                )}
                              </TableCell>
                              <TableCell>{event.blockNumber.toLocaleString()}</TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={() => window.open(`https://explorer.vitruveo.ai/tx/${event.txHash}`, '_blank')}
                                >
                                  <IconExternalLink size={16} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
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
                          InputProps={{ sx: { fontFamily: '"Roboto Mono", monospace' } }}
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
                          InputProps={{ sx: { fontFamily: '"Roboto Mono", monospace' } }}
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
                          disabled={Boolean(processing || !rescueForm.to || !rescueForm.amount)}
                          sx={{ height: '40px', ...BUTTON_BLACK_TEXT }}
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
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Wallet Title"
                value={newWallet.title}
                onChange={(e) => setNewWallet(prev => ({ ...prev, title: e.target.value }))}
                placeholder="My Multisig Wallet"
                sx={{ flexGrow: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={newWallet.isPublic}
                    onChange={(e) => setNewWallet(prev => ({ ...prev, isPublic: e.target.checked }))}
                  />
                }
                label="Public"
                sx={{ whiteSpace: 'nowrap', display: isLocalhost ? undefined : 'none' }}
              />
            </Stack>

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
                    InputProps={{ sx: { fontFamily: '"Roboto Mono", monospace' } }}
                  />
                  <IconButton
                    onClick={() => removeSignerField(idx)}
                    disabled={Boolean(newWallet.signers.length <= 1)}
                  >
                    <IconX size={18} />
                  </IconButton>
                </Stack>
              ))}
              <Button
                size="small"
                startIcon={<IconPlus size={16} />}
                onClick={addSignerField}
                disabled={Boolean(newWallet.signers.length >= 10)}
              >
                Add Signer
              </Button>
            </Box>

            <Stack direction="row" spacing={3} alignItems="center">
              <TextField
                type="number"
                label="Required"
                value={newWallet.threshold}
                onChange={(e) => setNewWallet(prev => ({
                  ...prev,
                  threshold: Math.max(1, Math.min(parseInt(e.target.value) || 1, prev.signers.filter(s => ethers.isAddress(s)).length || 1))
                }))}
                inputProps={{ min: 1, max: newWallet.signers.filter(s => ethers.isAddress(s)).length || 1 }}
                sx={{ width: '30%' }}
              />
              <Typography variant="h4" fontWeight={600} sx={{ textAlign: 'left' }}>
                <Box component="span" sx={{ color: 'common.white' }}>{newWallet.threshold}</Box>
                <Box component="span" sx={{ color: 'text.secondary', px: 1 }}>of</Box>
                <Box component="span" sx={{ color: 'common.white' }}>{newWallet.signers.filter(s => ethers.isAddress(s)).length || 0}</Box>
                <Box component="span" sx={{ color: 'text.secondary', pl: 1 }}>Signers Required</Box>
              </Typography>
            </Stack>

            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Asset Type</Typography>
              <ToggleButtonGroup
                value={newWalletIsToken ? 'token' : 'vtru'}
                exclusive
                onChange={(_, value) => {
                  if (value === 'vtru') {
                    setNewWalletIsToken(false);
                    setNewWallet(prev => ({ ...prev, tokenAddress: ZERO_ADDRESS }));
                    setNewWalletTokenSymbol('');
                  } else if (value === 'token') {
                    setNewWalletIsToken(true);
                  }
                }}
                fullWidth
                size="small"
              >
                <ToggleButton value="vtru">VTRU</ToggleButton>
                <ToggleButton value="token">{newWalletTokenSymbol || 'Token'}</ToggleButton>
              </ToggleButtonGroup>
              {newWalletIsToken && (
                <TextField
                  fullWidth
                  size="small"
                  label="Token Contract Address"
                  value={newWallet.tokenAddress === ZERO_ADDRESS ? '' : newWallet.tokenAddress}
                  onChange={(e) => handleNewWalletTokenAddress(e.target.value)}
                  placeholder="0x..."
                  sx={{ mt: 2 }}
                  error={Boolean(newWallet.tokenAddress && newWallet.tokenAddress !== ZERO_ADDRESS && !ethers.isAddress(newWallet.tokenAddress))}
                  helperText={newWalletTokenSymbol ? `Token: ${newWalletTokenSymbol}` : ''}
                  InputProps={{ sx: { fontFamily: '"Roboto Mono", monospace' } }}
                />
              )}
            </Box>

            <TextField
              fullWidth
              type="number"
              label={`Initial Wallet Funding (${newWalletIsToken ? (newWalletTokenSymbol || 'Token') : 'VTRU'})`}
              value={newWallet.initialFunding}
              onChange={(e) => setNewWallet(prev => ({ ...prev, initialFunding: e.target.value }))}
              placeholder="0"
              inputProps={{ step: "0.01", min: 0 }}
              error={Boolean(newWallet.initialFunding && parseFloat(newWallet.initialFunding) > 0 && (
                newWalletIsToken
                  ? parseFloat(newWallet.initialFunding) > Number(newWalletTokenBalance) / Math.pow(10, newWalletTokenDecimals)
                  : parseFloat(newWallet.initialFunding) > Number(userVtruBalance) / 1e18
              ))}
              helperText={
                newWalletIsToken
                  ? `Balance: ${formatBalance(newWalletTokenBalance, newWalletTokenDecimals)} ${newWalletTokenSymbol || 'tokens'}`
                  : `Balance: ${formatBalance(userVtruBalance, 18)} VTRU`
              }
            />

                      </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateWallet}
            disabled={Boolean(
              processing ||
              !newWallet.title ||
              newWallet.signers.filter(s => ethers.isAddress(s)).length === 0 ||
              (parseFloat(newWallet.initialFunding || '0') > 0 && (
                newWalletIsToken
                  ? parseFloat(newWallet.initialFunding) > Number(newWalletTokenBalance) / Math.pow(10, newWalletTokenDecimals)
                  : parseFloat(newWallet.initialFunding) > Number(userVtruBalance) / 1e18
              ))
            )}
            sx={BUTTON_BLACK_TEXT}
          >
            {processing ? <CircularProgress size={24} /> : 'Create Wallet'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

Multisig.layout = "Blank";
