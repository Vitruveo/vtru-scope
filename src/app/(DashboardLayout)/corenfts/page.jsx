"use client"

import React, { useEffect, useState, useRef } from "react";
import { Grid, Typography } from '@mui/material';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import CoreNFTCard from '@/app/(DashboardLayout)/components/widgets/cards/CoreNFTCard';

import { readContract, watchAccount } from "@wagmi/core";
import * as prodConfig  from "@/app/config/corevest_prod.json";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

export default function CoreNft () {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [nfts, setNfts] = useState([]);

  const config = prodConfig; //data?.data?.chain?.id == 1490 ? prodConfig : testConfig;

  useAccount({
    
    onConnect({ address, connector, isReconnected }) {
      const rpcUrl = connector.chains[0].rpcUrls['default']['http'][0];
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      provider.getBlockNumber().then((result) => {
        console.log("Current block number: " + result);
      });
      
      setNfts(arr => []);
      setContract(new ethers.Contract(config.contractAddress, config.abi, provider));
      setAccount(address);
     
    },
    onDisconnect() {
      setAccount(null);
      setNfts(arr => []);
    },
  });


  useEffect(() => {

    async function getTokens() {

      if (account !== null) {
        const transfers = contract?.filters?.CoreNFTGranted(null, null, account, null);
        if (transfers) {
          const logEvents = await contract.queryFilter(transfers);
          const tokens = [];
          logEvents.map((log) => {
            const info = contract.interface.parseLog(log);
            tokens.push(Number(info.args.tokenId));
          });
          await getAccountNfts(tokens);
        }  
      } else {
        setNfts(arr => []);
      }
    }

    getTokens();

  }, [contract, account ])


  async function getAccountNfts(tokens) {
    try {
      let nftTmp = [];
      for(let t=0; t<tokens.length; t++) {
        let token = tokens[t];
        const nft = await readContract({
          address: config?.contractAddress,
          abi: config?.abi,
          functionName: "getCoreTokenInfo",
          args: [token]
        });
        const tokenUri = await readContract({
          address: config?.contractAddress,
          abi: config?.abi,
          functionName: "tokenURI",
          args: [token]
        });
        nft.class = JSON.parse(atob(tokenUri.split(',')[1]));
        nftTmp.push(nft);
      }

      if (nftTmp.length > 0) {
        setNfts(arr => nftTmp);
      } else {
        setNfts(arr => []);
      }
      console.log(nfts);

    } catch (error) {
        console.log(error);
    }

  }

  const breadcrumb = [
    {
      to: '/',
      title: 'Home',
    },
    {
      title: 'Core NFTs',
    },
  ];



  return (
    <PageContainer title="VTRU Scope" description="View all Core NFTs">
      <Breadcrumb title="Core NFTs" items={breadcrumb} />
             
          {
            nfts.length == 0 ?
              (account == null ?
                <Typography variant="h4" sx={{mx: 2}}>Connect account to view Core NFTs.</Typography>
              :
                <Typography variant="h4" sx={{mx: 2}}>No Core NFTs in connected account.</Typography>
              )
            :
              <Grid container spacing={3}>
                  {
                    nfts.map((nft) => {
                      return (
                        <CoreNFTCard nft={nft} key={nft.id}/>
                      );
                    })
                  }
              </Grid>
          }
    
    </PageContainer>
  ); 
};

CoreNft.layout = "Blank";
