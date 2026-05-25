const VERDICT_URL = process.env.VERDICT_ENGINE_URL ?? "https://verdict-engine.fly.dev";

export interface VerdictCertificate {
  certificate_id: string;
  entity: string;
  proof_status: "PROVED" | "NOT_PROVED" | "ERROR";
  z3_result: string;
  axioms_applied: string[];
  hop_count: number;
  solver_time_ms: number;
  sha256: string;
  signature: string;
  signing_scheme: string;
  timestamp: string;
  issuer: string;
  verify_url: string;
}

export async function certifyWallet(
  wallet: string,
  chain: string,
  entityName: string,
  signals: string[],
  riskScore: number,
  scheme: "Ed25519" | "ML-DSA-65" = "Ed25519"
): Promise<VerdictCertificate | null> {
  try {
    const res = await fetch(`${VERDICT_URL}/prove_wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet,
        chain,
        entity_name: entityName || wallet.slice(0, 16),
        signals,
        risk_score: riskScore,
        scheme,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const cert = data.certificate;
    if (!cert) return null;

    return {
      ...cert,
      verify_url: `${VERDICT_URL}/certificates/${cert.certificate_id}`,
    };
  } catch {
    return null;
  }
}
