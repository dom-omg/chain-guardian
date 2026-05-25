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

  const chainIntel = alert.chainIntel;
  const webIntel = alert.webIntel;

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-lg p-4 transition-colors">
      <div className="flex items-start gap-3">
        <ScoreRing score={alert.compositeScore} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <ThreatBadge level={alert.threatLevel as Parameters<typeof ThreatBadge>[0]["level"]} />
            <span className="text-slate-500 text-xs uppercase">{alert.chain}</span>
            {chainIntel?.verdict && chainIntel.verdict !== "none" && (
              <span className="text-xs text-red-400 font-mono uppercase">{chainIntel.verdict}</span>
            )}
            <span className="text-slate-600 text-xs ml-auto">{timeAgo(alert.createdAt)}</span>
          </div>

          <div className="text-slate-300 font-mono text-xs mt-1 truncate">{short}</div>

          {/* Labels */}
          {chainIntel?.labels && chainIntel.labels.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {chainIntel.labels.map(l => (
                <span key={l} className="text-xs bg-red-950 text-red-400 border border-red-900 rounded px-1.5 py-0.5">
                  {l}
                </span>
              ))}
            </div>
          )}

          <p className="text-slate-400 text-xs mt-2 leading-relaxed">{alert.summary}</p>

          {/* Recommended action */}
          {chainIntel?.recommendedAction && (
            <div className="mt-2 text-xs text-orange-400 font-mono border-l-2 border-orange-800 pl-2">
              {chainIntel.recommendedAction}
            </div>
          )}

          {/* Scores + sources */}
          <div className="flex gap-4 mt-2 text-xs text-slate-600 flex-wrap">
            <span>Web <span className="text-slate-400">{alert.webScore}</span></span>
            <span>Chain <span className="text-slate-400">{alert.chainScore}</span></span>
            {chainIntel?.jurisdictions && chainIntel.jurisdictions.length > 0 && (
              <span className="text-slate-600">
                Jurisdictions: <span className="text-slate-500">{chainIntel.jurisdictions.join(" · ")}</span>
              </span>
            )}
          </div>

          {/* Web sources */}
          {webIntel?.mentions && webIntel.mentions.length > 0 && (
            <div className="mt-2 flex gap-1 flex-wrap">
              {webIntel.mentions.slice(0, 4).map((m, i) => (
                <a
                  key={i}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-400 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5"
                >
                  {m.source}
                </a>
              ))}
            </div>
          )}

          {/* Ecosystem links */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex gap-2 flex-wrap">
            <a
              href={`https://u-cant-hide.fly.dev?wallet=${alert.wallet}&chain=${alert.chain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold px-3 py-1 rounded bg-violet-950 text-violet-400 border border-violet-800 hover:bg-violet-900 transition-colors"
            >
              TRACE →
            </a>
            <a
              href={`https://wraith-007.fly.dev?address=${alert.wallet}&chain=${alert.chain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold px-3 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 hover:bg-cyan-900 transition-colors"
            >
              Wraith →
            </a>
            <a
              href="https://skyveil.fly.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold px-3 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900 transition-colors"
            >
              Skyveil →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
