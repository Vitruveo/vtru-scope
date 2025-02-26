"use client";

import React, { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import { CardContent, Grid, Typography, Button, Alert} from "@mui/material";
import { styled } from "@mui/material/styles";
import Breadcrumb from "@/app/(pages)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/(pages)/components/container/PageContainer";
import VibeNFTCard from "@/app/(pages)/components/widgets/cards/VibeNFTCard";
import DenomCard from '@/app/(pages)/components/vibe/DenomCard';

import { FlapDisplay, Presets } from 'react-split-flap-effect'
import { useSearchParams } from "next/navigation";
import "./theme.css";

import { readContract, writeContract  } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";

import { useAccount } from "wagmi";
import { ethers } from "ethers";


export default function Nfts() {

  const MODE_DEPOSIT = 'deposit';
  const MODE_MINT = 'mint';

  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [claimed, setClaimed] = useState(0);
  const [units, setUnits] = useState(0);
  const [nfts, setNfts] = useState(0);
  const [vibes, setVibes] = useState(0);
  const [unclaimed, setUnclaimed] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [buttonMessage, setButtonMessage] = useState('CLAIM');
  const [buttonEnabled, setButtonEnabled] = useState(true);

  const [x1000Nfts, setx1000Nfts] = useState([]);
  const [x100Nfts, setx100Nfts] = useState([]);
  const [x50Nfts, setx50Nfts] = useState([]);
  const [x20Nfts, setx20Nfts] = useState([]);
  const [x10Nfts, setx10Nfts] = useState([]);
  const [x5Nfts, setx5Nfts] = useState([]);
  const [x1Nfts, setx1Nfts] = useState([]);
  const [availableCredits, setAvailableCredits] = useState([]);
  const [creditMode, setCreditMode] = useState(MODE_DEPOSIT);

  const [credit1, setCredit1] = useState(0);
  const [credit2, setCredit2] = useState(0);
  const [credit3, setCredit3] = useState(0);
  const [credit4, setCredit4] = useState(0);
  const [credit5, setCredit5] = useState(0);
  const [credit6, setCredit6] = useState(0);
  const [credit7, setCredit7] = useState(0);

  const [deposit1, setDeposit1] = useState(0);
  const [deposit2, setDeposit2] = useState(0);
  const [deposit3, setDeposit3] = useState(0);
  const [deposit4, setDeposit4] = useState(0);
  const [deposit5, setDeposit5] = useState(0);
  const [deposit6, setDeposit6] = useState(0);
  const [deposit7, setDeposit7] = useState(0);

  const [depositTokens, setDepositTokens] = useState(0);
  const [depositUnits, setDepositUnits] = useState(0);
  const [mintTokens, setMintTokens] = useState(0);
  const [mintUnits, setMintUnits] = useState(0);
  
  const [depositButtonMessage, setDepositButtonMessage] = useState('DEPOSIT');
  const [mintButtonMessage, setMintButtonMessage] = useState('MINT');

  const [loadMessage, setLoadMessage] = useState(
    "Scanning account for digital assets..."
  );

  const [provider, setProvider] = useState(null);
  const isTestnet = false; //Boolean(process.env.NEXT_PUBLIC_IS_TESTNET) === true;
  const network = isTestnet === true ? 'testnet' : 'mainnet';
  let processing = false;


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
    const stats = await readContract({
      address: config[network].VIBE,
      abi: config.abi.VIBE,
      functionName: "stats",
      args: [],
    });
    //console.log('Revenue',Number(stats[4])/10^18)
    setUnits(Math.min(1000000, Number(stats[1]) + 100000));
    setRevenue(Number(stats[4])/ Math.pow(10, 18));

    if (connectedOwner !== null && provider !== null) {


        const nftCount = await readContract({
          address: config[network].VIBE,
          abi: config.abi.VIBE,
          functionName: "balanceOf",
          args: [connectedOwner],
        });
        setNfts(nftCount);

        const revShare = await readContract({
          address: config[network].VIBE,
          abi: config.abi.VIBE,
          functionName: "getRevenueShareByOwner",
          args: [connectedOwner],
        });
        setClaimed(revShare[0]);
        setUnclaimed(revShare[1])
        
        let tokens = await readContract({
          address: config[network].VIBE,
          abi: config.abi.VIBE,
          functionName: "getVibeNFTsByOwner",
          args: [connectedOwner],
        });

        const order = [1000, 100, 50, 20, 10, 5, 1];
        tokens = tokens.sort(function(a,b) {
          return order.indexOf( a.denomination ) - order.indexOf( b.denomination );
        });  


        let totalVibes = 0;
        for(let t=0; t<tokens.length; t++) {
      
            try {

              const token = tokens[t];
              let tokenURI = await readContract({
                address: config[network].VIBE,
                abi: config.abi.VIBE,
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
              totalVibes += json.denomination;
           
            } catch(e) {

            }

        }
        setVibes(totalVibes);

        const mintCredits = await readContract({
                                      address: config[network].VIBE,
                                      abi: config.abi.VIBE,
                                      functionName: "getMintCredits",
                                      args: [connectedOwner],
                                    });
        setAvailableCredits(mintCredits);         

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
  }, [contract, account, network, provider]);

  useEffect(() => {
    setCreditMode(Number(availableCredits.credits) > 0 ? MODE_MINT : MODE_DEPOSIT);
  }, [availableCredits]);

  useEffect(() => {
    // setDeposit1(x1000Nfts.length);
    // setDeposit2(x100Nfts.length);
    // setDeposit3(x50Nfts.length);
    // setDeposit4(x20Nfts.length);
    setDeposit5(x10Nfts.length);
    setDeposit6(x5Nfts.length);
    setDeposit7(x1Nfts.length);
  }, [x1000Nfts, x100Nfts, x50Nfts, x20Nfts, x10Nfts, x5Nfts, x1Nfts]);

  async function handleClaim() {
    if (processing) return;
    processing = true;

    try {
        await writeContract({
            address: config[network].VIBE,
            abi: config.abi.VIBE,
            functionName: "claimRevenueShareByOwner",
            gas: 1_500_000,
            args: []
            });
        setTimeout(() => {
            window.location.reload()
        }, 6000)
    
    } catch(e) {
        console.log('***************',e);
        processing = false;
    
    } 
  }

    
  const getDepositTokenIds = () => {
    const keys = ['deposit1', 'deposit2', 'deposit3', 'deposit4', 'deposit5', 'deposit6', 'deposit7'];
    const tokenIds = [];

    for(let k=0; k<keys.length; k++) {
      const key = keys[k];
      let nfts = null;
      let count = 0;
      switch(key) {
        case 'deposit1': nfts = x1000Nfts; count = deposit1; break;
        case 'deposit2': nfts = x100Nfts;  count = deposit2; break;
        case 'deposit3': nfts = x50Nfts;   count = deposit3; break;
        case 'deposit4': nfts = x20Nfts;   count = deposit4; break;
        case 'deposit5': nfts = x10Nfts;   count = deposit5; break;
        case 'deposit6': nfts = x5Nfts;    count = deposit6; break;
        case 'deposit7': nfts = x1Nfts;    count = deposit7; break;
      }
      
      if (count > 0) {
        for(let c=0; c<count; c++) {
          tokenIds.push(nfts[c].id);
        }
      }
    }

    return tokenIds;
  }

  async function handleDeposit() {
    if (processing) return;
    processing = true;
    setDepositButtonMessage('WAIT...');

    const tokenIds = getDepositTokenIds();
    if (tokenIds.length == 0) return;

    try {
        await writeContract({
            address: config[network].VIBE,
            abi: config.abi.VIBE,
            functionName: "burnForCredit",
            gas: 20_000_000,
            args: [tokenIds]
            });
        setTimeout(() => {
            window.location.reload()
        }, 9000)
    
    } catch(e) {
        console.log('***************',e);
        processing = false;
    
    } 
  }

  async function handleMint() {
    if (processing) return;
    processing = true;

    setMintButtonMessage('WAIT...');

    try {
        await writeContract({
            address: config[network].VIBE,
            abi: config.abi.VIBE,
            functionName: "mintFromCredit",
            gas: 20_000_000,
            args: [ [credit1, credit2, credit3, credit4, credit5, credit6, credit7] ]
            });
        setTimeout(() => {
            window.location.reload()
        }, 9000)
    
    } catch(e) {
        console.log('***************',e);
        processing = false;
    
    } 
  }

  
  useEffect(() => {
    setDepositTokens(deposit1 + deposit2 + deposit3 + deposit4 + deposit5 + deposit6 + deposit7);
    setDepositUnits((deposit1 * 1000) + (deposit2 * 100) + (deposit3 * 50) + (deposit4 * 20) + (deposit5 * 10) + (deposit6 * 5) + (deposit7 * 1));
  }, [deposit1, deposit2, deposit3, deposit4, deposit5, deposit6, deposit7]);
    

  const updateDeposits = (key, value) => {
    if (value < 0) return;
    switch(key) {
      case 'deposit1': if (value <= x1000Nfts.length) setDeposit1(value); break;
      case 'deposit2': if (value <= x100Nfts.length) setDeposit2(value); break;
      case 'deposit3': if (value <= x50Nfts.length) setDeposit3(value); break;
      case 'deposit4': if (value <= x20Nfts.length) setDeposit4(value); break;
      case 'deposit5': if (value <= x10Nfts.length) setDeposit5(value); break;
      case 'deposit6': if (value <= x5Nfts.length) setDeposit6(value); break;
      case 'deposit7': if (value <= x1Nfts.length) setDeposit7(value); break;
    }  
  }


  const calculateMintUnits = (units) => {
    return (units[0] * 1000) + (units[1] * 100) + (units[2] * 50) + (units[3] * 20) + (units[4] * 10) + (units[5] * 5) + (units[6] * 1)
  }

  useEffect(() => {
    setMintTokens(credit1 + credit2 + credit3 + credit4 + credit5 + credit6 + credit7);
    setMintUnits(calculateMintUnits([credit1, credit2, credit3, credit4, credit5, credit6, credit7]));
  }, [credit1, credit2, credit3, credit4, credit5, credit6, credit7]);
    

  const updateMints = (key, value) => {
    if (value < 0) return;
    const unitsToMint = [credit1, credit2, credit3, credit4, credit5, credit6, credit7];
    let index = -1;
    switch(key) {
      case 'credit1': index = 0; break;
      case 'credit2': index = 1; break;
      case 'credit3': index = 2; break;
      case 'credit4': index = 3; break;
      case 'credit5': index = 4; break;
      case 'credit6': index = 5; break;
      case 'credit7': index = 6; break;
    }  
    if (index > -1) {
        unitsToMint[index] = value;
        const totalUnits = calculateMintUnits(unitsToMint);

        if (totalUnits <= Number(availableCredits.credits)) {
          switch(key) {
            case 'credit1': setCredit1(value); break;
            case 'credit2': setCredit2(value); break;
            case 'credit3': setCredit3(value); break;
            case 'credit4': setCredit4(value); break;
            case 'credit5': setCredit5(value); break;
            case 'credit6': setCredit6(value); break;
            case 'credit7': setCredit7(value); break;
          }           
        }
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
      title: "VIBE Units (Digital Assets)",
      content: `${Number(vibes)} (${Number(nfts)})`,
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
    {
      title: "CLAIM_BUTTON",
      content: "0",
      bgcolor: "white",
    },
  ];


  function buttonState(enabled) {
    setButtonEnabled(enabled);
    setButtonMessage('Wait...');
  }

  function renderTabContent(panel) {
    switch(panel.title) {
      case 'CLAIM_BUTTON':
        return  (
          <Button color="primary" size="large" disabled={ !buttonEnabled } fullWidth onClick={ () => { buttonState(false); handleClaim(); } }>
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
    <PageContainer title="VTRU Scope" description="View all VIBE Digital Assets">
      <Breadcrumb title="VIBE (Vitruveo Income Building Engine)" items={breadcrumb} />

      {nfts.length == 0 ? (
        account == null ? (
          <Typography variant="h4" sx={{ mx: 2 }}>
            Connect account to view digital assets.
          </Typography>
        ) : (
          <Typography variant="h4" sx={{ mx: 2 }}>
            {loadMessage}
          </Typography>
        )
      ) : (
        <>
         <Grid container spacing={1} style={{marginBottom: '30px'}} >
           <Grid item xs={12} sm={12} md={9} lg={9} key={1}>
            <p>VIBE Contract Total Revenue in $VTRU divided equally between 1 million VIBE units</p>
              <FlapDisplay
                className={"XL darkBordered"}
                chars={Presets.NUM + ','}
                length={12}
                value={Number(revenue.toFixed(0)).toLocaleString()}
              />
            </Grid>

            <Grid item xs={12} sm={12} md={3} lg={3} key={2}>
              <Box bgcolor={"info.light"} textAlign="center">
                <CardContent px={1} style={{marginTop: '50px', height: '125px'}}>
                <Typography
                  color={"white"}
                  variant="subtitle3"
                  fontWeight={800}
                >
                  Issued Units (Max 1M)
                </Typography>
                <Typography
                  color={"white"}
                  variant="h1"
                  fontWeight={600}
                >
                  { units.toLocaleString() }                               
                </Typography>  
                </CardContent>
              </Box>
            </Grid>
         </Grid>


          <Grid container spacing={1} style={{marginBottom: '50px'}}>
            {tabPanels.map((panel, panelIndex) => (
            <Grid item xs={12} sm={12} md={3} lg={3} key={panelIndex}>
              <Box bgcolor={panel.bgcolor + ".light"} textAlign="center">
                <CardContent px={1}>
                  { renderTabContent(panel) }     
                </CardContent>
              </Box>
            </Grid>
            ))}
          </Grid>

          <h1>(Optional) Swap VIBE Denominations — Available VIBE Credits: <span style={{color: '#00CC00', fontWeight: 'bold'}}>{Number(availableCredits.credits ?? 0)}</span> Units</h1> 
          {
            creditMode == MODE_DEPOSIT ?
            <h3>Enter a token count for each denomination that you wish to deposit for VIBE Credit. <span style={{color: '#FFFF33'}}>If you get an error, reduce tokens per transaction.</span></h3>
            :
            <h3>Enter a token count for each denomination that you wish to mint from your VIBE Credits. <span style={{color: '#FFFF33'}}>If you get an error, reduce tokens per transaction.</span></h3>
          }
          <Grid container spacing={3}  style={{marginBottom: '50px'}}>
            <Grid item xs={12} sm={12} md={2} lg={2} key={1}>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: "5px", fontSize: "24px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="creditMode"
                  value={MODE_DEPOSIT}
                  checked={creditMode === MODE_DEPOSIT}
                  onChange={() => setCreditMode(MODE_DEPOSIT)}
                  style={{ width: "20px", height: "20px", cursor: "pointer", appearance: "none", border: creditMode === MODE_DEPOSIT ? "10px solid #763ebd" : "10px solid #ccc", borderRadius: "50%", backgroundColor: "white", transition: "all 0.2s ease-in-out" }}
                />
                1️⃣ Deposit
              </label>

              <label style={{ marginTop: 15, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="creditMode"
                  value={MODE_MINT}
                  checked={creditMode === MODE_MINT}
                  onChange={() => setCreditMode(MODE_MINT)}
                  style={{ width: "20px", height: "20px", cursor: "pointer", appearance: "none", border: creditMode === MODE_MINT ? "10px solid #763ebd" : "10px solid #ccc", borderRadius: "50%", backgroundColor: "white", transition: "all 0.2s ease-in-out" }}
                />
                2️⃣ Mint
              </label>
            </div>
            </Grid>
            <Grid item xs={12} sm={12} md={8} lg={8} key={2}>
              <div style={{display: 'flex', justifyContent: 'space-between', paddingLeft: '10px'}}>
                {
                  creditMode === MODE_DEPOSIT ?
                  <>
                    <DenomCard value={deposit1 ?? ''} item={{defaultValue: x1000Nfts.length, title: '1000', handleInputChange: updateDeposits, key: 'deposit1'}} key={1}/>
                    <DenomCard value={deposit2 ?? ''} item={{defaultValue: x100Nfts.length, title: '100',   handleInputChange: updateDeposits, key: 'deposit2'}} key={2} />
                    <DenomCard value={deposit3 ?? ''} item={{defaultValue: x50Nfts.length, title: '50',     handleInputChange: updateDeposits, key: 'deposit3'}} key={3} />
                    <DenomCard value={deposit4 ?? ''} item={{defaultValue: x20Nfts.length, title: '20',     handleInputChange: updateDeposits, key: 'deposit4'}} key={4} />
                    <DenomCard value={deposit5 ?? ''} item={{defaultValue: x10Nfts.length, title: '10',     handleInputChange: updateDeposits, key: 'deposit5'}} key={5} />
                    <DenomCard value={deposit6 ?? ''} item={{defaultValue: x5Nfts.length, title: '5',       handleInputChange: updateDeposits, key: 'deposit6'}} key={6} />
                    <DenomCard value={deposit7 ?? ''} item={{defaultValue: x1Nfts.length, title: '1',       handleInputChange: updateDeposits, key: 'deposit7'}} key={7} />
                  </>
                  :
                  <>
                    <DenomCard value={credit1 ?? ''} item={{defaultValue: x1000Nfts.length, title: '1000', handleInputChange: updateMints, key: 'credit1'}} key={8}/>
                    <DenomCard value={credit2 ?? ''} item={{defaultValue: x100Nfts.length, title: '100',   handleInputChange: updateMints, key: 'credit2'}} key={9} />
                    <DenomCard value={credit3 ?? ''} item={{defaultValue: x50Nfts.length, title: '50',     handleInputChange: updateMints, key: 'credit3'}} key={10} />
                    <DenomCard value={credit4 ?? ''} item={{defaultValue: x20Nfts.length, title: '20',     handleInputChange: updateMints, key: 'credit4'}} key={11} />
                    <DenomCard value={credit5 ?? ''} item={{defaultValue: x10Nfts.length, title: '10',     handleInputChange: updateMints, key: 'credit5'}} key={12} />
                    <DenomCard value={credit6 ?? ''} item={{defaultValue: x5Nfts.length, title: '5',       handleInputChange: updateMints, key: 'credit6'}} key={13} />
                    <DenomCard value={credit7 ?? ''} item={{defaultValue: x1Nfts.length, title: '1',       handleInputChange: updateMints, key: 'credit7'}} key={14} />
                  </>
                }
              </div>
            </Grid>
            <Grid item xs={12} sm={12} md={2} lg={2} key={3}>
              {
                creditMode === MODE_DEPOSIT ?
                <>
                  <h2 style={{marginTop: 0, fontWeight: 'normal'}}>UNITS: <span style={{color: '#00CC00', fontWeight: 'bold'}}>{depositUnits}</span></h2>
                  <h2 style={{marginBottom: 13,  fontWeight: 'normal', fontSize: '1.2em'}}>Tokens:  <span style={{fontWeight: 'bold'}}>{depositTokens}</span></h2>
                  <Button color="primary" size="large" disabled={ depositTokens == 0 } fullWidth onClick={ () => { buttonState(false); handleDeposit(); } }>
                  {   depositButtonMessage }
                  </Button>
                </>
                :
                <>
                  <h2 style={{marginTop: 0, fontWeight: 'normal'}}>UNITS: <span style={{color: '#00CC00', fontWeight: 'bold'}}>{mintUnits}</span></h2>
                  <h2 style={{marginBottom: 13,  fontWeight: 'normal', fontSize: '1.2em'}}>Tokens:  <span style={{fontWeight: 'bold'}}>{mintTokens}</span></h2>
                  <Button color="primary" size="large" disabled={ mintTokens == 0 } fullWidth onClick={ () => { buttonState(false); handleMint(); } }>
                    {  mintButtonMessage }
                  </Button>                
                </>
              }
            </Grid>
          </Grid>


          <h1 style={{marginBottom: '30px'}}>VIBE Tokens</h1> 
          <h2>1000s ({x1000Nfts.length})</h2>
          <Grid container spacing={3} style={{marginBottom: '50px'}}>
            {
              x1000Nfts.length == 0 ?
              <p style={{marginLeft: '50px'}}>No 1000 denomination NFTs.</p>
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
              <p style={{marginLeft: '50px'}}>No 100 denomination NFTs.</p>
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
              <p style={{marginLeft: '50px'}}>No 50 denomination NFTs.</p>
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
              <p style={{marginLeft: '50px'}}>No 20 denomination NFTs.</p>
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
              <p style={{marginLeft: '50px'}}>No 10 denomination NFTs.</p>
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
              <p style={{marginLeft: '50px'}}>No 5 denomination NFTs.</p>
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
              <p style={{marginLeft: '50px'}}>No 1 denomination NFTs.</p>
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
