import { NextRequest, NextResponse } from "next/server";
import { certifyWallet } from "@/lib/verdict";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  const cert = await certifyWallet(
    body.wallet,
    body.chain ?? "eth",
    body.entity_name ?? "",
    body.signals ?? [],
    body.risk_score ?? 0,
    body.scheme ?? "Ed25519"
  );

  if (!cert) return NextResponse.json({ error: "verdict engine unavailable" }, { status: 503 });
  return NextResponse.json(cert);
}
