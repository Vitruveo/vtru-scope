"use client";

import React, { useEffect, useState, useMemo } from "react";
import Box from "@mui/material/Box";
import { Grid, Typography, Pagination } from "@mui/material";
import Breadcrumb from "@/app/(pages)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/(pages)/components/container/PageContainer";
import VtruNFTCard from "@/app/(pages)/components/widgets/cards/VtruNFTCard";

import { useAccount } from "wagmi";
import { ethers } from "ethers";

const PER_PAGE = 24;

export default function Nfts() {
  const [account, setAccount] = useState(null);
  const [nfts, setNfts] = useState([]);

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
      // connectedOwner = '0xd07D220d7e43eCa35973760F8951c79dEebe0dcc';
      // connectedOwner = "0xABBA32cF845256A4284cdbA91D82C96CbB13dc59";
      // connectedOwner = '0xC0ee5bb36aF2831baaE1d31f358ccA46dAa6a4e8';
      // connectedOwner = '0xaD78De2EFaAb615956f7c4Cb26ADeB108199F86a';

      // connectedOwner = "0x1e8F9510e9A599204Db4dA3f352a7e73111f050C";

      // const assetUrl = `https://studio-api.vtru.dev/assets/scope/nft/${connectedOwner}`;
      const assetUrl = `https://studio-api.vitruveo.xyz/assets/scope/nft/${connectedOwner}`;

      try {
        const resp = await fetch(assetUrl);
        const json = await resp.json();

        setNfts(json);
      } catch (error) {
        console.log("Error fetching NFTs: ", error);
        // do nothing
      }
    }

    if (account) getTokens(account);
  }, [account, network, provider]);

  const breadcrumb = [
    {
      to: "/",
      title: "Home",
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
    <PageContainer title="VTRU Scope" description="View all account digital assets">
      <Breadcrumb title="VTRU Suite Digital Assets" items={breadcrumb} />

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

Nfts.layout = "Blank";
