"use client";
import type { Variants } from "framer-motion";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BrainCircuit, ChevronRight, Clock, AlertTriangle, Zap, Globe, Briefcase, Activity, TrendingUp } from "lucide-react";
import AnimatedGrid from "@/components/AnimatedGrid";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import SignalBadge from "@/components/SignalBadge";
import SentimentGauge from "@/components/SentimentGauge";
import NiftyChart from "@/components/NiftyChart";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Link from "next/link";
import { supabase, type BriefingData, type DailyBriefing } from "@/lib/supabase";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

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
      <div className="w-full rounded-full h-2" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-2 rounded-full" style={{ width: `${width}%`, background: `linear-gradient(90deg, ${color}80, ${color})`, transition: "width 1s ease-out", boxShadow: `0 0 8px ${color}60` }} />
      </div>
    </div>
  );
}

export default function BriefingPage() {
  const params = useParams<{ date: string }>();
  const router = useRouter();
  const date = params.date;

  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [allDates, setAllDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load this specific briefing
        const { data: row, error } = await supabase
          .from("daily_briefings")
          .select("briefing")
          .eq("date", date)
          .single();

        if (!error && row) {
          setBriefing(row.briefing as BriefingData);
        }

        // Load all dates for prev/next navigation
        const { data: dates } = await supabase
          .from("daily_briefings")
          .select("date")
          .order("date", { ascending: false });

        if (dates) {
          setAllDates(dates.map((d: Pick<DailyBriefing, "date">) => d.date));
        }
      } catch (err) {
        console.error("Failed to load briefing:", err);
      } finally {
        setLoading(false);
      }
    };

    if (date) loadData();
  }, [date]);

  const currentIndex = allDates.indexOf(date);
  const prevDate = currentIndex < allDates.length - 1 ? allDates[currentIndex + 1] : null;
  const nextDate = currentIndex > 0 ? allDates[currentIndex - 1] : null;

  const formattedDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="relative min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <AnimatedGrid />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* ─── HEADER / BREADCRUMB ─── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          {/* Logo + Breadcrumb */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))", boxShadow: "0 0 14px rgba(0,212,255,0.4)" }}
              >
                <BrainCircuit size={16} color="white" />
              </div>
              <span className="display-font text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                Brief<span style={{ color: "var(--accent-cyan)" }}>AI</span>
              </span>
            </div>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs" aria-label="Breadcrumb">
              <Link href="/dashboard" className="transition-colors" style={{ color: "var(--accent-cyan)" }}>
                Dashboard
              </Link>
              <ChevronRight size={12} style={{ color: "var(--text-muted)" }} />
              <span style={{ color: "var(--text-muted)" }}>Briefings</span>
              <ChevronRight size={12} style={{ color: "var(--text-muted)" }} />
              <span style={{ color: "var(--text-primary)" }} className="mono">{date}</span>
            </nav>
          </div>

          {/* Prev/Next Navigation */}
          <div className="flex items-center gap-2">
            {prevDate && (
              <button
                id="prev-briefing-btn"
                onClick={() => router.push(`/briefing/${prevDate}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "var(--accent-cyan)" }}
              >
                <ArrowLeft size={13} /> {prevDate}
              </button>
            )}
            {nextDate && (
              <button
                id="next-briefing-btn"
                onClick={() => router.push(`/briefing/${nextDate}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "var(--accent-cyan)" }}
              >
                {nextDate} <ArrowRight size={13} />
              </button>
            )}
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)" }}
            >
              ← Back to Dashboard
            </Link>
          </div>
        </motion.div>

        {/* ─── DATE HEADING ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-center py-2"
        >
          <h2 className="display-font text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            {formattedDate}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            AI-generated CEO morning briefing
          </p>
        </motion.div>

        {loading ? (
          <LoadingSkeleton />
        ) : !briefing ? (
          <GlassCard className="py-16 text-center space-y-4">
            <BrainCircuit size={48} style={{ color: "var(--text-muted)", margin: "0 auto" }} />
            <h3 className="display-font text-xl" style={{ color: "var(--text-primary)" }}>
              No briefing found for {date}
            </h3>
            <Link href="/dashboard" className="text-sm" style={{ color: "var(--accent-cyan)" }}>
              ← Back to Dashboard
            </Link>
          </GlassCard>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Executive Summary */}
            <motion.div variants={itemVariants}>
              <div className="glass-card relative overflow-hidden" style={{ borderLeft: "3px solid var(--accent-purple)" }}>
                <div className="gradient-mesh" style={{ opacity: 0.4 }} />
                <div className="relative z-10 p-6">
                  <SectionHeader icon={<BrainCircuit size={14} />}>Executive Summary</SectionHeader>
                  <p className="text-base leading-relaxed" style={{ color: "var(--text-primary)" }}>
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

            {/* Market Pulse */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <GlassCard className="flex flex-col items-center gap-4">
                <SectionHeader icon={<Activity size={14} />}>Market Pulse</SectionHeader>
                <SentimentGauge score={briefing.market_pulse.sentiment_score} size={160} />
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>Decision</span>
                    <SignalBadge value={briefing.market_pulse.decision} size="md" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>NIFTY</span>
                    <SignalBadge value={briefing.market_pulse.nifty_trend} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>SENSEX</span>
                    <SignalBadge value={briefing.market_pulse.sensex_trend} />
                  </div>
                  <ConfidenceBar value={briefing.market_pulse.confidence} />
                </div>
                <div className="w-full grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Support</div>
                    <div className="mono text-sm font-bold" style={{ color: "#10b981" }}>₹{briefing.market_pulse.key_levels.nifty_support?.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Resistance</div>
                    <div className="mono text-sm font-bold" style={{ color: "#ef4444" }}>₹{briefing.market_pulse.key_levels.nifty_resistance?.toLocaleString("en-IN")}</div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="lg:col-span-2">
                <SectionHeader icon={<TrendingUp size={14} />}>Commodities</SectionHeader>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: "gold", label: "Gold", data: briefing.commodities.gold },
                    { key: "crude", label: "Crude Oil", data: briefing.commodities.crude_oil },
                    { key: "fx", label: "USD/INR", data: briefing.commodities.usd_inr },
                  ].map(({ key, label, data }) => (
                    <div key={key} className="p-3 rounded-xl space-y-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{label}</span>
                        <span className="text-xs font-bold" style={{ color: data.outlook === "UP" || data.outlook === "STRENGTHENING" ? "#10b981" : data.outlook === "DOWN" || data.outlook === "WEAKENING" ? "#ef4444" : "#f59e0b" }}>
                          {data.outlook}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{data.insight}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Top Sectors */}
            <motion.div variants={itemVariants}>
              <SectionHeader icon={<TrendingUp size={14} />}>Top Sectors</SectionHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {briefing.top_sectors.map((s, i) => (
                  <GlassCard key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm display-font" style={{ color: "var(--text-primary)" }}>{s.name}</span>
                      <SignalBadge value={s.signal} />
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{s.reason}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Momentum:</span>
                      <SignalBadge value={s.momentum} />
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>

            {/* Opportunities + Risks */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <GlassCard>
                <SectionHeader icon={<Briefcase size={14} />}>Business Opportunities</SectionHeader>
                <div className="space-y-3">
                  {briefing.business_opportunities.map((opp, i) => (
                    <div key={i} className="p-4 rounded-xl space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{opp.title}</span>
                        <SignalBadge value={opp.urgency} />
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{opp.description}</p>
                      <div className="text-xs p-2 rounded-lg" style={{ background: "rgba(0,212,255,0.08)", color: "var(--accent-cyan)" }}>⚡ {opp.action}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard>
                <SectionHeader icon={<AlertTriangle size={14} />}>Risk Alerts</SectionHeader>
                <div className="space-y-3">
                  {briefing.risk_alerts.map((alert, i) => (
                    <div key={i} className={`p-4 rounded-xl space-y-2 ${alert.severity === "HIGH" ? "pulse-red" : ""}`}
                      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${alert.severity === "HIGH" ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.06)"}` }}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{alert.title}</span>
                        <SignalBadge value={alert.severity} />
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{alert.description}</p>
                      <div className="text-xs p-2 rounded-lg" style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}>🛡️ {alert.mitigation}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* VC Funding */}
            {briefing.vc_funding_highlights?.length > 0 && (
              <motion.div variants={itemVariants}>
                <GlassCard>
                  <SectionHeader icon={<Zap size={14} />}>VC Funding Highlights</SectionHeader>
                  <div className="h-scroll">
                    {briefing.vc_funding_highlights.map((vc, i) => (
                      <div key={i} className="w-72 p-4 rounded-xl space-y-2" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm display-font" style={{ color: "var(--text-primary)" }}>{vc.company}</span>
                          <span className="mono text-xs font-bold" style={{ color: "var(--accent-purple)" }}>{vc.amount}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full inline-block" style={{ background: "rgba(139,92,246,0.15)", color: "var(--accent-purple)" }}>{vc.sector}</span>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{vc.insight}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* World Impact */}
            <motion.div variants={itemVariants}>
              <GlassCard>
                <SectionHeader icon={<Globe size={14} />}>World Impact</SectionHeader>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)", lineHeight: "1.7" }}>
                    {briefing.world_impact.summary}
                  </p>
                  <div className="space-y-2">
                    {briefing.world_impact.key_events.map((ev, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: ev.impact === "POSITIVE" ? "#10b981" : ev.impact === "NEGATIVE" ? "#ef4444" : "#f59e0b" }} />
                        <div>
                          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{ev.event}</p>
                          <span className="text-xs" style={{ color: ev.impact === "POSITIVE" ? "#10b981" : ev.impact === "NEGATIVE" ? "#ef4444" : "#f59e0b" }}>{ev.impact}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Bottom Navigation */}
            <motion.div variants={itemVariants} className="flex items-center justify-between pt-4">
              {prevDate ? (
                <button
                  onClick={() => router.push(`/briefing/${prevDate}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "var(--accent-cyan)" }}
                >
                  <ArrowLeft size={15} /> {prevDate}
                </button>
              ) : <div />}
              {nextDate && (
                <button
                  onClick={() => router.push(`/briefing/${nextDate}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "var(--accent-cyan)" }}
                >
                  {nextDate} <ArrowRight size={15} />
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Suppress unused import warning for NiftyChart (may be used for future chart embed)
const _NiftyChart = NiftyChart;
void _NiftyChart;
