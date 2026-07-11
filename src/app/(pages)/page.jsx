"use client";
import React from "react";
import PageContainer from "@/app/(pages)/components/container/PageContainer";
import Link from "next/link";

import { Typography, Box, Grid, Chip } from "@mui/material";

const BRAND = "#763EBD";
const BRAND_LIGHT = "#9B6FD9";

/* Icons reproduced from the Vertical Foundation site (verticalfoundation.net) */
const CoinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="100%" height="100%">
    <circle cx="12" cy="12" r="9" />
    <path d="M8 9l4 7 4-7" />
  </svg>
);

const TrendingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="100%" height="100%">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const SaleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="100%" height="100%">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const UtilitiesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="100%" height="100%">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ProtocolIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="100%" height="100%">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="100%" height="100%">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const pillars = [
  {
    name: "VTRU",
    tagline: "Native Currency",
    description:
      "The native cryptocurrency of Vitruveo — the asset every other pillar is built to strengthen.",
    href: "https://www.verticalfoundation.net/#vtru",
    Icon: CoinIcon,
  },
  {
    name: "Pretrend",
    tagline: "Prediction Markets",
    description:
      "On-chain trend resolution for prediction markets, powered by native statistical computation.",
    href: "https://www.pretrend.ai",
    Icon: TrendingIcon,
  },
  {
    name: "VIBE",
    tagline: "Revenue Sharing",
    description:
      "The Vitruveo Income Building Engine — on-chain revenue-sharing back to the community.",
    href: "/assets/vibe",
    internal: true,
    Icon: SaleIcon,
  },
  {
    name: "Scope",
    tagline: "Asset Management",
    description:
      "The app that lets you manage all of your Vitruveo assets in one place.",
    href: null,
    Icon: UtilitiesIcon,
  },
  {
    name: "Protocol",
    tagline: "Developer Power",
    description:
      "Developer power built into the chain: HOST webhooks, protocol smart contracts, and AI.",
    href: "https://www.vitruveo.ai/developers",
    Icon: ProtocolIcon,
  },
  {
    name: "Validators",
    tagline: "Network Operations",
    description:
      "We run the protocol network and oversee validator onboarding, health, and success.",
    href: "https://www.verticalfoundation.net/validators",
    Icon: ShieldIcon,
  },
];

export default function Dashboard() {
  return (
    <PageContainer title="VTRU Scope" description="VTRU Scope by Vitruveo">
      {/* Hero */}
      <Box
        sx={{
          textAlign: "center",
          maxWidth: "820px",
          mx: "auto",
          mt: { xs: 3, md: 4 },
          mb: { xs: 5, md: 8 },
          px: 2,
        }}
      >
        <Chip
          label="VERTICAL FOUNDATION"
          component="a"
          href="https://www.verticalfoundation.net"
          target="_blank"
          rel="noopener noreferrer"
          clickable
          sx={{
            mb: 3,
            letterSpacing: "2px",
            fontSize: "11px",
            fontWeight: 700,
            color: BRAND_LIGHT,
            bgcolor: "rgba(118, 62, 189, 0.12)",
            border: `1px solid rgba(118, 62, 189, 0.35)`,
            "&:hover": { bgcolor: "rgba(118, 62, 189, 0.22)" },
          }}
        />
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: "38px", sm: "48px", md: "60px" },
            fontWeight: 800,
            lineHeight: 1.05,
            background: `linear-gradient(120deg, #ffffff 0%, ${BRAND_LIGHT} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Six Foundation Pillars
        </Typography>
        <Typography
          sx={{
            color: "rgba(255,255,255,0.7)",
            fontSize: { xs: "15px", md: "18px" },
            lineHeight: 1.6,
            mt: 3,
          }}
        >
          As the governing body behind Vitruveo, Vertical Foundation carries the
          protocol&apos;s development, treasury, and long-term growth — organized
          across six foundational pillars.
        </Typography>
      </Box>

      {/* Pillars grid */}
      <Grid
        container
        spacing={{ xs: 2.5, md: 4 }}
        sx={{ pb: 8, px: { xs: 1, md: 0 }, maxWidth: "1200px", mx: "auto" }}
      >
        {pillars.map((pillar) => {
          const { Icon } = pillar;
          const isLink = Boolean(pillar.href);
          const linkProps = isLink
            ? {
                component: Link,
                href: pillar.href,
                ...(pillar.internal ? {} : { target: "_new" }),
              }
            : {};
          return (
            <Grid item xs={12} sm={6} lg={4} key={pillar.name}>
              <Box
                {...linkProps}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  height: "100%",
                  minHeight: { xs: "auto", sm: "320px" },
                  p: { xs: 4, md: 5 },
                  textDecoration: "none",
                  borderRadius: "20px",
                  position: "relative",
                  overflow: "hidden",
                  cursor: isLink ? "pointer" : "default",
                  background:
                    "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  transition: "all 0.25s ease",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "3px",
                    background: `linear-gradient(90deg, ${BRAND} 0%, ${BRAND_LIGHT} 100%)`,
                    opacity: 0,
                    transition: "opacity 0.25s ease",
                  },
                  ...(isLink && {
                    "&:hover": {
                      transform: "translateY(-6px)",
                      borderColor: "rgba(118, 62, 189, 0.5)",
                      boxShadow: `0 20px 40px -12px rgba(118, 62, 189, 0.35)`,
                      background:
                        "linear-gradient(160deg, rgba(118,62,189,0.10) 0%, rgba(255,255,255,0.02) 100%)",
                    },
                    "&:hover::before": { opacity: 1 },
                    "&:hover .pillar-icon": {
                      color: "#fff",
                      borderColor: "rgba(118, 62, 189, 0.6)",
                      background: `linear-gradient(160deg, ${BRAND} 0%, rgba(118,62,189,0.4) 100%)`,
                    },
                    "&:hover .pillar-arrow": {
                      opacity: 1,
                      transform: "translateX(0)",
                    },
                  }),
                }}
              >
                {/* Icon badge */}
                <Box
                  className="pillar-icon"
                  sx={{
                    width: { xs: 64, md: 76 },
                    height: { xs: 64, md: 76 },
                    p: { xs: 1.75, md: 2.25 },
                    mb: 3,
                    borderRadius: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: BRAND_LIGHT,
                    background: "rgba(118, 62, 189, 0.12)",
                    border: "1px solid rgba(118, 62, 189, 0.3)",
                    transition: "all 0.25s ease",
                  }}
                >
                  <Icon />
                </Box>

                <Typography
                  sx={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.45)",
                    mb: 0.5,
                  }}
                >
                  {pillar.tagline}
                </Typography>

                <Typography
                  sx={{
                    fontSize: { xs: "26px", md: "30px" },
                    fontWeight: 800,
                    color: "#fff",
                    mb: 1.5,
                  }}
                >
                  {pillar.name}
                </Typography>

                <Typography
                  sx={{
                    fontSize: { xs: "15px", md: "16px" },
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.7)",
                    flexGrow: 1,
                  }}
                >
                  {pillar.description}
                </Typography>

                {isLink && (
                  <Typography
                    className="pillar-arrow"
                    sx={{
                      mt: 3,
                      fontSize: "14px",
                      fontWeight: 700,
                      color: BRAND_LIGHT,
                      opacity: 0.6,
                      transform: "translateX(-6px)",
                      transition: "all 0.25s ease",
                    }}
                  >
                    Explore →
                  </Typography>
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </PageContainer>
  );
}

Dashboard.layout = "Blank";
