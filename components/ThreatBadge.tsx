"use client";

type Level = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const COLORS: Record<Level, string> = {
  NONE: "bg-slate-800 text-slate-400 border-slate-700",
  LOW: "bg-blue-950 text-blue-400 border-blue-800",
  MEDIUM: "bg-yellow-950 text-yellow-400 border-yellow-700",
  HIGH: "bg-orange-950 text-orange-400 border-orange-700",
  CRITICAL: "bg-red-950 text-red-400 border-red-700 animate-pulse",
};

export function ThreatBadge({ level }: { level: Level }) {
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${COLORS[level]}`}>
      {level}
    </span>
  );
}
