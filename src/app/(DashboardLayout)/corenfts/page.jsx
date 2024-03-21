"use client"

import React, { useEffect, useState, useRef } from "react";
import { Grid, Typography } from '@mui/material';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import CoreNFTCard from '@/app/(DashboardLayout)/components/widgets/cards/CoreNFTCard';

import { readContract, writeContract } from "@wagmi/core";
import * as testConfig  from "@/app/config/corevest_test.json";
import * as prodConfig  from "@/app/config/corevest_prod.json";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

export default function CoreNft () {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loadMessage, setLoadMessage] = useState('Scanning account for Core NFTs...');
  let processing = false;


  const config = process.env.NEXT_PUBLIC_IS_TESTNET == "true" ? testConfig : prodConfig; 

  useAccount({
    
    onConnect({ address, connector, isReconnected }) {
      const rpcUrl = connector.chains[0].rpcUrls['default']['http'][0];
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      provider.getBlockNumber().then((result) => {
//        console.log("Current block number: " + result);
      });
      
      setNfts(arr => []);
      setContract(new ethers.Contract(config.contractAddress, config.abi, provider));
      setAccount(address);
     
    },
    onDisconnect() {
      setAccount(null);
      setNfts(arr => []);
      setLoadMessage('Account disconnected.')
    },
  });


  useEffect(() => {

    async function getTokens(connectedOwner) {
      //connectedOwner=''
      if (connectedOwner !== null) {
        const transfers = contract?.filters?.Transfer(null, connectedOwner, null);
        if (transfers) {
          const logEvents = await contract.queryFilter(transfers);
          const tokens = [];console.log(logEvents)
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
              console.log(tokenId);
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

  async function handleClaim(tokenId) {
    if (processing) return;
    processing = true;
    // Send transaction
    try {
        await writeContract({
            address: config.contractAddress,
            abi: config.abi,
            functionName: "claim",
            args: [tokenId]
            });
        setTimeout(() => {
            window.location.reload()
        }, 5000)
    
    } catch(e) {
        console.log('***************',e);
        processing = false;
    
    } 
  }

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
        const claimInfo = await readContract({
          address: config?.contractAddress,
          abi: config?.abi,
          functionName: "calculateGrantClaimAmounts",
          args: [token, true]
        });
        const tokenUri = await readContract({
          address: config?.contractAddress,
          abi: config?.abi,
          functionName: "tokenURI",
          args: [token]
        });
        nft.class = JSON.parse(atob(tokenUri.split(',')[1]));
        nft.grantClaimableAmount = claimInfo[0];
        nft.rebaseClaimableAmount = claimInfo[1];
        nft.elapsedMonths = claimInfo[2];
        nftTmp.push(nft);
        console.table(nft);console.log(claimInfo)
      }

      if (nftTmp.length > 0) {
        setNfts(arr => nftTmp);
      } else {
        setNfts(arr => []);
        setLoadMessage('No Core NFTs found in account.')
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
                <Typography variant="h4" sx={{mx: 2}}>{loadMessage}</Typography>
              )
            :

              <Grid container spacing={3}>
                  {
                    nfts.map((nft) => {
                      return (
                        <CoreNFTCard nft={nft} key={nft.id} handleClaim={handleClaim}/>
                      );
                    })
                  }
              </Grid>
            
          }
    
    </PageContainer>
  ); 
};

CoreNft.layout = "Blank";
