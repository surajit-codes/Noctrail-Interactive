"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Activity, AlertTriangle, BarChart3, Bell, BrainCircuit, Briefcase, ChevronRight, Clock, Globe, Loader2, RefreshCw, TrendingDown, TrendingUp, Zap } from "lucide-react";
import AnimatedGrid from "@/components/AnimatedGrid";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import SignalBadge from "@/components/SignalBadge";
import SentimentGauge from "@/components/SentimentGauge";
import NiftyChart from "@/components/NiftyChart";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import type { BriefingData, DailyBriefing } from "@/lib/briefingTypes";
import { getDailyBriefingHistory, getLatestDailyBriefing } from "@/lib/firebaseClient";
import Link from "next/link";

// ─── Animation Variants ────────────────────────────────────────────
const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};

// ─── Live Clock ────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Kolkata",
        })
      );
      setDate(
        now.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-right">
      <div className="mono text-xl font-semibold" style={{ color: "var(--accent-cyan)" }}>
        {time} IST
      </div>
      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
        {date}
      </div>
    </div>
  );
}

// ─── Confidence Bar ────────────────────────────────────────────────
function ConfidenceBar({ value }: { value: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value * 100), 400);
    return () => clearTimeout(t);
  }, [value]);

  const color =
    value >= 0.7 ? "#10b981" : value >= 0.4 ? "#f59e0b" : "#ef4444";

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
        <span>Confidence</span>
        <span className="mono font-semibold" style={{ color }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="w-full rounded-full h-2" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-2 rounded-full transition-all duration-1000 ease-out"
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

// ─── Toast ────────────────────────────────────────────────────────
interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="toast"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{
                  background:
                    t.type === "success" ? "#10b981" : t.type === "error" ? "#ef4444" : "#00d4ff",
                }}
              />
              <p className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>
                {t.message}
              </p>
              <button
                onClick={() => onRemove(t.id)}
                className="text-xs opacity-50 hover:opacity-100 ml-2 transition-opacity"
                style={{ color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Commodity Card ────────────────────────────────────────────────
function CommodityCard({
  title,
  price,
  change,
  changePct,
  outlook,
  insight,
  unit = "",
}: {
  title: string;
  price: number | null;
  change?: number | null;
  changePct?: number | null;
  outlook?: string;
  insight?: string;
  unit?: string;
}) {
  const isUp = (change ?? 0) >= 0;
  const color = isUp ? "#10b981" : "#ef4444";
  const TrendIcon = isUp ? TrendingUp : TrendingDown;

  return (
    <GlassCard className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
          {title}
        </span>
        {outlook && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full border"
            style={{
              color: outlook === "UP" || outlook === "STRENGTHENING" ? "#10b981" : outlook === "DOWN" || outlook === "WEAKENING" ? "#ef4444" : "#f59e0b",
              borderColor: "currentColor",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            {outlook}
          </span>
        )}
      </div>
      <div className="flex items-end gap-3">
        <span className="mono text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {price != null ? `${unit}${price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "N/A"}
        </span>
        {change != null && (
          <div className="flex items-center gap-1 mb-0.5" style={{ color }}>
            <TrendIcon size={14} />
            <span className="mono text-xs font-semibold">
              {changePct != null ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%` : `${change >= 0 ? "+" : ""}${change.toFixed(2)}`}
            </span>
          </div>
        )}
      </div>
      {insight && (
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {insight}
        </p>
      )}
    </GlassCard>
  );
}

// ─── Main Dashboard Page ───────────────────────────────────────────
export default function DashboardPage() {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [marketData, setMarketData] = useState<{
    nifty?: { historical: { date: string; close: number }[]; current_price: number };
    sensex?: { historical: { date: string; close: number }[]; current_price: number };
    spot?: {
      usd_inr?: { price: number; change: number; change_percent: number };
      gold?: { price: number; change: number; change_percent: number };
      crude_oil?: { price: number; change: number; change_percent: number };
    };
  } | null>(null);
  const [history, setHistory] = useState<DailyBriefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifStatus, setNotifStatus] = useState<"idle" | "loading" | "enabled" | "denied">("idle");

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch latest briefing from Firestore
  const fetchBriefing = useCallback(async () => {
    try {
      const latest = await getLatestDailyBriefing();
      if (latest) setBriefing(latest);
    } catch (err) {
      console.warn("Failed to fetch briefing (likely missing keys):", err);
    }
  }, []);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      const rows = await getDailyBriefingHistory(30);
      setHistory(rows);
    } catch (err) {
      console.warn("Failed to fetch history:", err);
    }
  }, []);

  // Fetch live market data
  const fetchMarketData = useCallback(async () => {
    try {
      const res = await fetch("/api/data/markets");
      if (res.ok) {
        const data = await res.json();
        setMarketData(data);
      }
    } catch (err) {
      console.error("Failed to fetch market data:", err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.allSettled([fetchBriefing(), fetchHistory(), fetchMarketData()]);
      setLoading(false);
    };
    init();
  }, [fetchBriefing, fetchHistory, fetchMarketData]);

  // Run briefing now
  const handleRunNow = async () => {
    setRunning(true);
    addToast("⚡ Generating briefing...", "info");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "x-demo-bypass": "true" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchBriefing();
        await fetchHistory();
        addToast("✅ Morning briefing generated successfully!", "success");
      } else {
        throw new Error(data.details ? `${data.error}: ${data.details}` : data.error ?? "Unknown error");
      }
    } catch (err) {
      addToast(`❌ Failed to generate briefing: ${String(err)}`, "error");
    } finally {
      setRunning(false);
    }
  };

  // Enable push notifications
  const handleEnableNotifications = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      addToast("❌ Push notifications not supported in this browser.", "error");
      return;
    }

    setNotifStatus("loading");
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      setNotifStatus("denied");
      addToast("🔕 Notification permission denied.", "error");
      return;
    }

    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        addToast("⚠️ Push notifications not configured (missing VAPID key).", "info");
        setNotifStatus("idle");
        return;
      }

      const swReg = await navigator.serviceWorker.ready;
      const subscription = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(vapidKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      setNotifStatus("enabled");
      addToast("🔔 Morning briefing notifications enabled!", "success");
    } catch (err) {
      setNotifStatus("idle");
      addToast(`❌ Failed to enable notifications: ${String(err)}`, "error");
    }
  };

  const spot = marketData?.spot;

  if (loading) {
    return (
      <div className="relative min-h-screen p-6" style={{ zIndex: 1 }}>
        <AnimatedGrid />
        <div className="relative z-10 max-w-7xl mx-auto">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <AnimatedGrid />
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* ─── HEADER ──────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))",
                boxShadow: "0 0 20px rgba(0,212,255,0.4)",
              }}
            >
              <BrainCircuit size={20} color="white" />
            </div>
            <div>
              <h1 className="display-font text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                Brief<span style={{ color: "var(--accent-cyan)" }}>AI</span>
              </h1>
              <div className="flex items-center gap-1.5">
                <div className="live-dot" />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>LIVE INTELLIGENCE</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <LiveClock />

            {/* Enable Notifications Button */}
            {notifStatus !== "enabled" && (
              <button
                id="enable-notifications-btn"
                onClick={handleEnableNotifications}
                disabled={notifStatus === "loading"}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: "rgba(139,92,246,0.1)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  color: "var(--accent-purple)",
                  cursor: notifStatus === "loading" ? "not-allowed" : "pointer",
                }}
              >
                <Bell size={14} />
                {notifStatus === "loading" ? "Enabling..." : "Enable Notifications"}
              </button>
            )}

            {/* Run Now Button */}
            <button
              id="run-briefing-btn"
              onClick={handleRunNow}
              disabled={running}
              className="btn-cyber flex items-center gap-2"
            >
              {running ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Analyzing markets...</span>
                </>
              ) : (
                <>
                  <Zap size={15} />
                  <span>Run Briefing Now</span>
                </>
              )}
            </button>
          </div>
        </motion.header>

        {!briefing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center p-16 space-y-6 min-h-[50vh]"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(139,92,246,0.1))",
                border: "1px solid rgba(0,212,255,0.3)",
                boxShadow: "0 0 30px rgba(0,212,255,0.2)",
              }}
            >
              <BrainCircuit size={40} style={{ color: "var(--accent-cyan)" }} />
            </div>
            <h2 className="display-font text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              No briefing generated yet
            </h2>
            <p className="text-base max-w-md text-center" style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>
              Your dashboard is currently empty. Initialize the AI engine to sweep the markets, aggregate global news, and formulate your first CEO briefing.
            </p>
            <button
              id="generate-first-btn"
              onClick={handleRunNow}
              disabled={running}
              className="btn-cyber flex items-center justify-center gap-3 px-8 py-4 text-sm mt-4 w-full sm:w-auto"
              style={{ transform: "scale(1.05)" }}
            >
              {running ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
              <span>{running ? "Analyzing..." : "Generate Your First Briefing"}</span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* ─── EXECUTIVE SUMMARY ─────────────────────────── */}
            <motion.div variants={itemVariants}>
              <div
                className="glass-card relative overflow-hidden"
                style={{
                  borderLeft: "3px solid var(--accent-purple)",
                  background: "linear-gradient(135deg, rgba(139,92,246,0.05), rgba(0,212,255,0.03))",
                }}
              >
                <div className="gradient-mesh" style={{ opacity: 0.5 }} />
                <div className="relative z-10 p-6">
                  <SectionHeader icon={<BrainCircuit size={14} />}>Executive Summary</SectionHeader>
                  <p className="text-base leading-relaxed" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
                    {briefing.executive_summary}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Clock size={12} style={{ color: "var(--text-muted)" }} />
                    <span className="text-xs mono" style={{ color: "var(--text-muted)" }}>
                      Generated: {new Date(briefing.generated_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ─── MARKET PULSE + CHART + COMMODITIES ──────── */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Market Pulse */}
              <GlassCard className="flex flex-col items-center gap-4">
                <SectionHeader icon={<Activity size={14} />}>Market Pulse</SectionHeader>
                <SentimentGauge score={briefing.market_pulse?.sentiment_score || 0} size={160} />

                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>Decision</span>
                    <SignalBadge value={briefing.market_pulse?.decision || "HOLD"} size="md" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>NIFTY</span>
                    <SignalBadge value={briefing.market_pulse?.nifty_trend || "SIDEWAYS"} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>SENSEX</span>
                    <SignalBadge value={briefing.market_pulse?.sensex_trend || "SIDEWAYS"} />
                  </div>
                  <ConfidenceBar value={briefing.market_pulse?.confidence || 0.5} />
                </div>

                <div className="w-full grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Support</div>
                    <div className="mono text-sm font-bold" style={{ color: "#10b981" }}>
                      ₹{briefing.market_pulse?.key_levels?.nifty_support?.toLocaleString("en-IN") || "---"}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Resistance</div>
                    <div className="mono text-sm font-bold" style={{ color: "#ef4444" }}>
                      ₹{briefing.market_pulse?.key_levels?.nifty_resistance?.toLocaleString("en-IN") || "---"}
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* NIFTY Chart */}
              <GlassCard className="lg:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <SectionHeader icon={<BarChart3 size={14} />}>
                    NIFTY 50 — 20 Day Chart
                  </SectionHeader>
                  {marketData?.nifty?.current_price && (
                    <span className="mono text-lg font-bold" style={{ color: "var(--accent-cyan)" }}>
                      ₹{marketData.nifty.current_price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
                {marketData?.nifty?.historical && marketData.nifty.historical.length > 0 ? (
                  <NiftyChart data={marketData.nifty.historical} name="NIFTY 50" />
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
                    Chart data unavailable right now
                  </div>
                )}

                {/* SENSEX mini info */}
                {marketData?.sensex?.current_price && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>SENSEX</span>
                    <span className="mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      ₹{marketData.sensex.current_price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,212,255,0.08)", color: "var(--accent-cyan)" }}>
                      {briefing.market_pulse?.sensex_trend || "SIDEWAYS"}
                    </span>
                  </div>
                )}
              </GlassCard>
            </motion.div>

            {/* ─── COMMODITIES ──────────────────────────────── */}
            <motion.div variants={itemVariants}>
              <SectionHeader icon={<TrendingUp size={14} />}>Commodities & FX</SectionHeader>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CommodityCard
                  title="Gold (XAU/USD)"
                  price={spot?.gold?.price ?? null}
                  change={spot?.gold?.change}
                  changePct={spot?.gold?.change_percent}
                  outlook={briefing.commodities?.gold?.outlook || "STABLE"}
                  insight={briefing.commodities?.gold?.insight || "Data unavailable"}
                  unit="$"
                />
                <CommodityCard
                  title="Crude Oil (WTI)"
                  price={spot?.crude_oil?.price ?? null}
                  change={spot?.crude_oil?.change}
                  changePct={spot?.crude_oil?.change_percent}
                  outlook={briefing.commodities?.crude_oil?.outlook || "STABLE"}
                  insight={briefing.commodities?.crude_oil?.insight || "Data unavailable"}
                  unit="$"
                />
                <CommodityCard
                  title="USD/INR"
                  price={spot?.usd_inr?.price ?? null}
                  change={spot?.usd_inr?.change}
                  changePct={spot?.usd_inr?.change_percent}
                  outlook={briefing.commodities?.usd_inr?.outlook || "STABLE"}
                  insight={briefing.commodities?.usd_inr?.insight || "Data unavailable"}
                  unit="₹"
                />
              </div>
            </motion.div>

            {/* ─── TOP SECTORS ──────────────────────────────── */}
            <motion.div variants={itemVariants}>
              <SectionHeader icon={<BarChart3 size={14} />}>Top Sectors</SectionHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(briefing.top_sectors || []).map((sector, i) => (
                  <GlassCard key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm display-font" style={{ color: "var(--text-primary)" }}>
                        {sector.name}
                      </span>
                      <SignalBadge value={sector.signal} />
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {sector.reason}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Momentum:</span>
                      <SignalBadge value={sector.momentum} />
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>

            {/* ─── OPPORTUNITIES + RISK ALERTS ─────────────── */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Business Opportunities */}
              <GlassCard>
                <SectionHeader icon={<Briefcase size={14} />}>Business Opportunities</SectionHeader>
                <div className="space-y-4">
                  {(briefing.business_opportunities || []).map((opp, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl space-y-2"
                      style={{
                        background: opp.urgency === "HIGH" ? "rgba(0,212,255,0.05)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${opp.urgency === "HIGH" ? "rgba(0,212,255,0.2)" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                          {opp.title}
                        </span>
                        <SignalBadge value={opp.urgency} />
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {opp.description}
                      </p>
                      <div
                        className="text-xs p-2 rounded-lg"
                        style={{ background: "rgba(0,212,255,0.08)", color: "var(--accent-cyan)" }}
                      >
                        ⚡ {opp.action}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Risk Alerts */}
              <GlassCard>
                <SectionHeader icon={<AlertTriangle size={14} />}>Risk Alerts</SectionHeader>
                <div className="space-y-4">
                  {(briefing.risk_alerts || []).map((alert, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl space-y-2 ${alert.severity === "HIGH" ? "pulse-red" : ""}`}
                      style={{
                        background: alert.severity === "HIGH" ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${alert.severity === "HIGH" ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                          {alert.title}
                        </span>
                        <SignalBadge value={alert.severity} />
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {alert.description}
                      </p>
                      <div
                        className="text-xs p-2 rounded-lg"
                        style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}
                      >
                        🛡️ {alert.mitigation}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* ─── VC FUNDING ───────────────────────────────── */}
            {briefing.vc_funding_highlights?.length > 0 && (
              <motion.div variants={itemVariants}>
                <GlassCard>
                  <SectionHeader icon={<Zap size={14} />}>VC Funding Highlights</SectionHeader>
                  <div className="h-scroll pb-2">
                    {(briefing.vc_funding_highlights || []).map((vc, i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 w-72 p-4 rounded-xl space-y-2"
                        style={{
                          background: "rgba(139,92,246,0.06)",
                          border: "1px solid rgba(139,92,246,0.2)",
                          minWidth: "270px",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm display-font" style={{ color: "var(--text-primary)" }}>
                            {vc.company}
                          </span>
                          <span className="mono text-xs font-bold" style={{ color: "var(--accent-purple)" }}>
                            {vc.amount}
                          </span>
                        </div>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full inline-block"
                          style={{ background: "rgba(139,92,246,0.15)", color: "var(--accent-purple)" }}
                        >
                          {vc.sector}
                        </span>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                          {vc.insight}
                        </p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* ─── WORLD IMPACT ─────────────────────────────── */}
            <motion.div variants={itemVariants}>
              <GlassCard>
                <SectionHeader icon={<Globe size={14} />}>World Impact on India</SectionHeader>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)", lineHeight: "1.7" }}>
                      {briefing.world_impact?.summary || "Global impact data unavailable."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {(briefing.world_impact?.key_events || []).map((ev, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{
                            background: ev.impact === "POSITIVE" ? "#10b981" : ev.impact === "NEGATIVE" ? "#ef4444" : "#f59e0b",
                            boxShadow: `0 0 6px ${ev.impact === "POSITIVE" ? "#10b981" : ev.impact === "NEGATIVE" ? "#ef4444" : "#f59e0b"}60`,
                          }}
                        />
                        <div>
                          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{ev.event}</p>
                          <span
                            className="text-xs"
                            style={{
                              color: ev.impact === "POSITIVE" ? "#10b981" : ev.impact === "NEGATIVE" ? "#ef4444" : "#f59e0b",
                            }}
                          >
                            {ev.impact}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* ─── HISTORY TABLE ────────────────────────────── */}
            {history.length > 0 && (
              <motion.div variants={itemVariants}>
                <GlassCard>
                  <SectionHeader icon={<RefreshCw size={14} />}>Briefing History (Last 30 Days)</SectionHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          {["Date", "Decision", "NIFTY Trend", "Sentiment", "Generated"].map((h) => (
                            <th
                              key={h}
                              className="text-left py-3 px-3 text-xs font-semibold tracking-wider uppercase"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {h}
                            </th>
                          ))}
                          <th className="py-3 px-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((row, i) => (
                          <tr
                            key={row.id}
                            className="transition-colors"
                            style={{
                              borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "rgba(0,212,255,0.04)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "transparent";
                            }}
                          >
                            <td className="py-3 px-3 mono text-sm" style={{ color: "var(--text-primary)" }}>
                              {new Date(row.date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-3 px-3">
                              <SignalBadge value={(row.briefing as BriefingData).market_pulse?.decision ?? "HOLD"} />
                            </td>
                            <td className="py-3 px-3">
                              <SignalBadge value={(row.briefing as BriefingData).market_pulse?.nifty_trend ?? "SIDEWAYS"} />
                            </td>
                            <td className="py-3 px-3 mono text-xs" style={{ color: "var(--accent-cyan)" }}>
                              {(row.briefing as BriefingData).market_pulse?.sentiment_score?.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-xs" style={{ color: "var(--text-muted)" }}>
                              {new Date(row.created_at).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "Asia/Kolkata",
                              })}{" "}
                              IST
                            </td>
                            <td className="py-3 px-3">
                              <Link
                                href={`/briefing/${row.date}`}
                                className="flex items-center gap-1 text-xs transition-colors"
                                style={{ color: "var(--accent-cyan)" }}
                              >
                                View <ChevronRight size={12} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Helper: base64 to Uint8Array for VAPID
function urlB64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
