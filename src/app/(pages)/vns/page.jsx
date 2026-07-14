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
  Card,
  CardContent,
  Alert,
  Divider,
  Stack,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  CheckCircleOutline,
  ErrorOutline,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";

import {
  readContract,
  writeContract,
  waitForTransaction,
  switchNetwork,
  getNetwork,
  getWalletClient,
} from "@wagmi/core";
import config from "@/app/config/vtru-contracts.json";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

// canvas-confetti's callable lives on the default export under ESM interop,
// but falls back to the namespace itself in some bundler configs.
import * as confettiModule from "canvas-confetti";
const confetti = confettiModule.default || confettiModule;

const VITRUVEO_CHAIN_ID = 1490;
const vitruveoProvider = new ethers.JsonRpcProvider("https://rpc.vitruveo.ai", VITRUVEO_CHAIN_ID);

// node = keccak256(rootNode(0x00..0) ++ keccak256(label))
const namehash = (label) =>
  ethers.keccak256(ethers.concat([ethers.ZeroHash, ethers.keccak256(ethers.toUtf8Bytes(label))]));

// Adapt the connected wallet client to an ethers signer.
function walletClientToSigner(walletClient) {
  const { account, chain, transport } = walletClient;
  const provider = new ethers.BrowserProvider(transport, { chainId: chain.id, name: chain.name });
  return provider.getSigner(account.address);
}

async function getSigner() {
  if (getNetwork().chain?.id !== VITRUVEO_CHAIN_ID) {
    await switchNetwork({ chainId: VITRUVEO_CHAIN_ID });
  }
  const walletClient = await getWalletClient({ chainId: VITRUVEO_CHAIN_ID });
  if (!walletClient) throw new Error("Wallet not connected");
  return walletClientToSigner(walletClient);
}

// Minimal, dependency-free syntax highlighter for JS/Solidity snippets.
const CODE_KEYWORDS = new Set([
  "import", "from", "const", "let", "var", "new", "await", "async", "function",
  "return", "if", "else", "true", "false", "null", "require", "interface",
  "contract", "constant", "external", "view", "pure", "returns", "calldata",
  "memory", "storage", "public", "private", "internal",
]);
const CODE_TYPES = new Set([
  "address", "bool", "bytes32", "bytes", "uint256", "uint64", "uint8", "int", "string",
]);
const CODE_COLORS = {
  comment: "#6a9955",
  string: "#ce9178",
  number: "#b5cea8",
  keyword: "#569cd6",
  type: "#4ec9b0",
};

function highlightCode(code) {
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*')|(\b\d+\b)|([A-Za-z_$][\w$]*)/g;
  const out = [];
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) out.push(code.slice(last, m.index));
    let color = null;
    if (m[1]) color = CODE_COLORS.comment;
    else if (m[2]) color = CODE_COLORS.string;
    else if (m[3]) color = CODE_COLORS.number;
    else if (m[4]) {
      if (CODE_KEYWORDS.has(m[4])) color = CODE_COLORS.keyword;
      else if (CODE_TYPES.has(m[4])) color = CODE_COLORS.type;
    }
    out.push(color ? <span key={i++} style={{ color }}>{m[0]}</span> : m[0]);
    last = re.lastIndex;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

function CodeBlock({ code }) {
  return (
    <Box
      component="pre"
      sx={{
        bgcolor: "#1e1e1e",
        color: "#d4d4d4",
        borderRadius: 3,
        p: 2.5,
        m: 0,
        overflowX: "auto",
        fontFamily: "monospace",
        fontSize: "0.78rem",
        lineHeight: 1.5,
        whiteSpace: "pre",
      }}
    >
      {highlightCode(code)}
    </Box>
  );
}

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

  // Treasury: when unset (zero address), all registration funds go to VIBE.
  const [treasuryZero, setTreasuryZero] = useState(false);

  // Developer Notes tab: 0 = JS, 1 = Solidity
  const [devTab, setDevTab] = useState(0);

  // The account's names + view mode
  const [myNames, setMyNames] = useState([]);
  const [nameDetails, setNameDetails] = useState({}); // name -> { expiresAt, expired }
  const [mode, setMode] = useState(null); // null (loading) | "list" | "form"

  const hasRegistrations = myNames.length > 0;

  // VNS Send
  const [sendName, setSendName] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState("");
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(null);

  // Resolution management (per name): current on-chain addr + edited input + busy
  const [resolvedAddrs, setResolvedAddrs] = useState({});
  const [addrInputs, setAddrInputs] = useState({});
  const [settingName, setSettingName] = useState(null);
  const [addrError, setAddrError] = useState(null);

  // Load the account's registered names and pick the view.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!address) {
        setMyNames([]);
        setMode("form");
        return;
      }
      try {
        const detailed = await readContract({
          address: registrarAddress,
          abi: registrarAbi,
          functionName: "namesOfDetailed",
          args: [address],
        });
        if (cancelled) return;
        const entries = Array.from(detailed || []).reverse();
        const list = entries.map((d) => d.name);
        setMyNames(list);
        setNameDetails(
          Object.fromEntries(entries.map((d) => [d.name, { expiresAt: Number(d.expiresAt), expired: d.expired }]))
        );
        setMode(list.length > 0 ? "list" : "form");
        void loadResolutions(list);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setMyNames([]);
        setMode("form");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address]);

  // Read the treasury once to decide whether to show the VIBE footnote.
  useEffect(() => {
    (async () => {
      try {
        const t = await readContract({
          address: registrarAddress,
          abi: registrarAbi,
          functionName: "treasury",
        });
        setTreasuryZero(t === ethers.ZeroAddress);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const resetQuote = () => {
    setQuoteValid(null);
    setYear1Cost(null);
    setSubsequentCost(null);
    setTotalCost(null);
  };

  // Filter input + trigger quote
  const handleNameChange = (e) => {
    const raw = e.target.value;
    const filtered = raw.toLowerCase().replace(/[^a-z0-9_]/g, "");

    setName(filtered);
    setError(null);
    resetQuote();

    if (filtered.length >= 3) {
      void fetchQuote(filtered, years);
    }
  };

  const handleYearsChange = (e) => {
    const value = parseInt(e.target.value, 10) || 1;
    setYears(value);
    setError(null);
    resetQuote();

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
        resetQuote();
        setQuoteValid(false);
      }
    } catch (err) {
      console.error(err);
      setError("Error checking name. Try again.");
      resetQuote();
    } finally {
      setChecking(false);
    }
  };

  // Fetch the current address record for each of the account's names.
  const loadResolutions = async (list) => {
    const resolver = new ethers.Contract(config.mainnet.VNSResolver, config.abi.VNSResolver, vitruveoProvider);
    const entries = await Promise.all(
      list.map(async (n) => {
        try {
          const addr = await resolver.addr(namehash(n));
          return [n, addr === ethers.ZeroAddress ? "" : addr];
        } catch {
          return [n, ""];
        }
      })
    );
    const map = Object.fromEntries(entries);
    setResolvedAddrs(map);
    setAddrInputs((prev) => {
      const next = { ...prev };
      for (const [n, a] of entries) if (next[n] === undefined) next[n] = a;
      return next;
    });
  };

  const handleSend = async () => {
    setSendError(null);
    setSendSuccess(null);

    const target = sendName.toLowerCase().replace(/[^a-z0-9_]/g, "");
    const amount = parseFloat(sendAmount);

    if (!target) {
      setSendError("Enter a VNS name.");
      return;
    }
    if (!(amount > 0)) {
      setSendError("Enter an amount greater than 0.");
      return;
    }

    try {
      setSending(true);

      setSendStatus("Resolving name…");
      const reg = new ethers.Contract(registrarAddress, registrarAbi, vitruveoProvider);
      const r = await reg.lookupName(target);
      if (!r[0]) throw new Error(`@${target} is not registered.`);
      const to = r[5];
      if (!to || to === ethers.ZeroAddress) throw new Error(`@${target} has no address set.`);

      const signer = await getSigner();
      setSendStatus("Confirm the transfer in your wallet…");
      const tx = await signer.sendTransaction({ to, value: ethers.parseEther(String(amount)) });
      setSendStatus("Waiting for confirmation…");
      await tx.wait();

      setSendStatus("");
      setSendSuccess({ name: target, to, amount });
      setSendName("");
      setSendAmount("");
    } catch (err) {
      console.error(err);
      setSendError(err?.shortMessage || err?.reason || err?.message || "Transfer failed.");
    } finally {
      setSending(false);
    }
  };

  const handleSetAddr = async (n) => {
    setAddrError(null);
    const addr = (addrInputs[n] || "").trim();
    if (!ethers.isAddress(addr)) {
      setAddrError("Enter a valid address.");
      return;
    }
    try {
      setSettingName(n);
      const tx = await writeContract({
        address: config.mainnet.VNSResolver,
        abi: config.abi.VNSResolver,
        functionName: "setAddr",
        args: [namehash(n), addr],
      });
      const hash = tx.hash ?? tx;
      await waitForTransaction({ hash });
      setResolvedAddrs((prev) => ({ ...prev, [n]: addr }));
    } catch (err) {
      console.error(err);
      setAddrError(err?.shortMessage || err?.reason || err?.message || "Failed to set address.");
    } finally {
      setSettingName(null);
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
        gas: 1_000_000n,
      });

      const hash = tx.hash ?? tx;
      await waitForTransaction({ hash });

      // SUCCESS 🎉
      confetti({ particleCount: 160, spread: 70, origin: { y: 0.6 } });

      setMyNames((prev) => (prev.includes(name) ? prev : [name, ...prev]));
      void loadResolutions([name]);
      setSuccessInfo({ name, address, years });
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err?.shortMessage || err?.message || "Transaction failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const goToForm = () => {
    setSuccessInfo(null);
    setName("");
    setYears(1);
    resetQuote();
    setError(null);
    setMode("form");
  };

  const goToList = () => {
    setSuccessInfo(null);
    setMode("list");
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

  const formatDate = (secs) =>
    !secs ? "—" : new Date(secs * 1000).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const formatVTRU = (value) =>
    value == null ? "—" : parseFloat(ethers.formatEther(value)).toLocaleString(undefined, { maximumFractionDigits: 4 });

  // Sending only resolves a name and transfers VTRU, so it works without any registration.
  const sendSection = (
    <Box>
      <Typography fontWeight={800} sx={{ fontSize: "2rem", mb: 2 }}>
        VNS Send
      </Typography>
      <Typography color="text.secondary" sx={{ fontSize: "1.2rem", mb: 2 }}>
        Send VTRU to a VNS name. The name is resolved to its address.
      </Typography>
      <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-start">
        <TextField
          label="VNS name"
          value={sendName}
          onChange={(e) => {
            setSendName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
            setSendError(null);
            setSendSuccess(null);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Box component="span" sx={{ fontSize: "1.6rem", fontWeight: 700, color: "text.secondary" }}>@</Box>
              </InputAdornment>
            ),
            sx: { fontSize: "1.6rem" },
          }}
          InputLabelProps={{ sx: { fontSize: "1.2rem" } }}
          sx={{ flex: "2 1 260px" }}
        />
        <TextField
          label="Amount (VTRU)"
          type="number"
          value={sendAmount}
          onChange={(e) => {
            setSendAmount(e.target.value);
            setSendError(null);
            setSendSuccess(null);
          }}
          InputProps={{ sx: { fontSize: "1.6rem" } }}
          InputLabelProps={{ sx: { fontSize: "1.2rem" } }}
          sx={{ flex: "1 1 160px" }}
        />
        <Button
          variant="contained"
          size="large"
          disabled={sending || !sendName || !sendAmount}
          onClick={handleSend}
          sx={{ py: 1.9, px: 4, borderRadius: 3, fontWeight: 700, fontSize: "1.2rem", textTransform: "none" }}
        >
          {sending ? "Sending…" : "Send"}
        </Button>
      </Box>
      {sending && sendStatus && (
        <Box mt={2} display="flex" alignItems="center" gap={1.5}>
          <CircularProgress size={18} />
          <Typography color="text.secondary" sx={{ fontSize: "1.1rem" }}>{sendStatus}</Typography>
        </Box>
      )}
      {sendSuccess && (
        <Alert severity="success" onClose={() => setSendSuccess(null)} sx={{ mt: 2, fontSize: "1.1rem", wordBreak: "break-word" }}>
          Sent {sendSuccess.amount} VTRU to @{sendSuccess.name} ({sendSuccess.to}).
        </Alert>
      )}
      {sendError && (
        <Alert severity="error" onClose={() => setSendError(null)} sx={{ mt: 2, fontSize: "1.1rem", wordBreak: "break-word" }}>
          {sendError}
        </Alert>
      )}
    </Box>
  );

  return (
    <PageContainer title="Vitruveo Naming Service" description="Vitruveo Naming Service">
      <Breadcrumb title="Vitruveo Naming Service (VNS)" items={breadcrumb} />

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent sx={{ p: 4 }}>
              {mode === null ? (
                // ---- Loading ----
                <Box display="flex" justifyContent="center" py={6}>
                  <CircularProgress />
                </Box>
              ) : successInfo ? (
                // ---- Success summary ----
                <Stack spacing={3} alignItems="center" textAlign="center" py={2}>
                  <CheckIcon color="success" sx={{ fontSize: 84 }} />
                  <Box>
                    <Typography fontWeight={800} sx={{ fontSize: "2.4rem" }}>
                      Registration successful
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: "1.4rem", mt: 1 }}>
                      Your name is now registered on Vitruveo.
                    </Typography>
                  </Box>
                  <Box>
                    <Typography fontWeight={800} lineHeight={1.1} sx={{ fontSize: "4rem" }}>
                      @{successInfo.name}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: "1.4rem", mt: 1 }}>
                      {successInfo.years} {successInfo.years === 1 ? "year" : "years"}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={goToList}
                    sx={{ py: 1.6, px: 5, borderRadius: 3, fontWeight: 700, fontSize: "1.2rem", textTransform: "none" }}
                  >
                    View my names
                  </Button>
                </Stack>
              ) : mode === "list" ? (
                // ---- List of the account's names ----
                <Stack spacing={4}>
                  {/* ---- VNS Send ---- */}
                  {sendSection}

                  <Divider />

                  {/* ---- Names + resolution ---- */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Typography fontWeight={800} sx={{ fontSize: "2rem" }}>
                      VNS Names
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<AddIcon />}
                      onClick={goToForm}
                      sx={{ py: 1.4, px: 3, borderRadius: 3, fontWeight: 700, fontSize: "1.15rem", textTransform: "none" }}
                    >
                      Register Name
                    </Button>
                  </Box>

                  {addrError && (
                    <Alert severity="error" onClose={() => setAddrError(null)} sx={{ fontSize: "1.1rem", wordBreak: "break-word" }}>
                      {addrError}
                    </Alert>
                  )}

                  <Stack spacing={2}>
                    {myNames.map((n) => {
                      const input = addrInputs[n] ?? "";
                      const valid = ethers.isAddress(input.trim());
                      const changed = input.trim().toLowerCase() !== (resolvedAddrs[n] || "").toLowerCase();
                      return (
                        <Box
                          key={n}
                          p={2.5}
                          sx={{ borderRadius: 3, bgcolor: "action.hover", display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}
                        >
                          <Box sx={{ flex: "0 0 200px", minWidth: 0 }}>
                            <Typography fontWeight={800} sx={{ fontSize: "1.8rem", lineHeight: 1.2, wordBreak: "break-all" }}>
                              @{n}
                            </Typography>
                            {nameDetails[n] && (
                              <Typography
                                sx={{ fontSize: "0.95rem", mt: 2, lineHeight: 1.2 }}
                                color={nameDetails[n].expired ? "error.main" : "text.secondary"}
                              >
                                {nameDetails[n].expired ? "Expired " : "Expires "}
                                {formatDate(nameDetails[n].expiresAt)}
                              </Typography>
                            )}
                          </Box>
                          <TextField
                            placeholder="0x… address"
                            value={input}
                            onChange={(e) => {
                              setAddrInputs((prev) => ({ ...prev, [n]: e.target.value }));
                              setAddrError(null);
                            }}
                            InputProps={{ sx: { fontSize: "1.2rem", fontFamily: "monospace" } }}
                            sx={{ flex: "1 1 320px" }}
                          />
                          <Button
                            variant="contained"
                            size="large"
                            disabled={settingName === n || !valid || !changed}
                            onClick={() => handleSetAddr(n)}
                            sx={{ py: 1.6, px: 4, borderRadius: 3, fontWeight: 700, fontSize: "1.2rem", textTransform: "none", flex: "0 0 auto" }}
                          >
                            {settingName === n ? "Setting…" : "Set"}
                          </Button>
                        </Box>
                      );
                    })}
                  </Stack>

                  {/* ---- Developer Notes ---- */}
                  <Box sx={{ pt: 12 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Accordion
                      disableGutters
                      elevation={0}
                      sx={{ bgcolor: "transparent", "&:before": { display: "none" } }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ px: 0, opacity: 0.75 }}
                      >
                        <Typography fontWeight={700} color="text.secondary" sx={{ fontSize: "1.2rem" }}>
                          Developer Notes
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 0, opacity: 0.75 }}>
                    <Typography color="text.secondary" sx={{ fontSize: "0.9rem", mb: 1.5 }}>
                      Resolve a VNS name to an address by calling{" "}
                      <Box component="code" sx={{ fontFamily: "monospace" }}>lookupName</Box> on the
                      registrar. The <Box component="code" sx={{ fontFamily: "monospace" }}>addrRecord</Box>{" "}
                      field is the resolved address.
                    </Typography>

                    <Tabs
                      value={devTab}
                      onChange={(e, v) => setDevTab(v)}
                      sx={{ minHeight: 0, mb: 1.5, "& .MuiTab-root": { minHeight: 0, py: 1, fontSize: "0.85rem", textTransform: "none" } }}
                    >
                      <Tab label="JavaScript" />
                      <Tab label="Solidity" />
                    </Tabs>

                    {devTab === 0 ? (
                      <CodeBlock
                        code={`import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://rpc.vitruveo.ai", 1490);

const registrar = new ethers.Contract(
  "${registrarAddress}", // VNSRegistrar
  ["function lookupName(string) view returns (bool valid, bytes32 labelHash, bytes32 node, address owner, address resolver, address addrRecord, uint64 expiresAt, bool isRegistered)"],
  provider
);

const r = await registrar.lookupName("scope");
if (r.valid && r.isRegistered && r.addrRecord !== ethers.ZeroAddress) {
  console.log("scope resolves to", r.addrRecord);
}`}
                      />
                    ) : (
                      <CodeBlock
                        code={`interface IVNSRegistrar {
    function lookupName(string calldata name)
        external
        view
        returns (
            bool valid,
            bytes32 labelHash,
            bytes32 node,
            address owner,
            address resolver,
            address addrRecord,
            uint64 expiresAt,
            bool isRegistered
        );
}

contract Example {
    IVNSRegistrar constant VNS =
        IVNSRegistrar(${registrarAddress});

    function resolve(string calldata name) external view returns (address) {
        (bool valid, , , , , address addrRecord, , bool isRegistered) =
            VNS.lookupName(name);
        require(valid && isRegistered, "VNS: not registered");
        return addrRecord;
    }
}`}
                      />
                    )}
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                </Stack>
              ) : (
                // ---- Registration form ----
                <>
                  {sendSection}

                  <Divider sx={{ my: 4 }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
                    <Box>
                      <Typography fontWeight={800} sx={{ fontSize: "2rem", mb: 2 }}>
                        VNS Register
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontSize: "1.2rem" }}>
                        Register a name on the Vitruveo Naming Service (VNS).
                      </Typography>
                    </Box>
                    {hasRegistrations && (
                      <Button onClick={goToList} sx={{ textTransform: "none", fontSize: "1.15rem" }}>
                        ← My names
                      </Button>
                    )}
                  </Box>

                  <TextField
                    label="Name"
                    fullWidth
                    value={name}
                    onChange={handleNameChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box component="span" sx={{ fontSize: "3rem", fontWeight: 700, color: "text.secondary" }}>@</Box>
                        </InputAdornment>
                      ),
                      endAdornment: renderStatusIcon(),
                      sx: { fontSize: "3rem", fontWeight: 700, py: 1 },
                    }}
                    InputLabelProps={{ sx: { fontSize: "1.5rem" } }}
                    FormHelperTextProps={{ sx: { fontSize: "1.05rem" } }}
                    helperText="Allowed: a–z, 0–9, underscore. Minimum 3 characters."
                    sx={{ mb: 4 }}
                  />

                  <TextField
                    label="Years"
                    select
                    fullWidth
                    value={years}
                    onChange={handleYearsChange}
                    InputProps={{ sx: { fontSize: "1.6rem" } }}
                    InputLabelProps={{ sx: { fontSize: "1.5rem" } }}
                    sx={{ mb: 4 }}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((y) => (
                      <MenuItem key={y} value={y} sx={{ fontSize: "1.4rem" }}>
                        {y} {y === 1 ? "year" : "years"}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Box p={3} sx={{ borderRadius: 3, bgcolor: "action.hover", mb: 4 }}>
                    <Typography fontWeight={700} mb={1.5} sx={{ fontSize: "1.5rem" }}>
                      Pricing
                    </Typography>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography color="text.secondary" sx={{ fontSize: "1.3rem" }}>Year 1</Typography>
                      <Typography sx={{ fontSize: "1.3rem" }}>{formatVTRU(year1Cost)} VTRU</Typography>
                    </Box>
                    {years > 1 && (
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography color="text.secondary" sx={{ fontSize: "1.3rem" }}>Years 2–{years}</Typography>
                        <Typography sx={{ fontSize: "1.3rem" }}>{formatVTRU(subsequentCost)} VTRU</Typography>
                      </Box>
                    )}
                    <Divider sx={{ my: 1.5 }} />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={700} sx={{ fontSize: "1.4rem" }}>
                        Total ({years} {years === 1 ? "year" : "years"})
                      </Typography>
                      <Typography fontWeight={800} sx={{ fontSize: "1.9rem" }}>
                        {formatVTRU(totalCost)} VTRU
                      </Typography>
                    </Box>
                  </Box>

                  {error && (
                    <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3, fontSize: "1.1rem", wordBreak: "break-word" }}>
                      {error}
                    </Alert>
                  )}

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={submitting || checking || !name || name.length < 3 || !quoteValid || !totalCost}
                    onClick={handleRegister}
                    sx={{ py: 2.2, borderRadius: 3, fontWeight: 700, fontSize: "1.4rem", textTransform: "none" }}
                  >
                    {submitting ? "Submitting…" : "Register"}
                  </Button>

                  {treasuryZero && (
                    <Typography color="text.secondary" textAlign="center" sx={{ fontSize: "1rem", mt: 2 }}>
                      100% of funds sent to{" "}
                      <Box
                        component="a"
                        href="https://explorer.vitruveo.ai/address/0x000000000000000000000000000000000000dEaD"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: "primary.main", textDecoration: "underline" }}
                      >
                        burn wallet
                      </Box>
                    </Typography>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
}

VNS.layout = "Blank";
