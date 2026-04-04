"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import SignalBadge from "./SignalBadge";

// ─── Confidence Bar ────────────────────────────────────────────────
function ConfidenceBar({ value }: { value: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value * 100), 400);
    return () => clearTimeout(t);
  }, [value]);

  const color = value >= 0.7 ? "#10b981" : value >= 0.4 ? "#f59e0b" : "#ef4444";

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
        <span>Confidence</span>
        <span className="mono font-semibold" style={{ color }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="w-full rounded-full h-1.5" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-1.5 rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Bank Card Display ─────────────────────────────────────────────
function BankCardDisplay({ niftyPrice, niftyChange }: { niftyPrice?: number; niftyChange?: number }) {
  const isUp = (niftyChange ?? 0) >= 0;
  return (
    <div style={{ position: "relative" }}>
      {/* Back card (stacked) */}
      <div
        className="bank-card bank-card-secondary"
        style={{ marginBottom: "-60px", transform: "scale(0.94) translateY(-8px)", opacity: 0.6, position: "relative", zIndex: 1 }}
      >
        <div className="flex justify-between items-start">
          <span className="text-xs font-semibold" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>VISA</span>
          <span className="mono text-xs" style={{ color: "var(--text-muted)" }}>₹{niftyPrice ? (niftyPrice * 0.82).toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "—"}</span>
        </div>
      </div>

      {/* Front card */}
      <div className="bank-card bank-card-primary" style={{ position: "relative", zIndex: 2 }}>
        <div className="flex justify-between items-start mb-6">
          <span className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.9)", letterSpacing: "0.1em" }}>VISA</span>
          <div className="flex gap-0.5">
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(139,92,246,0.6)" }} />
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(109,40,217,0.5)", marginLeft: -10 }} />
          </div>
        </div>
        <div className="mb-2">
          <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>NIFTY 50</div>
          <div className="mono text-2xl font-bold" style={{ color: "white" }}>
            ₹{niftyPrice ? niftyPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "—"}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span
            className="mono text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: isUp ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
              color: isUp ? "#10b981" : "#ef4444",
              border: `1px solid ${isUp ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
            }}
          >
            {isUp ? "▲" : "▼"} {Math.abs(niftyChange ?? 0).toFixed(2)}%
          </span>
          <div style={{
            width: 36, height: 28, borderRadius: 4,
            background: "linear-gradient(135deg, #d4af37, #b8962e)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 20, height: 16, borderRadius: 2, background: "rgba(0,0,0,0.4)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

import { usePathname } from "next/navigation";

// ─── Right Panel ──────────────────────────────────────────────────
export default function RightPanel() {
  const { briefing, marketData, running, handleRunNow, addToast } = useData();
  const pathname = usePathname();

  if (["/portfolio", "/chat", "/settings"].includes(pathname)) return null;

  // Calculate approximate % change from nifty historical
  const niftyData = marketData?.nifty?.historical ?? [];
  const niftyPrice = marketData?.nifty?.current_price;
  const niftyStartPrice = niftyData.length > 1 ? niftyData[0].close : niftyPrice;
  const niftyChangePct = niftyPrice && niftyStartPrice ? ((niftyPrice - niftyStartPrice) / niftyStartPrice) * 100 : 0;

  const handleAction = (msg: string) => {
    addToast(msg, "info");
  };

  const recentTxns = [
    { name: "NIFTY 50", sub: "Index Fund", amount: niftyPrice ? `₹${niftyPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—", positive: niftyChangePct >= 0, icon: "N" },
    { name: "SENSEX", sub: "BSE Index", amount: marketData?.sensex?.current_price ? `₹${marketData.sensex.current_price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—", positive: true, icon: "S" },
    { name: briefing?.top_sectors?.[0]?.name ?? "Top Sector", sub: briefing?.top_sectors?.[0]?.signal ?? "HOLD", amount: `${briefing?.market_pulse?.sentiment_score !== undefined ? (briefing.market_pulse.sentiment_score * 100).toFixed(0) : "—"}pt`, positive: (briefing?.market_pulse?.sentiment_score ?? 0.5) > 0.5, icon: "T" },
  ];

  return (
    <aside className="right-panel">
      {/* My Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold display-font" style={{ color: "var(--text-primary)" }}>My Cards</span>
          <button
            onClick={handleRunNow}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
            style={{
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.25)",
              color: "var(--accent-violet-light)",
              cursor: "pointer",
            }}
            disabled={running}
          >
            {running ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
            {running ? "Running…" : "+ Refresh"}
          </button>
        </div>

        <BankCardDisplay niftyPrice={niftyPrice} niftyChange={niftyChangePct} />

        {/* Sensex Balance */}
        <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>SENSEX</div>
          <div className="mono text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            ₹{marketData?.sensex?.current_price?.toLocaleString("en-IN", { maximumFractionDigits: 2 }) ?? "—"}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button onClick={() => handleAction("Request Sent: Processing new market data.")} className="btn-secondary text-sm" style={{ borderRadius: 12, padding: "0.6rem 0" }}>
            <ArrowDownLeft size={14} /> Request
          </button>
          <button onClick={() => handleAction("Analysis Triggered: Checking technical indicators.")} className="btn-primary text-sm" style={{ borderRadius: 12, padding: "0.6rem 0" }}>
            <ArrowUpRight size={14} /> Analyze
          </button>
        </div>
      </div>

      {/* Recent Transactions / Market Snapshot */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold display-font" style={{ color: "var(--text-primary)" }}>
            Recent Signals
          </span>
          <Link href="/briefing" className="text-xs" style={{ color: "var(--accent-violet-light)" }}>View All</Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {recentTxns.map((txn, i) => (
            <div key={i} className="txn-item">
              <div className="txn-avatar">{txn.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{txn.name}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{txn.sub}</div>
              </div>
              <span className="mono text-sm font-bold" style={{ color: txn.positive ? "#10b981" : "#ef4444", flexShrink: 0 }}>
                {txn.positive ? "+" : ""}{txn.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Decision Badge - BIG */}
      {briefing && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold display-font" style={{ color: "var(--text-primary)" }}>Top Opportunity</span>
          </div>
          <div className="stat-card p-4 text-center">
            <div className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--text-muted)" }}>Decision of the Day</div>
            <SignalBadge value={briefing.market_pulse?.decision || "HOLD"} size="lg" />
            <p className="text-xs mt-3 text-balance" style={{ color: "var(--text-secondary)" }}>
               {briefing.business_opportunities?.[0]?.title || "Market is trending sideways. Await further signals."}
            </p>
          </div>
        </div>
      )}

      {/* Market Pulse Mini */}
      {briefing && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold display-font" style={{ color: "var(--text-primary)" }}>Market Pulse</span>
          </div>
          <div className="stat-card space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Decision</span>
              <SignalBadge value={briefing.market_pulse?.decision || "HOLD"} size="md" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>NIFTY Trend</span>
              <SignalBadge value={briefing.market_pulse?.nifty_trend || "SIDEWAYS"} />
            </div>
            <ConfidenceBar value={briefing.market_pulse?.confidence || 0.5} />
          </div>
        </div>
      )}
    </aside>
  );
}
