"use client";

import {
  BarChart3, LineChart, Newspaper,
  Briefcase, BellRing, MessageSquareText, Settings, Home,
  LogOut, X, ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

const NAV_ITEMS = [
  { icon: Home, href: "/dashboard", label: "Overview" },
  { icon: BarChart3, href: "/briefing", label: "Briefing" },
  { icon: LineChart, href: "/markets", label: "Markets" },
  { icon: Newspaper, href: "/news", label: "News" },
  { icon: Briefcase, href: "/portfolio", label: "Portfolio" },
  { icon: BellRing, href: "/alerts", label: "Alerts" },
  { icon: MessageSquareText, href: "/chat", label: "AI Chat" },
  { icon: Settings, href: "/settings", label: "Settings" },
];

function NavItems({ isCollapsed, onNavigate }: { isCollapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logOut: firebaseLogOut } = useAuth();
  const { isSidebarCollapsed, setSidebarCollapsed } = useData();

  const handleLogout = async () => {
    await firebaseLogOut();
    router.push("/login");
  };

  const handleToggleCollapse = () => {
    const newState = !isSidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden" }}>
      {/* Logo Area */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "12px", 
        marginBottom: "2rem", 
        padding: isCollapsed ? "0" : "0 8px",
        justifyContent: isCollapsed ? "center" : "flex-start",
        transition: "all 0.3s ease"
      }}>
        <Image src="/logo.svg" alt="BriefAI" width={32} height={32} style={{ flexShrink: 0 }} />
        {!isCollapsed && (
          <span className="display-font" style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
            BriefAI
          </span>
        )}
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", gap: "4px", width: "100%" }} className="custom-scrollbar">
        {NAV_ITEMS.map(({ icon: Icon, href, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              title={isCollapsed ? label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "12px",
                textDecoration: "none",
                background: isActive ? "rgba(139,92,246,0.12)" : "transparent",
                color: isActive ? "var(--accent-violet-light)" : "var(--text-muted)",
                borderLeft: isActive ? "3px solid var(--accent-violet)" : "3px solid transparent",
                transition: "all 0.2s ease",
                fontSize: "0.85rem",
                fontWeight: 500,
                justifyContent: isCollapsed ? "center" : "flex-start",
                overflow: "hidden"
              }}
            >
              <Icon size={18} style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }} />
              {!isCollapsed && <span style={{ whiteSpace: "nowrap" }}>{label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Collapse Toggle — Desktop Only Bottom */}
      {!onNavigate && (
         <button
            onClick={handleToggleCollapse}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "flex-start",
              gap: "12px",
              padding: "10px 12px",
              margin: "4px 0",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
              color: "var(--text-muted)",
              transition: "all 0.2s ease",
            }}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : (
              <>
                <ChevronLeft size={16} />
                <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Collapse</span>
              </>
            )}
          </button>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: "var(--border-subtle)", margin: "12px 0" }} />

      {/* Profile/Logout */}
      <button
        onClick={handleLogout}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "8px 8px",
          borderRadius: "12px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          width: "100%",
          transition: "all 0.2s ease",
          justifyContent: isCollapsed ? "center" : "flex-start",
          overflow: "hidden"
        }}
        onMouseEnter={(e) => {
          if (!isCollapsed) (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
          (e.currentTarget as HTMLElement).style.color = "#f87171";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
        }}
      >
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "linear-gradient(135deg,var(--accent-violet),#6d28d9)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.7rem", fontWeight: 700, color: "white", flexShrink: 0,
        }}>
          {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
        </div>
        {!isCollapsed && (
          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.displayName || "Sayan CEO"}
            </div>
            <div style={{ fontSize: "0.65rem", color: "inherit" }}>Logout</div>
          </div>
        )}
      </button>
    </div>
  );
}

/* ─── DESKTOP SIDEBAR ─── */
export function DesktopSidebar() {
  const { isSidebarCollapsed } = useData();
  
  return (
    <aside style={{
      position: "fixed",
      top: 0, left: 0,
      width: "var(--sidebar-width)",
      height: "100vh",
      background: "var(--bg-sidebar)",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex",
      flexDirection: "column",
      padding: "1.25rem 0.75rem",
      zIndex: 100,
      transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      overflow: "hidden"
    }}>
      <NavItems isCollapsed={isSidebarCollapsed} />
    </aside>
  );
}

/* ─── MOBILE SIDEBAR ─── */
export function MobileSidebar() {
  const { isMobileMenuOpen, setMobileMenuOpen } = useData();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(4px)",
          opacity: isMobileMenuOpen ? 1 : 0,
          pointerEvents: isMobileMenuOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Drawer */}
      <aside
        style={{
          position: "fixed",
          top: 0, left: 0,
          width: 260,
          height: "100vh",
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          padding: "1.25rem 0.75rem",
          zIndex: 9999,
          transform: isMobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: isMobileMenuOpen ? "12px 0 40px rgba(0,0,0,0.6)" : "none",
        }}
      >
        {/* Header with Close */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
             <Image src="/logo.svg" alt="Logo" width={28} height={28} />
             <span className="display-font" style={{ fontWeight: 700, color: "var(--text-primary)" }}>BriefAI</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "#f87171",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <NavItems onNavigate={() => setMobileMenuOpen(false)} />
      </aside>
    </>
  );
}

/* ─── DEFAULT EXPORT ─── */
export default function Sidebar() {
  return (
    <>
      <div className="desktop-sidebar-wrapper">
        <DesktopSidebar />
      </div>
      <div className="mobile-sidebar-wrapper">
        <MobileSidebar />
      </div>
    </>
  );
}
