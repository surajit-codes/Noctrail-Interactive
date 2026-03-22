import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
);

// Server client (service role) — for API routes that write data
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder",
  { auth: { persistSession: false } }
);

// Database types
export interface DailyBriefing {
  id: string;
  date: string;
  briefing: BriefingData;
  created_at: string;
}

export interface BriefingData {
  date: string;
  generated_at: string;
  market_pulse: {
    nifty_trend: "BULLISH" | "BEARISH" | "SIDEWAYS";
    sensex_trend: "BULLISH" | "BEARISH" | "SIDEWAYS";
    sentiment_score: number;
    decision: "BUY" | "HOLD" | "AVOID";
    confidence: number;
    key_levels: {
      nifty_support: number;
      nifty_resistance: number;
    };
  };
  commodities: {
    gold: { outlook: "UP" | "DOWN" | "STABLE"; insight: string };
    crude_oil: { outlook: "UP" | "DOWN" | "STABLE"; insight: string };
    usd_inr: { outlook: "STRENGTHENING" | "WEAKENING" | "STABLE"; insight: string };
  };
  top_sectors: Array<{
    name: string;
    signal: "BUY" | "HOLD" | "AVOID";
    reason: string;
    momentum: "STRONG" | "MODERATE" | "WEAK";
  }>;
  business_opportunities: Array<{
    title: string;
    description: string;
    urgency: "HIGH" | "MEDIUM" | "LOW";
    action: string;
  }>;
  risk_alerts: Array<{
    title: string;
    description: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    mitigation: string;
  }>;
  vc_funding_highlights: Array<{
    company: string;
    amount: string;
    sector: string;
    insight: string;
  }>;
  world_impact: {
    summary: string;
    key_events: Array<{
      event: string;
      impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    }>;
  };
  executive_summary: string;
}
