"use client";

import React, { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import { CardContent, Grid, Typography, Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import NFTCard from "@/app/(DashboardLayout)/components/widgets/cards/NFTCard";

import { readContract, writeContract  } from "@wagmi/core";
import * as testConfig from "@/app/config/boosters_test.json";
import * as prodConfig from "@/app/config/boosters_prod.json";

import { useAccount } from "wagmi";
import { ethers } from "ethers";


export default function NFTs() {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loadMessage, setLoadMessage] = useState(
    "Scanning account for NFTs..."
  );

  const [boosters, setBoosters] = useState([]);

  const config = process.env.NEXT_PUBLIC_IS_TESTNET == "true" ? testConfig : prodConfig;

  useAccount({
    onConnect({ address, connector, isReconnected }) {
      const rpcUrl = connector.chains[0].rpcUrls["default"]["http"][0];
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      setNfts((arr) => []);
      setContract(
        new ethers.Contract(config.contractAddress, config.abi, provider)
      );
      setAccount(address);
    },
    onDisconnect() {
      setAccount(null);
      setNfts((arr) => []);
      setLoadMessage("Account disconnected.");
    },
  });


  useEffect(() => {
    async function getTokens(connectedOwner) {
      if (connectedOwner !== null) {
        const transfers = contract?.filters?.Transfer(
          null,
          connectedOwner,
          null
        );
        if (transfers) {
          const logEvents = await contract.queryFilter(transfers);
          const tokens = [];
          for (let l = 0; l < logEvents.length; l++) {
            const log = logEvents[l];
            const info = contract.interface.parseLog(log);
            const tokenId = info.args.tokenId;
            const currentOwner = await readContract({
              address: config?.contractAddress,
              abi: config?.abi,
              functionName: "ownerOf",
              args: [tokenId],
            });
            if (currentOwner.toLowerCase() == connectedOwner.toLowerCase()) {
              tokens.push(Number(tokenId));
            }
          }
          await getAccountNfts(tokens);
        }
      } else {
        setNfts((arr) => []);
      }
    }

    getTokens(account);
  }, [contract, account]);

  
  async function getAccountNfts(tokens) {
    try {
      let nftTmp = [];
      for (let t = 0; t < tokens.length; t++) {
        let tokenId = tokens[t];
        const nft = await readContract({
          address: config?.contractAddress,
          abi: config?.abi,
          functionName: "Boosters",
          args: [tokenId],
        });
        if (nft[1]) {
          nftTmp.push({
            tokenId: Number(nft[0]),
            isBoosted: nft[1],
            vtru: Number(nft[2]),
            boosterName: nft[3],
            boosterType: nft[4],
            basisPoints: Number(nft[5])
          });  
        }
      }

      if (nftTmp.length > 0) {
        setNfts((arr) => nftTmp.sort((a,b) => a.tokenId < b.tokenId));
      } else {
        setNfts((arr) => []);
        setLoadMessage("No Boosters found in account.");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const breadcrumb = [
    {
      to: "/",
      title: "Home",
    },
    {
      title: "NFTs",
    },
  ];

  return (
    <PageContainer title="VTRU Scope" description="View Account NFTs">
      <Breadcrumb title="NFTs" items={breadcrumb} />

      {nfts.length == 0 ? (
        account == null ? (
          <Typography variant="h4" sx={{ mx: 2 }}>
            Connect account to view Booster NFTs.
          </Typography>
        ) : (
          <Typography variant="h4" sx={{ mx: 2 }}>
            {loadMessage}
          </Typography>
        )
      ) : (
        <>
        
          <Grid container spacing={3}>
            {nfts.map((nft) => {
              return <NFTCard nft={nft} key={nft.tokenId}/>;
            })}
          </Grid>
        </>
      )}
    </PageContainer>
  );
}

NFTs.layout = "Blank";
