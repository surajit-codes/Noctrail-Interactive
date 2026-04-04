"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import AnimatedGrid from "@/components/AnimatedGrid";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { getUserPortfolio, updateUserPortfolio, PortfolioItem } from "@/lib/firebaseClient";
import { Briefcase, Plus, TrendingDown, TrendingUp, X } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";

export default function PortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const { marketData, addToast } = useData();
  
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [newSymbol, setNewSymbol] = useState("");
  const [newName, setNewName] = useState("");
  const [newShares, setNewShares] = useState("");
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    
    // In a real app we'd fetch live data for the tickers, here we mix actual data with market data roughly
    getUserPortfolio(user.uid).then(data => {
      // simulate live price updates randomly if they don't have current prices
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
      currentPrice: priceNum // initially same
    };
    
    const updated = [...items, newItem];
    try {
      await updateUserPortfolio(user.uid, updated);
      setItems(updated);
      setIsModalOpen(false);
      addToast("Stock added to portfolio", "success");
      
      // Reset form
      setNewSymbol(""); setNewName(""); setNewShares(""); setNewPrice("");
    } catch (err) {
      addToast("Failed to save portfolio", "error");
    } finally {
      setIsSaving(false);
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

  return (
    <>
      <AnimatedGrid />
      <div className="space-y-6 relative z-10">
        
        {/* Header / Summary */}
        <div className="glass-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-l-4" style={{ borderColor: isUp ? "#10b981" : "#ef4444" }}>
          <div>
            <div className="text-sm font-semibold tracking-wider uppercase text-[var(--text-muted)] mb-1">Total Portfolio Value</div>
            <div className="flex items-end gap-4">
              <span className="mono text-4xl font-bold text-white">₹{totalValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              <div className="flex flex-col mb-1">
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
            className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5"
          >
            <Plus size={16} /> Add Stock
          </button>
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
                      <td className="py-4 text-right mono text-white">{item.shares}</td>
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
                      No holdings in your portfolio. Click "Add Stock" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
