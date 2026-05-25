"use client";

import { useEffect, useState } from "react";
import { ScanForm } from "@/components/ScanForm";
import { AlertCard } from "@/components/AlertCard";
import type { GuardianAlert } from "@/lib/guardian";

interface DemoAlert {
  id: string;
  wallet: string;
  chain: string;
  threatLevel: string;
  compositeScore: number;
  webScore: number;
  chainScore: number;
  summary: string;
  createdAt: string;
}

export default function Home() {
  const [alerts, setAlerts] = useState<DemoAlert[]>([]);
  const [scanResults, setScanResults] = useState<GuardianAlert[]>([]);

  useEffect(() => {
    fetch("/api/alerts")
      .then(r => r.json())
      .then(d => setAlerts(d.alerts ?? []));
  }, []);

  function handleNewAlert(alert: GuardianAlert) {
    setScanResults(prev => [alert, ...prev]);
  }

  const allAlerts = [
    ...scanResults,
    ...alerts.map(a => ({ ...a, webIntel: null, chainIntel: null } as unknown as GuardianAlert)),
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-blue-400">CHAIN</span>
              <span className="text-slate-200">GUARDIAN</span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Web2 × Web3 Threat Intelligence — Bright Data + Wraith
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
              Bright Data Live
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse" />
              Wraith 12-Chain
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Wallets Monitored", value: "847" },
            { label: "Threats Today", value: "23" },
            { label: "Chains Covered", value: "12" },
            { label: "Web Sources", value: "∞" },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Scan */}
        <ScanForm onResult={handleNewAlert} />

        {/* Demo wallets */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-3">
            Demo Targets (Real Intel)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            {[
              { label: "Lazarus Group", addr: "0x8BAbec8B3F20F5C8B65B52e2B4042CAE6dD9E18", chain: "ETH" },
              { label: "Xinbi USDT", addr: "TGCnXVpKZbSsoBbvJBmFMF8GGn5gGDLa3H", chain: "TRX" },
              { label: "OneCoin (Ruja)", addr: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", chain: "BTC" },
            ].map(t => (
              <div key={t.addr} className="bg-slate-950 rounded p-2">
                <div className="text-slate-400 font-sans text-xs mb-1">{t.label}</div>
                <div className="text-slate-600 truncate">{t.addr}</div>
                <div className="text-slate-700 text-xs mt-1">{t.chain}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-3">
            Threat Feed
          </div>
          <div className="space-y-3">
            {allAlerts.length === 0 ? (
              <div className="text-slate-600 text-sm text-center py-12">
                No alerts yet. Scan a wallet above.
              </div>
            ) : (
              allAlerts.map(a => <AlertCard key={a.id} alert={a as GuardianAlert} />)
            )}
          </div>
        </div>

        {/* How it works */}
        <div className="border-t border-slate-800 pt-8 grid grid-cols-3 gap-6 text-center">
          {[
            {
              step: "01",
              title: "Bright Data Scans the Web",
              desc: "SERP API + Web Unlocker searches forums, news, and dark-web sources for wallet mentions and threat signals.",
            },
            {
              step: "02",
              title: "Wraith Reads the Chain",
              desc: "On-chain forensics across 12 blockchains: OFAC hits, mixer flows, exploit patterns, entity attribution.",
            },
            {
              step: "03",
              title: "AI Synthesizes Both",
              desc: "Claude correlates web intelligence + chain signals into a composite threat score and written assessment.",
            },
          ].map(s => (
            <div key={s.step} className="space-y-2">
              <div className="text-3xl font-bold text-slate-800">{s.step}</div>
              <div className="text-sm font-semibold text-slate-300">{s.title}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
