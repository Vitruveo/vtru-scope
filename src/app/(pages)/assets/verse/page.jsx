"use client";

import React, { useEffect, useState, useRef } from "react";
import Breadcrumb from "@/app/(pages)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/(pages)/components/container/PageContainer";
import VerseNFTCard from "@/app/(pages)/components/widgets/cards/VerseNFTCard";
import VerseStats from "@/app/(pages)/components/verse/Stats";

import {
  Typography,
  Box,
  Slider,
  CardContent,
  Grid,
  Button,
} from "@mui/material";


import { writeContract } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";

import { ethers } from "ethers";
import { useAccount, useBalance } from "wagmi";

export default function Stake() {
  const DECIMALS = BigInt(String(Math.pow(10, 18)));

  const isTestnet = false; //Boolean(process.env.NEXT_PUBLIC_IS_TESTNET) === true;
  const network = isTestnet === true ? "testnet" : "mainnet";

  const vtroAddress = "0xDECAF2f187Cb837a42D26FA364349Abc3e80Aa5D";
  const vtroAbi = [
    {
      inputs: [
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "balanceOf",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [
        {
          name: "_owner",
          type: "address",
        },
        {
          name: "_spender",
          type: "address",
        },
      ],
      name: "allowance",
      outputs: [
        {
          name: "",
          type: "uint256",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        {
          name: "_spender",
          type: "address",
        },
        {
          name: "_value",
          type: "uint256",
        },
      ],
      name: "approve",
      outputs: [
        {
          name: "",
          type: "bool",
        },
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "recipient",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "vtroAmount",
          type: "uint256",
        },
      ],
      name: "transfer",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "sender",
          type: "address",
        },
        {
          internalType: "address",
          name: "recipient",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "vtroAmount",
          type: "uint256",
        },
      ],
      name: "transferFrom",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

  let processing = false;

  const [account, setAccount] = useState(null);

  const [buttonStakeMessage, setButtonStakeMessage] = useState("STAKE VTRU");
  const [buttonStakeEnabled, setButtonStakeEnabled] = useState(false);

  const [buttonSwapMessage, setButtonSwapMessage] = useState("STAKE VTRO");
  const [buttonSwapEnabled, setButtonSwapEnabled] = useState(false);

  const [loadMessage, setLoadMessage] = useState(
    "Scanning account for tokens..."
  );

  const [unlockedVtruBalance, setUnlockedVtruBalance] = useState(0);
  const [vtroBalance, setVtroBalance] = useState(0);
  const [stakeAmountSlider, setStakeAmountSlider] = useState(0);
  const [stakeAmountInput, setStakeAmountInput] = useState(0);
  const [stakeAmount, setStakeAmount] = useState(0);
  const [swapAmountSlider, setSwapAmountSlider] = useState(0);
  const [swapAmountInput, setSwapAmountInput] = useState(0);
  const [swapAmount, setSwapAmount] = useState(0);
  const [nft, setNft] = useState(null);

  const rpcUrl = 'https://rpc.vitruveo.xyz';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const verseContract = new ethers.Contract(config[network].VERSE, config.abi.VERSE, provider);
  const vtroContract = new ethers.Contract(vtroAddress, vtroAbi, provider);



  useAccount({
    onConnect({ address, connector, isReconnected }) {
      setAccount(address);
    },
    onDisconnect() {
      setAccount(null);
      setLoadMessage("Account disconnected.");
    },
  });

  useEffect(() => {
    async function getVtroBalance() {
      if (account == null || vtroContract == null) return;
        const rawAccountBalance = await vtroContract.balanceOf(account);
        setVtroBalance(Number(rawAccountBalance) / Math.pow(10, 18));
    }

    getVtroBalance();
  }, [account, vtroContract]);

  useEffect(() => {
    async function getVerseNFT() {
      if (account == null || verseContract == null) return;

      try {
        const rawNFT = await verseContract.getVerseNFTByOwner(account);
        setNft({
          id: Number(rawNFT[0]),
          units: Number(rawNFT[2]),
        });
        console.log(rawNFT);
      } catch (e) {}
    }

    getVerseNFT();
  }, [account, verseContract]);

  const balance = useBalance({
    address: account,
    cacheTime: 15_000,
  });

  useEffect(() => {
    setUnlockedVtruBalance(
      Number(Math.trunc(Number(balance?.data?.value) / Math.pow(10, 18)))
    );
  }, [balance]);

  const handleStakeSliderChange = (event) => {
    const percentage = event.target.value;
    setStakeAmountSlider(percentage);
    if (unlockedVtruBalance > 0) {
      const amount = Number(
        Math.trunc((unlockedVtruBalance * percentage) / 100)
      );
      setStakeAmountInput(amount);
      setStakeAmount(amount);
    }
  };

  const handleSwapSliderChange = (event) => {
    const percentage = event.target.value;
    setSwapAmountSlider(percentage);
    if (vtroBalance > 0) {
      const amount = Number(
        Math.trunc((vtroBalance * percentage) / 100 / 10) * 10
      );
      setSwapAmountInput(amount);
      setSwapAmount(amount);
    }
  };

  const handleStakeAmountInputChange = (event) => {
    const amount = event.target.value;
    if (amount <= Math.trunc(Number(unlockedVtruBalance))) {
      setStakeAmountInput(amount);
      setStakeAmount(amount);
    }
  };

  const handleSwapAmountInputChange = (event) => {
    const amount = event.target.value;
    if (amount <= Math.trunc(Number(vtroBalance))) {
      setSwapAmountInput(amount);
      setSwapAmount(amount);
    }
  };

  async function handleStake() {
    if (processing) return;
    processing = true;

    // Send transaction
    try {
      await writeContract({
        address: config[network].VERSE,
        abi: config.abi.VERSE,
        functionName: "mintStake",
        args: [],
        gas: 20_500_000,
        value: BigInt(stakeAmount) * DECIMALS,
      });
      setTimeout(() => {
        window.location.reload();
      }, 7000);
    } catch (e) {
      console.log("***************", e);
      processing = false;
    }
  }

  async function swapForVerse(vtroSpend) {
    try {
      await writeContract({
        address: config[network].VERSE,
        abi: config.abi.VERSE,
        functionName: "mintSwap",
        args: [vtroSpend],
        gas: 20_500_000,
      });
      setTimeout(() => {
        window.location.reload();
      }, 7000);
    } catch (e) {
      console.log("***************", e);
      processing = false;
    }
  }

  async function handleSwap() {
    if (processing) return;
    processing = true;

    const allowance = await vtroContract.allowance(
      account,
      config[network].VERSE
    );
    const vtroSpend = BigInt(swapAmountInput) * DECIMALS;
    const units = swapAmountInput / 10;

    if (allowance < vtroSpend) {
      try {
        await writeContract({
          address: vtroAddress,
          abi: vtroAbi,
          functionName: "approve",
          args: [config[network].VERSE, vtroSpend],
          gas: 20_500_000,
        });
        setTimeout(() => {
          swapForVerse(units);
        }, 8500);
      } catch (e) {
        console.log("***************", e);
        processing = false;
      }
    } else {
      await swapForVerse(units);
    }
  }

function buttonStakeState(enabled) {
  setButtonStakeEnabled(enabled);
  setButtonStakeMessage("Wait...");
}

function buttonSwapState(enabled) {
  setButtonSwapEnabled(enabled);
  setButtonSwapMessage("Wait...");
}

  const breadcrumb = [
    {
      to: "/",
      title: "Home",
    },
    {
      title: "Digital Assets",
    },
    {
      title: "VERSE",
    },
  ];


  return (
    <PageContainer title="VTRU Scope" description="VERSE Digital Assets">
      <Breadcrumb
        title="VERSE (Vitruveo Entertainment Revenue Sharing Engine)"
        items={breadcrumb}
      />

      <VerseStats provider={provider} verseAddress={config[network].VERSE} verseAbi={config.abi.VERSE} />

      {

        account ?
      <>
        <Grid container spacing={3} style={{ marginBottom: "30px" }} key={1}>
          <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
            <Box
              bgcolor={"primary.main"}
              textAlign="center"
              style={{ height: "120px" }}
            >
              <CardContent px={1}>
                <Typography
                  color={"grey.900"}
                  variant="subtitle1"
                  fontWeight={600}
                >
                  Stake 1 VTRU for 1 VERSE
                </Typography>

                <Typography color={"grey.900"} variant="h1" fontWeight={600}>
                  <input
                    type="number"
                    value={stakeAmountInput}
                    onChange={handleStakeAmountInputChange}
                    style={{
                      textAlign: "center",
                      marginLeft: "10px",
                      padding: "2px",
                      fontSize: "30px",
                      width: "90%",
                      fontFamily: "monospace",
                    }}
                  />
                </Typography>
              </CardContent>
            </Box>
          </Grid>

          <Grid item xs={12} sm={12} md={3} lg={3} key={2}>
            <Box
              bgcolor={"primary.main"}
              textAlign="center"
              style={{ height: "120px" }}
            >
              <CardContent px={1}>
                <Typography
                  color={"grey.900"}
                  variant="subtitle1"
                  fontWeight={600}
                >
                  Stake {stakeAmountSlider}% of{" "}
                  {Math.trunc(Number(unlockedVtruBalance)).toLocaleString()}
                </Typography>
                <Slider
                  defaultValue={0}
                  step={1}
                  min={0}
                  max={100}
                  onChange={handleStakeSliderChange}
                  sx={{ color: "grey.900" }}
                />
                {/* <Typography
                      color={"grey.900"}
                      variant="subtitle1"
                      fontWeight={600}
                    >
                      Airdrop: {Math.trunc(stakeAmount/150)} VIBE (150 each)
                    </Typography> */}
              </CardContent>
            </Box>
          </Grid>

          <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
            <Box
              bgcolor={"primary.main"}
              textAlign="center"
              style={{ height: "120px" }}
            >
              <CardContent px={1}>
                <Typography
                  color={"grey.900"}
                  variant="subtitle1"
                  fontWeight={600}
                >
                  VERSE Units from Stake
                </Typography>
                <Typography
                  color={"grey.900"}
                  variant={"h1"}
                  fontWeight={600}
                  style={{ marginTop: "5px" }}
                >
                  {stakeAmountInput}
                </Typography>
              </CardContent>
            </Box>
          </Grid>

          <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
            <Box textAlign="center">
              <CardContent px={1}>
                <Button
                  color="primary"
                  size="large"
                  disabled={stakeAmountInput == 0}
                  style={{ fontWeight: "900", marginTop: "15px" }}
                  fullWidth
                  onClick={() => {
                    buttonStakeState(false);
                    handleStake();
                  }}
                >
                  {buttonStakeMessage}
                </Button>
              </CardContent>
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={3} style={{ marginBottom: "30px" }} key={2}>
          <Grid item xs={12} sm={12} md={3} lg={3} key={1}>
            <Box
              bgcolor={"secondary.main"}
              textAlign="center"
              style={{ height: "120px" }}
            >
              <CardContent px={1}>
                <Typography
                  color={"grey.900"}
                  variant="subtitle1"
                  fontWeight={600}
                >
                  Stake 10 VTRO for 1 VERSE
                </Typography>

                <Typography color={"grey.900"} variant="h1" fontWeight={600}>
                  <input
                    type="number"
                    value={swapAmountInput}
                    onChange={handleSwapAmountInputChange}
                    style={{
                      textAlign: "center",
                      marginLeft: "10px",
                      padding: "2px",
                      fontSize: "30px",
                      width: "90%",
                      fontFamily: "monospace",
                    }}
                  />
                </Typography>
              </CardContent>
            </Box>
          </Grid>

          <Grid item xs={12} sm={12} md={3} lg={3} key={2}>
            <Box
              bgcolor={"secondary.main"}
              textAlign="center"
              style={{ height: "120px" }}
            >
              <CardContent px={1}>
                <Typography
                  color={"grey.900"}
                  variant="subtitle1"
                  fontWeight={600}
                >
                  Stake {swapAmountSlider}% of{" "}
                  {Math.trunc(Number(vtroBalance)).toLocaleString()}
                </Typography>
                <Slider
                  defaultValue={0}
                  step={1}
                  min={0}
                  max={100}
                  onChange={handleSwapSliderChange}
                  sx={{ color: "grey.900" }}
                />
                {/* <Typography
                      color={"grey.900"}
                      variant="subtitle1"
                      fontWeight={600}
                    >
                      Airdrop: {Math.trunc(stakeAmount/150)} VIBE (150 each)
                    </Typography> */}
              </CardContent>
            </Box>
          </Grid>

          <Grid item xs={12} sm={12} md={3} lg={3} key={3}>
            <Box
              bgcolor={"secondary.main"}
              textAlign="center"
              style={{ height: "120px" }}
            >
              <CardContent px={1}>
                <Typography
                  color={"grey.900"}
                  variant="subtitle1"
                  fontWeight={600}
                >
                  VERSE Units from Stake
                </Typography>
                <Typography
                  color={"grey.900"}
                  variant={"h1"}
                  fontWeight={600}
                  style={{ marginTop: "5px" }}
                >
                  {Math.trunc(swapAmountInput / 10).toLocaleString()}
                </Typography>
              </CardContent>
            </Box>
          </Grid>

          <Grid item xs={12} sm={12} md={3} lg={3} key={4}>
            <Box textAlign="center">
              <CardContent px={1}>
                <Button
                  color="primary"
                  size="large"
                  disabled={swapAmountInput == 0}
                  style={{ fontWeight: "900", marginTop: "15px" }}
                  fullWidth
                  onClick={() => {
                    buttonSwapState(false);
                    handleSwap();
                  }}
                >
                  {buttonSwapMessage}
                </Button>
              </CardContent>
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {nft == null ? <></> : <VerseNFTCard nft={nft} key={nft.id} />}
        </Grid>
      </>
      :
      <></>
      }
    </PageContainer>
  );
}

Stake.layout = "Blank";
