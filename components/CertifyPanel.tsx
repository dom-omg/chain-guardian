"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { VerdictCertificate } from "@/lib/verdict";
import type { GuardianAlert } from "@/lib/guardian";

interface Props {
  alert: GuardianAlert;
}

export function CertifyPanel({ alert }: Props) {
  const [cert, setCert] = useState<VerdictCertificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function certify() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/certify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: alert.wallet,
          chain: alert.chain,
          entity_name: alert.chainIntel?.entity ?? alert.wallet.slice(0, 16),
          signals: alert.chainIntel?.signals.map(s => s.type) ?? [],
          risk_score: alert.compositeScore,
          scheme: "Ed25519",
        }),
      });
      if (!res.ok) { setError("Verdict Engine unavailable"); return; }
      const c: VerdictCertificate = await res.json();
      setCert(c);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const statusColor = cert?.proof_status === "PROVED"
    ? "text-green-400 border-green-800 bg-green-950"
    : "text-red-400 border-red-800 bg-red-950";

  const verifyUrl = cert?.verify_url ?? "";

  return (
    <div className="mt-3 pt-3 border-t border-slate-800">
      {!cert && (
        <button
          onClick={certify}
          disabled={loading}
          className="text-xs font-bold px-3 py-1.5 rounded bg-amber-950 text-amber-400 border border-amber-800 hover:bg-amber-900 disabled:opacity-50 transition-colors"
        >
          {loading ? "Generating proof..." : "⊢ CERTIFY (Z3 + Ed25519)"}
        </button>
      )}
      {error && <div className="text-red-400 text-xs mt-1">{error}</div>}

      {cert && (
        <div className="mt-2 grid grid-cols-2 gap-4">
          {/* Cert info */}
          <div className="space-y-1.5">
            <div className={`text-xs font-bold px-2 py-1 rounded border inline-block ${statusColor}`}>
              {cert.proof_status} — {cert.z3_result}
            </div>
            <div className="text-xs text-slate-500 space-y-0.5">
              <div><span className="text-slate-600">Scheme </span><span className="text-slate-300">{cert.signing_scheme}</span></div>
              <div><span className="text-slate-600">Axioms </span><span className="text-slate-300">{cert.axioms_applied.join(", ")}</span></div>
              <div><span className="text-slate-600">Solver </span><span className="text-slate-300">{cert.solver_time_ms}ms</span></div>
              <div><span className="text-slate-600">Sig </span><span className="text-slate-400 font-mono text-xs">{cert.signature.slice(0, 28)}…</span></div>
              <div><span className="text-slate-600">ID </span><span className="text-slate-400 font-mono text-xs">{cert.certificate_id.slice(0, 20)}…</span></div>
              <div className="text-slate-700 text-xs">{cert.issuer}</div>
            </div>
          </div>

          {/* QR */}
          <div className="flex flex-col items-center gap-1">
            {verifyUrl && (
              <a href={verifyUrl} target="_blank" rel="noopener noreferrer">
                <QRCodeSVG
                  value={verifyUrl}
                  size={96}
                  bgColor="#0f172a"
                  fgColor="#e2e8f0"
                  level="M"
                />
              </a>
            )}
            <span className="text-xs text-slate-600">Scan to verify</span>
          </div>
        </div>
      )}
    </div>
  );
}
