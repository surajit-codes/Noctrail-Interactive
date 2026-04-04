import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

type ChartQuote = { date: Date; close: number };

function isChartQuoteWithClose(q: unknown): q is ChartQuote {
  if (!q || typeof q !== "object") return false;
  const candidate = q as { date?: unknown; close?: unknown };
  return candidate.date instanceof Date && typeof candidate.close === "number";
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

    results.nifty = {
      symbol: "^NSEI",
      name: "NIFTY 50",
      historical: niftyHistorical.map((d) => ({
        date: d.date.toISOString().split("T")[0],
        close: d.close,
      })),
      current_price: niftyHistorical[niftyHistorical.length - 1]?.close ?? null,
    };
  } catch (err) {
    errors.push("NIFTY historical: " + String(err));
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

    results.sensex = {
      symbol: "^BSESN",
      name: "BSE SENSEX",
      historical: sensexHistorical.map((d) => ({
        date: d.date.toISOString().split("T")[0],
        close: d.close,
      })),
      current_price: sensexHistorical[sensexHistorical.length - 1]?.close ?? null,
    };
  } catch (err) {
    errors.push("SENSEX historical: " + String(err));
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
      spot[key] = {
        symbol,
        name,
        price: q.regularMarketPrice ?? null,
        change: q.regularMarketChange ?? null,
        change_percent: q.regularMarketChangePercent ?? null,
        currency: q.currency ?? null,
      };
    } catch (err) {
      errors.push(`${symbol}: ` + String(err));
      spot[key] = { symbol, name, error: "Data Unavailable" };
    }
  }
  results.spot = spot;

  if (errors.length > 0) {
    results.partial_errors = errors;
  }

  return NextResponse.json(results);
}
