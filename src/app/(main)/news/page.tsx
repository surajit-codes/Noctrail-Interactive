"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import AnimatedGrid from "@/components/AnimatedGrid";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { useData } from "@/context/DataContext";
import { ExternalLink, Newspaper, BrainCircuit, Loader2 } from "lucide-react";
import { getSearchUrl } from "@/lib/utils";
import { t } from "@/lib/i18n";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

function NewsCard({ 
  headline, 
  source, 
  insight, 
  date, 
  tag,
  tagColor = "var(--accent-violet)",
  url
}: { 
  headline: string, source: string, insight: string, date?: string, tag: string, tagColor?: string, url?: string, readStoryLabel?: string 
}) {
  return (
    <div className="group glass-card p-5 h-full flex flex-col hover:bg-[rgba(255,255,255,0.06)] transition-all">
      <div className="flex justify-between items-start mb-3 gap-3">
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${tagColor}20`, color: tagColor, border: `1px solid ${tagColor}40` }}>
          {tag}
        </span>
        <span className="text-[10px] text-[var(--text-muted)] font-mono">{date || "Today"}</span>
      </div>
      
      <h3 className="font-bold text-[15px] leading-snug mb-2 text-[var(--text-primary)] group-hover:text-[var(--accent-violet-light)] transition-colors">
        {headline}
      </h3>
      
      <p className="text-xs text-[var(--text-muted)] mb-4 flex-1 line-clamp-3">
        {insight}
      </p>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-1.5 opacity-60">
          <Newspaper size={12} className="text-[var(--text-secondary)]" />
          <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase">{source}</span>
        </div>
        
        <a
          href={getSearchUrl(headline)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-semibold text-[var(--accent-violet-light)] group-hover:underline"
        >
          Read Story <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
}

export default function NewsPage() {
  const { briefing, loading, running, handleRunNow, language } = useData();
  const [activeTab, setActiveTab] = useState<"business" | "world" | "vc">("business");
  const i = t(language);

  // Auto refresh every 30 minutes (30 * 60 * 1000 ms = 1,800,000 ms)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!running) {
        handleRunNow();
      }
    }, 1800000);
    return () => clearInterval(timer);
  }, [running, handleRunNow]);

  if (loading || !briefing) {
    return (
      <div className="relative">
        <AnimatedGrid />
        <LoadingSkeleton />
      </div>
    );
  }

  // Map briefing items to news cards
  const businessNews = briefing.business_opportunities.map(opp => ({
    id: opp.title,
    headline: opp.title,
    source: "BriefAI Engine",
    insight: opp.description,
    tag: opp.urgency,
    tagColor: opp.urgency === "HIGH" ? "#10b981" : opp.urgency === "MEDIUM" ? "#f59e0b" : "#8b5cf6",
    url: opp.url
  }));

  const worldNews = briefing.world_impact.key_events.map(event => ({
    id: event.event,
    headline: event.event,
    source: "Global Sweep",
    insight: "Automated analysis of global macroeconomic conditions affecting this sector.",
    tag: event.impact,
    tagColor: event.impact === "POSITIVE" ? "#10b981" : event.impact === "NEGATIVE" ? "#ef4444" : "#06b6d4",
    url: event.url
  }));

  const vcNews = briefing.vc_funding_highlights.map(vc => ({
    id: `${vc.company}-${vc.amount}`,
    headline: `${vc.company} raises ${vc.amount} in latest funding round`,
    source: "Venture Scanner",
    insight: vc.insight,
    tag: vc.sector,
    tagColor: "#a78bfa", // Let's use light violet for all sectors
    url: vc.url
  }));

  return (
    <>
      <AnimatedGrid />
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 relative z-10">
        
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit size={16} className="text-[var(--accent-violet-light)]" />
              <span className="text-[10px] font-bold text-[var(--accent-violet-light)] uppercase tracking-widest">
                {i.aiCuratedFeed}
              </span>
            </div>
            {running && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] animate-pulse">
                <Loader2 size={12} className="animate-spin" /> Fetching latest updates...
              </div>
            )}
          </div>

          <div className="flex items-center bg-[rgba(255,255,255,0.05)] border border-[var(--border-subtle)] p-1 rounded-xl">
            {(["business", "world", "vc"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === tab 
                  ? "bg-[rgba(139,92,246,0.2)] text-[var(--accent-violet-light)] shadow-[0_0_12px_rgba(139,92,246,0.15)]" 
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.03)]"
                }`}
              >
                {tab === "business" ? i.business : tab === "world" ? i.world : i.vcFunding}
              </button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <motion.div 
          key={activeTab} // Forces re-animation when tab changes
          variants={containerVariants} 
          initial="hidden" 
          animate="visible" 
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          {activeTab === "business" && businessNews.map(news => (
            <motion.div key={news.id} variants={itemVariants} className="h-full">
              <NewsCard {...news} />
            </motion.div>
          ))}

          {activeTab === "world" && worldNews.map(news => (
            <motion.div key={news.id} variants={itemVariants} className="h-full">
              <NewsCard {...news} />
            </motion.div>
          ))}

          {activeTab === "vc" && vcNews.map(news => (
            <motion.div key={news.id} variants={itemVariants} className="h-full">
              <NewsCard {...news} />
            </motion.div>
          ))}
        </motion.div>

        {/* Fallback if empty */}
        {((activeTab === "business" && businessNews.length === 0) || 
          (activeTab === "world" && worldNews.length === 0) || 
          (activeTab === "vc" && vcNews.length === 0)) && (
          <div className="py-12 text-center text-[var(--text-muted)] text-sm border border-dashed border-[var(--border-subtle)] rounded-2xl">
            No items found in this category for today's sweep.
          </div>
        )}

      </motion.div>
    </>
  );
}
