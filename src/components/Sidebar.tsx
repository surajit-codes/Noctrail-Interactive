"use client";

import { useEffect, useState } from "react";
import { BarChart3, BrainCircuit, Calendar, Home, LayoutGrid, Mail, Shield, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { icon: Home, href: "/dashboard", label: "Dashboard" },
  { icon: LayoutGrid, href: "/dashboard#overview", label: "Overview" },
  { icon: BarChart3, href: "/dashboard#market", label: "Market" },
  { icon: Mail, href: "/dashboard#briefing", label: "Briefing" },
  { icon: Shield, href: "/dashboard#risk", label: "Risk" },
  { icon: Calendar, href: "/dashboard#history", label: "History" },
];

const BOTTOM_ITEMS = [
  { icon: UserCircle, href: "#account", label: "Account" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    // Update hash on load and when hash changes
    const updateHash = () => {
      setActiveHash(window.location.hash);
    };
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  return (
    <nav className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <BrainCircuit size={20} color="white" />
      </div>

      {/* Main nav */}
      <div className="sidebar-nav">
        {NAV_ITEMS.map(({ icon: Icon, href, label }) => {
          const isHome = href === "/dashboard";
          const itemHash = href.split("#")[1] ? `#${href.split("#")[1]}` : "";
          const isActive = isHome 
            ? pathname === "/dashboard" && activeHash === "" 
            : activeHash === itemHash;

          return (
            <Link key={href} href={href} title={label} onClick={() => setActiveHash(itemHash)}>
              <div className={`sidebar-item ${isActive ? "active" : ""}`}>
                <Icon size={19} />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="sidebar-divider" />

      {/* Bottom nav */}
      <div className="sidebar-bottom">
        {BOTTOM_ITEMS.map(({ icon: Icon, href, label }) => {
          const isActive = activeHash === href;
          return (
            <Link key={href} href={href} title={label} onClick={() => setActiveHash(href)}>
              <div className={`sidebar-item ${isActive ? "active" : ""}`}>
                <Icon size={19} />
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
