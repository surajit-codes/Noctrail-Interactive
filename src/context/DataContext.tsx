"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { BriefingData, DailyBriefing } from "@/lib/briefingTypes";
import { getDailyBriefingHistory, getLatestDailyBriefing } from "@/lib/firebaseClient";
import { useAuth } from "./AuthContext";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface WidgetConfig {
  id: string;
  label: string;
  active: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'executive_summary', label: 'Executive Summary', active: true },
  { id: 'market_pulse', label: 'Market Pulse & Top Sectors', active: true },
  { id: 'opportunities', label: 'Opportunities & Risks', active: true },
  { id: 'vc_funding', label: 'VC Funding & World Impact', active: true },
  { id: 'portfolio', label: 'Portfolio Summary', active: true },
  { id: 'commodities', label: 'Commodities Tracker', active: true },
];

interface DataContextType {
  briefing: BriefingData | null;
  marketData: any;
  history: DailyBriefing[];
  loading: boolean;
  running: boolean;
  toasts: Toast[];
  notifStatus: "idle" | "loading" | "enabled" | "denied";
  theme: "dark" | "light";
  
  handleRunNow: () => Promise<void>;
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
  handleEnableNotifications: () => Promise<void>;
  toggleTheme: () => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  widgets: WidgetConfig[];
  setWidgets: (widgets: WidgetConfig[] | ((prev: WidgetConfig[]) => WidgetConfig[])) => void;
  fontDisplay: string;
  setFontDisplay: (font: string) => void;
  fontBody: string;
  setFontBody: (font: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const urlB64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [marketData, setMarketData] = useState<any>(null);
  const [history, setHistory] = useState<DailyBriefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifStatus, setNotifStatus] = useState<"idle" | "loading" | "enabled" | "denied">("idle");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [widgets, setWidgetsState] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [fontDisplay, setFontDisplayState] = useState("Syne");
  const [fontBody, setFontBodyState] = useState("Inter");

  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
    if (savedCollapsed) setSidebarCollapsed(true);
    
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    const savedWidgets = localStorage.getItem("dashboardWidgets");
    if (savedWidgets) {
      try {
        setWidgetsState(JSON.parse(savedWidgets));
      } catch (e) {
        console.error("Failed to parse saved widgets", e);
      }
    }

    const savedFontDisplay = localStorage.getItem("fontDisplay");
    if (savedFontDisplay) {
      setFontDisplayState(savedFontDisplay);
      document.documentElement.style.setProperty('--font-display', savedFontDisplay);
    }

    const savedFontBody = localStorage.getItem("fontBody");
    if (savedFontBody) {
      setFontBodyState(savedFontBody);
      document.documentElement.style.setProperty('--font-body', savedFontBody);
    }
  }, []);

  const setWidgets = useCallback((newWidgets: WidgetConfig[] | ((prev: WidgetConfig[]) => WidgetConfig[])) => {
    setWidgetsState(prev => {
      const resolved = typeof newWidgets === 'function' ? newWidgets(prev) : newWidgets;
      localStorage.setItem("dashboardWidgets", JSON.stringify(resolved));
      return resolved;
    });
  }, []);

  const setFontDisplay = useCallback((font: string) => {
    setFontDisplayState(font);
    localStorage.setItem("fontDisplay", font);
    document.documentElement.style.setProperty('--font-display', font);
  }, []);

  const setFontBody = useCallback((font: string) => {
    setFontBodyState(font);
    localStorage.setItem("fontBody", font);
    document.documentElement.style.setProperty('--font-body', font);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem("theme", newTheme);
      return newTheme;
    });
  }, []);

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
    if (!user) return; // Only fetch data if logged in
    const init = async () => {
      await Promise.allSettled([fetchBriefing(), fetchHistory(), fetchMarketData()]);
      setLoading(false);
    };
    init();

    // ─── 8 AM IST Auto-Refresh Timer ───
    const checkTime = () => {
      const now = new Date();
      // Indian Standard Time (IST) is UTC+5:30
      const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      
      // If it's exactly 8:00 AM (and close enough to it)
      if (hours === 8 && minutes === 0) {
        console.log("🌅 8 AM auto-refresh triggered");
        init(); // Refresh data from Firestore (assuming cron ran)
      }
    };

    const timer = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [user, fetchBriefing, fetchHistory, fetchMarketData]);

  const handleRunNow = async () => {
    setRunning(true);
    addToast("⚡ Generating briefing...", "info");
    try {
      // Pass the user's email so the backend can send a direct notification
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { 
          "x-demo-bypass": "true",
          "x-user-email": user?.email ?? ""
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await Promise.all([fetchBriefing(), fetchHistory()]);
        if (data.email?.attempted && !data.email?.success) {
          addToast(
            `⚠️ Briefing generated, but email not sent: ${String(data.email?.error ?? "Unknown email error")}`,
            "error"
          );
        } else if (data.email?.attempted && data.email?.success) {
          addToast("✅ Briefing generated and emailed successfully!", "success");
        } else {
          addToast("✅ Briefing generated successfully!", "success");
        }
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
        addToast("⚠️ Push notifications simulated (VAPID key missing).", "success");
        setNotifStatus("enabled");
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

  const value = {
    briefing,
    marketData,
    history,
    loading,
    running,
    toasts,
    notifStatus,
    theme,
    handleRunNow,
    addToast,
    removeToast,
    handleEnableNotifications,
    toggleTheme,
    isMobileMenuOpen,
    setMobileMenuOpen,
    isSidebarCollapsed,
    setSidebarCollapsed,
    widgets,
    setWidgets,
    fontDisplay,
    setFontDisplay,
    fontBody,
    setFontBody,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
