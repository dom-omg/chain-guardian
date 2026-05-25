const WRAITH_URL = process.env.WRAITH_API_URL ?? "https://wraith-007.fly.dev";

export type Chain =
  | "eth" | "bsc" | "polygon" | "arbitrum" | "base"
  | "optimism" | "btc" | "trx" | "sol" | "avax" | "xrp" | "ltc";

export interface OnChainSignal {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  chain: Chain;
}

export interface ExposureResult {
  sanctions: number;
  darknet: number;
  mixer: number;
  exploit: number;
  scam: number;
  clean: number;
}

export interface WraithIntel {
  wallet: string;
  chain: Chain;
  signals: OnChainSignal[];
  exposure: ExposureResult | null;
  riskScore: number;
  entity: string | null;
  verdict: string | null;
  recommendedAction: string | null;
  jurisdictions: string[];
  labels: string[];
}

interface IntelResponse {
  risk_score?: number;
  risk_tier?: string;
  risk_signals?: string[];
  risk_justification?: string;
  labels?: string[];
  entity_type?: string;
  verdict?: string;
  recommended_action?: string;
  jurisdictions?: string[];
  ofac?: boolean;
  mixer?: boolean;
  scam?: boolean;
  exchange?: boolean;
  bridge?: boolean;
}

function mapSignals(intel: IntelResponse, chain: Chain): OnChainSignal[] {
  const signals: OnChainSignal[] = [];
  const tier = (intel.risk_tier ?? "LOW").toUpperCase();
  const severity = (
    tier === "CRITICAL" ? "CRITICAL"
    : tier === "HIGH" ? "HIGH"
    : tier === "MEDIUM" ? "MEDIUM"
    : "LOW"
  ) as OnChainSignal["severity"];

  for (const sig of intel.risk_signals ?? []) {
    const typeMap: Record<string, string> = {
      ofac_direct: "OFAC",
      mixer: "MIXER",
      scam: "SCAM",
      exploit: "EXPLOIT",
      darknet: "DARKNET",
      bridge: "BRIDGE",
      exchange: "CEX",
    };
    signals.push({
      type: typeMap[sig] ?? sig.toUpperCase(),
      severity,
      description: intel.risk_justification ?? sig,
      chain,
    });
  }

  // Fallback from boolean flags
  if (signals.length === 0) {
    if (intel.ofac) signals.push({ type: "OFAC", severity: "CRITICAL", description: "OFAC SDN match", chain });
    if (intel.mixer) signals.push({ type: "MIXER", severity: "HIGH", description: "Mixer protocol detected", chain });
    if (intel.scam) signals.push({ type: "SCAM", severity: "HIGH", description: "Scam address", chain });
  }

  return signals;
}

export async function getWraithIntel(address: string, chain: Chain): Promise<WraithIntel> {
  let intel: IntelResponse = {};

  try {
    const res = await fetch(
      `${WRAITH_URL}/api/v1/intel?address=${address}&chain=${chain}`,
      { next: { revalidate: 0 } }
    );
    if (res.ok) intel = await res.json();
  } catch {
    // Wraith unavailable — degrade gracefully
  }

  // Fetch exposure separately
  let exposure: ExposureResult | null = null;
  try {
    const res = await fetch(
      `${WRAITH_URL}/api/exposure?address=${address}&chain=${chain}&depth=3`,
      { next: { revalidate: 0 } }
    );
    if (res.ok) {
      const data = await res.json();
      exposure = data.exposure ?? null;
    }
  } catch {
    // ignore
  }

  const signals = mapSignals(intel, chain);
  const riskScore = intel.risk_score ?? 0;
  const entity = intel.labels?.[0] ?? intel.entity_type ?? null;

  return {
    wallet: address,
    chain,
    signals,
    exposure,
    riskScore,
    entity,
    verdict: intel.verdict ?? null,
    recommendedAction: intel.recommended_action ?? null,
    jurisdictions: intel.jurisdictions ?? [],
    labels: intel.labels ?? [],
  };
}
