"use client";
import React, { useEffect, useState, useRef } from "react";
import PageContainer from "@/app/(pages)/components/container/PageContainer";
import CustomSelect from "@/app/(pages)/components/forms/theme-elements/CustomSelect";
import Link from "next/link";

import { Typography, Box, CardContent, Grid } from "@mui/material";
import InfoBar from "@/app/(pages)/components/widgets/InfoBar";

import { readContract, writeContract } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";

import { ethers } from "ethers";
import VerseStats from "@/app/(pages)/components/verse/Stats";

export default function Dashboard() {
  const Capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const DIVISOR = BigInt(String(Math.pow(10, 18)));
  const MAX_SUPPLY = 250_000_000;
  const TOTAL_SUPPLY = 60_000_000;
  const network = "mainnet";

  let processing = false;

  const provider = new ethers.JsonRpcProvider("https://rpc.vitruveo.xyz");
  const [totalSupply] = useState(TOTAL_SUPPLY);
  const [blockNumber, setBlockNumber] = useState(0);

  const PANCAKE_ABI = [
    {
      inputs: [],
      name: "getReserves",
      outputs: [
        {
          internalType: "uint112",
          name: "_reserve0",
          type: "uint112",
        },
        {
          internalType: "uint112",
          name: "_reserve1",
          type: "uint112",
        },
        {
          internalType: "uint32",
          name: "_blockTimestampLast",
          type: "uint32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  const [balances, setBalances] = useState([]);

  const [stakedBalance, setStakedBalance] = useState(0);
  const [vestingBalance, setVestingBalance] = useState(0);

  const [vibeBalance, setVibeBalance] = useState(0);
  const [veoBalance, setVeoBalance] = useState(0);
  const [verseBalance, setVerseBalance] = useState(0);
  const [vusdBalance, setVusdBalance] = useState(0);
  const [wvtruBalance, setWvtruBalance] = useState(0);
  const [bridgeBalance, setBridgeBalance] = useState(0);

  const [perksBalance, setPerksBalance] = useState(0);
  const [vipBalance, setVipBalance] = useState(0);
  const [partnerBalance, setPartnerBalance] = useState(0);
  const [boosterBalance, setBoosterBalance] = useState(0);
  const [communityVibeBalance, setCommunityVibeBalance] = useState(0);
  const [perksPoolBalance, setPerksPoolBalance] = useState(0);

  const [treasuryBalance, setTreasuryBalance] = useState(0);
  const [circulatingSupply, setCirculatingSupply] = useState(0);
  const [tradingSupply, setTradingSupply] = useState(0);

  const [goal, setGoal] = useState({
    jan12: 0,
    jan19: 0,
    jan26: 0,
    balance: 0,
    wallet: 0
  });

  const [nkBalance, setNkBalance] = useState(0);
  const [mpBalance, setMpBalance] = useState(0);
  const [apBalance, setApBalance] = useState(0);

  const [whaleCount, setWhaleCount] = useState(0);
  const [whaleTotal, setWhaleTotal] = useState(0);
  const [whaleMax, setWhaleMax] = useState(0);
  const [whaleMin, setWhaleMin] = useState(0);

  const [lastVTRUPrice, setlastVTRUPrice] = useState(0);
  const [vtruPriceColor, setvtruPriceColor] = useState(0);

  const [lastVTROPrice, setlastVTROPrice] = useState(0);
  const [vtroPriceColor, setvtroPriceColor] = useState(0);

  const [tvl, setTvl] = useState(0);
  const [mcap, setMcap] = useState(0);

  const vaultsBalance = 382693;

  useEffect(() => {
    function updateBlock() {
      if (!processing) {
        provider.getBlockNumber().then((block) => {
          setBlockNumber(block);
          readContract({
            address: "0x8B3808260a058ECfFA9b1d0eaA988A1b4167DDba",
            abi: PANCAKE_ABI,
            functionName: "getReserves",
            args: [],
          }).then((info) => {
            // VTRU
            const wVTRUReserve = info[0];
            const usdcVtruReserve = info[1];
            const vtruPrice =
              Number(
                (usdcVtruReserve * BigInt(Math.pow(10, 18))) / wVTRUReserve
              ) / Math.pow(10, 6);

            if (lastVTRUPrice !== 0) {
              if (Number(vtruPrice.toFixed(4)) < lastVTRUPrice) {
                setvtruPriceColor(-1);
              } else if (Number(vtruPrice.toFixed(4)) > lastVTRUPrice) {
                setvtruPriceColor(1);
              }
            }
            setlastVTRUPrice(Number(vtruPrice.toFixed(4)));
          });

          readContract({
            address: "0xEe4f40e39B06D3561b94f2F24184f4b66A64Fd3e",
            abi: PANCAKE_ABI,
            functionName: "getReserves",
            args: [],
          }).then((info) => {
            // VTRO
            const vtroReserve = info[1];
            const usdcVtroReserve = info[0];
            const vtroPrice =
              Number(
                (usdcVtroReserve * BigInt(Math.pow(10, 18))) / vtroReserve
              ) / Math.pow(10, 6);

            if (lastVTROPrice !== 0) {
              if (Number(vtroPrice.toFixed(4)) < lastVTROPrice) {
                setvtroPriceColor(-1);
              } else if (Number(vtroPrice.toFixed(4)) > lastVTROPrice) {
                setvtroPriceColor(1);
              }
            }
            setlastVTROPrice(Number(vtroPrice.toFixed(4)));

            processing = false;
          });
        });
      }
    }

    const interval = setInterval(() => {
      updateBlock();
    }, 15000);

    updateBlock();
    return () => clearInterval(interval);
  }, [blockNumber, provider]);

  function formatCurrency(amount) {
    if (amount < 1_000_000) {
      return amount
        ? Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
          }).format(amount)
        : "";
    } else {
      return amount
        ? Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(amount)
        : "";
    }
  }

  function targetPerWeek(goal, weeks = 3) {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const daysElapsedInWeek1 = dayOfWeek; // Days passed since Sunday of Week 1
    const daysRemainingInWeek1 = 7 - daysElapsedInWeek1; // Remaining days in Week 1
    const totalDays = weeks * 7; // Total days in the goal period
  
    const week1Target = (goal * daysRemainingInWeek1) / totalDays;
    const remainingGoal = goal - week1Target; // Remaining goal after Week 1
    const perFullWeekTarget = remainingGoal / (weeks - 1); // Equal targets for Weeks 2 and 3
  
    return [
      Math.ceil(week1Target), // Week 1 target
      Math.ceil(perFullWeekTarget), // Week 2 target
      Math.ceil(perFullWeekTarget), // Week 3 target
    ];
  };

  function lower(a) {
    return a.toLowerCase();
  }

  function display(n, isCurrency) {
    if (typeof n === "number") {
      return n > 0
        ? isCurrency == true
          ? formatCurrency(n)
          : Number(n).toLocaleString()
        : "⏳";
    } else {
      return n;
    }
  }

  useEffect(() => {
    setTvl((stakedBalance + vestingBalance) * lastVTRUPrice);
    setMcap(circulatingSupply * lastVTRUPrice);
  }, [lastVTRUPrice, stakedBalance, vestingBalance, circulatingSupply]);

  useEffect(() => {
    async function fetchBalances() {
      const response = await fetch(
        "https://explorer.vitruveo.xyz/api/v2/addresses?page=1"
      );
      const data = await response.json();
      const balances = data.items.map((i) => {
        return {
          account: lower(i.hash),
          balance: Number(BigInt(i.coin_balance) / DIVISOR),
          isContract: i.is_contract,
        };
      });
      let targets = [];
      for (let i = 0; i < balances.length; i++) {
        const item = balances[i];
        switch (item.account) {
          case lower(config[network].CoreStake):
            setStakedBalance(item.balance);
            targets.push(i);
            break;
          case lower(config[network].CoreVestV2):
            setVestingBalance(item.balance);
            targets.push(i);
            break;
          case lower(config[network].VIBE):
            setVibeBalance(item.balance);
            targets.push(i);
            break;
          case lower(config[network].VEO):
            setVeoBalance(item.balance);
            targets.push(i);
            break;
          case lower(config[network].VUSD):
            setVusdBalance(item.balance);
            targets.push(i);
            break;
          case lower(config[network].wVTRU):
            setWvtruBalance(item.balance);
            targets.push(i);
            break;
          case lower(config[network].VTRU):
            setBridgeBalance(item.balance);
            targets.push(i);
            break;
          case lower("0xCA01dDbEacFcEF7456C4f291BE2F216F8fd81Ea6"):
            setTreasuryBalance(item.balance);
            targets.push(i);
            break;
          case lower("0xCA0216cE0F48c0b9595597634B17a3C7Ef12F4d4"):
            setPerksBalance(item.balance);
            targets.push(i);
            break;
          case lower("0xCA03830833702561926b34F65e9C822959B2Ccf5"):
            setVipBalance(item.balance);
            targets.push(i);
            break;
          case lower("0xCA0552B00450DC23EEe813486e75154c48791218"):
            setPartnerBalance(item.balance);
            targets.push(i);
            break;
          case lower("0xCA06ecC58c9EB5237270d3360bD36f3Bf04CcC9c"):
            setBoosterBalance(item.balance);
            targets.push(i);
            break;
          case lower("0xACED10A8b06fa98Eb729d13D9F24870864f754b3"):
            setCommunityVibeBalance(item.balance);
            targets.push(i);
            break;
          case lower("0xec274828B11338A5fa5A0f83F60DaD7be429F15C"):
            setPerksPoolBalance(item.balance);
            targets.push(i);
            break;
        }
      }

      const KNOWN = 14;

      for (let t = 0; t < KNOWN; t++) {
        balances[targets[t]] = null;
      }

      const WHALE_BALANCE = 50_000;

      let tempWhaleTotal = 0;
      let tempWhaleCount = 0;
      let tempWhaleMax = 0;
      let tempWhaleMin = 100_000_000;

      for (let i = 0; i < balances.length; i++) {
        const item = balances[i];
        if (item !== null && item.balance >= WHALE_BALANCE) {
          tempWhaleTotal += item.balance;
          tempWhaleCount++;
          if (item.balance > tempWhaleMax) tempWhaleMax = item.balance;
          if (item.balance < tempWhaleMin) tempWhaleMin = item.balance;
        }
      }

      setWhaleCount(tempWhaleCount);
      setWhaleTotal(tempWhaleTotal);
      setWhaleMax(tempWhaleMax);
      setWhaleMin(tempWhaleMin);

      if (targets.length == KNOWN) {
        let reserved =
          wvtruBalance +
          bridgeBalance +
          veoBalance +
          vibeBalance +
          vusdBalance +
          vestingBalance +
          stakedBalance +
          perksBalance +
          vipBalance +
          partnerBalance +
          boosterBalance +
          treasuryBalance +
          communityVibeBalance +
          perksPoolBalance +
          vaultsBalance;
        if (reserved > 0) {
          let currentCirculatingSupply = totalSupply - reserved;
          setCirculatingSupply(currentCirculatingSupply);

          // Goal calculations
          const goalBalance = 20_000_000 - stakedBalance;
          const walletMin = goalBalance / 30_000;
          const days = Math.max(0, Math.ceil((new Date(new Date().getFullYear(), 1, 1) - new Date()) / (1000 * 60 * 60 * 24)));
          const weekly = targetPerWeek(goalBalance, 3);
          setGoal({
            balance: goalBalance,
            jan12: weekly[0],
            jan19: weekly[1],
            jan26: weekly[2],
            wallet: walletMin
          });
        }
        setTradingSupply(wvtruBalance + bridgeBalance);
      }
    }

    fetchBalances();
  }, [blockNumber, stakedBalance]);

  const handleClick = function (account) {
    window.open(`https://explorer.vitruveo.xyz/address/${account}`);
  };

  const contractBarItems = [
    {
      label: "VIBE",
      amount: vibeBalance,
      address: "0x8e7C7f0DF435Be6773641f8cf62C590d7Dde5a8a",
    },
    {
      label: "VEO",
      amount: veoBalance,
      address: "0x4D5B24179c656A88087eF4369887fD58AB5e8EF3",
    },
    {
      label: "VUSD",
      amount: vusdBalance,
      address: "0x1D607d8c617A09c638309bE2Ceb9b4afF42236dA",
    },
    {
      label: "wVTRU",
      amount: wvtruBalance,
      address: "0x3ccc3F22462cAe34766820894D04a40381201ef9",
    },
    {
      label: "Bridge",
      amount: bridgeBalance,
      address: "0x931AC5400ba4BD2d882Ef6Bc3C5714113f2a4d29",
    },
  ];

  const reservedBarItems = [
    {
      label: "Perks Vault",
      amount: perksBalance,
      address: "0xCA0216cE0F48c0b9595597634B17a3C7Ef12F4d4",
    },
    {
      label: "Perks Pool",
      amount: perksPoolBalance,
      address: "0xec274828B11338A5fa5A0f83F60DaD7be429F15C",
    },
    {
      label: "Validators",
      amount: vipBalance,
      address: "0xCA03830833702561926b34F65e9C822959B2Ccf5",
    },
    {
      label: "Boosters",
      amount: boosterBalance,
      address: "0xCA06ecC58c9EB5237270d3360bD36f3Bf04CcC9c",
    },
    {
      label: "Partners",
      amount: partnerBalance,
      address: "0xCA0552B00450DC23EEe813486e75154c48791218",
    },
    {
      label: "Treasury",
      amount: treasuryBalance,
      address: "0xCA01dDbEacFcEF7456C4f291BE2F216F8fd81Ea6",
    },
    {
      label: "VIBE Gift",
      amount: communityVibeBalance,
      address: "0xACED10A8b06fa98Eb729d13D9F24870864f754b3",
    },
  ];

  const challengeBarItems = [
    {
      label: "Staked 🎉",
      amount: stakedBalance,
      address: "0xf793A4faD64241c7273b9329FE39e433c2D45d71",
    },
    { 
      label: "Remaining ⏳",
      amount: goal.balance,
      address: "0xf793A4faD64241c7273b9329FE39e433c2D45d71"
    }
  ]

  const lockedBarItems = [
    {
      label: "Vesting",
      amount: vestingBalance,
      address: "0xaEf0a72A661B82CB1d871FCA5117486C664EeF13",
    },
    {
      label: "Staked",
      amount: stakedBalance,
      address: "0xf793A4faD64241c7273b9329FE39e433c2D45d71",
    },
    {
      label: "Creator Vaults",
      amount: vaultsBalance,
      address: "0xDFda76C704515d19C737C54cFf523E45ab01d90A",
    },
  ];

  const linkStyle = {
    color: "inherit", // Prevent visited link color
    textDecoration: "none", // Optional: No underline
  };

  return (
    <PageContainer title="VTRU Scope" description="VTRU Scope by Vitruveo">
      <h1 style={{ fontSize: "30px", color: "#fff", marginTop: "40px" }}>
        Current
      </h1>
      <Grid container spacing={3} style={{ marginBottom: "30px" }}>
        <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
          <Box
            bgcolor={"secondary.main"}
            textAlign="center"
            style={{ cursor: "pointer" }}
            onClick={() =>
              handleClick("0xCA01dDbEacFcEF7456C4f291BE2F216F8fd81Ea6")
            }
          >
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Market Capitalization
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(mcap, true)}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={2}>
          <Box bgcolor={"secondary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                wVTRU Price
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {vtruPriceColor == 0 ? (
                  <span>{display(lastVTRUPrice, true)}</span>
                ) : vtruPriceColor == -1 ? (
                  <span style={{ color: "#FF4D4F" }}>
                    {display(lastVTRUPrice, true)}
                  </span>
                ) : (
                  <span style={{ color: "#008000" }}>
                    {display(lastVTRUPrice, true)}
                  </span>
                )}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
          <Box bgcolor={"secondary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                VTRO Price
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {vtroPriceColor == 0 ? (
                  <span>{display(lastVTROPrice, true)}</span>
                ) : vtroPriceColor == -1 ? (
                  <span style={{ color: "#FF4D4F" }}>
                    {display(lastVTROPrice, true)}
                  </span>
                ) : (
                  <span style={{ color: "#008000" }}>
                    {display(lastVTROPrice, true)}
                  </span>
                )}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
          <Box bgcolor={"secondary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Current Block
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(blockNumber)}
              </Typography>
            </CardContent>
          </Box>
        </Grid>
      </Grid>

      <h1 style={{ fontSize: "30px", color: "#fff", marginTop: "40px" }}>
        Supply
      </h1>
      <Grid container spacing={3} style={{  }}>
        <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
          <Box bgcolor={"secondary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Circulating Supply<sup>1</sup>
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(circulatingSupply)}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={2}>
          <Box bgcolor={"secondary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Total Supply
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(totalSupply)}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
          <Box bgcolor={"secondary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Max Supply
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(MAX_SUPPLY)}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
          <Box bgcolor={"secondary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Trading Supply (Wrap + Bridge)
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(tradingSupply)}
              </Typography>
            </CardContent>
          </Box>
        </Grid>
      </Grid>
      <h4 style={{color: 'white', marginBottom: "30px"}}><sup>1</sup> Excludes total balance of all Creator Vaults of { display(vaultsBalance) } which is locked and can only be staked.</h4>

      <h1 style={{ fontSize: "30px", color: "#fff", marginTop: "40px" }}>
        20M Community Staking Challenge
      </h1>
      <Grid container spacing={3} style={{ marginBottom: "30px" }}>      

        <Grid item xs={12} sm={12} md={9} lg={9} key={9}>
          <InfoBar items={challengeBarItems} />
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
          <Box bgcolor={"secondary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Individual Wallet Stake Minimum
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {goal.wallet.toFixed(0)}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

      </Grid>


      <Grid container spacing={3} style={{ marginBottom: "30px" }}>


        <Grid item xs={12} sm={12} md={4} lg={4} key={2}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Jan. 12 Week Goal
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(goal.jan12)}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={4} key={1}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Jan. 19 Week Goal
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(goal.jan19)}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={4} key={4}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Jan. 26 Week Goal
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(goal.jan26)}
              </Typography>
            </CardContent>
          </Box>
        </Grid>
      </Grid>


      <h1 style={{ fontSize: "30px", color: "#fff", marginTop: "40px" }}>
        VERSE Stats
      </h1>
      <VerseStats
        provider={provider}
        verseAddress={config[network].VERSE}
        verseAbi={config.abi.VERSE}
      />

      <h1 style={{ fontSize: "30px", color: "#fff", marginTop: "40px" }}>
        Locked Balances
      </h1>
      <Grid container spacing={3} style={{ marginBottom: "30px" }}>
        <Grid item xs={12} sm={12} md={3} lg={3} key={2}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Total
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(lockedBarItems.reduce((a, b) => a + b.amount, 0))}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={6} lg={6} key={3}>
          <InfoBar items={lockedBarItems} />
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
          <Box
            bgcolor={"primary.main"}
            textAlign="center"
            style={{ cursor: "pointer" }}
            onClick={() =>
              handleClick("0xCA01dDbEacFcEF7456C4f291BE2F216F8fd81Ea6")
            }
          >
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Total Value Locked (TVL)
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(tvl, true)}
              </Typography>
            </CardContent>
          </Box>
        </Grid>
      </Grid>

      <h1 style={{ fontSize: "30px", color: "#fff", marginTop: "40px" }}>
        Contract Balances
      </h1>
      <Grid container spacing={3} style={{ marginBottom: "30px" }}>
        <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Total
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(contractBarItems.reduce((a, b) => a + b.amount, 0))}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={9} lg={9} key={2}>
          <InfoBar items={contractBarItems} />
        </Grid>
      </Grid>

      <h1 style={{ fontSize: "30px", color: "#fff", marginTop: "40px" }}>
        Reserved Balances
      </h1>
      <Grid container spacing={3} style={{ marginBottom: "30px" }}>
        <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Total
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(reservedBarItems.reduce((a, b) => a + b.amount, 0))}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={9} lg={9} key={2}>
          <InfoBar items={reservedBarItems} />
        </Grid>
      </Grid>

      <h1 style={{ fontSize: "30px", color: "#fff", marginTop: "40px" }}>
        Wallet Balance &gt;50K
      </h1>
      <Grid container spacing={3} style={{ marginBottom: "30px" }}>
        <Grid item xs={12} sm={12} md={4} lg={4} key={1}>
          <Box bgcolor={"grey.700"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Count
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(whaleCount)}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={4} key={2}>
          <Box bgcolor={"grey.700"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Total
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(whaleTotal)}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={4} key={3}>
          <Box bgcolor={"grey.700"} textAlign="center">
            <CardContent px={1}>
              <Typography
                color={"grey.900"}
                variant="subtitle1"
                fontWeight={600}
              >
                Max
              </Typography>
              <Typography color={"grey.900"} variant="h2" fontWeight={600}>
                {display(whaleMax)}
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        {/* <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
                  <Box bgcolor={"grey.700"} textAlign="center">
                    <CardContent px={1}>
                  
                            <Typography
                              color={"grey.900"}
                              variant="subtitle1"
                              fontWeight={600}
                            >
                              Min
                            </Typography>
                            <Typography
                              color={"grey.900"}
                              variant="h2"
                              fontWeight={600}
                            >
                              { display(whaleMin) }                        
                            </Typography>
                      </CardContent>
                  </Box>
                </Grid> */}
      </Grid>

      <h1 style={{ fontSize: "30px", color: "#fff", marginTop: "40px" }}>
        Trading
      </h1>
      <Grid container spacing={3} style={{ marginBottom: "30px" }}>
        <Grid item xs={12} sm={12} md={4} lg={4} key={1}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography color={"grey.900"} variant="h3" fontWeight={600}>
                <Link
                  style={linkStyle}
                  target="_new"
                  href="https://pancakeswap.finance/?chain=bsc&inputCurrency=0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d&outputCurrency=0xb08504D245713Ca9692C8fA605E76A0A11Ed4955&fee=10000"
                >
                  <img
                    alt="PancakeSwap"
                    src="/images/pancake.png"
                    style={{ width: "24px", position: "relative", top: "2px" }}
                  />{" "}
                  USDC/VTRU (BSC)
                </Link>
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={4} key={2}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography color={"grey.900"} variant="h3" fontWeight={600}>
                <Link
                  style={linkStyle}
                  target="_new"
                  href="https://pancakeswap.finance/?chain=bsc&inputCurrency=BNB&outputCurrency=0xb08504D245713Ca9692C8fA605E76A0A11Ed4955&fee=10000"
                >
                  <img
                    alt="PancakeSwap"
                    src="/images/pancake.png"
                    style={{ width: "24px", position: "relative", top: "2px" }}
                  />{" "}
                  BNB/VTRU (BSC)
                </Link>
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={4} key={3}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography color={"grey.900"} variant="h3" fontWeight={600}>
                <Link
                  style={linkStyle}
                  target="_new"
                  href="https://app.uniswap.org/swap?chain=mainnet&inputCurrency=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&outputCurrency=0x7070f01a2040bd06109c6fc478cd139b323459af&fee=10000"
                >
                  <img
                    alt="Uniswap"
                    src="/images/uniswap.png"
                    style={{ width: "24px", position: "relative", top: "2px" }}
                  />{" "}
                  USDC/VTRU (ETH)
                </Link>
              </Typography>
            </CardContent>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={3} style={{ marginBottom: "30px" }}>
        <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography color={"grey.900"} variant="h5" fontWeight={600}>
                <Link
                  style={linkStyle}
                  target="_new"
                  href="https://www.dextools.io/app/en/bnb/pair-explorer/0xbe14641c6e776721ae8cff906612bdee81693e7e"
                >
                  DEX Tools (BSC)
                </Link>
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={2}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography color={"grey.900"} variant="h5" fontWeight={600}>
                <Link
                  style={linkStyle}
                  target="_new"
                  href="https://dexscreener.com/bsc/0xbe14641c6e776721ae8cff906612bdee81693e7e"
                >
                  DEX Screener (BSC)
                </Link>
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography color={"grey.900"} variant="h5" fontWeight={600}>
                <Link
                  style={linkStyle}
                  target="_new"
                  href="https://www.dextools.io/app/en/ether/pair-explorer/0xdad3e43020f50a94b92c6f7617c6540b54adf87e"
                >
                  DEX Tools (ETH)
                </Link>
              </Typography>
            </CardContent>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
          <Box bgcolor={"primary.main"} textAlign="center">
            <CardContent px={1}>
              <Typography color={"grey.900"} variant="h5" fontWeight={600}>
                <Link
                  style={linkStyle}
                  target="_new"
                  href="https://dexscreener.com/ethereum/0xdad3e43020f50a94b92c6f7617c6540b54adf87e"
                >
                  DEX Screener (ETH)
                </Link>
              </Typography>
            </CardContent>
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
}

Dashboard.layout = "Blank";
