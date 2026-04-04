"use client";

import { usePathname } from "next/navigation";
import { useData } from "@/context/DataContext";

export default function MainContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isSidebarCollapsed } = useData();
  const hideRightPanel = ["/portfolio", "/chat", "/settings"].includes(pathname);

  return (
    <div 
      className={`main-content flex flex-col min-w-0 bg-[var(--bg-primary)] ${hideRightPanel ? "no-right-panel" : ""} ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}
    >
      {children}
    </div>
  );
}
