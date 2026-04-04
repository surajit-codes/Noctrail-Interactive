"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import RightPanel from "@/components/RightPanel";
import { DataProvider } from "@/context/DataContext";
import MainContentWrapper from "@/components/MainContentWrapper";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
       <div className="w-10 h-10 border-4 border-[var(--accent-violet)] border-t-transparent rounded-full animate-spin"></div>
     </div>;
  }

  if (!user) return null;
  return (
    <DataProvider>
      <div className="dashboard-shell">
        <Sidebar />
        
        <MainContentWrapper>
          <TopBar />
          
          <div className="flex-1 overflow-y-auto relative">
            <div className="page-content">
              {children}
            </div>
          </div>
        </MainContentWrapper>

        <RightPanel />
      </div>
    </DataProvider>
  );
}
