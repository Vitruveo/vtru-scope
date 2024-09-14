"use client";

import React, { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import { CardContent, Grid, Typography, Button, Alert} from "@mui/material";
import { styled } from "@mui/material/styles";
import Breadcrumb from "@/app/(pages)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/(pages)/components/container/PageContainer";
import BoosterNFTCard from "@/app/(pages)/components/widgets/cards/BoosterNFTCard";

import { useSearchParams } from "next/navigation";

import { readContract, writeContract  } from "@wagmi/core";

import * as testConfig from "@/app/config/boosters_test.json";
import * as prodConfig from "@/app/config/boosters_prod.json";
import * as testCoreConfig  from "@/app/config/corevest_test.json";
import * as prodCoreConfig  from "@/app/config/corevest_prod.json";

import { useAccount } from "wagmi";
import { ethers } from "ethers";


export default function Boosters() {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loadMessage, setLoadMessage] = useState(
    "Scanning account for Boosters..."
  );

  const [boosters, setBoosters] = useState([]);
  const [totalBoosters, setTotalBoosters] = useState(0);
  const [totalVtru, setTotalVtru] = useState(0);
  const [totalBasisPoints, setTotalBasisPoints] = useState(0);
  const [buttonMessage, setButtonMessage] = useState('BOOST IT!');
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [targetAddress, setTargetAddress] = useState('');

  const config = process.env.NEXT_PUBLIC_IS_TESTNET == "true" ? testConfig : prodConfig;
  const coreConfig = process.env.NEXT_PUBLIC_IS_TESTNET == "true" ? testCoreConfig : prodCoreConfig;

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

  const searchParams = useSearchParams();
  const boostNftId = searchParams.get("boost");
  let processing = false;

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

  useEffect(() => {
    setButtonEnabled(boosters.length > 0 && targetAddress != '');
  }, [targetAddress]);

  function trackBoosters(nft) {
    const idx = boosters.indexOf(nft.tokenId); 
    if (idx > -1) {
      boosters.splice(idx,1);  
      setTotalBoosters(totalBoosters - 1);
      setTotalVtru(totalVtru - nft.vtru);
      setTotalBasisPoints(totalBasisPoints - nft.basisPoints)
    } else {
        boosters.push(nft.tokenId);
        setTotalBoosters(totalBoosters + 1);
        setTotalVtru(totalVtru + nft.vtru);
        setTotalBasisPoints(totalBasisPoints + nft.basisPoints)  
    }
    setBoosters(boosters);
    setButtonEnabled(boosters.length > 0 && (boostNftId ? true : targetAddress != ''));
  }

  function handleAddressChange(e) {
    if (ethers.isAddress(e.target.value.toLowerCase())) {
      setTargetAddress(e.target.value.toLowerCase());
    } else {
      setTargetAddress('');      
    }
  }

  async function boost() {
    if (processing) return;

    setButtonMessage('Wait...');
    setButtonEnabled(false);

    processing = true;
    const method = targetAddress != '' ? 'batchBoostAccount' : 'batchBoostToken';
    const param = targetAddress != '' ? targetAddress : boostNftId;
    
    // Send transaction
    try {
        await writeContract({
            address: coreConfig.contractAddress,
            abi: coreConfig.abi,
            functionName: method,
            args: [param, boosters]
            });
        setTimeout(() => {
            window.location.reload()
        }, 5000)
    
    } catch(e) {
        console.log('***************',e);
        processing = false;
        setButtonMessage('BOOST IT!');
        setButtonEnabled(true);
    
    } 
    
  }

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
        nftTmp.push({
          tokenId: Number(nft[0]),
          isBoosted: nft[1],
          vtru: Number(nft[2]),
          boosterName: nft[3],
          boosterType: nft[4],
          basisPoints: Number(nft[5])
        });
      }

      if (nftTmp.length > 0) {
        setNfts((arr) => nftTmp.sort((a,b) => a.isBoosted - b.isBoosted));
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
      title: "Digital Assets"
    },
    {
      title: "Boosters",
    },
  ];

  const gridCols = boostNftId ? 3 : 2;
  const btnCols = boostNftId ? 3 : 2;

  return (
    <PageContainer title="VTRU Scope" description="View all Booster Digital Assets">
      <Breadcrumb title="Booster Digital Assets" items={breadcrumb} />

      {nfts.length == 0 ? (
        account == null ? (
          <Typography variant="h4" sx={{ mx: 2 }}>
            Connect account to view Booster digital assets.
          </Typography>
        ) : (
          <Typography variant="h4" sx={{ mx: 2 }}>
            {loadMessage}
          </Typography>
        )
      ) : (
        <>
         
            <Grid container spacing={3} textAlign="center" mb={3}>
              <Grid item xs={12} md={6} lg={gridCols}>
              <Box bgcolor={"primary.light"} textAlign="center">
                    <CardContent>
                      <Typography
                        color={"primary.main"}
                        variant="subtitle1"
                        fontWeight={600}
                      >
                        Selected
                      </Typography>
                      <Typography
                        color={"grey.900"}
                        variant="h5"
                        fontWeight={600}
                      >
                        { totalBoosters }
                      </Typography>
                    </CardContent>
                  </Box>

              </Grid>

            <Grid item xs={12} md={6} lg={gridCols}>
            <Box bgcolor={"primary.light"} textAlign="center">
                  <CardContent>
                    <Typography
                      color={"primary.main"}
                      variant="subtitle1"
                      fontWeight={600}
                    >
                      Total $VTRU
                    </Typography>
                    <Typography
                      color={"grey.900"}
                      variant="h5"
                      fontWeight={600}
                    >
                      { totalVtru }
                    </Typography>
                  </CardContent>
                </Box>
            </Grid>

            <Grid item xs={12} md={6} lg={gridCols}>
                <Box bgcolor={"primary.light"} textAlign="center">
                  <CardContent>
                    <Typography
                      color={"primary.main"}
                      variant="subtitle1"
                      fontWeight={600}
                    >
                      Total Boost%
                    </Typography>
                    <Typography
                      color={"grey.900"}
                      variant="h5"
                      fontWeight={600}
                    >
                      { (totalBasisPoints/100).toFixed(2) }
                    </Typography>
                  </CardContent>
                </Box>
            </Grid>
            {
              boostNftId ? 
              <></> :
                <Grid item xs={12} md={6} lg={4}>
                <Box bgcolor={"primary.light"} textAlign="center" style={{ maxHeight: "98.09px" }}>
                  <CardContent sx={{ pt: 2, pb: 2 }}>
                    <Typography
                      color={"primary.main"}
                      variant="subtitle1"
                      fontWeight={600}
                    >
                      Boost Target Account
                    </Typography>
                        <input type="text" onChange={handleAddressChange} style={{marginTop: '10px', padding: '2px', paddingTop: '5px', paddingBottom: '5px', fontSize: '11px', width: '98%', fontFamily: 'monospace'}} />
                  </CardContent>
                </Box>
              </Grid>
            }

            <Grid item xs={12} md={6} lg={btnCols} textAlign="center">
              <Box textAlign="center">
                <CardContent>
                  <Button
                    color="primary"
                    size="large"
                    variant="outlined"
                    fullWidth
                    onClick={ boost }
                    disabled={!buttonEnabled}
                  >
                    {buttonMessage}
                  </Button>
                </CardContent>
              </Box>
            </Grid>
          </Grid>
          {
            boostNftId ? 
            <></> :            
            <Grid item xs={12} md={12} lg={12} sx={{ mb: 3}}>
                <Alert
                  variant="filled"                  
                  severity="info"
                >
                  The <b>Boost Target Account</b> must have a Nexus or Maxim NFT so after boosting, benefits can be tracked. If none is found, a Maxim NFT will automatically be added to the account.
              </Alert>
          </Grid>
          }
          <Grid container spacing={3}>
            {nfts.map((nft) => {
              return <BoosterNFTCard nft={nft} key={nft.tokenId} tracker={ trackBoosters }/>;
            })}
          </Grid>
        </>
      )}
    </PageContainer>
  );
}

Boosters.layout = "Blank";
