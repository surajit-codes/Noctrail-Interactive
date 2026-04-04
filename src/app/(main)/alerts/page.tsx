"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import AnimatedGrid from "@/components/AnimatedGrid";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { useData } from "@/context/DataContext";
import GlassCard from "@/components/GlassCard";
import { Bell, BellOff, Settings, AlertTriangle, ShieldAlert } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

export default function AlertsPage() {
  const { briefing, loading, notifStatus, handleEnableNotifications, addToast } = useData();
  
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(notifStatus === "enabled");

  if (loading || !briefing) {
    return (
      <div className="relative">
        <AnimatedGrid />
        <LoadingSkeleton />
      </div>
    );
  }

  const toggleEmail = () => {
    setEmailAlerts(!emailAlerts);
    addToast(`Email alerts ${!emailAlerts ? 'enabled' : 'disabled'}`, 'info');
  };

  const togglePush = () => {
    if (!pushAlerts && notifStatus !== "enabled") {
      handleEnableNotifications();
      setPushAlerts(true);
    } else {
      setPushAlerts(!pushAlerts);
      addToast(`Push alerts ${!pushAlerts ? 'enabled' : 'disabled'}`, 'info');
    }
  };

  return (
    <>
      <AnimatedGrid />
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Alerts List */}
          <div className="lg:col-span-2">
            <motion.div variants={itemVariants}>
              <GlassCard title="Active Market Alerts" icon={ShieldAlert}>
                <div className="space-y-4">
                  {briefing.risk_alerts.map((alert, idx) => (
                    <div key={idx} className={`p-5 rounded-2xl border ${alert.severity === "HIGH" ? "pulse-red" : "border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.05)]"} relative`}>
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 flex-shrink-0 ${alert.severity === "HIGH" ? "text-red-500" : "text-amber-500"}`}>
                          <AlertTriangle size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-[15px] text-[var(--text-primary)]">{alert.title}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                              alert.severity === "HIGH" ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                            }`}>
                              {alert.severity} PRIORITY
                            </span>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">
                            {alert.description}
                          </p>
                          <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-xs border border-[var(--border-subtle)]">
                            <span className="font-semibold text-[var(--text-muted)] uppercase tracking-wider">Mitigation Plan: </span>
                            <span className="text-[var(--text-primary)]">{alert.mitigation}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {briefing.risk_alerts.length === 0 && (
                    <div className="py-12 text-center text-emerald-400/80 bg-emerald-500/5 rounded-2xl border border-dashed border-emerald-500/20">
                      <ShieldAlert size={32} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium">No active risk alerts detected for today.</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Preferences */}
          <div>
            <motion.div variants={itemVariants}>
              <GlassCard title="Alert Preferences" icon={Settings}>
                <div className="space-y-6">
                  
                  <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(139,92,246,0.1)] text-[var(--accent-violet-light)]">
                        <Bell size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[var(--text-primary)]">Push Notifications</div>
                        <div className="text-xs text-[var(--text-muted)]">Receive alerts on your device</div>
                      </div>
                    </div>
                    
                    {/* Toggle Switch */}
                    <button 
                      onClick={togglePush}
                      className={`w-12 h-6 rounded-full relative transition-colors ${pushAlerts ? "bg-[var(--accent-violet)]" : "bg-[rgba(255,255,255,0.1)]"}`}
                    >
                      <motion.div 
                        animate={{ x: pushAlerts ? 24 : 2 }} 
                        className="w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm"
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(16,185,129,0.1)] text-emerald-400">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[var(--text-primary)]">Email Digest</div>
                        <div className="text-xs text-[var(--text-muted)]">Daily summary sent to CEO</div>
                      </div>
                    </div>
                    
                    {/* Toggle Switch */}
                    <button 
                      onClick={toggleEmail}
                      className={`w-12 h-6 rounded-full relative transition-colors ${emailAlerts ? "bg-[var(--accent-green)]" : "bg-[rgba(255,255,255,0.1)]"}`}
                    >
                      <motion.div 
                        animate={{ x: emailAlerts ? 24 : 2 }} 
                        className="w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm"
                      />
                    </button>
                  </div>

                  <div className="pt-4 border-t border-[var(--border-subtle)]">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Notification Rules</h5>
                    
                    <label className="flex items-center gap-3 text-sm text-[var(--text-secondary)] mb-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-[var(--accent-violet)]" />
                      Notify on High Severity Risks
                    </label>
                    <label className="flex items-center gap-3 text-sm text-[var(--text-secondary)] mb-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-[var(--accent-violet)]" />
                      Notify on Portfolio asset drops &gt; 5%
                    </label>
                    <label className="flex items-center gap-3 text-sm text-[var(--text-secondary)] mb-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-[var(--accent-violet)]" />
                      Notify on major World Events
                    </label>
                  </div>
                  
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
