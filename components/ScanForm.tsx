"use client";

import { useState } from "react";
import type { Chain } from "@/lib/wraith";
import type { GuardianAlert } from "@/lib/guardian";

const CHAINS: Chain[] = ["eth", "btc", "trx", "sol", "bsc", "polygon", "arbitrum", "base", "xrp"];

interface Props {
  onResult: (alert: GuardianAlert) => void;
}

export function ScanForm({ onResult }: Props) {
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState<Chain>("eth");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    if (!address.trim()) return;
    setScanning(true);
    setError(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim(), chain }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Scan failed");
        return;
      }

      const alert: GuardianAlert = await res.json();
      onResult(alert);
      setAddress("");
    } catch {
      setError("Network error");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
      <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">
        Scan Wallet
      </div>
      <div className="flex gap-2">
        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleScan()}
          placeholder="0x... or bc1... or T..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500"
        />
        <select
          value={chain}
          onChange={e => setChain(e.target.value as Chain)}
          className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300"
        >
          {CHAINS.map(c => (
            <option key={c} value={c}>{c.toUpperCase()}</option>
          ))}
        </select>
        <button
          onClick={handleScan}
          disabled={scanning || !address.trim()}
          className="bg-blue-700 hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-bold px-4 py-2 rounded transition-colors"
        >
          {scanning ? "Scanning..." : "SCAN"}
        </button>
      </div>
      {error && <div className="text-red-400 text-xs">{error}</div>}
      <div className="text-xs text-slate-600">
        Powered by Bright Data SERP + Web Unlocker + Wraith on-chain forensics
      </div>
    </div>
  );
}
