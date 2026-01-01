"use client";
import React, { useEffect, useState } from "react";
import Breadcrumb from "@/app/(pages)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/(pages)/components/container/PageContainer";

import {
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { CheckCircleOutline, ErrorOutline } from "@mui/icons-material";

import { readContract, writeContract, waitForTransaction } from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

// Confetti
import  * as confetti  from "canvas-confetti";

export default function VNS() {
  const { address, isConnected } = useAccount();

  const registrarAddress = config.mainnet.VNSRegistrar;
  const registrarAbi = config.abi.VNSRegistrar;

  const [name, setName] = useState("");
  const [years, setYears] = useState(1);

  const [checking, setChecking] = useState(false);
  const [quoteValid, setQuoteValid] = useState(null);
  const [year1Cost, setYear1Cost] = useState(null);
  const [subsequentCost, setSubsequentCost] = useState(null);
  const [totalCost, setTotalCost] = useState(null);

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Success summary
  const [successInfo, setSuccessInfo] = useState(null);

  // Filter input + trigger quote
  const handleNameChange = (e) => {
    const raw = e.target.value;
    const filtered = raw.toLowerCase().replace(/[^a-z0-9_]/g, "");

    setName(filtered);
    setError(null);
    setQuoteValid(null);
    setYear1Cost(null);
    setSubsequentCost(null);
    setTotalCost(null);
    setSuccessInfo(null);

    if (filtered.length >= 3) {
      void fetchQuote(filtered, years);
    }
  };

  const handleYearsChange = (e) => {
    const value = parseInt(e.target.value, 10) || 1;
    setYears(value);
    setError(null);
    setQuoteValid(null);
    setYear1Cost(null);
    setSubsequentCost(null);
    setTotalCost(null);
    setSuccessInfo(null);

    if (name.length >= 3) {
      void fetchQuote(name, value);
    }
  };

  const fetchQuote = async (n, y) => {
    try {
      setChecking(true);
      setError(null);

      const [valid, y1, sub, total] = await readContract({
        address: registrarAddress,
        abi: registrarAbi,
        functionName: "quoteRegistration",
        args: [n, BigInt(y)],
      });

      setQuoteValid(valid);

      if (valid) {
        setYear1Cost(y1);
        setSubsequentCost(sub);
        setTotalCost(total);
      } else {
        setYear1Cost(null);
        setSubsequentCost(null);
        setTotalCost(null);
      }
    } catch (err) {
      console.error(err);
      setError("Error checking name. Try again.");
      setQuoteValid(null);
      setYear1Cost(null);
      setSubsequentCost(null);
      setTotalCost(null);
    } finally {
      setChecking(false);
    }
  };

  const handleRegister = async () => {
    if (!isConnected || !address) {
      setError("Connect your wallet first.");
      return;
    }

    if (!name || name.length < 3) {
      setError("Enter at least 3 characters.");
      return;
    }

    if (!quoteValid || !totalCost) {
      setError("Name not available or quote missing.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const tx = await writeContract({
        address: registrarAddress,
        abi: registrarAbi,
        functionName: "register",
        args: [name, BigInt(years)],
        value: totalCost,
        gas: 1_000_000n
      });

      const hash = tx.hash ?? tx;
      await waitForTransaction({ hash });

      // SUCCESS 🎉
      confetti({
        particleCount: 160,
        spread: 70,
        origin: { y: 0.6 },
      });

      setSuccessInfo({
        name,
        address,
        years,
      });

      setError(null);
    } catch (err) {
      console.error(err);
      setError(err?.shortMessage || err?.message || "Transaction failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumb = [
    { to: "/", title: "Home" },
    { title: "Vitruveo Naming Service" },
  ];

  const renderStatusIcon = () => {
    if (name.length < 3) return null;
    if (checking)
      return (
        <InputAdornment position="end">
          <CircularProgress size={20} />
        </InputAdornment>
      );
    if (quoteValid === true)
      return (
        <InputAdornment position="end">
          <CheckCircleOutline color="success" />
        </InputAdornment>
      );
    if (quoteValid === false)
      return (
        <InputAdornment position="end">
          <ErrorOutline color="error" />
        </InputAdornment>
      );
    return null;
  };

  const formatVTRU = (value) =>
    value === null ? "-" : ethers.formatEther(value);

  return (
    <PageContainer
      title="Vitruveo Naming Service"
      description="Vitruveo Naming Service"
    >
      <Breadcrumb title="Vitruveo Naming Service (VNS)" items={breadcrumb} />

      <Grid container spacing={3} style={{ marginBottom: "30px" }} key={3}>
        <Grid item xs={12} sm={12} md={9} lg={9} key={1}>
          <h2>Register VNS Name</h2>

          <Box mt={2} mb={3}>
            <TextField
              label="Name (without @)"
              fullWidth
              value={name}
              onChange={handleNameChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">@</InputAdornment>
                ),
                endAdornment: renderStatusIcon(),
              }}
              helperText="Allowed: a–z, 0–9, underscore. Minimum 3 characters."
            />
          </Box>

          <Box mb={3}>
            <TextField
              label="Years"
              select
              fullWidth
              value={years}
              onChange={handleYearsChange}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((y) => (
                <MenuItem key={y} value={y}>
                  {y} {y === 1 ? "year" : "years"}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box mb={2}>
            <Typography variant="subtitle1">Pricing Preview</Typography>
            <Typography variant="body2">
              Year 1: <strong>{formatVTRU(year1Cost)} VTRU</strong>
            </Typography>
            <Typography variant="body2">
              Years 2–{years}:{" "}
              <strong>
                {years > 1 ? `${formatVTRU(subsequentCost)} VTRU` : "0"}
              </strong>
            </Typography>
            <Typography variant="body1" style={{ marginTop: "8px" }}>
              Total:{" "}
              <strong>
                {formatVTRU(totalCost)} VTRU{" "}
                {years > 1 ? `for ${years} years` : "for 1 year"}
              </strong>
            </Typography>
          </Box>

          {error && (
            <Box mb={2}>
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            </Box>
          )}

          <Box mt={2}>
            <Button
              variant="contained"
              disabled={
                submitting ||
                checking ||
                !name ||
                name.length < 3 ||
                !quoteValid ||
                !totalCost
              }
              onClick={handleRegister}
            >
              {submitting ? "Submitting..." : "Register"}
            </Button>
          </Box>

          {/* SUCCESS SUMMARY */}
          {successInfo && (
            <Box mt={4} p={2} style={{ border: "1px solid #ddd", borderRadius: 8 }}>
              <Typography variant="h6" gutterBottom>
                ✔ Registration Successful
              </Typography>
              <Typography variant="body1">
                <strong>Name:</strong> @{successInfo.name}
              </Typography>
              <Typography variant="body1">
                <strong>Owner:</strong> {successInfo.address}
              </Typography>
              <Typography variant="body1">
                <strong>Period:</strong> {successInfo.years}{" "}
                {successInfo.years === 1 ? "year" : "years"}
              </Typography>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} sm={12} md={3} lg={3}></Grid>
      </Grid>
    </PageContainer>
  );
}

VNS.layout = "Blank";