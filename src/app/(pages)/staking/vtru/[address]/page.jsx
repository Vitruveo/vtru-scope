"use client"

import { useParams } from "next/navigation";
import { ethers } from "ethers";
import StakeView from "../StakeView";

export default function StakeAddress () {
  const params = useParams();
  const raw = Array.isArray(params?.address) ? params.address[0] : params?.address;
  const address = raw && ethers.isAddress(raw) ? ethers.getAddress(raw) : null;

  return <StakeView viewAddress={address} />;
};

StakeAddress.layout = "Blank";
