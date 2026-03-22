import { NextResponse } from "next/server";

const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY;

export async function GET() {
  if (!EXCHANGERATE_API_KEY) {
    return NextResponse.json(
      { error: "EXCHANGERATE_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch current rates
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/USD`,
      { next: { revalidate: 3600 } } // cache 1 hour
    );

    if (!res.ok) {
      throw new Error(`ExchangeRate API error: ${res.status}`);
    }

    const data = await res.json();

    if (data.result !== "success") {
      throw new Error(`ExchangeRate API failed: ${data["error-type"]}`);
    }

    const rates = data.conversion_rates as Record<string, number>;
    const inrRate = rates["INR"];

    if (!inrRate) {
      throw new Error("INR rate not found in response");
    }

    const pairsToCross = ["EUR", "GBP", "JPY"];
    const crossRates: Record<string, { rate: number; change_percent: string }> = {};

    // Compute cross rates vs INR
    for (const currency of pairsToCross) {
      const currRate = rates[currency];
      if (currRate) {
        // rate = INR per 1 unit of foreign currency = (INR/USD) / (currency/USD)
        crossRates[`${currency}_INR`] = {
          rate: parseFloat((inrRate / currRate).toFixed(4)),
          change_percent: "N/A", // free tier doesn't provide historical
        };
      }
    }

    return NextResponse.json({
      base: "USD",
      USD_INR: {
        rate: parseFloat(inrRate.toFixed(4)),
        change_percent: "N/A",
      },
      ...crossRates,
      last_updated: data.time_last_update_utc ?? new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: String(err),
        USD_INR: { rate: null, change_percent: "N/A" },
        EUR_INR: { rate: null, change_percent: "N/A" },
        GBP_INR: { rate: null, change_percent: "N/A" },
        JPY_INR: { rate: null, change_percent: "N/A" },
      },
      { status: 503 }
    );
  }
}
