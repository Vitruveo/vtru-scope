"use client";

import React, { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import { CardContent, Grid, Typography, Button, Alert} from "@mui/material";
import { styled } from "@mui/material/styles";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import NFTCard from "@/app/(DashboardLayout)/components/widgets/cards/NFTCard";

import { useSearchParams } from "next/navigation";

import { readContract, writeContract  } from "@wagmi/core";
import vaultConfig from "@/app/config/vault-config.json";
import * as testConfig from "@/app/config/boosters_test.json";
import * as prodConfig from "@/app/config/boosters_prod.json";
import * as testCoreConfig  from "@/app/config/corevest_test.json";
import * as prodCoreConfig  from "@/app/config/corevest_prod.json";

import { useAccount } from "wagmi";
import { ethers } from "ethers";


export default function Nfts() {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loadMessage, setLoadMessage] = useState(
    "Scanning account for NFTs..."
  );

  const [provider, setProvider] = useState(null);
  const isTestnet = process.env.NEXT_PUBLIC_IS_TESTNET === true;
  const network = isTestnet === true ? 'testnet' : 'mainnet';

  useAccount({
    onConnect({ address, connector, isReconnected }) {
      const rpcUrl = connector.chains[0].rpcUrls["default"]["http"][0];
      setProvider(new ethers.JsonRpcProvider(rpcUrl));
      setNfts((arr) => []);
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
//     connectedOwner = '0xd07D220d7e43eCa35973760F8951c79dEebe0dcc';
 //    connectedOwner = '0xABBA32cF845256A4284cdbA91D82C96CbB13dc59';
//     connectedOwner = '0xC0ee5bb36aF2831baaE1d31f358ccA46dAa6a4e8';

     if (connectedOwner !== null && provider !== null) {

        let tokens = await readContract({
          address: vaultConfig.licenseRegistry[network],
          abi: vaultConfig.licenseRegistry.abi,
          functionName: "getTokens",
          args: [connectedOwner],
        });

        for(let t=0; t<tokens.length; t++) {
      
            try {

              const token = tokens[t];
              let tokenURI = await readContract({
                address: token.vault,
                abi: vaultConfig.creatorVault.abi,
                functionName: "tokenURI",
                args: [token.tokenId],
              });

              const frags = tokenURI.split('/');
              const assetKey = frags[frags.length - 1];
              const assetUrl = `https://studio-api.vitruveo.xyz/assets/scope/${assetKey}`;

              const resp = await fetch(assetUrl);          
              const json = await resp.json();
              console.log(assetKey, assetUrl, json)
              json.key = `X${t}`;

              setNfts(nfts => [json,...nfts]);
           
            } catch(e) {

            }

        }
         
      } else {
        setNfts((arr) => []);
      }
    } 

    getTokens(account);
  }, [contract, account]);



  const breadcrumb = [
    {
      to: "/",
      title: "Home",
    },
    {
      title: "NFTs",
    },
  ];

  const gridCols = 3;
  const btnCols = 3;

  return (
    <PageContainer title="VTRU Scope" description="View all account NFTs">
      <Breadcrumb title="NFTs" items={breadcrumb} />

      {nfts.length == 0 ? (
        account == null ? (
          <Typography variant="h4" sx={{ mx: 2 }}>
            Connect account to view NFTs.
          </Typography>
        ) : (
          <Typography variant="h4" sx={{ mx: 2 }}>
            {loadMessage}
          </Typography>
        )
      ) : (
        <>
         
          <Grid container spacing={3}>
            {
              nfts.length == 0 ?
              "No NFTs found in account."
              :
              nfts.map((nft, index) => {
                return <NFTCard nft={nft} key={index} />;
              })
            }
          </Grid>
        </>
      )}
    </PageContainer>
  );
}

Nfts.layout = "Blank";
