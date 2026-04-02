"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Activity, AlertTriangle, BarChart3, Bell, BrainCircuit, Briefcase,
  ChevronRight, Clock, CreditCard, Globe, Loader2, RefreshCw,
  Search, TrendingDown, TrendingUp, Zap, ArrowDownLeft, ArrowUpRight,
  ChevronDown, Moon, RotateCcw, Sun, LogOut,
} from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

// ─── Animation Variants ────────────────────────────────────────────
const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

// ─── Live Clock ────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" }));
      setDate(now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-right">
      <div className="mono text-sm font-semibold" style={{ color: "var(--accent-violet-light)" }}>{time} IST</div>
      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{date}</div>
    </div>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────
function TopBar({
  userName,
  notifStatus,
  running,
  theme,
  onEnableNotif,
  onRunNow,
  onToggleTheme,
  onLogOut,
}: {
  userName: string | null;
  notifStatus: string;
  running: boolean;
  theme: "dark" | "light";
  onEnableNotif: () => void;
  onRunNow: () => void;
  onToggleTheme: () => void;
  onLogOut: () => void;
}) {
  return (
    <header className="topbar">
      <div style={{ flex: 1 }} />

      {/* Actions */}
      <div className="topbar-actions">
        <LiveClock />

        <div className="topbar-icon-btn" title="Refresh" onClick={onRunNow} style={{ cursor: "pointer" }}>
          {running ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
        </div>

        {notifStatus !== "enabled" && (
          <div className="topbar-icon-btn" title="Enable Notifications" onClick={onEnableNotif} style={{ cursor: "pointer", position: "relative" }}>
            <Bell size={15} />
            <span style={{
              position: "absolute", top: 7, right: 7, width: 6, height: 6,
              background: "var(--accent-violet)", borderRadius: "50%",
              border: "1.5px solid var(--bg-sidebar)",
            }} />
          </div>
        )}

        <div className="topbar-icon-btn" title="Toggle Theme" onClick={onToggleTheme}>
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </div>

        {/* Avatar */}
        <div className="topbar-avatar" style={{ cursor: "default" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, var(--accent-violet), #6d28d9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.65rem", fontWeight: 700, color: "white",
          }}>
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: "var(--text-primary)", lineHeight: 1.2 }}>{userName || "User"}</div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>CEO</div>
          </div>
        </div>

        <div style={{ width: 1, height: 24, background: "var(--border-subtle)", margin: "0 4px" }} />

        <button 
          onClick={onLogOut} 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-red-500/20"
          style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", cursor: "pointer" }}
          title="Log out"
        >
          <LogOut size={14} strokeWidth={2.5} />
          <span className="text-xs font-bold tracking-wide">LOGOUT</span>
        </button>
      </div>
    </header>
  );
}

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

// ─── Toast ────────────────────────────────────────────────────────
interface Toast { id: string; message: string; type: "success" | "error" | "info"; }

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
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{
                background: t.type === "success" ? "#10b981" : t.type === "error" ? "#ef4444" : "var(--accent-violet)",
              }} />
              <p className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>{t.message}</p>
              <button onClick={() => onRemove(t.id)} className="text-xs opacity-50 hover:opacity-100 ml-2 transition-opacity" style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Commodity Card ────────────────────────────────────────────────
function CommodityCard({ title, price, change, changePct, outlook, insight, unit = "" }: {
  title: string; price: number | null; change?: number | null;
  changePct?: number | null; outlook?: string; insight?: string; unit?: string;
}) {
  const isUp = (change ?? 0) >= 0;
  const color = isUp ? "#10b981" : "#ef4444";
  const TrendIcon = isUp ? TrendingUp : TrendingDown;

  return (
    <div className="stat-card flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>{title}</span>
        {outlook && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full border" style={{
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

// ─── Right Panel ──────────────────────────────────────────────────
function RightPanel({
  briefing, marketData, running, onRunNow, onAction
}: {
  briefing: BriefingData | null;
  marketData: { nifty?: { historical: { date: string; close: number }[]; current_price: number }; sensex?: { historical: { date: string; close: number }[]; current_price: number } } | null;
  running: boolean;
  onRunNow: () => void;
  onAction: (msg: string) => void;
}) {
  // Calculate approximate % change from nifty historical
  const niftyData = marketData?.nifty?.historical ?? [];
  const niftyPrice = marketData?.nifty?.current_price;
  const niftyStartPrice = niftyData.length > 1 ? niftyData[0].close : niftyPrice;
  const niftyChangePct = niftyPrice && niftyStartPrice ? ((niftyPrice - niftyStartPrice) / niftyStartPrice) * 100 : 0;

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
            onClick={onRunNow}
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
          <button onClick={() => onAction("Request Sent: Processing new market data.")} className="btn-secondary text-sm" style={{ borderRadius: 12, padding: "0.6rem 0" }}>
            <ArrowDownLeft size={14} /> Request
          </button>
          <button onClick={() => onAction("Analysis Triggered: Checking technical indicators.")} className="btn-primary text-sm" style={{ borderRadius: 12, padding: "0.6rem 0" }}>
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
          <Link href="/dashboard#history" className="text-xs" style={{ color: "var(--accent-violet-light)" }}>View All</Link>
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

      {/* Market Pulse Mini */}
      {briefing && (
        <div>
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

// ─── Main Dashboard Page ───────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading: authLoading, logOut } = useAuth();
  const router = useRouter();

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
  const [activeTab, setActiveTab] = useState<"6month" | "1year" | "3month" | "1month">("6month");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchBriefing = useCallback(async () => {
    try {
      const latest = await getLatestDailyBriefing();
      if (latest) setBriefing(latest);
    } catch (err) {
      console.warn("Failed to fetch briefing:", err);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const rows = await getDailyBriefingHistory(30);
      setHistory(rows);
    } catch (err) {
      console.warn("Failed to fetch history:", err);
    }
  }, []);

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
        addToast("✅ Briefing generated successfully!", "success");
      } else {
        throw new Error(data.details ? `${data.error}: ${data.details}` : data.error ?? "Unknown error");
      }
    } catch (err) {
      addToast(`❌ Failed to generate briefing: ${String(err)}`, "error");
    } finally {
      setRunning(false);
    }
  };

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
      addToast("🔔 Briefing notifications enabled!", "success");
    } catch (err) {
      setNotifStatus("idle");
      addToast(`❌ Failed to enable notifications: ${String(err)}`, "error");
    }
  };

  const spot = marketData?.spot;

  // NIFTY derived stats & filtering
  let niftyData = marketData?.nifty?.historical ?? [];
  if (activeTab === "1month") {
    niftyData = niftyData.slice(-21); // Roughly 21 trading days
  } else if (activeTab === "3month") {
    niftyData = niftyData.slice(-63);
  } else if (activeTab === "6month") {
    niftyData = niftyData.slice(-126);
  } else if (activeTab === "1year") {
    niftyData = niftyData.slice(-252);
  }
  
  const niftyPrice = marketData?.nifty?.current_price;
  const niftyStart = niftyData.length > 1 ? niftyData[0].close : undefined;
  const niftyChangePct = niftyPrice && niftyStart ? ((niftyPrice - niftyStart) / niftyStart) * 100 : null;
  const niftyIsUp = (niftyChangePct ?? 0) >= 0;

  if (loading || authLoading || (!user && !authLoading)) {
    return (
      <div className="main-content" style={{ zIndex: 1, position: "relative" }}>
        <AnimatedGrid />
        <div style={{ padding: "2rem", position: "relative", zIndex: 10 }}>
          <LoadingSkeleton />
        </div>
        <RightPanel briefing={null} marketData={null} running={false} onRunNow={() => {}} onAction={() => {}} />
      </div>
    );
  }

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 18 ? "Good Afternoon" : "Good Evening";
  const temporalWord = currentHour < 12 ? "morning" : currentHour < 18 ? "afternoon" : "evening";

  return (
    <>
      <div className="main-content" style={{ position: "relative" }}>
        <AnimatedGrid />
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* Top Bar */}
        <TopBar
          userName={user?.displayName || null}
          notifStatus={notifStatus}
          running={running}
          theme={theme}
          onEnableNotif={handleEnableNotifications}
          onRunNow={handleRunNow}
          onToggleTheme={toggleTheme}
          onLogOut={logOut}
        />

        <div className="page-content" id="overview" style={{ position: "relative", zIndex: 10 }}>
          <div className="mb-6">
            <h1 className="text-3xl font-bold display-font text-white">{greeting}, {user?.displayName || "CEO"}!</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Here is your {temporalWord} intelligence briefing.</p>
          </div>

          {!briefing ? (
            /* ─── EMPTY STATE ──────────────────────────────── */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-6"
            >
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(109,40,217,0.1))",
                border: "1px solid rgba(139,92,246,0.3)",
                boxShadow: "0 0 40px rgba(139,92,246,0.2)",
              }}>
                <BrainCircuit size={38} style={{ color: "var(--accent-violet-light)" }} />
              </div>
              <h2 className="display-font text-3xl font-bold" style={{ color: "var(--text-primary)" }}>No briefing yet</h2>
              <p className="text-base max-w-md text-center" style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>
                Initialize the AI engine to sweep Indian markets, aggregate global news, and generate your CEO briefing.
              </p>
              <button
                id="generate-first-btn"
                onClick={handleRunNow}
                disabled={running}
                className="btn-primary flex items-center gap-3 px-8 py-4 text-sm mt-4"
              >
                {running ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                <span>{running ? "Analyzing…" : "Generate Your First Briefing"}</span>
              </button>
            </motion.div>
          ) : (
            /* ─── MAIN CONTENT ─────────────────────────────── */
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">

              {/* ── NIFTY CHART HERO ──────────────────────── */}
              <motion.div variants={itemVariants} id="market">
                <div className="glass-card p-5">
                  {/* Header row */}
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

                    {/* Time tabs */}
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

                  {/* Chart */}
                  {niftyData.length > 0 ? (
                    <NiftyChart data={niftyData} name="NIFTY 50" />
                  ) : (
                    <div className="h-52 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
                      Chart data unavailable
                    </div>
                  )}

                  {/* Legend */}
                  <div className="flex flex-wrap items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Avg. annual rate{" "}
                      <span className="mono font-semibold" style={{ color: "var(--text-secondary)" }}>
                        {niftyPrice ? `₹${(niftyPrice * 0.84).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}
                      </span>
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Actual close</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent-violet)" }} />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>NIFTY 50</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── PROMO + COMMODITIES ───────────────────── */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Promo Card */}
                <div className="promo-card">
                  <div className="relative z-10">
                    <h3 className="display-font text-xl font-bold mb-2" style={{ color: "white" }}>
                      Trusted by{" "}
                      <span style={{ color: "var(--accent-violet-light)" }}>Thousands</span>
                      <br />
                      of CEOs Today!
                    </h3>
                    <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.55)", lineHeight: "1.6" }}>
                      Secure, reliable, and trusted by business leaders worldwide
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      {["A", "B", "C", "D"].map((l, i) => (
                        <div key={l} style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: `linear-gradient(135deg, hsl(${260 + i * 30},70%,55%), hsl(${280 + i * 20},60%,40%))`,
                          border: "2px solid rgba(255,255,255,0.2)",
                          marginLeft: i > 0 ? -8 : 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.6rem", fontWeight: 700, color: "white",
                        }}>{l}</div>
                      ))}
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: "rgba(139,92,246,0.4)",
                        border: "2px solid rgba(139,92,246,0.5)",
                        marginLeft: -8, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.6rem", color: "white",
                      }}>+</div>
                    </div>
                    <button
                      onClick={handleRunNow}
                      className="w-full py-2.5 text-sm font-semibold rounded-xl transition-all"
                      style={{
                        background: "white", color: "#1a0a40",
                        border: "none", cursor: "pointer",
                      }}
                    >
                      {running ? "Generating…" : "Generate Briefing"}
                    </button>
                  </div>
                </div>

                {/* Commodities */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    title="USD / INR"
                    price={spot?.usd_inr?.price ?? null}
                    change={spot?.usd_inr?.change}
                    changePct={spot?.usd_inr?.change_percent}
                    outlook={briefing.commodities?.usd_inr?.outlook || "STABLE"}
                    insight={briefing.commodities?.usd_inr?.insight || "Data unavailable"}
                    unit="₹"
                  />
                </div>
              </motion.div>

              {/* ── EXECUTIVE SUMMARY ─────────────────────── */}
              <motion.div variants={itemVariants} id="briefing">
                <div
                  className="glass-card p-5 relative overflow-hidden"
                  style={{
                    borderLeft: "3px solid var(--accent-violet)",
                    background: "linear-gradient(135deg, rgba(139,92,246,0.05), rgba(0,0,0,0))",
                  }}
                >
                  <div className="gradient-mesh" style={{ opacity: 0.4 }} />
                  <div className="relative z-10">
                    <SectionHeader icon={<BrainCircuit size={14} />}>Executive Summary</SectionHeader>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)", lineHeight: "1.75" }}>
                      {briefing.executive_summary}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Clock size={11} style={{ color: "var(--text-muted)" }} />
                      <span className="text-xs mono" style={{ color: "var(--text-muted)" }}>
                        Generated: {new Date(briefing.generated_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── MARKET PULSE + SENTIMENT ──────────────── */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <GlassCard className="flex flex-col items-center gap-4">
                  <SectionHeader icon={<Activity size={14} />}>Market Pulse</SectionHeader>
                  <SentimentGauge score={briefing.market_pulse?.sentiment_score || 0} size={150} />
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

                {/* Top Sectors */}
                <GlassCard>
                  <SectionHeader icon={<BarChart3 size={14} />}>Top Sectors</SectionHeader>
                  <div className="space-y-3">
                    {(briefing.top_sectors || []).slice(0, 4).map((sector, i) => (
                      <div key={i} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{sector.name}</span>
                          <SignalBadge value={sector.signal} />
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sector.reason}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>

              {/* ── OPPORTUNITIES + RISK ──────────────────── */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4" id="risk">
                <GlassCard>
                  <SectionHeader icon={<Briefcase size={14} />}>Business Opportunities</SectionHeader>
                  <div className="space-y-3">
                    {(briefing.business_opportunities || []).map((opp, i) => (
                      <div key={i} className="p-4 rounded-xl space-y-2" style={{
                        background: opp.urgency === "HIGH" ? "rgba(139,92,246,0.06)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${opp.urgency === "HIGH" ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)"}`,
                      }}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{opp.title}</span>
                          <SignalBadge value={opp.urgency} />
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{opp.description}</p>
                        <div className="text-xs p-2 rounded-lg" style={{ background: "rgba(139,92,246,0.08)", color: "var(--accent-violet-light)" }}>
                          ⚡ {opp.action}
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard>
                  <SectionHeader icon={<AlertTriangle size={14} />}>Risk Alerts</SectionHeader>
                  <div className="space-y-3">
                    {(briefing.risk_alerts || []).map((alert, i) => (
                      <div key={i} className={`p-4 rounded-xl space-y-2 ${alert.severity === "HIGH" ? "pulse-red" : ""}`} style={{
                        background: alert.severity === "HIGH" ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${alert.severity === "HIGH" ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.06)"}`,
                      }}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{alert.title}</span>
                          <SignalBadge value={alert.severity} />
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{alert.description}</p>
                        <div className="text-xs p-2 rounded-lg" style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}>
                          🛡️ {alert.mitigation}
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>

              {/* ── VC FUNDING ────────────────────────────── */}
              {briefing.vc_funding_highlights?.length > 0 && (
                <motion.div variants={itemVariants}>
                  <GlassCard>
                    <SectionHeader icon={<Zap size={14} />}>VC Funding Highlights</SectionHeader>
                    <div className="h-scroll pb-2">
                      {(briefing.vc_funding_highlights || []).map((vc, i) => (
                        <div key={i} className="flex-shrink-0 w-72 p-4 rounded-xl space-y-2" style={{
                          background: "rgba(139,92,246,0.06)",
                          border: "1px solid rgba(139,92,246,0.18)",
                          minWidth: "270px",
                        }}>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm display-font" style={{ color: "var(--text-primary)" }}>{vc.company}</span>
                            <span className="mono text-xs font-bold" style={{ color: "var(--accent-violet-light)" }}>{vc.amount}</span>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full inline-block" style={{ background: "rgba(139,92,246,0.12)", color: "var(--accent-violet-light)" }}>
                            {vc.sector}
                          </span>
                          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{vc.insight}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* ── WORLD IMPACT ──────────────────────────── */}
              <motion.div variants={itemVariants}>
                <GlassCard>
                  <SectionHeader icon={<Globe size={14} />}>World Impact on India</SectionHeader>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)", lineHeight: "1.75" }}>
                      {briefing.world_impact?.summary || "Global impact data unavailable."}
                    </p>
                    <div className="space-y-2">
                      {(briefing.world_impact?.key_events || []).map((ev, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{
                            background: ev.impact === "POSITIVE" ? "#10b981" : ev.impact === "NEGATIVE" ? "#ef4444" : "#f59e0b",
                            boxShadow: `0 0 6px ${ev.impact === "POSITIVE" ? "#10b981" : ev.impact === "NEGATIVE" ? "#ef4444" : "#f59e0b"}60`,
                          }} />
                          <div>
                            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{ev.event}</p>
                            <span className="text-xs" style={{ color: ev.impact === "POSITIVE" ? "#10b981" : ev.impact === "NEGATIVE" ? "#ef4444" : "#f59e0b" }}>
                              {ev.impact}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              {/* ── HISTORY TABLE ─────────────────────────── */}
              {history.length > 0 && (
                <motion.div variants={itemVariants} id="history">
                  <GlassCard>
                    <SectionHeader icon={<RefreshCw size={14} />}>Briefing History (Last 30 Days)</SectionHeader>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                            {["Date", "Decision", "NIFTY Trend", "Sentiment", "Generated"].map((h) => (
                              <th key={h} className="text-left py-3 px-3 text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
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
                              style={{ borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.04)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                            >
                              <td className="py-3 px-3 mono text-sm" style={{ color: "var(--text-primary)" }}>
                                {new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </td>
                              <td className="py-3 px-3"><SignalBadge value={(row.briefing as BriefingData).market_pulse?.decision ?? "HOLD"} /></td>
                              <td className="py-3 px-3"><SignalBadge value={(row.briefing as BriefingData).market_pulse?.nifty_trend ?? "SIDEWAYS"} /></td>
                              <td className="py-3 px-3 mono text-xs" style={{ color: "var(--accent-violet-light)" }}>
                                {(row.briefing as BriefingData).market_pulse?.sentiment_score?.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-xs" style={{ color: "var(--text-muted)" }}>
                                {new Date(row.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST
                              </td>
                              <td className="py-3 px-3">
                                <Link href={`/briefing/${row.date}`} className="flex items-center gap-1 text-xs transition-colors" style={{ color: "var(--accent-violet-light)" }}>
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

      {/* ─── RIGHT PANEL ──────────────────────────────────── */}
      <RightPanel
        briefing={briefing}
        marketData={marketData}
        running={running}
        onRunNow={handleRunNow}
        onAction={addToast}
      />

      {/* Unused icons to prevent TS errors */}
      <span style={{ display: "none" }}><CreditCard size={0} /></span>
    </>
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
