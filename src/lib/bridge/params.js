// Request parameter parsing shared by the bridge routes.
import { ethers } from "ethers";
import { BSC_CHAIN_ID, VITRUVEO_CHAIN_ID } from "./config";

export const parseAccount = (v) => (v && ethers.isAddress(v) ? ethers.getAddress(v) : null);

export const parseChain = (v) => {
  const n = Number(v);
  return n === VITRUVEO_CHAIN_ID || n === BSC_CHAIN_ID ? n : null;
};

// Whole units only (the contracts refund/ignore fractions). Accepts "100" or "100.7" (truncated). Returns wei (18 decimals: VTRU, BSC USDT, USDT.b).
export const parseWhole = (v) => {
  const n = Math.trunc(Number(v ?? 0));
  return Number.isFinite(n) && n > 0 ? ethers.parseEther(String(n)) : 0n;
};

export const parseToken = (v) => {
  const t = String(v || "VTRU").toUpperCase();
  return t === "VTRU" || t === "USDT" ? t : null;
};

// Optional route modifier: "vusd" = VUSD swap relayed by the bridge (token USDT only).
export const parseVia = (token, v) => (v == null || v === "" ? null : token === "USDT" && v === "vusd" ? "vusd" : undefined);
