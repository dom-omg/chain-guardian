# Chain Guardian — Web3 Threat Intelligence

Real-time blockchain threat detection that bridges **web intelligence** (Bright Data) with **on-chain forensics** (Wraith).

## What it does

Enter any wallet address. Chain Guardian simultaneously:
1. **Bright Data SERP + Web Unlocker** — scans the live web for mentions on forums, news sites, OSINT reports, dark-web sources
2. **Wraith API** — runs on-chain forensics across 12 blockchains (OFAC, mixer flows, exploits, entity attribution)
3. **Claude AI** — synthesizes both signals into a composite threat score + written assessment

## Stack

- Next.js 15 (App Router) + TypeScript strict
- Bright Data SERP API + Web Unlocker
- Wraith blockchain intelligence (wraith-007.fly.dev)
- Claude Haiku (threat synthesis)

## Hackathon Track

- Track 3: Security & Compliance
- Track 2: Finance & Market Intelligence

## Quick Start

```bash
npm install
cp .env.example .env.local  # add your keys
npm run dev
```

## Bright Data Usage

- `SERP API` — queries wallet addresses across Google with threat-focused keywords
- `Web Unlocker` — fetches raw content from flagged URLs that block standard scrapers

## Live Demo

[chain-guardian.fly.dev](https://chain-guardian.fly.dev) — deployed on Fly.io

Built for **Web Data UNLOCKED Hackathon** — May 25–30, 2026
