"use client";

import React, { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import { CardContent, Grid, Typography, Button, Alert} from "@mui/material";
import { styled } from "@mui/material/styles";
import Breadcrumb from "@/app/(pages)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/(pages)/components/container/PageContainer";
import VortexNFTCard from "@/app/(pages)/components/widgets/cards/VortexNFTCard";

import { useSearchParams } from "next/navigation";

import { readContract, writeContract  } from "@wagmi/core";
import vortexConfig from "@/app/config/vortex-config.json";

import { useAccount } from "wagmi";
import { ethers } from "ethers";
 

export default function Nfts() {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [commonNfts, setCommonNfts] = useState([]);
  const [rareNfts, setRareNfts] = useState([]);
  const [ultraNfts, setUltraNfts] = useState([]);
  const [epicNfts, setEpicNfts] = useState([]);
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
      setCommonNfts((arr) => []);
      setRareNfts((arr) => []);
      setUltraNfts((arr) => []);
      setEpicNfts((arr) => []);
      setAccount(address);


    },
    onDisconnect() {
      setAccount(null);
      setCommonNfts((arr) => []);
      setRareNfts((arr) => []);
      setUltraNfts((arr) => []);
      setEpicNfts((arr) => []);
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
          address: vortexConfig.contractAddress,
          abi: vortexConfig.abi,
          functionName: "getTokens",
          args: [connectedOwner],
        });

        const order = ["Epic", "Ultra", "Rare", "Common"];
        tokens = tokens.sort(function(a,b) {
          return order.indexOf( a.rarity ) - order.indexOf( b.rarity );
        });  

        for(let t=0; t<tokens.length; t++) {
      
            try {

              const token = tokens[t];
              let tokenURI = await readContract({
                address: vortexConfig.contractAddress,
                abi: vortexConfig.abi,
                functionName: "tokenURI",
                args: [token.tokenId],
              });
              const json = JSON.parse(atob(tokenURI.split(',')[1]));
              
              json.key = `X${t}`;
              json.id = Number(token.tokenId);
              const vibes = token.vibe === true ? 1 : 0;
              switch(json.rarity) {
                case 'Common': json.vibecount = json.id <= 25000 ? 1 : vibes; setCommonNfts(commonNfts => [...commonNfts, json]); ; break;
                case 'Rare': json.vibecount = json.id <= 25000 ? 2 : vibes; setRareNfts(rareNfts => [...rareNfts, json]);  break;
                case 'Ultra': json.vibecount = json.id <= 25000 ? 3 : vibes; setUltraNfts(ultraNfts => [...ultraNfts, json]);  break;
                case 'Epic': json.vibecount = json.id <= 25000 ? 4 : vibes;  setEpicNfts(epicNfts => [...epicNfts, json]); break;
              }
           
            } catch(e) {

            }

        }
         
      } else {
        setCommonNfts((arr) => []);
        setRareNfts((arr) => []);
        setUltraNfts((arr) => []);
        setEpicNfts((arr) => []);
      }
    } 

    getTokens(account);
  }, [contract, account, provider]);



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
      <Breadcrumb title="Vortex NFTs" items={breadcrumb} />

      {commonNfts.length == 0 && rareNfts.length == 0 && ultraNfts.length == 0 && epicNfts.length == 0 ? (
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
          <h2>Epic ({epicNfts.length})</h2>
          <Grid container spacing={3} style={{marginBottom: '100px'}}>
            {
              epicNfts.length == 0 ?
              "No Epic NFTs."
              :
              epicNfts.map((nft, index) => {
                return <VortexNFTCard nft={nft} key={index} />;
              })
            }
          </Grid>

          <h2>Ultra ({ultraNfts.length})</h2>
          <Grid container spacing={3} style={{marginBottom: '100px'}}>
            {
              ultraNfts.length == 0 ?
              "No Ultra NFTs."
              :
              ultraNfts.map((nft, index) => {
                return <VortexNFTCard nft={nft} key={index} />;
              })
            }
          </Grid>

          <h2>Rare ({rareNfts.length})</h2>
          <Grid container spacing={3} style={{marginBottom: '100px'}}>
            {
              rareNfts.length == 0 ?
              "No Rare NFTs."
              :
              rareNfts.map((nft, index) => {
                return <VortexNFTCard nft={nft} key={index} />;
              })
            }
          </Grid>

          <h2>Common ({commonNfts.length})</h2>
          <Grid container spacing={3} style={{marginBottom: '100px'}}>
            {
              commonNfts.length == 0 ?
              "No Common NFTs."
              :
              commonNfts.map((nft, index) => {
                return <VortexNFTCard nft={nft} key={index} />;
              })
            }
          </Grid>
        </>
      )}
    </PageContainer>
  );
}

Nfts.layout = "Blank";
