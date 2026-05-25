import Anthropic from "@anthropic-ai/sdk";
import { getWebIntel, type WebIntelResult } from "./brightdata";
import { getWraithIntel, type WraithIntel, type Chain } from "./wraith";

export type ThreatLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface GuardianAlert {
  id: string;
  wallet: string;
  chain: Chain;
  threatLevel: ThreatLevel;
  compositeScore: number;
  webScore: number;
  chainScore: number;
  summary: string;
  webIntel: WebIntelResult;
  chainIntel: WraithIntel;
  createdAt: string;
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function levelFromScore(score: number): ThreatLevel {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 35) return "MEDIUM";
  if (score >= 15) return "LOW";
  return "NONE";
}

async function synthesize(web: WebIntelResult, chain: WraithIntel): Promise<string> {
  const prompt = `You are a blockchain threat intelligence analyst. Synthesize the following signals into a 2-sentence threat assessment.

WEB INTEL (Bright Data SERP scan):
- Wallet: ${web.wallet}
- Web risk score: ${web.riskScore}/100
- Threat keywords found: ${web.threatKeywords.join(", ") || "none"}
- Mentions count: ${web.mentions.length}
- Top sources: ${web.mentions.slice(0, 3).map(m => m.source).join(", ")}

ON-CHAIN INTEL (Wraith):
- Chain: ${chain.chain}
- On-chain risk score: ${chain.riskScore}/100
- Entity: ${chain.entity ?? "unknown"}
- Signals: ${chain.signals.map(s => `${s.type}(${s.severity})`).join(", ") || "none"}
- Exposure: ${chain.exposure ? `sanctions:${chain.exposure.sanctions}% mixer:${chain.exposure.mixer}% darknet:${chain.exposure.darknet}%` : "N/A"}

Write a concise threat assessment. Be direct and factual. No markdown.`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    messages: [{ role: "user", content: prompt }],
  });

  const block = msg.content[0];
  return block.type === "text" ? block.text : "Assessment unavailable.";
}

export async function scanWallet(address: string, chain: Chain): Promise<GuardianAlert> {
  const [webIntel, chainIntel] = await Promise.all([
    getWebIntel(address),
    getWraithIntel(address, chain),
  ]);

  const compositeScore = Math.round(webIntel.riskScore * 0.4 + chainIntel.riskScore * 0.6);
  const threatLevel = levelFromScore(compositeScore);

  const summary = await synthesize(webIntel, chainIntel);

  return {
    id: `${address.slice(0, 8)}-${Date.now()}`,
    wallet: address,
    chain,
    threatLevel,
    compositeScore,
    webScore: webIntel.riskScore,
    chainScore: chainIntel.riskScore,
    summary,
    webIntel,
    chainIntel,
    createdAt: new Date().toISOString(),
  };
}
