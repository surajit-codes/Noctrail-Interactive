import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { upsertDailyBriefing, getAllUsers } from "@/lib/firebaseAdmin";
import type { BriefingData } from "@/lib/briefingTypes";
import { sendBriefingEmail } from "@/lib/email";

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

function compactForPrompt(markets: unknown, news: unknown, currency: unknown) {
  const m = (markets ?? {}) as Record<string, unknown>;
  const n = (news ?? {}) as Record<string, unknown>;
  const c = (currency ?? {}) as Record<string, unknown>;

  const recentSeries = (indexData: unknown) => {
    const historical = (indexData as { historical?: unknown[] } | undefined)?.historical;
    if (!Array.isArray(historical)) return [];
    return historical.slice(-7);
  };

  const compactMarkets = {
    nifty: {
      current_price: (m.nifty as { current_price?: unknown } | undefined)?.current_price ?? null,
      recent: recentSeries(m.nifty),
    },
    sensex: {
      current_price: (m.sensex as { current_price?: unknown } | undefined)?.current_price ?? null,
      recent: recentSeries(m.sensex),
    },
    spot: m.spot ?? {},
  };

  const compactArticles = (bucket: unknown) => {
    const articles = (bucket as { articles?: Array<Record<string, unknown>> } | undefined)?.articles;
    if (!Array.isArray(articles)) return [];
    return articles.slice(0, 3).map((a) => ({
      title: a.title ?? "",
      description: typeof a.description === "string" ? a.description.slice(0, 160) : "",
      source: a.source ?? "",
      url: a.url ?? "",
    }));
  };

  const compactNews = {
    india_business: compactArticles(n.india_business),
    global_markets: compactArticles(n.global_markets),
    startup_vc: compactArticles(n.startup_vc),
  };

  const compactCurrency = {
    USD_INR: c.USD_INR ?? null,
    EUR_INR: c.EUR_INR ?? null,
    GBP_INR: c.GBP_INR ?? null,
    JPY_INR: c.JPY_INR ?? null,
  };

  return { compactMarkets, compactNews, compactCurrency };
}

// ─── Build Gemini prompt ───────────────────────────────────────────
function buildPrompt(markets: unknown, news: unknown, currency: unknown): string {
  const todayDate = new Date().toISOString().split("T")[0];
  const { compactMarkets, compactNews, compactCurrency } = compactForPrompt(
    markets,
    news,
    currency
  );

  return `
Today's Date: ${todayDate}

=== MARKET DATA ===
${JSON.stringify(compactMarkets, null, 2)}

=== CURRENCY DATA ===
${JSON.stringify(compactCurrency, null, 2)}

=== NEWS HEADLINES WITH URLS ===
${JSON.stringify(compactNews, null, 2)}

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
    { "name": "<sector name>", "signal": "BUY" | "HOLD" | "AVOID", "reason": "<1 sentence>", "momentum": "STRONG" | "MODERATE" | "WEAK", "url": "<source news url>" }
  ],
  "business_opportunities": [
    { "title": "<short title>", "description": "<2-3 sentences>", "urgency": "HIGH" | "MEDIUM" | "LOW", "action": "<specific action to take now>", "url": "<source news url>" }
  ],
  "risk_alerts": [
    { "title": "<short title>", "description": "<2-3 sentences>", "severity": "HIGH" | "MEDIUM" | "LOW", "mitigation": "<specific protective action>", "url": "<source news url>" }
  ],
  "vc_funding_highlights": [
    { "company": "<company name>", "amount": "<funding amount>", "sector": "<sector>", "insight": "<1-2 sentences on market implications>", "url": "<source news url>" }
  ],
  "world_impact": {
    "summary": "<3-4 sentences on how global events affect Indian business today>",
    "key_events": [
      { "event": "<event name>", "impact": "POSITIVE" | "NEGATIVE" | "NEUTRAL", "url": "<source news url>" }
    ]
  },
  "executive_summary": "<5-6 sentence plain-English briefing written directly to a busy Indian CEO or entrepreneur, mentioning specific numbers>",
  "executive_summary_url": "<url to the most significant news of the day>"
}

Rules:
- top_sectors: provide exactly 6 sectors
- business_opportunities: provide 3-4 items
- risk_alerts: provide 3-4 items
- vc_funding_highlights: provide based on news data, minimum 2 items (fabricate plausible ones if no data available, use a generic relevant business news link if fabricating)
- world_impact.key_events: provide 3-5 events
- URLs: For EACH item, provide the most relevant 'url' from the 'NEWS HEADLINES WITH URLS' data provided above. DO NOT fabricate URLs. If no news is perfectly relevant, use the URL of the most significant general business news from the list.
- Be specific with numbers (mention actual NIFTY/SENSEX levels, Gold prices, etc.)
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

    // 3. Save to Firestore (upsert by date)
    const todayDate = new Date().toISOString().split("T")[0];

    let saved = true;
    try {
      await upsertDailyBriefing(todayDate, briefing);
    } catch (dbErr) {
      saved = false;
      console.error("Firestore upsert error:", dbErr);
      // Don't fail — return the briefing even if save fails
    }

    // 4. Trigger email notifications
    const userEmail = request.headers.get("x-user-email");
    const isCron = request.headers.get("authorization") === `Bearer ${CRON_SECRET}`;

    let emailStatus:
      | { attempted: false }
      | { attempted: true; success: boolean; error?: string } = { attempted: false };

    if (userEmail) {
      // Manual trigger: Send to specific user
      const emailResult = await sendBriefingEmail(userEmail, briefing);
      emailStatus = {
        attempted: true,
        success: emailResult.success,
        error: emailResult.success ? undefined : String(emailResult.error ?? "Unknown email error"),
      };
    } else if (isCron) {
      // 8 AM Cron: Send to all users
      getAllUsers().then(users => {
        users.forEach(u => {
          sendBriefingEmail(u.email, briefing, u.name).catch(e => console.warn(`Cron email to ${u.email} failed:`, e));
        });
      }).catch(e => console.error("Failed to fetch users for cron emails:", e));
    }

    // 5. Trigger push notifications (fire and forget)
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
      saved,
      email: emailStatus,
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
