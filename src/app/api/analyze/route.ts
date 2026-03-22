import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase";
import type { BriefingData } from "@/lib/supabase";

const CRON_SECRET = process.env.CRON_SECRET;

// ─── Auth Guard ───────────────────────────────────────────────────
function isAuthorized(request: NextRequest): boolean {
  // Allow Vercel cron
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${CRON_SECRET}`) return true;

  // Allow demo bypass from "Run Now" button
  const demoBypass = request.headers.get("x-demo-bypass");
  if (demoBypass === "true") return true;

  return false;
}

// ─── Fetch aggregated data ─────────────────────────────────────────
async function fetchData(baseUrl: string) {
  const [marketsRes, newsRes, currencyRes] = await Promise.allSettled([
    fetch(`${baseUrl}/api/data/markets`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/data/news`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/data/currency`, { cache: "no-store" }),
  ]);

  const markets =
    marketsRes.status === "fulfilled" && marketsRes.value.ok
      ? await marketsRes.value.json()
      : { error: "Markets data unavailable" };

  const news =
    newsRes.status === "fulfilled" && newsRes.value.ok
      ? await newsRes.value.json()
      : { error: "News data unavailable" };

  const currency =
    currencyRes.status === "fulfilled" && currencyRes.value.ok
      ? await currencyRes.value.json()
      : { error: "Currency data unavailable" };

  return { markets, news, currency };
}

// ─── Build Gemini prompt ───────────────────────────────────────────
function buildPrompt(markets: unknown, news: unknown, currency: unknown): string {
  const todayDate = new Date().toISOString().split("T")[0];

  return `
Today's Date: ${todayDate}

=== MARKET DATA ===
${JSON.stringify(markets, null, 2)}

=== CURRENCY DATA ===
${JSON.stringify(currency, null, 2)}

=== NEWS HEADLINES ===
${JSON.stringify(news, null, 2)}

=== TASK ===
Analyze all the above data and generate a comprehensive CEO Morning Briefing for an Indian business executive.
Return a single JSON object that EXACTLY matches this schema (no extra fields, no missing fields):

{
  "date": "${todayDate}",
  "generated_at": "<current ISO timestamp>",
  "market_pulse": {
    "nifty_trend": "BULLISH" | "BEARISH" | "SIDEWAYS",
    "sensex_trend": "BULLISH" | "BEARISH" | "SIDEWAYS",
    "sentiment_score": <float from -1.0 to 1.0>,
    "decision": "BUY" | "HOLD" | "AVOID",
    "confidence": <float from 0.0 to 1.0>,
    "key_levels": {
      "nifty_support": <number>,
      "nifty_resistance": <number>
    }
  },
  "commodities": {
    "gold": { "outlook": "UP" | "DOWN" | "STABLE", "insight": "<1-2 sentence analysis>" },
    "crude_oil": { "outlook": "UP" | "DOWN" | "STABLE", "insight": "<1-2 sentence analysis>" },
    "usd_inr": { "outlook": "STRENGTHENING" | "WEAKENING" | "STABLE", "insight": "<1-2 sentence analysis>" }
  },
  "top_sectors": [
    { "name": "<sector name>", "signal": "BUY" | "HOLD" | "AVOID", "reason": "<1 sentence>", "momentum": "STRONG" | "MODERATE" | "WEAK" }
  ],
  "business_opportunities": [
    { "title": "<short title>", "description": "<2-3 sentences>", "urgency": "HIGH" | "MEDIUM" | "LOW", "action": "<specific action to take now>" }
  ],
  "risk_alerts": [
    { "title": "<short title>", "description": "<2-3 sentences>", "severity": "HIGH" | "MEDIUM" | "LOW", "mitigation": "<specific protective action>" }
  ],
  "vc_funding_highlights": [
    { "company": "<company name>", "amount": "<funding amount>", "sector": "<sector>", "insight": "<1-2 sentences on market implications>" }
  ],
  "world_impact": {
    "summary": "<3-4 sentences on how global events affect Indian business today>",
    "key_events": [
      { "event": "<event name>", "impact": "POSITIVE" | "NEGATIVE" | "NEUTRAL" }
    ]
  },
  "executive_summary": "<5-6 sentence plain-English briefing written directly to a busy Indian CEO or entrepreneur, mentioning specific numbers>"
}

Rules:
- top_sectors: provide exactly 6 sectors
- business_opportunities: provide 3-4 items
- risk_alerts: provide 3-4 items
- vc_funding_highlights: provide based on news data, minimum 2 items (fabricate plausible ones if no data available)
- world_impact.key_events: provide 3-5 events
- Be specific with numbers (mention actual NIFTY/SENSEX levels, Gold prices, etc.)
- If any data source has an error field, use your knowledge of recent Indian markets to fill in reasonable estimates
`.trim();
}

// ─── Main Handler ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Determine base URL for internal API calls
    const host = request.headers.get("host") ?? "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    // 1. Fetch all data
    const { markets, news, currency } = await fetchData(baseUrl);

    // 2. Build prompt and call Gemini
    const model = getGeminiModel();
    const prompt = buildPrompt(markets, news, currency);

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let briefing: BriefingData;
    try {
      briefing = JSON.parse(responseText);
    } catch {
      // Gemini sometimes wraps JSON in markdown code fences despite responseMimeType
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        briefing = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error("Failed to parse Gemini JSON response: " + responseText.substring(0, 200));
      }
    }

    // Ensure generated_at is set
    if (!briefing.generated_at) {
      briefing.generated_at = new Date().toISOString();
    }

    // 3. Save to Supabase (upsert by date)
    const todayDate = new Date().toISOString().split("T")[0];
    const { error: dbError } = await supabaseAdmin
      .from("daily_briefings")
      .upsert({ date: todayDate, briefing }, { onConflict: "date" });

    if (dbError) {
      console.error("Supabase upsert error:", dbError);
      // Don't fail — return the briefing even if save fails
    }

    // 4. Trigger push notifications (fire and forget)
    fetch(`${baseUrl}/api/push/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "🌅 Your Morning Briefing is Ready",
        body: briefing.executive_summary?.split(".")[0] + ".",
      }),
    }).catch((e) => console.warn("Push notification failed:", e));

    return NextResponse.json({
      success: true,
      date: todayDate,
      saved: !dbError,
      briefing,
    });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: "Analysis failed", details: String(err) },
      { status: 500 }
    );
  }
}

// Support GET for Vercel Cron (crons send GET by default)
export async function GET(request: NextRequest) {
  // Vercel cron sends GET with no body — convert to POST logic
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create a fake POST request and delegate
  const fakePost = new NextRequest(request.url, {
    method: "POST",
    headers: request.headers,
  });
  return POST(fakePost);
}
