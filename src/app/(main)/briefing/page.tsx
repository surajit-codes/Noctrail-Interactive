"use client";

import { motion } from "framer-motion";
import { BrainCircuit, ChevronRight, Activity, AlertTriangle, Briefcase, Globe, Loader2, Search, Zap } from "lucide-react";
import AnimatedGrid from "@/components/AnimatedGrid";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import SignalBadge from "@/components/SignalBadge";
import SentimentGauge from "@/components/SentimentGauge";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { useData } from "@/context/DataContext";
import Link from "next/link";
import { useState } from "react";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

export default function BriefingPage() {
  const { briefing, history, loading } = useData();
  const [searchHistory, setSearchHistory] = useState("");

  if (loading) {
    return (
      <div className="relative">
        <AnimatedGrid />
        <LoadingSkeleton />
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <AnimatedGrid />
        <h2 className="display-font text-2xl font-bold" style={{ color: "var(--text-primary)" }}>No Briefing Available</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Please generate a briefing from the Overview page.</p>
      </div>
    );
  }

  return (
    <>
      <AnimatedGrid />
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 relative z-10">
        
        {/* Executive Summary */}
        <motion.div variants={itemVariants}>
          <div className="glass-card p-6 relative overflow-hidden" style={{ borderLeft: "4px solid var(--accent-violet)" }}>
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <BrainCircuit size={100} />
            </div>
            <SectionHeader title="Executive Summary" icon={BrainCircuit} />
            <h2 className="display-font text-xl font-bold mb-3 mt-4" style={{ color: "var(--text-primary)" }}>{new Date(briefing.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</h2>
            <p className="text-base" style={{ color: "var(--text-primary)", lineHeight: "1.7" }}>
              {briefing.executive_summary}
            </p>
          </div>
        </motion.div>

        {/* Market Pulse & Sectors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={itemVariants}>
            <GlassCard title="Market Pulse" icon={Activity}>
              <div className="flex items-center justify-center py-6">
                 <SentimentGauge score={briefing.market_pulse.sentiment_score} />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="p-3 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] text-center">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Status</div>
                  <SignalBadge value={briefing.market_pulse.decision} />
                </div>
                <div className="p-3 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] text-center">
                  <div className="text-xs text-[var(--text-muted)] mb-1">NIFTY Trend</div>
                  <SignalBadge value={briefing.market_pulse.nifty_trend} />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard title="Top Sectors" icon={Briefcase}>
              <div className="space-y-3">
                {briefing.top_sectors.map((sector, i) => (
                  <div key={i} className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm display-font">{sector.name}</span>
                      <SignalBadge value={sector.signal} size="sm" />
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{sector.reason}</p>
                    <div className="absolute right-0 bottom-0 w-2 h-full" style={{
                      background: sector.signal === "BUY" ? "var(--accent-green)" : sector.signal === "AVOID" ? "var(--accent-red)" : "var(--accent-amber)",
                      opacity: 0.3
                    }} />
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Opportunities & Risks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={itemVariants}>
            <GlassCard title="Opportunities" icon={Zap}>
              <div className="space-y-3">
                {briefing.business_opportunities.map((opp, i) => (
                  <div key={i} className="p-4 rounded-xl border border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between mb-2">
                       <h4 className="font-bold text-sm text-[var(--text-primary)]">{opp.title}</h4>
                       <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold" style={{
                         background: "rgba(16, 185, 129, 0.15)", color: "#10b981"
                       }}> {opp.urgency}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mb-3">{opp.description}</p>
                    <div className="text-xs font-medium text-[var(--accent-violet-light)] flex items-center gap-1">
                      <ChevronRight size={14} /> {opp.action}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard title="Risk Alerts" icon={AlertTriangle}>
              <div className="space-y-3">
                {briefing.risk_alerts.map((risk, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${risk.severity === "HIGH" ? "pulse-red" : "border-[var(--border-subtle)]"} relative overflow-hidden`}>
                     <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm">{risk.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold bg-red-500/10 text-red-500"> {risk.severity}</span>
                     </div>
                     <p className="text-xs text-[var(--text-muted)] mb-3">{risk.description}</p>
                     <div className="text-xs text-amber-600 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                        <strong>Mitigation:</strong> {risk.mitigation}
                     </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* VC Funding & World Impact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={itemVariants}>
            <GlassCard title="VC Funding Highlights" icon={Activity}>
              <div className="space-y-3">
                 {briefing.vc_funding_highlights.map((vc, i) => (
                   <div key={i} className="flex flex-col gap-1 pb-3 mb-3 border-b border-[var(--border-subtle)] last:border-0 last:pb-0 last:mb-0">
                     <div className="flex justify-between text-sm">
                        <strong className="text-[var(--text-primary)]">{vc.company}</strong>
                        <span className="font-mono font-bold text-[var(--accent-green)]">{vc.amount}</span>
                     </div>
                     <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{vc.sector}</div>
                     <div className="text-xs text-[var(--text-secondary)] mt-1">{vc.insight}</div>
                   </div>
                 ))}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard title="World Impact" icon={Globe}>
              <p className="text-sm text-[var(--text-primary)] mb-4">{briefing.world_impact.summary}</p>
              <div className="space-y-2">
                 {briefing.world_impact.key_events.map((event, i) => (
                   <div key={i} className="flex gap-3 text-sm p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)]">
                      <div className={`w-1.5 rounded-full ${event.impact === "POSITIVE" ? "bg-green-500" : event.impact === "NEGATIVE" ? "bg-red-500" : "bg-blue-500"}`} />
                      <span className="text-[var(--text-secondary)]">{event.event}</span>
                   </div>
                 ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* History Table */}
        <motion.div variants={itemVariants} className="mt-8" id="history">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <SectionHeader title="Briefing History" icon={Activity} />
              <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 focus-within:border-[var(--accent-violet)] transition-colors">
                <Search size={14} className="text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  placeholder="Search dates..." 
                  className="bg-transparent border-none text-xs focus:outline-none w-32"
                  style={{ color: "var(--text-primary)" }}
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <th className="pb-3 text-xs font-semibold uppercase text-[var(--text-muted)]">Date</th>
                    <th className="pb-3 text-xs font-semibold uppercase text-[var(--text-muted)]">NIFTY Trend</th>
                    <th className="pb-3 text-xs font-semibold uppercase text-[var(--text-muted)]">Decision</th>
                    <th className="pb-3 text-xs font-semibold uppercase text-[var(--text-muted)] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {history
                    .filter(h => h.date.includes(searchHistory) || new Date(h.date).toLocaleDateString().includes(searchHistory))
                    .map(h => (
                    <tr key={h.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td className="py-4 font-mono text-[var(--text-primary)]">{h.date}</td>
                      <td className="py-4"><SignalBadge value={h.briefing.market_pulse.nifty_trend} size="sm" /></td>
                      <td className="py-4"><SignalBadge value={h.briefing.market_pulse.decision} size="sm" /></td>
                      <td className="py-4 text-right">
                        <Link href={`/briefing/${h.date}`} className="text-xs text-[var(--accent-violet-light)] hover:underline flex items-center justify-end gap-1">
                          View details <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-[var(--text-muted)]">No past briefings found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </>
  );
}
