// Shared data types for the daily CEO briefing.
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
    url?: string;
  }>;
  business_opportunities: Array<{
    title: string;
    description: string;
    urgency: "HIGH" | "MEDIUM" | "LOW";
    action: string;
    url?: string;
  }>;
  risk_alerts: Array<{
    title: string;
    description: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    mitigation: string;
    url?: string;
  }>;
  vc_funding_highlights: Array<{
    company: string;
    amount: string;
    sector: string;
    insight: string;
    url?: string;
  }>;
  world_impact: {
    summary: string;
    key_events: Array<{
      event: string;
      impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
      url?: string;
    }>;
  };
  executive_summary: string;
  executive_summary_url?: string;
}

