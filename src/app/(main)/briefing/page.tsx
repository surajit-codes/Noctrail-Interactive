"use client";

import { motion } from "framer-motion";
import { BrainCircuit, ChevronRight, Activity, AlertTriangle, Briefcase, Globe, Search, Zap, FileText, TableProperties, Crown } from "lucide-react";
import AnimatedGrid from "@/components/AnimatedGrid";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import SignalBadge from "@/components/SignalBadge";
import SentimentGauge from "@/components/SentimentGauge";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import PremiumGate from "@/components/PremiumGate";
import { useData } from "@/context/DataContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useRouter } from "next/navigation";
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
  const { briefing, history, loading, addToast } = useData();
  const { isPremium } = useSubscription();
  const router = useRouter();
  const [searchHistory, setSearchHistory] = useState("");

  const exportPDF = async () => {
    try {
      addToast("Generating PDF...", "info");
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      let y = 20;

      // Helper to add text with word wrap
      const addText = (text: string, x: number, fontSize: number, color: [number, number, number] = [255, 255, 255], maxWidth?: number) => {
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...color);
        if (maxWidth) {
          const lines = pdf.splitTextToSize(text, maxWidth);
          pdf.text(lines, x, y);
          y += lines.length * (fontSize * 0.5) + 2;
        } else {
          pdf.text(text, x, y);
          y += fontSize * 0.5 + 2;
        }
      };

      const addSection = (title: string) => {
        if (y > 260) { pdf.addPage(); y = 20; }
        y += 4;
        pdf.setFillColor(124, 58, 237);
        pdf.rect(10, y - 4, pageWidth - 20, 8, "F");
        addText(title, 14, 11, [255, 255, 255]);
        y += 4;
      };

      // Background
      pdf.setFillColor(2, 8, 23);
      pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F");

      // Title
      pdf.setFontSize(22);
      pdf.setTextColor(139, 92, 246);
      pdf.text("BriefAI", 10, y);
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`CEO Morning Briefing — ${briefing!.date}`, 42, y);
      y += 12;

      // Executive Summary
      addSection("EXECUTIVE SUMMARY");
      addText(briefing!.executive_summary, 14, 9, [200, 200, 200], pageWidth - 28);
      y += 4;

      // Market Pulse
      addSection("MARKET PULSE");
      addText(`Decision: ${briefing!.market_pulse.decision}   |   NIFTY Trend: ${briefing!.market_pulse.nifty_trend}   |   Sentiment: ${briefing!.market_pulse.sentiment_score}/100`, 14, 9, [200, 200, 200], pageWidth - 28);
      y += 4;

      // Top Sectors
      addSection("TOP SECTORS");
      briefing!.top_sectors.forEach((s: any) => {
        if (y > 270) { pdf.addPage(); y = 20; pdf.setFillColor(2, 8, 23); pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F"); }
        addText(`${s.signal}  ${s.name} (${s.momentum})`, 14, 9, s.signal === "BUY" ? [16, 185, 129] : s.signal === "AVOID" ? [239, 68, 68] : [245, 158, 11]);
        addText(s.reason, 18, 8, [150, 150, 150], pageWidth - 36);
        y += 2;
      });

      // Opportunities
      addSection("BUSINESS OPPORTUNITIES");
      briefing!.business_opportunities.forEach((o: any) => {
        if (y > 270) { pdf.addPage(); y = 20; pdf.setFillColor(2, 8, 23); pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F"); }
        addText(`[${o.urgency}] ${o.title}`, 14, 9, [16, 185, 129]);
        addText(o.description, 18, 8, [150, 150, 150], pageWidth - 36);
        addText(`Action: ${o.action}`, 18, 8, [139, 92, 246], pageWidth - 36);
        y += 2;
      });

      // Risk Alerts
      addSection("RISK ALERTS");
      briefing!.risk_alerts.forEach((r: any) => {
        if (y > 270) { pdf.addPage(); y = 20; pdf.setFillColor(2, 8, 23); pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F"); }
        addText(`[${r.severity}] ${r.title}`, 14, 9, r.severity === "HIGH" ? [239, 68, 68] : [245, 158, 11]);
        addText(r.description, 18, 8, [150, 150, 150], pageWidth - 36);
        addText(`Mitigation: ${r.mitigation}`, 18, 8, [200, 170, 80], pageWidth - 36);
        y += 2;
      });

      // Footer
      if (y > 270) { pdf.addPage(); y = 20; pdf.setFillColor(2, 8, 23); pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F"); }
      y += 6;
      pdf.setFontSize(7);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated by BriefAI Premium on ${new Date().toLocaleString("en-IN")}`, 10, y);

      pdf.save(`BriefAI-Briefing-${briefing!.date}.pdf`);
      addToast("PDF exported successfully!", "success");
    } catch (err) {
      console.error("PDF export failed:", err);
      addToast("PDF export failed", "error");
    }
  };

  const exportExcel = async () => {
    try {
      addToast("Generating Excel...", "info");
      const XLSX = await import("xlsx");

      const summaryData = [
        ["BriefAI Export", briefing!.date],
        ["Generated At", briefing!.generated_at],
        [""],
        ["MARKET PULSE"],
        ["Decision", briefing!.market_pulse.decision],
        ["Sentiment Score", briefing!.market_pulse.sentiment_score],
        ["NIFTY Trend", briefing!.market_pulse.nifty_trend],
        ["Confidence", briefing!.market_pulse.confidence],
        [""],
        ["TOP SECTORS"],
        ["Sector", "Signal", "Momentum", "Reason"],
        ...briefing!.top_sectors.map((s: any) => [s.name, s.signal, s.momentum, s.reason]),
        [""],
        ["BUSINESS OPPORTUNITIES"],
        ["Title", "Urgency", "Description", "Action"],
        ...briefing!.business_opportunities.map((o: any) => [o.title, o.urgency, o.description, o.action]),
        [""],
        ["RISK ALERTS"],
        ["Title", "Severity", "Description", "Mitigation"],
        ...briefing!.risk_alerts.map((r: any) => [r.title, r.severity, r.description, r.mitigation]),
      ];

      const ws = XLSX.utils.aoa_to_sheet(summaryData);
      ws["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 40 }, { wch: 40 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Briefing");
      XLSX.writeFile(wb, `BriefAI-${briefing!.date}.xlsx`);
      addToast("Excel exported successfully!", "success");
    } catch (err) {
      console.error("Excel export failed:", err);
      addToast("Excel export failed", "error");
    }
  };

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
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 relative z-10" id="briefing-content">
        
        {/* Export Buttons Row */}
        <motion.div variants={itemVariants} style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", flexWrap: "wrap" }}>
          {isPremium ? (
            <>
              <button
                onClick={exportPDF}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.12)"; }}
              >
                <FileText size={14} /> Export PDF
              </button>
              <button
                onClick={exportExcel}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  color: "#34d399",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.12)"; }}
              >
                <TableProperties size={14} /> Export Excel
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/pricing")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.3)",
                color: "#fbbf24",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.2)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.12)"; }}
            >
              <Crown size={14} /> Export (Premium)
            </button>
          )}
        </motion.div>

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

        {/* Deep Analysis — Premium Only */}
        <motion.div variants={itemVariants}>
          <PremiumGate feature="Get deeper AI market analysis with detailed reasoning and historical pattern comparison">
            <div className="glass-card p-6">
              <SectionHeader title="Deep AI Analysis" icon={BrainCircuit} />
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[rgba(139,92,246,0.05)]">
                  <h4 className="font-bold text-sm text-[var(--accent-violet-light)] mb-2">📊 Decision Reasoning</h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Detailed AI reasoning behind the {briefing.market_pulse.decision} signal based on 20-day historical pattern comparison, 
                    sector rotation analysis, and global macro indicators.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[rgba(16,185,129,0.05)]">
                  <h4 className="font-bold text-sm text-emerald-400 mb-2">📈 Risk-Adjusted Return Estimate</h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    AI-powered return projections with risk scenarios for your investment horizon.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[rgba(245,158,11,0.05)]">
                  <h4 className="font-bold text-sm text-amber-400 mb-2">🔍 Historical Pattern Match</h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Similar market patterns from the past 5 years and their outcomes to help predict likely movements.
                  </p>
                </div>
              </div>
            </div>
          </PremiumGate>
        </motion.div>

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
