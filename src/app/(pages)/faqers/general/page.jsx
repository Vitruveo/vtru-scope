"use client";

import React, { useEffect, useState, useMemo } from "react";
import Box from "@mui/material/Box";
import {
  Grid,
  Typography,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import Breadcrumb from "@/app/(pages)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/(pages)/components/container/PageContainer";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import config from "@/app/config/vtru-contracts.json";

export default function Faqers_General() {
  const isTestnet = process.env.NEXT_PUBLIC_IS_TESTNET === true;
  const network = isTestnet === true ? "testnet" : "mainnet";

  const [buttonMessage, setButtonMessage] = useState('GO');
  const [buttonEnabled, setButtonEnabled] = useState(true);

  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);

  let processing = false;

  useAccount({
    onConnect({ address, connector, isReconnected }) {
      const rpcUrl = connector.chains[0].rpcUrls["default"]["http"][0];
      setProvider(new ethers.JsonRpcProvider(rpcUrl));
      setAccount(address);

    },
    onDisconnect() {
      setAccount(null);

    },
  });

  useEffect(() => {
    async function initAccountView(connectedOwner) {

    }

    if (account) initAccountView(account);

  }, [account, network, provider]);

  const breadcrumb = [
    {
      to: "/",
      title: "Home",
    },
    {
      title: "FAQers",
    },
    {
      title: "General",
    },
  ];


  return (
    <PageContainer
      title="VTRU Scope"
      description="Interactive FAQ Answers"
    >
      <Breadcrumb title="Interactive FAQ Answers" items={breadcrumb} />

    </PageContainer>
  );
}

Faqers_General.layout = "Blank";
