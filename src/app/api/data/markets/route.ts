import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

interface OHLCVRow {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function GET() {
  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  // ─── NIFTY 50 Historical OHLCV ──────────────────────────────────
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const niftyRaw = await yahooFinance.historical("^NSEI", {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    });
    const niftyHistorical = niftyRaw as unknown as OHLCVRow[];

    results.nifty = {
      symbol: "^NSEI",
      name: "NIFTY 50",
      historical: niftyHistorical.slice(-20).map((d) => ({
        date: d.date.toISOString().split("T")[0],
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
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
    startDate.setDate(startDate.getDate() - 30);

    const sensexRaw = await yahooFinance.historical("^BSESN", {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    });
    const sensexHistorical = sensexRaw as unknown as OHLCVRow[];

    results.sensex = {
      symbol: "^BSESN",
      name: "BSE SENSEX",
      historical: sensexHistorical.slice(-20).map((d) => ({
        date: d.date.toISOString().split("T")[0],
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
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
      const quote = await yahooFinance.quote(symbol);
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
