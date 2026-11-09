// Response helpers for the /api/bridge/* routes: CORS for other Vertical Foundation apps (e.g. pretrend),
// BigInt-safe JSON, and the admin key check for privileged receipt writes.
import { NextResponse } from "next/server";

// Comma-separated list of extra origins allowed to call the bridge API. A ":*" port matches any port, e.g.
// BRIDGE_ALLOWED_ORIGINS=https://pretrend.ai,http://localhost:*
const allowed = () =>
  (process.env.BRIDGE_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const originAllowed = (origin) =>
  allowed().some((a) => (a.endsWith(":*") ? new RegExp(`^${a.slice(0, -2).replace(/[.]/g, "\\.")}(:\\d+)?$`).test(origin) : a === origin));

function corsHeaders(req) {
  const origin = req.headers.get("origin");
  if (!origin || !originAllowed(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-Api-Key",
    Vary: "Origin",
  };
}

const replacer = (_k, v) => (typeof v === "bigint" ? v.toString() : v);

export function json(req, body, status = 200) {
  return new NextResponse(JSON.stringify(body, replacer), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...corsHeaders(req) },
  });
}

export const fail = (req, status, error, detail) => json(req, detail ? { error, detail } : { error }, status);

export const preflight = (req) => new NextResponse(null, { status: 204, headers: corsHeaders(req) });

export const isAdmin = (req) => !!process.env.API_KEY && req.headers.get("x-api-key") === process.env.API_KEY;
