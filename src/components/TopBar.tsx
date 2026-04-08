"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Loader2, LogOut, Mail, Menu, Moon, RotateCcw, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSubscription } from "@/hooks/useSubscription";

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
    <div className="text-right hidden sm:block">
      <div className="mono text-sm font-semibold" style={{ color: "var(--accent-violet-light)" }}>{time}</div>
      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{date}</div>
    </div>
  );
}

export default function TopBar() {
  const { user, logOut } = useAuth();
  const { running, theme, handleRunNow, toggleTheme, setMobileMenuOpen } = useData();
  const [showMobileLogout, setShowMobileLogout] = useState(false);
  const pathname = usePathname();
  const { isPremium } = useSubscription();

  // Convert pathname to nice title
  let pageTitle = "BriefAI";
  if (pathname === "/dashboard") pageTitle = "Overview";
  else if (pathname === "/briefing") pageTitle = "Executive Briefing";
  else if (pathname === "/markets") pageTitle = "Markets";
  else if (pathname === "/news") pageTitle = "News & Alpha";
  else if (pathname === "/portfolio") pageTitle = "My Portfolio";
  else if (pathname === "/alerts") pageTitle = "Alerts";
  else if (pathname === "/chat") pageTitle = "AI Assistant";
  else if (pathname === "/settings") pageTitle = "Settings";

  return (
    <header className="topbar">
      {/* Mobile Menu Button — hidden on desktop via CSS */}
      <div 
        className="mobile-menu-btn topbar-icon-btn mr-3" 
        onClick={() => setMobileMenuOpen(true)}
      >
        <Menu size={18} />
      </div>

      {/* Page Title */}
      <div className="display-font text-lg font-bold" style={{ color: "var(--text-primary)" }}>
        {pageTitle}
      </div>

      <div style={{ flex: 1 }} />

      {/* Actions */}
      <div className="topbar-actions">
        <LiveClock />

        <button
          type="button"
          className="topbar-icon-btn hidden sm:flex"
          title="Refresh Briefing"
          aria-label="Refresh briefing"
          onClick={handleRunNow}
        >
          <span className="topbar-icon-slot">
            {running ? (
              <Loader2 size={16} strokeWidth={2} className="topbar-icon-spinner" aria-hidden />
            ) : (
              <RotateCcw size={16} strokeWidth={2} aria-hidden />
            )}
          </span>
        </button>

        {/* Email Notifications & Contact */}
        <a 
          href="mailto:support@briefai.co.in" 
          className="topbar-icon-btn hidden md:flex hover:text-[var(--accent-violet-light)] transition-colors"
          title="Contact Support"
          style={{ cursor: "pointer", position: "relative" }}
        >
          <Mail size={15} />
        </a>

        <div className="topbar-icon-btn" title="Toggle Theme" onClick={toggleTheme} style={{ cursor: "pointer" }}>
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </div>
        
        {/* User Avatar */}
        <div className="relative">
          <div 
            className="topbar-avatar" 
            onClick={() => setShowMobileLogout(!showMobileLogout)}
            style={{ cursor: "pointer", background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, var(--accent-violet), #6d28d9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.65rem", fontWeight: 700, color: "white",
            }} className={isPremium ? "border-2 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]" : ""}>
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold" style={{ color: "var(--text-primary)", lineHeight: 1.2 }}>{user?.displayName || "User"}</div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>CEO</div>
            </div>
          </div>

          {/* Mobile Logout Popover */}
          {showMobileLogout && (
            <div className="absolute right-0 top-full mt-2 w-32 p-1.5 rounded-xl border border-[var(--border-subtle)] sm:hidden z-50 shadow-lg flex flex-col gap-1" style={{ background: "var(--bg-card)" }}>
               <button 
                onClick={logOut} 
                className="flex items-center justify-center gap-2 px-3 py-2 w-full rounded-lg transition-all"
                style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
              >
                <LogOut size={14} strokeWidth={2.5} />
                <span className="text-xs font-bold tracking-wide">LOGOUT</span>
              </button>
            </div>
          )}
        </div>

        <div className="hidden sm:block" style={{ width: 1, height: 24, background: "var(--border-subtle)", margin: "0 4px" }} />

        <button 
          onClick={logOut} 
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-red-500/20"
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
