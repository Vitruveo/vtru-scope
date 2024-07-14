"use client";

import React, { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import { CardContent, Grid, Typography, Button, Alert} from "@mui/material";
import { styled } from "@mui/material/styles";
import Breadcrumb from "@/app/(pages)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/(pages)/components/container/PageContainer";
import VibeNFTCard from "@/app/(pages)/components/widgets/cards/VibeNFTCard";
import { FlapDisplay, Presets } from 'react-split-flap-effect'
import { useSearchParams } from "next/navigation";
import "./theme.css";

import { readContract, writeContract  } from "@wagmi/core";
import vaultConfig from "@/app/config/vault-config.json";

import { useAccount } from "wagmi";
import { ethers } from "ethers";


export default function Nfts() {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [claimed, setClaimed] = useState(0);
  const [vibes, setVibes] = useState(0);
  const [unclaimed, setUnclaimed] = useState(0);
  const [nfts, setNfts] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [buttonMessage, setButtonMessage] = useState('CLAIM  (Coming Soon)');
  const [buttonEnabled, setButtonEnabled] = useState(unclaimed > 0);

  const [x1000Nfts, setx1000Nfts] = useState([]);
  const [x100Nfts, setx100Nfts] = useState([]);
  const [x50Nfts, setx50Nfts] = useState([]);
  const [x20Nfts, setx20Nfts] = useState([]);
  const [x10Nfts, setx10Nfts] = useState([]);
  const [x5Nfts, setx5Nfts] = useState([]);
  const [x1Nfts, setx1Nfts] = useState([]);


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
      setx1000Nfts((arr) => []);
      setx100Nfts((arr) => []);
      setx50Nfts((arr) => []);
      setx20Nfts((arr) => []);
      setx10Nfts((arr) => []);
      setx5Nfts((arr) => []);
      setx1Nfts((arr) => []);
      setAccount(address);


    },
    onDisconnect() {
      setAccount(null);
      setx1000Nfts((arr) => []);
      setx100Nfts((arr) => []);
      setx50Nfts((arr) => []);
      setx20Nfts((arr) => []);
      setx10Nfts((arr) => []);
      setx5Nfts((arr) => []);
      setx1Nfts((arr) => []);
      setLoadMessage("Account disconnected.");
    },
  });
            
  useEffect(() => {
    async function getTokens(connectedOwner) {
//     connectedOwner = '0xd07D220d7e43eCa35973760F8951c79dEebe0dcc';
 //    connectedOwner = '0xABBA32cF845256A4284cdbA91D82C96CbB13dc59';
//     connectedOwner = '0xC0ee5bb36aF2831baaE1d31f358ccA46dAa6a4e8';
//connectedOwner = '0xaD78De2EFaAb615956f7c4Cb26ADeB108199F86a';
     if (connectedOwner !== null && provider !== null) {

        const stats = await readContract({
          address: vaultConfig.vibe[network],
          abi: vaultConfig.vibe.abi,
          functionName: "stats",
          args: [],
        });
        console.log('Revenue',Number(stats[4])/10^18)
        setRevenue(Number(stats[4])/ Math.pow(10, 18));

        const vibeCount = await readContract({
          address: vaultConfig.vibe[network],
          abi: vaultConfig.vibe.abi,
          functionName: "balanceOf",
          args: [connectedOwner],
        });
        setVibes(vibeCount);

        const revShare = await readContract({
          address: vaultConfig.vibe[network],
          abi: vaultConfig.vibe.abi,
          functionName: "getRevenueShareByOwner",
          args: [connectedOwner],
        });
        setClaimed(revShare[0]);
        setUnclaimed(revShare[1])
        
        let tokens = await readContract({
          address: vaultConfig.vibe[network],
          abi: vaultConfig.vibe.abi,
          functionName: "getVibeNFTsByOwner",
          args: [connectedOwner],
        });

        const order = [1000, 100, 50, 20, 10, 5, 1];
        tokens = tokens.sort(function(a,b) {
          return order.indexOf( a.denomination ) - order.indexOf( b.denomination );
        });  


        for(let t=0; t<tokens.length; t++) {
      
            try {

              const token = tokens[t];
              let tokenURI = await readContract({
                address: vaultConfig.vibe[network],
                abi: vaultConfig.vibe.abi,
                functionName: "tokenURI",
                args: [token.tokenId],
              });
              const json = JSON.parse(atob(tokenURI.split(',')[1]));
              
              json.key = `X${t}`;
              json.id = Number(token.tokenId);
              json.denomination = Number(token.denomination);
              json.claimed = Number(token.claimed);

              switch(json.denomination) {
                case 1000: setx1000Nfts(x1000Nfts => [...x1000Nfts, json]); ; break;
                case 100: setx100Nfts(x100Nfts => [...x100Nfts, json]); ; break;
                case 50: setx50Nfts(x50Nfts => [...x50Nfts, json]); ; break;
                case 20: setx20Nfts(x20Nfts => [...x20Nfts, json]); ; break;
                case 10: setx10Nfts(x10Nfts => [...x10Nfts, json]); ; break;
                case 5: setx5Nfts(x5Nfts => [...x5Nfts, json]); ; break;
                case 1: setx1Nfts(x1Nfts => [...x1Nfts, json]); ; break;
              }
           
              setNfts(nfts => [...nfts, json]);
           
            } catch(e) {

            }

        }
         
      } else {
        setx1000Nfts((arr) => []);
        setx100Nfts((arr) => []);
        setx50Nfts((arr) => []);
        setx20Nfts((arr) => []);
        setx10Nfts((arr) => []);
        setx5Nfts((arr) => []);
        setx1Nfts((arr) => []);
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
      title: "VIBE",
    },
  ];

  const formatBigNum = (n) => {
    const converted = Number(n) / Math.pow(10, 18); 
    return converted.toLocaleString(undefined, { 
      minimumFractionDigits: 4, 
      maximumFractionDigits: 4 
    });
  }

  const tabPanels = [
    {
      title: "VIBEs",
      content: Number(vibes),
      bgcolor: "primary",
    },
    {
      title: "Claimed $VTRU",
      content: formatBigNum(claimed),
      bgcolor: "primary",
    },
    {
      title: "Unclaimed $VTRU",
      content: formatBigNum(unclaimed),
      bgcolor: "primary",
    },
  ];


  
  function renderTabContent(panel) {
    switch(panel.title) {
      case 'CLAIM_BUTTON':
        return  (
          <Button color="primary" size="large" disabled={ true } fullWidth onClick={ () => { buttonState(false); handleClaim("xxxxx"); } }>
            { buttonMessage }
          </Button>
        );

      default:
        return (
        <>
          <Typography
            color={"white"}
            variant="subtitle3"
            fontWeight={800}
          >
            {panel.title}
          </Typography>
          <Typography
            color={"grey.900"}
            variant="h2"
            fontWeight={600}
          >
            { panel.content }                               
          </Typography>
        </>
      );
    }
  }


  return (
    <PageContainer title="VTRU Scope" description="View all account NFTs">
      <Breadcrumb title="VIBE (Vitruveo Income Building Engine)" items={breadcrumb} />

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
         
         <Grid container spacing={1} style={{marginBottom: '30px'}} direction="column" alignItems="center" justifyContent="center">
           <Grid item xs={12} sm={12} md={12} lg={12}>
           <FlapDisplay
              className={"XL darkBordered"}
              chars={Presets.NUM + ','}
              length={13}
              value={Number(revenue).toLocaleString()}
            />
            </Grid>
         </Grid>

          <Grid container spacing={1} style={{marginBottom: '30px'}}>
            {tabPanels.map((panel, panelIndex) => (
            <Grid item xs={12} sm={12} md={4} lg={4} key={panelIndex}>
              <Box bgcolor={panel.bgcolor + ".light"} textAlign="center">
                <CardContent px={1}>
                  { renderTabContent(panel) }     
                </CardContent>
              </Box>
            </Grid>
            ))}
          </Grid>

          <h2>1000s ({x1000Nfts.length})</h2>
          <Grid container spacing={3} style={{marginBottom: '50px'}}>
            {
              x1000Nfts.length == 0 ?
              "No 1000 denomination NFTs."
              :
              x1000Nfts.map((nft, index) => {
                return <VibeNFTCard nft={nft} key={index} />;
              })
            }
          </Grid>

          <h2>100s ({x100Nfts.length})</h2>
          <Grid container spacing={3} style={{marginBottom: '50px'}}>
            {
              x100Nfts.length == 0 ?
              "No 100 denomination NFTs."
              :
              x100Nfts.map((nft, index) => {
                return <VibeNFTCard nft={nft} key={index} />;
              })
            }
          </Grid>


          <h2>50s ({x50Nfts.length})</h2>
          <Grid container spacing={3} style={{marginBottom: '50px'}}>
            {
              x50Nfts.length == 0 ?
              "No 50 denomination NFTs."
              :
              x50Nfts.map((nft, index) => {
                return <VibeNFTCard nft={nft} key={index} />;
              })
            }
          </Grid>

          <h2>20s ({x20Nfts.length})</h2>
          <Grid container spacing={3} style={{marginBottom: '50px'}}>
            {
              x20Nfts.length == 0 ?
              "No 20 denomination NFTs."
              :
              x20Nfts.map((nft, index) => {
                return <VibeNFTCard nft={nft} key={index} />;
              })
            }
          </Grid>

          <h2>10s ({x10Nfts.length})</h2>
          <Grid container spacing={3} style={{marginBottom: '50px'}}>
            {
              x10Nfts.length == 0 ?
              "No 10 denomination NFTs."
              :
              x10Nfts.map((nft, index) => {
                return <VibeNFTCard nft={nft} key={index} />;
              })
            }
          </Grid>

          <h2>5s ({x5Nfts.length})</h2>
          <Grid container spacing={3} style={{marginBottom: '50px'}}>
            {
              x5Nfts.length == 0 ?
              "No 5 denomination NFTs."
              :
              x5Nfts.map((nft, index) => {
                return <VibeNFTCard nft={nft} key={index} />;
              })
            }
          </Grid>


          <h2>1s ({x1Nfts.length})</h2>
          <Grid container spacing={3} style={{marginBottom: '50px'}}>
            {
              x1Nfts.length == 0 ?
              "No 1 denomination NFTs."
              :
              x1Nfts.map((nft, index) => {
                return <VibeNFTCard nft={nft} key={index} />;
              })
            }
          </Grid>
          
        </>
      )}
    </PageContainer>
  );
}

Nfts.layout = "Blank";
