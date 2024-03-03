import React, { useEffect, useState } from "react";
import "../styles/landing.scss";
import { useConnectModal, useChainModal } from "@rainbow-me/rainbowkit";
import { ethers } from "ethers";
import { db } from "../config/firebase";
import { getDoc, setDoc, doc } from "firebase/firestore";
import addresses from "../utils/elidigibleWallets.json";
import ConnectWalletButton from "./ConnectWalletButton";
import { getWalletClient } from "@wagmi/core";
const configTestnet = require("../config/boosterContractTestnetV2");
const configMainnet = require("../config/boosterContractMainnetV2");
var config

if (process.env.NEXT_PUBLIC_IS_TESTNET == "true") {
  config = configTestnet.config
} else {
  config = configMainnet.config
}

import { readContract, writeContract, waitForTransaction } from "@wagmi/core";
import { useWalletClient, useAccount } from "wagmi";
import Link from "next/link";
import Image from "next/image";

function GraphCMSImageLoader({ src, width }) {
  return `https://media.graphcms.com/resize=width:${width}/${relativeSrc(src)}`;
}

function Collection({ booster }) {
  const src = booster?.image;
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  useEffect(() => {
    setIsImageLoaded(false);
  }, [src]);

  return (
    <div className="collection">
      <div className="img">
        <Image
          src={"/images/loader-yes.gif"}
          alt={booster?.name}
          width={50}
          height={50}
          style={{
            position: "absolute",
            top: "50%",
            transform: "translate(-50%, -50%) !important",
            opacity: !isImageLoaded ? 1 : 0,
            display: isImageLoaded ? 'none' : 'block',
            transitionDuration: "500ms",
            transitionProperty: "opacity",
            transitionTimingFunction: "ease-out",
          }}
        />
        <Image
          src={src}
          style={{
            opacity: isImageLoaded ? 1 : 0,
            transitionDuration: "500ms",
            transitionProperty: "opacity",
            transitionTimingFunction: "ease-out",
          }}
          alt={booster?.name}
          width={300}
          onLoadingComplete={() => {
            setIsImageLoaded(true);
          }}
          height={300}
        />
      </div>
      <div className="collection-details">
        <p>{booster?.name}</p>
        <p>#{booster?.id}</p>
      </div>
    </div>
  );
}

function MyCollections() {
  const [loading, setLoading] = useState(true);
  const { address, isDisconnected, isConnected } = useAccount();
  const data = useWalletClient();
  const [boosters, setBoosters] = useState([]);
  const { openConnectModal } = useConnectModal();

  useEffect(() => {
    console.log("address", address)
    if (address && data?.data?.chain?.id == 1490) {
      setLoading(true)
      getContractData();
    } else {
      setLoading(false)
      setBoosters([]);
    }
  }, [address, data?.data?.chain?.id]);

  async function getContractData() {
    setLoading(true);
    try {
      const mintedBoosters = await readContract({
        address: config?.contractAddress,
        abi: config?.abi,
        functionName: "getMintedBoosters",
        args: [address]
        // args: ["0x26a9268CC3312613A3a2e304127A8511E9529026"],
      });
      let boosters = [];
      for (let i = 0; i < mintedBoosters.length; i++) {
        let resp = await getData(mintedBoosters[i].toString());
        boosters.push(resp);
      }
      setBoosters(boosters);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setBoosters([]);
      console.log(error);
    }
  }

  const getData = async (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const resp = await fetch(`/api/metadata/${id}.json`);
        const json = await resp.json();
        resolve(json.data);
      } catch (error) {
        reject(error);
      }
    });
  };

  async function connectWalletHandler() {
    if (isDisconnected) {
      await openConnectModal();
      return;
    }
  }

  return (
    <div className="wrapper">
      <div className="top-bar">
        <div className="nav">
          <div className="logo">
            <a href={"https://www.vitruveo.xyz/"} target="_blank">
              <img src="/images/logo.png" alt="logo" />
            </a>
          </div>
          <Link href="/">
            <button type="button" className="">
              Booster Sale
            </button>
          </Link>
          <Link href="/referral">
            <button type="button" className="">
              Referral
            </button>
          </Link>
        </div>
        <ConnectWalletButton />
      </div>

      <div className="mid-content">
        <h1 className="title">My Boosters</h1>
        {!loading ? (
          <div className="collections-wrapper">
            {!(!isDisconnected && data?.data?.chain?.id) ? (
              <button
                className={`btn gradient-btn`}
                onClick={connectWalletHandler}
              >
                {loading === true ? (
                  <img src={"/images/loader-yes.gif"} alt="" />
                ) : (
                  "Connect Wallet"
                )}
              </button>
            ) : (data?.data?.chain?.id && data?.data?.chain?.id != 1490) ? (
              <p className="learn-more">
                Wrong Network, switch to{" "}
                <span className="text-bold">VITRUVEO</span>..!
              </p>
            ) : (
              <div className="collections">
                {boosters.length ? (
                  boosters.map((item, index) => (
                    <Collection key={index} booster={item} />
                  ))
                ) : (
                  <p className="learn-more"> Your wallet has no Boosters..!</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <section>
            <div class="loader loader-1">
              <div class="loader-outter"></div>
              <div class="loader-inner"></div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default MyCollections;