import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

type ChartQuote = { date: Date; close: number };

function isChartQuoteWithClose(q: unknown): q is ChartQuote {
  if (!q || typeof q !== "object") return false;
  const candidate = q as { date?: unknown; close?: unknown };
  return candidate.date instanceof Date && typeof candidate.close === "number";
}

const avCache = new Map<string, { data: any; timestamp: number }>();
const AV_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

async function fetchAlphaVantage(params: Record<string, string>) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) return null;

  const cacheKey = JSON.stringify(params);
  const cached = avCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < AV_CACHE_TTL) {
    return cached.data;
  }

  const url = new URL("https://www.alphavantage.co/query");
  Object.entries({ ...params, apikey: apiKey }).forEach(([k, v]) => url.searchParams.append(k, v));

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json();
    
    if (data.Information || data.Note) {
      console.warn("Alpha Vantage limit/info in Markets:", data.Information || data.Note);
      if (cached) return cached.data; // Return stale cache on limit hit
      return null;
    }

    avCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    console.error("Alpha Vantage error:", err);
    return cached?.data || null;
  }
}

export async function GET() {
  // yahoo-finance2 v2+ exports a class; you must instantiate it before calling methods.
  // Otherwise you get: "Call `const yahooFinance = new YahooFinance()` first..."
  const yf = new yahooFinance();

  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  // ─── NIFTY 50 Historical OHLCV ──────────────────────────────────
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 380);

    // `historical()` is strict about nulls and can throw for some index symbols.
    // `chart()` is more tolerant; we filter out null closes ourselves.
    const niftyRaw = await yf.chart("^NSEI", {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    });

    const niftyHistorical = ((niftyRaw?.quotes ?? []) as unknown[]).filter(isChartQuoteWithClose);

    // For current price accuracy, use yf.quote
    const niftyLive = await yf.quote("^NSEI");
    const nl = niftyLive as Record<string, any>;

    results.nifty = {
      symbol: "^NSEI",
      name: "NIFTY 50",
      historical: niftyHistorical.map((d) => ({
        date: d.date.toISOString().split("T")[0],
        open: (d as any).open ?? d.close,
        high: (d as any).high ?? d.close,
        low: (d as any).low ?? d.close,
        close: d.close,
      })),
      current_price: nl.regularMarketPrice ?? niftyHistorical[niftyHistorical.length - 1]?.close ?? null,
      change_percent: nl.regularMarketChangePercent ?? null,
      daily_change: nl.regularMarketChange ?? null,
    };
  } catch (err) {
    errors.push("NIFTY historical/quote: " + String(err));
    results.nifty = { error: "Data Unavailable" };
  }

  // ─── SENSEX Historical OHLCV ────────────────────────────────────
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 380);

    const sensexRaw = await yf.chart("^BSESN", {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    });
    const sensexHistorical = ((sensexRaw?.quotes ?? []) as unknown[]).filter(isChartQuoteWithClose);

    const sensexLive = await yf.quote("^BSESN");
    const sl = sensexLive as Record<string, any>;

    results.sensex = {
      symbol: "^BSESN",
      name: "BSE SENSEX",
      historical: sensexHistorical.map((d) => ({
        date: d.date.toISOString().split("T")[0],
        open: (d as any).open ?? d.close,
        high: (d as any).high ?? d.close,
        low: (d as any).low ?? d.close,
        close: d.close,
      })),
      current_price: sl.regularMarketPrice ?? sensexHistorical[sensexHistorical.length - 1]?.close ?? null,
      change_percent: sl.regularMarketChangePercent ?? null,
      daily_change: sl.regularMarketChange ?? null,
    };
  } catch (err) {
    errors.push("SENSEX historical/quote: " + String(err));
    results.sensex = { error: "Data Unavailable" };
  }

  // ─── Spot Prices ────────────────────────────────────────────────
  const spotSymbols = [
    { symbol: "USDINR=X", key: "usd_inr", name: "USD/INR" },
    { symbol: "GC=F", key: "gold", name: "Gold Futures" },
    { symbol: "CL=F", key: "crude_oil", name: "Crude Oil Futures" },
  ];

  const spot: Record<string, unknown> = {};
  for (const { symbol, key, name } of spotSymbols) {
    try {
      const quote = await yf.quote(symbol);
      const q = quote as Record<string, unknown>;
      
      let price = q.regularMarketPrice ?? null;
      let change = q.regularMarketChange ?? null;
      let change_percent = q.regularMarketChangePercent ?? null;

      // Alpha Vantage Fallback for Forex or if Yahoo price is null
      if (price === null) {
        if (key === "usd_inr") {
          const avData = await fetchAlphaVantage({
            function: "CURRENCY_EXCHANGE_RATE",
            from_currency: "USD",
            to_currency: "INR"
          });
          const rate = avData?.["Realtime Currency Exchange Rate"];
          if (rate) price = parseFloat(rate["5. Exchange Rate"]);
        } else if (key === "gold") {
          const avData = await fetchAlphaVantage({ function: "GOLD", interval: "daily" });
          if (avData?.data?.[0]) price = parseFloat(avData.data[0].value);
        } else if (key === "crude_oil") {
          const avData = await fetchAlphaVantage({ function: "WTI", interval: "daily" });
          if (avData?.data?.[0]) price = parseFloat(avData.data[0].value);
        }
      }

      spot[key] = {
        symbol,
        name,
        price,
        change,
        change_percent,
        currency: q.currency ?? (key === "usd_inr" ? "INR" : "USD"),
      };
    } catch (err) {
      // Final attempt fallback to Alpha Vantage for critical spots if Yahoo call actually throws
      if (key === "usd_inr" || key === "gold" || key === "crude_oil") {
        let price = null;
        if (key === "usd_inr") {
          const avData = await fetchAlphaVantage({ function: "CURRENCY_EXCHANGE_RATE", from_currency: "USD", to_currency: "INR" });
          price = parseFloat(avData?.["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"] || "0") || null;
        } else if (key === "gold") {
          const avData = await fetchAlphaVantage({ function: "GOLD", interval: "daily" });
          price = parseFloat(avData?.data?.[0]?.value || "0") || null;
        } else if (key === "crude_oil") {
          const avData = await fetchAlphaVantage({ function: "WTI", interval: "daily" });
          price = parseFloat(avData?.data?.[0]?.value || "0") || null;
        }

        if (price) {
          spot[key] = {
            symbol,
            name,
            price,
            change: null,
            change_percent: null,
            currency: key === "usd_inr" ? "INR" : "USD",
          };
          continue;
        }
      }
      errors.push(`${symbol}: ` + String(err));
      spot[key] = { symbol, name, error: "Data Unavailable" };
    }
  }
  results.spot = spot;

  // ─── Market Leaders ─────────────────────────────────────────────
  const leaders: Record<string, any> = {};
  const leaderSymbols = [
    { symbol: "RELIANCE.NS", name: "Reliance Industries" },
    { symbol: "TCS.NS", name: "TCS" },
    { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
    { symbol: "INFY.NS", name: "Infosys" }
  ];

  for (const l of leaderSymbols) {
    try {
      // 1. Primary: Yahoo Finance
      const quote = await yf.quote(l.symbol);
      const q = quote as Record<string, any>;
      
      if (q.regularMarketPrice) {
        leaders[l.symbol] = {
          name: l.name,
          price: q.regularMarketPrice,
          change: q.regularMarketChange,
          change_percent: q.regularMarketChangePercent,
        };
      } else {
        // Fallback: Alpha Vantage
        const avSymbol = l.symbol.replace('.NS', '.BOM');
        const avData = await fetchAlphaVantage({ function: "GLOBAL_QUOTE", symbol: avSymbol });
        const avQuote = avData?.["Global Quote"];
        if (avQuote) {
          leaders[l.symbol] = {
            name: l.name,
            price: parseFloat(avQuote["05. price"]),
            change: parseFloat(avQuote["09. change"]),
            change_percent: parseFloat(avQuote["10. change percent"]),
          };
        }
      }
    } catch (e) {
      console.warn(`Leader fetch failed for ${l.symbol}:`, e);
    }
  }
  results.leaders = leaders;

  if (errors.length > 0) {
    results.partial_errors = errors;
  }

  return NextResponse.json(results);
}
