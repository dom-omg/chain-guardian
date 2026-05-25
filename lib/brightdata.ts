const API_KEY = process.env.BRIGHT_DATA_API_KEY!;

export interface SerpResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface WebIntelResult {
  wallet: string;
  mentions: SerpResult[];
  threatKeywords: string[];
  riskScore: number;
  timestamp: string;
}

const THREAT_KEYWORDS = [
  "scam", "hack", "exploit", "rug pull", "phishing", "fraud", "stolen",
  "mixer", "tornado", "sanctioned", "ofac", "blacklist", "darknet",
  "laundering", "arrest", "seized", "criminal", "exchange hack",
];

export async function searchWalletMentions(address: string): Promise<SerpResult[]> {
  const queries = [
    `"${address}" crypto scam hack fraud`,
    `"${address}" blockchain wallet`,
    `"${address}" sanctioned mixer tornado`,
  ];

  const allResults: SerpResult[] = [];

  for (const q of queries) {
    try {
      const res = await fetch("https://api.brightdata.com/serp/google/search", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: q,
          country: "us",
          num_results: 10,
        }),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const organic = data?.organic_results ?? data?.results ?? [];

      for (const item of organic) {
        allResults.push({
          title: item.title ?? "",
          url: item.url ?? item.link ?? "",
          snippet: item.snippet ?? item.description ?? "",
          source: new URL(item.url ?? item.link ?? "https://unknown.com").hostname,
        });
      }
    } catch {
      // continue on individual query failure
    }
  }

  return allResults;
}

export async function fetchThreatPage(url: string): Promise<string> {
  try {
    const res = await fetch("https://api.brightdata.com/request", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        zone: "unlocker",
        url,
        format: "raw",
      }),
    });

    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

export function scoreMentions(mentions: SerpResult[]): { keywords: string[]; score: number } {
  const found = new Set<string>();

  for (const m of mentions) {
    const text = `${m.title} ${m.snippet}`.toLowerCase();
    for (const kw of THREAT_KEYWORDS) {
      if (text.includes(kw)) found.add(kw);
    }
  }

  const keywords = Array.from(found);
  const score = Math.min(100, keywords.length * 15 + Math.min(mentions.length * 3, 40));

  return { keywords, score };
}

export async function getWebIntel(address: string): Promise<WebIntelResult> {
  const mentions = await searchWalletMentions(address);
  const { keywords, score } = scoreMentions(mentions);

  return {
    wallet: address,
    mentions,
    threatKeywords: keywords,
    riskScore: score,
    timestamp: new Date().toISOString(),
  };
}
