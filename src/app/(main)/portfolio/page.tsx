"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import AnimatedGrid from "@/components/AnimatedGrid";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import PremiumGate from "@/components/PremiumGate";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { getUserPortfolio, updateUserPortfolio, PortfolioItem } from "@/lib/firebaseClient";
import { Briefcase, Plus, TrendingDown, TrendingUp, X, BrainCircuit, Star, ShieldCheck, Coins, Minus, Calculator, Sparkles, Award, AlertTriangle, PieChart as PieChartIcon } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function PortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const { marketData, briefing, addToast } = useData();
  
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [newSymbol, setNewSymbol] = useState("");
  const [newName, setNewName] = useState("");
  const [newShares, setNewShares] = useState("");
  const [newPrice, setNewPrice] = useState("");
  
  // Simulator State
  const [simYears, setSimYears] = useState(10);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    
    getUserPortfolio(user.uid).then(data => {
      const updated = data.map(item => ({
        ...item,
        currentPrice: item.currentPrice || (item.avgPrice * (1 + (Math.random() * 0.1 - 0.05)))
      }));
      setItems(updated);
      setLoading(false);
    });
  }, [user, authLoading]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const sharesNum = parseFloat(newShares);
    const priceNum = parseFloat(newPrice);
    
    if (!newSymbol || isNaN(sharesNum) || isNaN(priceNum)) return;
    
    setIsSaving(true);
    const newItem: PortfolioItem = {
      id: newSymbol.toUpperCase(),
      name: newName || newSymbol.toUpperCase(),
      shares: sharesNum,
      avgPrice: priceNum,
      currentPrice: priceNum
    };
    
    const updated = [...items, newItem];
    try {
      await updateUserPortfolio(user.uid, updated);
      setItems(updated);
      setIsModalOpen(false);
      addToast("Stock added to portfolio", "success");
      
      setNewSymbol(""); setNewName(""); setNewShares(""); setNewPrice("");
    } catch (err) {
      addToast("Failed to save portfolio", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const adjustStockShares = async (id: string, delta: number) => {
    if (!user) return;
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;
    
    const newShares = Math.max(0, targetItem.shares + delta);
    
    let updated;
    if (newShares === 0) {
      updated = items.filter(i => i.id !== id);
    } else {
      updated = items.map(item => item.id === id ? { ...item, shares: newShares } : item);
    }
    
    try {
      await updateUserPortfolio(user.uid, updated);
      setItems(updated);
      // Only toast on removal to avoid spamming the user when clicking '+' rapidly
      if (newShares === 0) {
        addToast("Stock removed", "info");
      }
    } catch(err) {
      addToast("Failed to update holdings", "error");
    }
  };

  const removeStock = async (id: string) => {
    if (!user) return;
    const updated = items.filter(i => i.id !== id);
    try {
      await updateUserPortfolio(user.uid, updated);
      setItems(updated);
      addToast("Stock removed", "info");
    } catch(err) {
      addToast("Failed to remove stock", "error");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="relative">
        <AnimatedGrid />
        <LoadingSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <AnimatedGrid />
        <h2 className="display-font text-2xl font-bold text-white">Log in to view Portfolio</h2>
      </div>
    );
  }

  // Calculations
  const totalValue = items.reduce((acc, item) => acc + (item.shares * item.currentPrice), 0);
  const totalCost = items.reduce((acc, item) => acc + (item.shares * item.avgPrice), 0);
  const totalPandL = totalValue - totalCost;
  const totalPandLPct = totalCost > 0 ? (totalPandL / totalCost) * 100 : 0;
  
  const isUp = totalPandL >= 0;

  // Simulator & Gamification Calcs
  const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#34d399', '#10b981', '#f59e0b', '#f87171'];
  const chartData = items.map(item => ({
    name: item.id,
    value: item.shares * item.currentPrice
  })).sort((a, b) => b.value - a.value);

  const mockDividendYield = 0.015; // 1.5% average dividend yield
  const estAnnualDividend = totalValue * mockDividendYield;
  
  const assumedReturnRate = 0.15; // 15% CAGR
  const futureValue = totalValue * Math.pow(1 + assumedReturnRate, simYears);

  // Find top and worst performers
  const performanceData = items.map(item => {
    const cost = item.shares * item.avgPrice;
    const value = item.shares * item.currentPrice;
    const pnlPct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
    return { ...item, pnlPct };
  }).filter(item => item.shares > 0);

  const topPerformer = performanceData.length > 0 
    ? performanceData.reduce((prev, curr) => (curr.pnlPct > prev.pnlPct ? curr : prev))
    : null;
    
  const worstPerformer = performanceData.length > 0 
    ? performanceData.reduce((prev, curr) => (curr.pnlPct < prev.pnlPct ? curr : prev))
    : null;

  return (
    <>
      <AnimatedGrid />
      <div className="space-y-6 relative z-10">

        {/* Live Market Trends */}
        {marketData && (
          <div className="flex gap-3 overflow-x-auto pb-1 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {[
              { 
                label: "NIFTY 50", 
                price: marketData.nifty?.current_price, 
                pct: marketData.nifty?.historical && marketData.nifty.historical.length > 1 ? ((marketData.nifty.current_price - marketData.nifty.historical[marketData.nifty.historical.length-2].close) / marketData.nifty.historical[marketData.nifty.historical.length-2].close) * 100 : 0
              },
              { 
                label: "SENSEX", 
                price: marketData.sensex?.current_price, 
                pct: marketData.sensex?.historical && marketData.sensex.historical.length > 1 ? ((marketData.sensex.current_price - marketData.sensex.historical[marketData.sensex.historical.length-2].close) / marketData.sensex.historical[marketData.sensex.historical.length-2].close) * 100 : 0
              },
              { label: "GOLD", price: marketData.spot?.gold?.price, pct: marketData.spot?.gold?.change_percent },
              { label: "USD/INR", price: marketData.spot?.usd_inr?.price, pct: marketData.spot?.usd_inr?.change_percent },
              { label: "CRUDE", price: marketData.spot?.crude_oil?.price, pct: marketData.spot?.crude_oil?.change_percent }
            ].map((trend, i) => {
              if (!trend.price) return null;
              const isUp = trend.pct >= 0;
              return (
                <div key={i} className="glass-card px-4 py-2.5 flex items-center justify-between gap-6 min-w-max snap-start border-l-2 bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.03)] transition-colors" style={{ borderColor: isUp ? '#10b981' : '#ef4444' }}>
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-0.5">{trend.label}</div>
                    <div className="mono text-white text-sm font-bold flex items-center gap-1.5">
                      {isUp ? <TrendingUp size={12} className="text-emerald-400" /> : <TrendingDown size={12} className="text-red-400" />}
                      {trend.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  {trend.pct !== undefined && trend.pct !== null && (
                    <div className={`text-xs font-bold mono bg-[rgba(0,0,0,0.2)] px-2 py-1 rounded ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isUp ? '+' : ''}{trend.pct.toFixed(2)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Header / Summary / Visuals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 flex flex-col justify-between border-l-4 lg:col-span-2" style={{ borderColor: isUp ? "#10b981" : "#ef4444" }}>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
              <div>
                <div className="text-sm font-semibold tracking-wider uppercase text-[var(--text-muted)] mb-1">Total Portfolio Value</div>
                <div className="flex items-end gap-4">
                  <span className="mono text-4xl sm:text-5xl font-bold text-white">₹{totalValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                  <div className="flex flex-col mb-1.5">
                    <span className="mono text-lg font-bold flex items-center gap-1" style={{ color: isUp ? "#10b981" : "#ef4444" }}>
                      {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {isUp ? "+" : ""}₹{Math.abs(totalPandL).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      ({isUp ? "+" : ""}{totalPandLPct.toFixed(2)}%) All time
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5 whitespace-nowrap"
              >
                <Plus size={16} /> Add Stock
              </button>
            </div>
            
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-[var(--border-subtle)] pt-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] group hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                <div className="p-2.5 rounded-lg bg-[rgba(139,92,246,0.1)] text-[var(--accent-violet-light)] group-hover:scale-110 transition-transform">
                  <Coins size={20} />
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-0.5">Est. Annual Dividend</div>
                  <div className="mono font-bold text-lg text-white">₹{estAnnualDividend.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                </div>
              </div>

              {topPerformer && items.length > 0 ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] group hover:bg-[rgba(255,255,255,0.04)] transition-colors overflow-hidden">
                  <div className="p-2.5 rounded-lg bg-[rgba(16,185,129,0.1)] text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0">
                    <Award size={20} />
                  </div>
                  <div className="w-full min-w-0">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-0.5">Top Performer</div>
                    <div className="flex items-baseline justify-between gap-2 w-full">
                      <div className="font-bold text-sm text-white truncate">{topPerformer.id}</div>
                      <div className="mono text-xs font-bold text-emerald-400 flex-shrink-0">+{topPerformer.pnlPct.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              ) : null}

              {worstPerformer && worstPerformer.pnlPct < 0 ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] group hover:bg-[rgba(255,255,255,0.04)] transition-colors overflow-hidden">
                  <div className="p-2.5 rounded-lg bg-[rgba(239,68,68,0.1)] text-red-500 group-hover:scale-110 transition-transform flex-shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="w-full min-w-0">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-0.5">Needs Attention</div>
                    <div className="flex items-baseline justify-between gap-2 w-full">
                      <div className="font-bold text-sm text-white truncate">{worstPerformer.id}</div>
                      <div className="mono text-xs font-bold text-red-400 flex-shrink-0">{worstPerformer.pnlPct.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          
          <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[200px] relative">
            <h3 className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-2 absolute top-6 left-6">Asset Allocation</h3>
            {items.length > 0 ? (
              <div className="w-full h-[160px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: any) => `₹${Number(value).toLocaleString("en-IN", {maximumFractionDigits:0})}`}
                      contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                      itemStyle={{ color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-sm text-[var(--text-muted)] text-center flex flex-col items-center gap-3 opacity-50">
                <PieChartIcon size={32} />
                Add stocks to see allocation
              </div>
            )}
          </div>
        </div>

        {/* Wealth Simulator Widget */}
        <div className="glass-card p-6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-violet)] rounded-full blur-[120px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"></div>
          <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[rgba(16,185,129,0.1)] text-emerald-400">
                <Calculator size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">Wealth Simulator <Sparkles size={14} className="text-amber-400" /></h3>
                <p className="text-xs text-[var(--text-secondary)]">Project your future wealth assuming a 15% historical CAGR.</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-center bg-[rgba(255,255,255,0.01)] p-6 rounded-2xl border border-[var(--border-subtle)]">
            <div className="w-full md:w-2/3">
              <div className="flex justify-between text-xs text-white font-bold uppercase tracking-wider mb-4">
                <span>Hold for {simYears} Year{simYears > 1 ? 's' : ''}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="30" 
                value={simYears}
                onChange={(e) => setSimYears(parseInt(e.target.value))}
                className="w-full h-2.5 bg-[rgba(255,255,255,0.1)] rounded-full appearance-none cursor-pointer accent-[var(--accent-violet-light)] outline-none"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-3 font-bold uppercase tracking-wider">
                <span>1 Yr</span>
                <span>15 Yrs</span>
                <span>30 Yrs</span>
              </div>
            </div>
            
            <div className="w-full md:w-1/3 bg-[rgba(16,185,129,0.08)] border border-emerald-500/30 p-5 rounded-2xl text-center shadow-[0_0_20px_rgba(16,185,129,0.05)]">
              <div className="text-[10px] text-emerald-400/80 uppercase font-bold tracking-wider mb-1.5">Projected Future Value</div>
              <div className="mono text-2xl md:text-3xl font-bold text-emerald-400">
                ₹{futureValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>

        {/* Holdings Table */}
        <div className="glass-card p-6">
          <SectionHeader title="Your Holdings" icon={Briefcase} />
          
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="pb-3 text-xs font-semibold uppercase text-[var(--text-muted)]">Asset</th>
                  <th className="pb-3 text-xs font-semibold uppercase text-[var(--text-muted)] text-right">Shares</th>
                  <th className="pb-3 text-xs font-semibold uppercase text-[var(--text-muted)] text-right">Avg Price</th>
                  <th className="pb-3 text-xs font-semibold uppercase text-[var(--text-muted)] text-right">LTP</th>
                  <th className="pb-3 text-xs font-semibold uppercase text-[var(--text-muted)] text-right">P&L</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {items.map(item => {
                  const currentValue = item.shares * item.currentPrice;
                  const itemCost = item.shares * item.avgPrice;
                  const pnl = currentValue - itemCost;
                  const pnlPct = (pnl / itemCost) * 100;
                  const itemIsUp = pnl >= 0;

                  return (
                    <tr key={item.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                      <td className="py-4">
                        <div className="font-bold text-[var(--text-primary)]">{item.id}</div>
                        <div className="text-xs text-[var(--text-muted)]">{item.name}</div>
                      </td>
                      <td className="py-4 text-right mono text-white">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => adjustStockShares(item.id, -1)} className="w-6 h-6 rounded bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(239,68,68,0.2)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 transition-colors">
                            <Minus size={12} strokeWidth={3} />
                          </button>
                          <span className="w-8 text-center">{item.shares}</span>
                          <button onClick={() => adjustStockShares(item.id, 1)} className="w-6 h-6 rounded bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(16,185,129,0.2)] flex items-center justify-center text-[var(--text-muted)] hover:text-emerald-400 transition-colors">
                            <Plus size={12} strokeWidth={3} />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 text-right mono text-[var(--text-secondary)]">₹{item.avgPrice.toLocaleString("en-IN")}</td>
                      <td className="py-4 text-right mono text-white">₹{item.currentPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                      <td className="py-4 text-right">
                        <div className="mono font-bold" style={{ color: itemIsUp ? "#10b981" : "#ef4444" }}>
                          {itemIsUp ? "+" : ""}₹{Math.abs(pnl).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs font-semibold" style={{ color: itemIsUp ? "#10b981" : "#ef4444" }}>
                          {itemIsUp ? "+" : ""}{pnlPct.toFixed(2)}%
                        </div>
                      </td>
                      <td className="py-4 text-right w-10">
                        <button 
                          onClick={() => removeStock(item.id)} 
                          className="text-[var(--text-muted)] hover:text-red-400 transition-opacity"
                          title="Remove from portfolio"
                          aria-label="Remove stock"
                        >
                          <X size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl mt-4 block w-full bg-[rgba(255,255,255,0.02)]">
                      No holdings in your portfolio. Click &quot;Add Stock&quot; to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Portfolio AI Advisor — Premium Only */}
        <PremiumGate feature="Get personalized AI investment advice based on your portfolio">
          <div className="glass-card p-6">
            <SectionHeader title="Portfolio AI Advisor" icon={BrainCircuit} />
            <div className="mt-4 space-y-4">
              <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[rgba(139,92,246,0.05)]">
                <h4 className="font-bold text-sm text-[var(--accent-violet-light)] mb-2">🤖 Personalized Advice</h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  AI analyzes your {items.length} holdings against today&apos;s market conditions to provide
                  personalized buy/hold/sell recommendations for each stock.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[rgba(16,185,129,0.05)]">
                <h4 className="font-bold text-sm text-emerald-400 mb-2">📊 Portfolio Rebalancing</h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  Smart suggestions to optimize your portfolio allocation based on current market trends
                  and risk profile.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[rgba(245,158,11,0.05)]">
                <h4 className="font-bold text-sm text-amber-400 mb-2">⚠️ Risk Assessment</h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  Real-time risk scoring for your entire portfolio with sector concentration warnings
                  and diversification suggestions.
                </p>
              </div>
            </div>
          </div>
        </PremiumGate>
        
        {/* Curated Expert Picks — Premium Only */}
        <PremiumGate feature="Access trusted, expert-curated stable wealth compounders">
          <div className="glass-card p-6">
            <SectionHeader title="Premium Stock Picks" icon={ShieldCheck} />
            <p className="text-sm text-[var(--text-secondary)] mt-2 mb-6">
              Handpicked, reliable large-cap stocks known for long-term stability and consistent growth. Highly recommended for building a safe core portfolio, similar to top picks on platforms like Groww and Upstox.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {[
                { symbol: "RELIANCE", name: "Reliance Ind.", price: "2950", desc: "Market leader in telecom & retail.", tag: "Bluechip" },
                { symbol: "HDFCBANK", name: "HDFC Bank", price: "1450", desc: "India's largest private sector bank.", tag: "Banking" },
                { symbol: "TCS", name: "Tata Consultancy", price: "4100", desc: "Top tier IT services with strong dividends.", tag: "Tech" },
                { symbol: "LT", name: "Larsen & Toubro", price: "3600", desc: "Infrastructure and defense giant.", tag: "Infra" },
                { symbol: "ITC", name: "ITC Limited", price: "420", desc: "FMCG conglomerate with high dividend yield.", tag: "FMCG" },
                { symbol: "BHARTIARTL", name: "Bharti Airtel", price: "1200", desc: "Leading telecom operator with strong ARPU.", tag: "Telecom" },
              ].map((stock) => (
                <div key={stock.symbol} className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition-colors relative overflow-hidden group flex flex-col justify-between">
                  <div>
                    <div className="absolute top-0 right-0 p-3">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-[rgba(139,92,246,0.15)] text-[var(--accent-violet-light)] border border-[rgba(139,92,246,0.3)] rounded-full">
                        {stock.tag}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-amber-400 fill-amber-400/20" />
                      <div className="font-bold text-lg text-[var(--text-primary)]">{stock.symbol}</div>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">{stock.name}</div>
                    <p className="text-xs text-[var(--text-secondary)] mt-4 leading-relaxed">
                      {stock.desc}
                    </p>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
                    <div>
                      <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-0.5">Est. Price</div>
                      <div className="mono text-sm text-white font-bold">₹{stock.price}</div>
                    </div>
                    <button 
                      onClick={() => {
                        setNewSymbol(stock.symbol);
                        setNewName(stock.name);
                        setNewPrice(stock.price);
                        setNewShares("10");
                        setIsModalOpen(true);
                        
                        // Scroll to top for the modal
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-xs bg-[var(--accent-violet)] hover:bg-[var(--accent-violet-light)] text-white font-bold py-2 px-3 rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-[var(--accent-violet)]/20"
                    >
                      <Plus size={14} /> Quick Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PremiumGate>
      </div>

      {/* Add Stock Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card w-full max-w-md p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white">
              <X size={20} />
            </button>
            <h3 className="display-font text-xl font-bold mb-6 text-white">Add to Portfolio</h3>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1.5 uppercase font-bold tracking-wider">Ticker Symbol</label>
                  <input required autoFocus value={newSymbol} onChange={e => setNewSymbol(e.target.value)} type="text" placeholder="e.g. RELIANCE" className="w-full bg-[rgba(255,255,255,0.05)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-violet)]" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1.5 uppercase font-bold tracking-wider">Company Name</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} type="text" placeholder="Reliance Ind." className="w-full bg-[rgba(255,255,255,0.05)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-violet)]" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1.5 uppercase font-bold tracking-wider">Shares</label>
                  <input required value={newShares} onChange={e => setNewShares(e.target.value)} type="number" step="any" placeholder="10" className="w-full bg-[rgba(255,255,255,0.05)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-violet)]" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1.5 uppercase font-bold tracking-wider">Avg Price (₹)</label>
                  <input required value={newPrice} onChange={e => setNewPrice(e.target.value)} type="number" step="any" placeholder="2500" className="w-full bg-[rgba(255,255,255,0.05)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent-violet)]" />
                </div>
              </div>
              
              <button disabled={isSaving} type="submit" className="w-full btn-primary py-3 flex items-center justify-center mt-2 font-bold tracking-wide">
                {isSaving ? "Saving..." : "Add to Holdings"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
}
