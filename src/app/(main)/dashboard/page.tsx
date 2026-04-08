"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Loader2, TrendingDown, TrendingUp, Zap } from "lucide-react";
import AnimatedGrid from "@/components/AnimatedGrid";
import NiftyChart from "@/components/NiftyChart";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { getUserPortfolio, PortfolioItem } from "@/lib/firebaseClient";
import { useEffect } from "react";
import { t } from "@/lib/i18n";

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
    <div className="stat-card flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2 overflow-hidden">
        <span className="text-xs font-semibold tracking-wider uppercase truncate" style={{ color: "var(--text-muted)" }}>{title}</span>
        {outlook && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0" style={{
            color: outlook === "UP" || outlook === "STRENGTHENING" ? "#10b981" : outlook === "DOWN" || outlook === "WEAKENING" ? "#ef4444" : "#f59e0b",
            borderColor: "currentColor",
            background: "rgba(255,255,255,0.03)",
          }}>{outlook}</span>
        )}
      </div>
      <div className="flex items-end gap-3">
        <span className="mono text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          {price != null ? `${unit}${price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "N/A"}
        </span>
        {change != null && (
          <div className="flex items-center gap-1 mb-0.5" style={{ color }}>
            <TrendIcon size={12} />
            <span className="mono text-xs font-semibold">
              {changePct != null ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%` : `${change >= 0 ? "+" : ""}${change.toFixed(2)}`}
            </span>
          </div>
        )}
      </div>
      {insight && <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{insight}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { briefing, marketData, loading, running, handleRunNow, widgets, language } = useData();
  const [activeTab, setActiveTab] = useState<"6month" | "1year" | "3month" | "1month">("6month");
  const [chartMode, setChartMode] = useState<"line" | "candle">("line");
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const i = t(language);

  useEffect(() => {
    if (user) {
      getUserPortfolio(user.uid).then(setPortfolioItems);
    }
  }, [user]);

  const totalPortfolioValue = portfolioItems.reduce((acc, item) => acc + (item.shares * (item.currentPrice || item.avgPrice)), 0);

  if (!user && !authLoading) return null;

  if (loading || authLoading) {
    return (
      <div className="relative">
        <AnimatedGrid />
        <LoadingSkeleton />
      </div>
    );
  }

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? i.goodMorning : currentHour < 18 ? i.goodAfternoon : i.goodEvening;
  const temporalWord = currentHour < 12 ? "morning" : currentHour < 18 ? "afternoon" : "evening";

  const spot = marketData?.spot;
  let niftyData = marketData?.nifty?.historical ?? [];
  if (activeTab === "1month") niftyData = niftyData.slice(-21);
  else if (activeTab === "3month") niftyData = niftyData.slice(-63);
  else if (activeTab === "6month") niftyData = niftyData.slice(-126);
  else if (activeTab === "1year") niftyData = niftyData.slice(-252);
  
  const niftyPrice = marketData?.nifty?.current_price;
  const niftyStart = niftyData.length > 1 ? niftyData[0].close : undefined;
  const niftyChangePct = marketData?.nifty?.change_percent !== undefined ? marketData.nifty.change_percent : (niftyPrice && niftyStart ? ((niftyPrice - niftyStart) / niftyStart) * 100 : null);
  const niftyIsUp = (niftyChangePct ?? 0) >= 0;

  return (
    <>
      <AnimatedGrid />
      <div className="mb-6 relative z-10">
        <h1 className="text-3xl font-bold display-font text-white">{greeting}, {user?.displayName || "CEO"}!</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{i.intelligenceOverview}</p>
      </div>

      {!briefing ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 relative z-10"
        >
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(109,40,217,0.1))",
            border: "1px solid rgba(139,92,246,0.3)",
            boxShadow: "0 0 40px rgba(139,92,246,0.2)",
          }}>
            <BrainCircuit size={38} style={{ color: "var(--accent-violet-light)" }} />
          </div>
          <h2 className="display-font text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{i.noBriefingYet}</h2>
          <p className="text-base max-w-md text-center" style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>
            Initialize the AI engine to sweep Indian markets, aggregate global news, and generate your CEO briefing.
          </p>
          <button
            onClick={handleRunNow} disabled={running}
            className="btn-primary flex items-center gap-3 px-8 py-4 text-sm mt-4"
          >
            {running ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
            <span>{running ? i.generating : i.generateFirstBriefing}</span>
          </button>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5 relative z-10">
          
          {widgets.find(w => w.id === 'executive_summary')?.active !== false && (
            <motion.div variants={itemVariants} className="glass-card p-5 relative overflow-hidden" style={{ borderLeft: "3px solid var(--accent-violet)" }}>
              <div className="gradient-mesh opacity-20" />
              <div className="relative z-10">
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--accent-violet-light)] mb-2">{i.executiveSummary}</div>
                <p className="text-sm leading-relaxed text-[var(--text-primary)]">{briefing.executive_summary}</p>
              </div>
            </motion.div>
          )}

          {widgets.find(w => w.id === 'market_pulse')?.active !== false && (
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-w-0 w-full">
              <div className="stat-card min-w-0">
                 <div className="text-xs text-[var(--text-muted)] mb-1 truncate">NIFTY 50</div>
                 <div className="mono text-xl font-bold truncate">₹{marketData?.nifty?.current_price?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
              </div>
              <div className="stat-card min-w-0">
                 <div className="text-xs text-[var(--text-muted)] mb-1 truncate">SENSEX</div>
                 <div className="mono text-xl font-bold truncate">₹{marketData?.sensex?.current_price?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
              </div>
              <div className="stat-card min-w-0">
                 <div className="text-xs text-[var(--text-muted)] mb-1 truncate">{i.sentiment}</div>
                 <div className="mono text-xl font-bold text-[var(--accent-violet-light)] truncate">{briefing.market_pulse.sentiment_score * 100}pt</div>
              </div>
              <div className="stat-card min-w-0">
                 <div className="text-xs text-[var(--text-muted)] mb-1 truncate">{i.topSector}</div>
                 <div className="mono text-base font-bold line-clamp-1">{briefing.top_sectors[0]?.name}</div>
              </div>
            </motion.div>
          )}

          {widgets.find(w => w.id === 'market_pulse')?.active !== false && (
            <motion.div variants={itemVariants} id="market">
              <div className="glass-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: "var(--text-muted)" }}>
                      NIFTY 50 Index
                    </div>
                    <div className="flex items-end gap-3">
                      <span className="mono text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                        {niftyPrice ? `₹${niftyPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "Loading…"}
                      </span>
                      {niftyChangePct !== null && (
                        <span
                          className="mono text-sm font-semibold mb-1 flex items-center gap-1"
                          style={{ color: niftyIsUp ? "#10b981" : "#ef4444" }}
                        >
                          {niftyIsUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {niftyIsUp ? "+" : ""}{niftyChangePct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="time-tabs">
                    {(["1year", "6month", "3month", "1month"] as const).map((tab) => (
                      <button
                        key={tab}
                        className={`time-tab ${activeTab === tab ? "active" : ""}`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab === "1year" ? "1 yr" : tab === "6month" ? "6 mo" : tab === "3month" ? "3 mo" : "1 mo"}
                      </button>
                    ))}
                  </div>
                </div>
                {niftyData.length > 0 ? (
                  <NiftyChart data={niftyData} name="NIFTY 50" mode={chartMode} onModeChange={setChartMode} />
                ) : (
                  <div className="h-52 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
                    {i.chartUnavailable}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="promo-card">
              <div className="relative z-10">
                <h3 className="display-font text-xl font-bold mb-2" style={{ color: "white" }}>
                  {i.generateNewIntelligence}
                </h3>
                <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.55)", lineHeight: "1.6" }}>
                  {i.runAIPipeline}
                </p>
                <button
                  onClick={handleRunNow}
                  className="w-full py-2.5 text-sm font-semibold rounded-xl transition-all"
                  style={{ background: "white", color: "#1a0a40", border: "none", cursor: "pointer" }}
                >
                  {running ? i.generating : i.refreshBriefing}
                </button>
              </div>
            </div>
            {widgets.find(w => w.id === 'commodities')?.active !== false && (
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <CommodityCard
                  title="Gold (XAU/USD)"
                  price={spot?.gold?.price}
                  change={spot?.gold?.change}
                  changePct={spot?.gold?.change_percent}
                  outlook={briefing.commodities?.gold?.outlook}
                  insight={briefing.commodities?.gold?.insight}
                  unit="$"
                />
                <CommodityCard
                  title="Crude Oil (WTI)"
                  price={spot?.crude_oil?.price}
                  change={spot?.crude_oil?.change}
                  changePct={spot?.crude_oil?.change_percent}
                  outlook={briefing.commodities?.crude_oil?.outlook}
                  insight={briefing.commodities?.crude_oil?.insight}
                  unit="$"
                />
                <CommodityCard
                  title="USD / INR"
                  price={spot?.usd_inr?.price}
                  change={spot?.usd_inr?.change}
                  changePct={spot?.usd_inr?.change_percent}
                  outlook={briefing.commodities?.usd_inr?.outlook}
                  insight={briefing.commodities?.usd_inr?.insight}
                  unit="₹"
                />
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {widgets.find(w => w.id === 'opportunities')?.active !== false && (
              <motion.div variants={itemVariants} className="glass-card p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">{i.todaysFocus}</div>
                <div className="space-y-3">
                  {briefing.business_opportunities.slice(0, 2).map((opp: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] mt-1.5" />
                      <div className="text-sm font-medium text-[var(--text-primary)]">{opp.title}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {widgets.find(w => w.id === 'portfolio')?.active !== false && (
              <motion.div variants={itemVariants} className="glass-card p-5 border-l-4 border-[var(--accent-green)]">
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">{i.portfolioSummary}</div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">₹{totalPortfolioValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                    <div className="text-xs text-[var(--accent-green)] font-medium mt-1">
                      {portfolioItems.length} {i.activeHoldings}
                    </div>
                  </div>
                  <TrendingUp className="text-[var(--accent-green)] opacity-50" size={32} />
                </div>
              </motion.div>
            )}

            {widgets.find(w => w.id === 'vc_funding')?.active !== false && (
              <motion.div variants={itemVariants} className="glass-card p-5 md:col-span-2">
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">{i.globalImpact}</div>
                <p className="text-sm line-clamp-2 text-[var(--text-secondary)]">{briefing.world_impact.summary}</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}
