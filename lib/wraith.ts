const WRAITH_URL = process.env.WRAITH_API_URL ?? "https://wraith-007.fly.dev";

export type Chain =
  | "eth" | "bsc" | "polygon" | "arbitrum" | "base"
  | "optimism" | "btc" | "trx" | "sol" | "avax" | "xrp" | "ltc";

export interface OnChainSignal {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  chain: Chain;
  txHash?: string;
  timestamp?: string;
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
}

export async function screenWallet(address: string, chain: Chain): Promise<OnChainSignal[]> {
  try {
    const res = await fetch(`${WRAITH_URL}/api/v1/screen?address=${address}&chain=${chain}`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.signals ?? [];
  } catch {
    return [];
  }
}

export async function getExposure(address: string, chain: Chain): Promise<ExposureResult | null> {
  try {
    const res = await fetch(
      `${WRAITH_URL}/api/exposure?address=${address}&chain=${chain}&depth=3`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.exposure ?? null;
  } catch {
    return null;
  }
}

export async function getEntity(address: string, chain: Chain): Promise<string | null> {
  try {
    const res = await fetch(
      `${WRAITH_URL}/api/entity?address=${address}&chain=${chain}`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.name ?? data.entity ?? null;
  } catch {
    return null;
  }
}

function scoreSignals(signals: OnChainSignal[], exposure: ExposureResult | null): number {
  let score = 0;
  for (const s of signals) {
    if (s.severity === "CRITICAL") score += 40;
    else if (s.severity === "HIGH") score += 25;
    else if (s.severity === "MEDIUM") score += 10;
    else score += 5;
  }
  if (exposure) {
    score += Math.round((exposure.sanctions + exposure.darknet + exposure.mixer) / 3);
  }
  return Math.min(100, score);
}

export async function getWraithIntel(address: string, chain: Chain): Promise<WraithIntel> {
  const [signals, exposure, entity] = await Promise.all([
    screenWallet(address, chain),
    getExposure(address, chain),
    getEntity(address, chain),
  ]);

  return {
    wallet: address,
    chain,
    signals,
    exposure,
    riskScore: scoreSignals(signals, exposure),
    entity,
  };
}
