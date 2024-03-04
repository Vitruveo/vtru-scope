"use client"

import React, { useEffect, useState, useRef } from "react";
import { Grid, Typography } from '@mui/material';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import BoosterNFTCard from '@/app/(DashboardLayout)/components/widgets/cards/BoosterNFTCard';

import { readContract, watchAccount } from "@wagmi/core";
import * as prodConfig  from "@/app/config/boosters_prod.json";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

export default function Boosters () {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [nfts, setNfts] = useState([]);

  const config = prodConfig; //data?.data?.chain?.id == 1490 ? prodConfig : testConfig;

  useAccount({
    
    onConnect({ address, connector, isReconnected }) {
      const rpcUrl = connector.chains[0].rpcUrls['default']['http'][0];
      const provider = new ethers.JsonRpcProvider(rpcUrl);      
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

    async function getTokens(connectedOwner) {
     
      if (connectedOwner !== null) {
        const transfers = contract?.filters?.Transfer(null, connectedOwner, null);
        if (transfers) {
          const logEvents = await contract.queryFilter(transfers);
          const tokens = [];
          for(let l=0; l<logEvents.length; l++) {
            const log = logEvents[l];
            const info = contract.interface.parseLog(log);
            const tokenId = info.args.tokenId;
            const currentOwner = await readContract({
                                    address: config?.contractAddress,
                                    abi: config?.abi,
                                    functionName: "ownerOf",
                                    args: [tokenId]
                                  });
            if (currentOwner.toLowerCase() == connectedOwner.toLowerCase()) {
              tokens.push(Number(tokenId));
            }
          }
          await getAccountNfts(tokens);
        }  
      } else {
        setNfts(arr => []);
      }
    }

    getTokens(account);

  }, [contract, account ])

  const getData = async (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const resp = await fetch(`https://booster.vitruveo.xyz/api/metadata/${id}.json`);
        const json = await resp.json();
        resolve(json.data);
      } catch (error) {
        reject(error);
      }
    });
  };

  async function getAccountNfts(tokens) {
    try {
      let nftTmp = [];
      for(let t=0; t<tokens.length; t++) {
        let tokenId = tokens[t];
        const nft = await readContract({
                      address: config?.contractAddress,
                      abi: config?.abi,
                      functionName: "Boosters",
                      args: [tokenId]
                    });
        nftTmp.push(nft);
      }

      if (nftTmp.length > 0) {
        setNfts(arr => nftTmp);
      } else {
        setNfts(arr => []);
      }
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
      title: 'Boosters',
    },
  ];



  return (
    <PageContainer title="VTRU Scope" description="View all Core NFTs">
      <Breadcrumb title="Booster NFTs" items={breadcrumb} />
             
          {
            nfts.length == 0 ?
              (account == null ?
                <Typography variant="h4" sx={{mx: 2}}>Connect account to view Booster NFTs.</Typography>
              :
                <Typography variant="h4" sx={{mx: 2}}>No Booster NFTs in connected account.</Typography>
              )
            :
              <Grid container spacing={3}>
                  {
                    nfts.map((nft) => {
                      return (
                        <BoosterNFTCard nft={nft} key={nft[0]}/>
                      );
                    })
                  }
              </Grid>
          }
    
    </PageContainer>
  ); 
};

Boosters.layout = "Blank";
