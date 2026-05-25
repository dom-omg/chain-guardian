import { NextRequest, NextResponse } from "next/server";
import { scanWallet } from "@/lib/guardian";
import type { Chain } from "@/lib/wraith";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  const chain: Chain = body.chain ?? "eth";

  try {
    const alert = await scanWallet(body.address, chain);
    return NextResponse.json(alert);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "scan failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
