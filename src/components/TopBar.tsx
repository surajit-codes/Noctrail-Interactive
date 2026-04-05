"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Loader2, LogOut, Mail, Menu, Moon, RotateCcw, Sun } from "lucide-react";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

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

        <div className="topbar-icon-btn hidden sm:flex" title="Refresh Briefing" onClick={handleRunNow} style={{ cursor: "pointer" }}>
          {running ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
        </div>

        {/* Email Notifications — Coming Soon */}
        <div 
          className="topbar-icon-btn hidden md:flex"
          title="Email Notifications — Coming Soon"
          style={{ cursor: "default", opacity: 0.5, position: "relative" }}
        >
          <Mail size={15} />
          <span style={{
            position: "absolute", top: 6, right: 6, width: 6, height: 6,
            background: "var(--accent-amber)", borderRadius: "50%",
            border: "1.5px solid var(--bg-sidebar)",
          }} />
        </div>

        <div className="topbar-icon-btn" title="Toggle Theme" onClick={toggleTheme} style={{ cursor: "pointer" }}>
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </div>
        
        {/* User Avatar */}
        <div className="topbar-avatar" style={{ cursor: "default", background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, var(--accent-violet), #6d28d9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.65rem", fontWeight: 700, color: "white",
          }}>
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-semibold" style={{ color: "var(--text-primary)", lineHeight: 1.2 }}>{user?.displayName || "User"}</div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>CEO</div>
          </div>
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
