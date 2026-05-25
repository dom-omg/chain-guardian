"use client";

import { ThreatBadge } from "./ThreatBadge";
import { ScoreRing } from "./ScoreRing";
import type { GuardianAlert } from "@/lib/guardian";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function AlertCard({ alert }: { alert: GuardianAlert }) {
  const short = alert.wallet.length > 20
    ? `${alert.wallet.slice(0, 10)}...${alert.wallet.slice(-8)}`
    : alert.wallet;

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-lg p-4 transition-colors">
      <div className="flex items-start gap-3">
        <ScoreRing score={alert.compositeScore} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <ThreatBadge level={alert.threatLevel as Parameters<typeof ThreatBadge>[0]["level"]} />
            <span className="text-slate-500 text-xs uppercase">{alert.chain}</span>
            <span className="text-slate-600 text-xs ml-auto">{timeAgo(alert.createdAt)}</span>
          </div>
          <div className="text-slate-300 font-mono text-xs mt-1 truncate">{short}</div>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">{alert.summary}</p>
          <div className="flex gap-4 mt-2 text-xs text-slate-600">
            <span>Web <span className="text-slate-400">{alert.webScore}</span></span>
            <span>Chain <span className="text-slate-400">{alert.chainScore}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
