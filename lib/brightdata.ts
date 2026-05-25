const API_TOKEN = process.env.BRIGHT_DATA_API_KEY!;
const MCP_SSE_URL = `https://mcp.brightdata.com/sse?token=${API_TOKEN}`;

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

// --- MCP HTTP client (SSE transport) ---

interface MCPToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

async function callMCPTool(
  tool: string,
  args: Record<string, unknown>
): Promise<string> {
  // 1. Open SSE to get session ID
  const sseRes = await fetch(MCP_SSE_URL, {
    headers: { Accept: "text/event-stream" },
  });

  if (!sseRes.ok || !sseRes.body) {
    throw new Error(`MCP SSE connect failed: ${sseRes.status}`);
  }

  const reader = sseRes.body.getReader();
  const decoder = new TextDecoder();

  // Read until we get the endpoint event
  let sessionId = "";
  let buffer = "";

  while (!sessionId) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: /messages?sessionId=")) {
        sessionId = line.replace("data: /messages?sessionId=", "").trim();
      }
    }
    buffer = lines[lines.length - 1];
  }

  if (!sessionId) throw new Error("No MCP session ID received");

  const msgUrl = `https://mcp.brightdata.com/messages?sessionId=${sessionId}`;

  // 2. Initialize
  await fetch(msgUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "chain-guardian", version: "1.0" },
      },
      id: 1,
    }),
  });

  // 3. Call tool
  await fetch(msgUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: tool, arguments: args },
      id: 2,
    }),
  });

  // 4. Read SSE response for tool result
  let result = "";
  let msgCount = 0;

  while (msgCount < 20) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const msg = JSON.parse(line.slice(6));
        if (msg.id === 2 && msg.result) {
          const r = msg.result as MCPToolResult;
          result = r.content?.map(c => c.text).join("\n") ?? "";
          reader.cancel();
          return result;
        }
      } catch {
        // skip non-JSON lines
      }
    }
    msgCount++;
  }

  reader.cancel();
  return result;
}

// --- Search wallet mentions ---

export async function searchWalletMentions(address: string): Promise<SerpResult[]> {
  const queries = [
    `"${address}" crypto fraud scam hack`,
    `"${address}" sanctioned mixer darknet`,
  ];

  // Use batch for efficiency
  let raw = "";
  try {
    raw = await callMCPTool("search_engine_batch", {
      queries: queries.map(q => ({ query: q, engine: "google", geo_location: "us" })),
    });
  } catch {
    return [];
  }

  const results: SerpResult[] = [];

  // Parse JSON results from batch — each result is a JSON object in the text
  try {
    // Try to parse as a JSON array or newline-separated JSON objects
    const chunks = raw.split(/\n(?=\{|\[)/).filter(Boolean);
    for (const chunk of chunks) {
      const parsed = JSON.parse(chunk);
      const organic = Array.isArray(parsed)
        ? parsed
        : parsed.organic_results ?? parsed.results ?? [];

      for (const item of organic) {
        const url = item.url ?? item.link ?? "";
        if (!url) continue;
        results.push({
          title: item.title ?? "",
          url,
          snippet: item.snippet ?? item.description ?? "",
          source: extractHostname(url),
        });
      }
    }
  } catch {
    // Fallback: extract URLs from markdown text
    const urlMatches = Array.from(raw.matchAll(/https?:\/\/[^\s)\]]+/g));
    for (const m of urlMatches) {
      results.push({
        title: "",
        url: m[0],
        snippet: "",
        source: extractHostname(m[0]),
      });
    }
  }

  return results;
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.slice(0, 30);
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
