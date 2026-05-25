import { NextResponse } from "next/server";

// In production this would be a DB. For demo, seeded alerts.
const DEMO_ALERTS = [
  {
    id: "0x8babec-1716700800000",
    wallet: "0x8BAbec8B3F20F5C8B65B52e2B4042CAE6dD9E18",
    chain: "eth",
    threatLevel: "CRITICAL",
    compositeScore: 91,
    webScore: 85,
    chainScore: 95,
    summary:
      "Wallet linked to Lazarus Group APT in multiple OSINT reports. On-chain signals confirm mixer usage and OFAC-flagged counterparties. Immediate escalation recommended.",
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
  {
    id: "TGCnXVpK-1716701100000",
    wallet: "TGCnXVpKZbSsoBbvJBmFMF8GGn5gGDLa3H",
    chain: "trx",
    threatLevel: "HIGH",
    compositeScore: 74,
    webScore: 60,
    chainScore: 82,
    summary:
      "Tron wallet associated with Xinbi marketplace. $166M+ USDT flow detected with partial USDT blacklist exposure. Web sources confirm marketplace shutdown and ongoing investigation.",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "bc1qxy-1716701400000",
    wallet: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    chain: "btc",
    threatLevel: "MEDIUM",
    compositeScore: 48,
    webScore: 35,
    chainScore: 57,
    summary:
      "Bitcoin address flagged in 2 forum posts referencing phishing campaign. On-chain hops trace through known mixing patterns. Monitoring recommended.",
    createdAt: new Date(Date.now() - 1000 * 60 * 31).toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({ alerts: DEMO_ALERTS });
}
