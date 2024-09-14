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
import VtruNFTCard from "@/app/(pages)/components/widgets/cards/VtruNFTCard";

import { readContract } from "@wagmi/core";
import vaultConfig from "@/app/config/vault-config.json";

import { useAccount } from "wagmi";
import { ethers } from "ethers";

const PER_PAGE = 24;

export default function Artwork() {
  const [account, setAccount] = useState(null);
  const [nfts, setNfts] = useState([]);
  // const [order, setOrder] = useState("mintNewToOld");
  const [currentPage, setCurrentPage] = useState(1);

  const [provider, setProvider] = useState(null);
  const isTestnet = process.env.NEXT_PUBLIC_IS_TESTNET === true;
  const network = isTestnet === true ? "testnet" : "mainnet";

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
    },
  });

  useEffect(() => {
    async function getTokens(connectedOwner) {
      if (connectedOwner !== null && provider !== null) {
        let tokens = await readContract({
          address: vaultConfig.licenseRegistry[network],
          abi: vaultConfig.licenseRegistry.abi,
          functionName: "getTokens",
          args: [connectedOwner],
        });

        await Promise.all(
          tokens.reverse().map(async (token, index) => {
            let tokenURI = await readContract({
              address: token.vault,
              abi: vaultConfig.creatorVault.abi,
              functionName: "tokenURI",
              args: [token.tokenId],
            });

            const frags = tokenURI.split("/");
            const assetKey = frags[frags.length - 1];
            const assetUrl = `https://studio-api.vitruveo.xyz/assets/scope/${assetKey}`;

            const resp = await fetch(assetUrl);
            const json = await resp.json();
            // console.log(assetKey, assetUrl, json);
            json.key = `X${index}`;

            setNfts((nfts) => [...nfts, json]);
          })
        );
      } else {
        setNfts((arr) => []);
      }
    }

    if (account) getTokens(account);
    else setNfts((arr) => []);
  }, [account, network, provider]);

  const breadcrumb = [
    {
      to: "/",
      title: "Home",
    },
    {
      title: "Digital Assets"
    },
    {
      title: "Artworks",
    },
  ];

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [currentPage]);

  const pages = useMemo(() => Math.ceil(nfts.length / PER_PAGE), [nfts]);
  const items = useMemo(
    () => nfts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
    [nfts, currentPage]
  );

  return (
    <PageContainer
      title="VTRU Scope"
      description="View all account digital assets"
    >
      <Breadcrumb title="VTRU Suite Digital Assets" items={breadcrumb} />
      {/* <FormControl sx={{ minWidth: "240px", marginBottom: 2 }}>
        <InputLabel>Order</InputLabel>
        <Select
          label="Order"
          defaultValue="mintNewToOld"
          onChange={(e) => setOrder(e.target.value)}
        >
          <MenuItem value="mintNewToOld">Latest</MenuItem>
          <MenuItem value="mintOldToNew">Oldest</MenuItem>
          <MenuItem value="creatorAZ">Creator – A-Z</MenuItem>
          <MenuItem value="creatorZA">Creator – Z-A</MenuItem>
          <MenuItem value="titleAZ">Title – A-Z</MenuItem>
          <MenuItem value="titleZA">Title – Z-A</MenuItem>
        </Select>
      </FormControl> */}
      {nfts.length == 0 && account == null ? (
        <Typography variant="h4" sx={{ mx: 2 }}>
          Connect account to view digital assets.
        </Typography>
      ) : (
        <>
          <Grid container spacing={3}>
            {nfts.length == 0 ? (
              <Typography variant="h4" sx={{ mx: 2, p: 3 }}>
                No digital assets found in account.
              </Typography>
            ) : (
              items.map((nft, index) => {
                return <VtruNFTCard nft={nft} key={index} />;
              })
            )}
          </Grid>
        </>
      )}
      {nfts.length > 0 && (
        <Box display="flex" alignItems="center" justifyContent="center">
          <Pagination
            count={pages}
            color="primary"
            sx={{ mt: 2, mx: "auto" }}
            onChange={(event, page) => setCurrentPage(page)}
          />
        </Box>
      )}
    </PageContainer>
  );
}

Artwork.layout = "Blank";
