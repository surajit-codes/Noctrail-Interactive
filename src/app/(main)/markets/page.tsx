"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import AnimatedGrid from "@/components/AnimatedGrid";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import DualChart from "@/components/DualChart";
import { useData } from "@/context/DataContext";
import GlassCard from "@/components/GlassCard";
import { TrendingDown, TrendingUp, BarChart3, Crosshair, ArrowRight } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import SignalBadge from "@/components/SignalBadge";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

function CommodityCard({ title, price, change, changePct, outlook, insight, unit = "" }: any) {
  const isUp = (change ?? 0) >= 0;
  const color = isUp ? "#10b981" : "#ef4444";
  const TrendIcon = isUp ? TrendingUp : TrendingDown;

  return (
    <div className="stat-card flex flex-col gap-2 relative overflow-hidden group">
      <div className="flex items-center justify-between z-10 relative">
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>{title}</span>
        {outlook && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full border" style={{
            color: outlook === "UP" || outlook === "STRENGTHENING" ? "#10b981" : outlook === "DOWN" || outlook === "WEAKENING" ? "#ef4444" : "#f59e0b",
            borderColor: "currentColor",
            background: "rgba(255,255,255,0.03)",
          }}>{outlook}</span>
        )}
      </div>
      <div className="flex items-end gap-3 z-10 relative">
        <span className="mono text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {price != null ? `${unit}${price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "N/A"}
        </span>
        {change != null && (
          <div className="flex items-center gap-1 mb-1" style={{ color }}>
            <TrendIcon size={14} />
            <span className="mono text-sm font-semibold">
              {changePct != null ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%` : `${change >= 0 ? "+" : ""}${change.toFixed(2)}`}
            </span>
          </div>
        )}
      </div>
      {insight && <p className="text-xs leading-relaxed mt-1 z-10 relative" style={{ color: "var(--text-secondary)" }}>{insight}</p>}
      
      {/* Abstract Sparkline Representation */}
      <div className="absolute -bottom-4 -right-4 w-32 h-20 opacity-20 group-hover:opacity-40 transition-opacity" style={{ 
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: "blur(15px)"
      }} />
    </div>
  );
}

export default function MarketsPage() {
  const { marketData, briefing, loading } = useData();
  const [activeTab, setActiveTab] = useState<"6month" | "1year" | "3month" | "1month">("6month");

  if (loading || !marketData) {
    return (
      <div className="relative">
        <AnimatedGrid />
        <LoadingSkeleton />
      </div>
    );
  }

  // Dual Chart Data Filtering
  let niftyData = marketData?.nifty?.historical ?? [];
  let sensexData = marketData?.sensex?.historical ?? [];
  
  if (activeTab === "1month") {
    niftyData = niftyData.slice(-21);
    sensexData = sensexData.slice(-21);
  } else if (activeTab === "3month") {
    niftyData = niftyData.slice(-63);
    sensexData = sensexData.slice(-63);
  } else if (activeTab === "6month") {
    niftyData = niftyData.slice(-126);
    sensexData = sensexData.slice(-126);
  } else if (activeTab === "1year") {
    niftyData = niftyData.slice(-252);
    sensexData = sensexData.slice(-252);
  }

  const spot = marketData?.spot;

  return (
    <>
      <AnimatedGrid />
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 relative z-10">
        
        {/* Dual Chart Area */}
        <motion.div variants={itemVariants}>
          <div className="glass-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
              <div>
                <SectionHeader title="Index Comparison" icon={BarChart3} />
                <h2 className="display-font text-xl font-bold mt-1 text-white">NIFTY 50 vs SENSEX</h2>
              </div>
              <div className="time-tabs">
                {(["1year", "6month", "3month", "1month"] as const).map((tab) => (
                  <button
                    key={tab}
                    className={`time-tab ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "1year" ? "1 year" : tab === "6month" ? "6 month" : tab === "3month" ? "3 month" : "1 month"}
                  </button>
                ))}
              </div>
            </div>
            
            <DualChart 
              data1={niftyData} 
              data2={sensexData} 
              name1="NIFTY 50" 
              name2="SENSEX" 
              color1="var(--accent-violet)" 
              color2="var(--accent-green)" 
            />
            
            <div className="flex flex-wrap items-center gap-6 mt-6 pt-4 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--accent-violet)] shadow-[0_0_10px_var(--accent-violet)]" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">NIFTY: <span className="font-mono">₹{marketData?.nifty?.current_price?.toLocaleString()}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--accent-green)] shadow-[0_0_10px_var(--accent-green)]" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">SENSEX: <span className="font-mono">₹{marketData?.sensex?.current_price?.toLocaleString()}</span></span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Commodities */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CommodityCard
            title="Gold (XAU/USD)"
            price={spot?.gold?.price}
            change={spot?.gold?.change}
            changePct={spot?.gold?.change_percent}
            outlook={briefing?.commodities?.gold?.outlook}
            insight={briefing?.commodities?.gold?.insight}
            unit="$"
          />
          <CommodityCard
            title="Crude Oil (WTI)"
            price={spot?.crude_oil?.price}
            change={spot?.crude_oil?.change}
            changePct={spot?.crude_oil?.change_percent}
            outlook={briefing?.commodities?.crude_oil?.outlook}
            insight={briefing?.commodities?.crude_oil?.insight}
            unit="$"
          />
          <CommodityCard
            title="USD / INR"
            price={spot?.usd_inr?.price}
            change={spot?.usd_inr?.change}
            changePct={spot?.usd_inr?.change_percent}
            outlook={briefing?.commodities?.usd_inr?.outlook}
            insight={briefing?.commodities?.usd_inr?.insight}
            unit="₹"
          />
        </motion.div>

        {/* Sector Performance and Key Levels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Support/Resistance */}
          {briefing?.market_pulse?.key_levels && (
            <motion.div variants={itemVariants}>
              <GlassCard title="Technical Levels (NIFTY)" icon={Crosshair}>
                <div className="flex flex-col h-full justify-center space-y-8 py-4">
                  
                  <div className="relative p-6 rounded-2xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.05)] text-center">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--bg-secondary)] px-3 text-xs font-bold text-red-400 uppercase tracking-wider">Resistance</div>
                    <div className="mono text-3xl font-bold text-red-500 text-shadow-red">{briefing.market_pulse.key_levels.nifty_resistance}</div>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-[var(--accent-violet-light)]">
                    <ArrowRight size={20} className="rotate-90 opacity-50" />
                    <div className="px-4 py-2 rounded-xl bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)]">
                      <span className="mono font-bold">CMP: {marketData?.nifty?.current_price?.toFixed(0)}</span>
                    </div>
                    <ArrowRight size={20} className="rotate-90 opacity-50" />
                  </div>

                  <div className="relative p-6 rounded-2xl border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.05)] text-center">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--bg-secondary)] px-3 text-xs font-bold text-emerald-400 uppercase tracking-wider">Support</div>
                    <div className="mono text-3xl font-bold text-emerald-500 text-shadow-green">{briefing.market_pulse.key_levels.nifty_support}</div>
                  </div>

                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Sector Performance */}
          {briefing?.top_sectors && (
            <motion.div variants={itemVariants}>
              <GlassCard title="Sector Momentum" icon={BarChart3}>
                <div className="space-y-4">
                  {briefing.top_sectors.map((sector, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] transition-all hover:bg-[rgba(255,255,255,0.04)]">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-sm text-[var(--text-primary)]">{sector.name}</span>
                        <SignalBadge value={sector.signal} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-2">
                        Momentum: <strong className={sector.momentum === "STRONG" ? "text-green-400" : sector.momentum === "WEAK" ? "text-red-400" : "text-amber-400"}>{sector.momentum}</strong>
                      </div>
                      
                      {/* Fake performance bar based on signal/momentum to visualize "Sector performance chart" loosely */}
                      <div className="w-full h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ 
                          width: sector.momentum === 'STRONG' ? '85%' : sector.momentum === 'MODERATE' ? '50%' : '25%',
                          background: sector.signal === 'BUY' ? 'var(--accent-green)' : sector.signal === 'AVOID' ? 'var(--accent-red)' : 'var(--accent-amber)'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>

      </motion.div>
    </>
  );
}
