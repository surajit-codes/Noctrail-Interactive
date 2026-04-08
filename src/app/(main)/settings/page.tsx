"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import AnimatedGrid from "@/components/AnimatedGrid";
import GlassCard from "@/components/GlassCard";
import { Settings as SettingsIcon, GripVertical, Save, Moon, Sun, Monitor, Crown, AlertTriangle, Database, Download, Trash2, Upload, ScrollText, X, Shield, CreditCard, Brain, FileText, Scale, Globe, Mail } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useRouter } from "next/navigation";
import { wipeUserHistory, getDailyBriefingHistory, restoreUserHistory } from "@/lib/firebaseClient";
import SectionHeader from "@/components/SectionHeader";
import { LANGUAGES, t } from "@/lib/i18n";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

function SortableItem(props: { id: string; label: string; active: boolean; toggle: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] mb-2 group">
      <button 
        {...attributes} 
        {...listeners} 
        className="text-[var(--text-muted)] cursor-grab active:cursor-grabbing hover:text-[var(--text-primary)] transition-colors p-1"
      >
        <GripVertical size={16} />
      </button>
      <div className="flex-1 font-medium text-sm text-[var(--text-primary)]">{props.label}</div>
      <button 
        onClick={() => props.toggle(props.id)}
        className={`w-10 h-5 rounded-full relative transition-colors ${props.active ? "bg-[var(--accent-violet)]" : "bg-[rgba(255,255,255,0.1)]"}`}
      >
        <motion.div 
          animate={{ x: props.active ? 20 : 2 }} 
          className="w-4 h-4 bg-white rounded-full absolute top-[2px] shadow-sm"
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { 
    theme, toggleTheme, addToast, 
    widgets, setWidgets,
    fontDisplay, setFontDisplay,
    fontBody, setFontBody,
    language, setLanguage
  } = useData();
  const ii = t(language);
  const { user } = useAuth();
  const { isPremium, expiresAt, isLoading: subLoading } = useSubscription();
  const router = useRouter();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const displayFonts = [
    { name: "Syne", preview: "Aa Bb Cc" },
    { name: "Outfit", preview: "Aa Bb Cc" },
    { name: "Playfair Display", preview: "Aa Bb Cc" },
    { name: "Roboto", preview: "Aa Bb Cc" },
    { name: "Montserrat", preview: "Aa Bb Cc" },
  ];

  const bodyFonts = [
    { name: "Inter", preview: "The quick brown fox" },
    { name: "Roboto", preview: "The quick brown fox" },
    { name: "Montserrat", preview: "The quick brown fox" },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((i: any) => i.id === active.id);
        const newIndex = items.findIndex((i: any) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleWidget = (id: string) => {
    setWidgets((prev: any[]) => prev.map((w: any) => w.id === id ? { ...w, active: !w.active } : w));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      addToast("Preferences saved successfully", "success");
    }, 600);
  };

  const handleCancelSubscription = async () => {
    if (!user?.uid) return;
    setIsCancelling(true);
    try {
      const res = await fetch('/api/payment/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      }).then(r => r.json());

      if (res.success) {
        addToast("Subscription cancelled. You're now on the Free plan.", "info");
        setShowCancelConfirm(false);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        addToast("Failed to cancel subscription.", "error");
      }
    } catch (err) {
      console.error("Cancel failed:", err);
      addToast("Failed to cancel subscription.", "error");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleWipeData = async () => {
    if (!user?.uid) return;
    setIsWiping(true);
    try {
      await wipeUserHistory(user.uid);
      addToast("Data wiped successfully! Dashboard is now clean.", "success");
      setShowWipeConfirm(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      addToast("Failed to wipe data.", "error");
    } finally {
      setIsWiping(false);
    }
  };

  const handleBackupData = async () => {
    if (!user?.uid) return;
    if (!isPremium) {
      addToast("Backup is a premium feature.", "error");
      router.push("/pricing");
      return;
    }
    setIsBackingUp(true);
    try {
      const history = await getDailyBriefingHistory(user.uid, 500);
      const dataStr = JSON.stringify(history, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `briefai_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("Backup downloaded successfully!", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to generate backup.", "error");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.uid) return;
    if (!isPremium) {
      addToast("Restore is a premium feature.", "error");
      router.push("/pricing");
      return;
    }
    
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const text = await file.text();
      const historyItems = JSON.parse(text);
      if (!Array.isArray(historyItems)) {
         throw new Error("Invalid format: expected array");
      }
      addToast("Restoring data... Please wait.", "info");
      await restoreUserHistory(user.uid, historyItems);
      addToast("Data restored successfully!", "success");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      addToast("Failed to restore data. Check the file format.", "error");
    } finally {
      setIsRestoring(false);
      e.target.value = ''; // clear input
    }
  };

  return (
    <>
      <AnimatedGrid />
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 relative z-10 max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold display-font text-white">Settings</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Manage your experience and preferences.</p>
          </div>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="btn-primary flex items-center gap-2 px-6 py-2.5"
          >
            <Save size={16} /> {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* ═══ Subscription Management ═══ */}
        <motion.div variants={itemVariants}>
          <GlassCard title="Subscription" icon={Crown}>
            {subLoading ? (
              <div style={{ height: '4rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', animation: 'pulse 2s infinite' }} />
            ) : isPremium ? (
              <div className="space-y-4">
                {/* Active Premium Status */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(234,179,8,0.05))',
                  border: '1px solid rgba(245,158,11,0.3)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>👑</span>
                    <div>
                      <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.95rem' }}>BriefAI Premium</div>
                      <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                        Active until {expiresAt ? new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(16,185,129,0.15)',
                    color: '#34d399',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.3rem 0.75rem',
                    borderRadius: '999px',
                    letterSpacing: '0.05em',
                  }}>
                    ACTIVE
                  </div>
                </div>

                {/* Premium Features */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {['Unlimited AI Chat', 'PDF & Excel Export', 'Deep Analysis', 'Portfolio AI Advisor', 'Priority Briefings', 'Premium Badge'].map((f, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.8rem', color: '#d1d5db',
                    }}>
                      <span style={{ color: '#34d399' }}>✓</span> {f}
                    </div>
                  ))}
                </div>

                {/* Cancel Button */}
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    style={{
                      padding: '0.6rem 1.25rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(239,68,68,0.25)',
                      background: 'transparent',
                      color: '#f87171',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget).style.background = 'rgba(239,68,68,0.08)'; }}
                    onMouseLeave={(e) => { (e.currentTarget).style.background = 'transparent'; }}
                  >
                    Cancel Subscription
                  </button>
                ) : (
                  <div style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.25)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <AlertTriangle size={16} style={{ color: '#f87171' }} />
                      <span style={{ color: '#f87171', fontWeight: 600, fontSize: '0.85rem' }}>
                        Are you sure you want to cancel?
                      </span>
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                      You&apos;ll lose access to all premium features including unlimited AI chat, PDF/Excel exports, 
                      deep analysis, and portfolio AI advisor. This action takes effect immediately.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={handleCancelSubscription}
                        disabled={isCancelling}
                        style={{
                          padding: '0.5rem 1.25rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#ef4444',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          opacity: isCancelling ? 0.6 : 1,
                        }}
                      >
                        {isCancelling ? 'Cancelling...' : 'Yes, Cancel Plan'}
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        style={{
                          padding: '0.5rem 1.25rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'transparent',
                          color: '#d1d5db',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Keep Premium
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Free Plan */
              <div className="space-y-4">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>📋</span>
                    <div>
                      <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Free Plan</div>
                      <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>Limited features • 3 AI messages/day</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/pricing')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(to right, #eab308, #f59e0b)',
                    color: 'black',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 15px -3px rgba(245,158,11,0.3)',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget).style.transform = 'scale(1.02)'; }}
                  onMouseLeave={(e) => { (e.currentTarget).style.transform = 'scale(1)'; }}
                >
                  ⚡ Upgrade to Premium
                </button>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* ═══ Data Management ═══ */}
        <motion.div variants={itemVariants}>
          <GlassCard title="Data Management" icon={Database}>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)]">
                <div>
                  <h4 className="text-sm font-semibold text-white">Backup & Restore</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Download or restore your past AI briefings safely (Premium only).
                  </p>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <button
                    onClick={handleBackupData}
                    disabled={isBackingUp || isRestoring}
                    title="Download Backup"
                    className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all flex-1 sm:flex-none
                      ${isPremium 
                        ? 'bg-[rgba(16,185,129,0.1)] text-[#34d399] hover:bg-[rgba(16,185,129,0.2)] border border-[rgba(16,185,129,0.2)] cursor-pointer' 
                        : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] cursor-not-allowed opacity-70'}
                    `}
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">{isBackingUp ? "..." : "Backup"}</span>
                  </button>

                  <label
                    title="Restore Data"
                    className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all flex-1 sm:flex-none cursor-pointer
                      ${isPremium 
                        ? 'bg-[rgba(59,130,246,0.1)] text-[#60a5fa] hover:bg-[rgba(59,130,246,0.2)] border border-[rgba(59,130,246,0.2)]' 
                        : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] cursor-not-allowed opacity-70'}
                    `}
                  >
                    <Upload size={16} />
                    <span className="hidden sm:inline">{isRestoring ? "..." : "Restore"}</span>
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleRestoreData} 
                      className="hidden" 
                      disabled={!isPremium || isRestoring}
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.02)]">
                <div>
                  <h4 className="text-sm font-semibold text-[#f87171]">Danger Zone: Wipe Data</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[400px]">
                    Permanently delete all your AI briefing history from our servers. This action cannot be undone.
                  </p>
                </div>
                {!showWipeConfirm ? (
                  <button
                    onClick={() => setShowWipeConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 cursor-pointer"
                  >
                    <Trash2 size={16} />
                    Wipe My Data
                  </button>
                ) : (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setShowWipeConfirm(false)}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white transition-colors flex-1 sm:flex-none cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleWipeData}
                      disabled={isWiping}
                      className="px-4 py-2 text-sm font-bold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex-1 sm:flex-none cursor-pointer"
                    >
                      {isWiping ? "Wiping..." : "Yes, Delete It"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ═══ Terms & Conditions ═══ */}
        <motion.div variants={itemVariants}>
          <GlassCard title="Legal" icon={Scale}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)]">
              <div>
                <h4 className="text-sm font-semibold text-white">Terms & Conditions</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[400px]">
                  Read our terms of service, privacy policy, and usage guidelines for BriefAI.
                </p>
              </div>
              <button
                id="view-terms-button"
                onClick={() => setShowTerms(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(109,40,217,0.08))',
                  border: '1px solid rgba(139,92,246,0.3)',
                  color: '#a78bfa',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget).style.background = 'rgba(139,92,246,0.2)';
                  (e.currentTarget).style.borderColor = 'rgba(139,92,246,0.5)';
                  (e.currentTarget).style.boxShadow = '0 0 20px rgba(139,92,246,0.2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget).style.background = 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(109,40,217,0.08))';
                  (e.currentTarget).style.borderColor = 'rgba(139,92,246,0.3)';
                  (e.currentTarget).style.boxShadow = 'none';
                }}
              >
                <ScrollText size={16} />
                View Terms & Conditions
              </button>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <GlassCard title={ii.language} icon={Globe}>
              <p className="text-xs text-[var(--text-muted)] mb-4">{ii.selectLanguage}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${language === lang.code ? 'border-[var(--accent-violet)] bg-[rgba(139,92,246,0.1)] shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)]'}`}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{lang.flag}</span>
                    <div>
                      <div className={`text-sm font-bold ${language === lang.code ? 'text-[var(--accent-violet-light)]' : 'text-[var(--text-primary)]'}`}>
                        {lang.nativeName}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">{lang.name}</div>
                    </div>
                    {language === lang.code && <span className="ml-auto text-[var(--accent-violet-light)] text-lg">✓</span>}
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>
          {/* Appearance */}
          <motion.div variants={itemVariants}>
            <GlassCard title="Appearance" icon={Monitor}>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-[var(--text-primary)]">Theme</h4>
                  <div className="flex bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] p-1 rounded-xl">
                    <button 
                      onClick={() => theme === 'light' && toggleTheme()}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${theme === 'dark' ? 'bg-[rgba(139,92,246,0.2)] text-[var(--accent-violet-light)] shadow-sm' : 'text-[var(--text-muted)] hover:text-white'}`}
                    >
                      <Moon size={16} /> Dark
                    </button>
                    <button 
                      onClick={() => theme === 'dark' && toggleTheme()}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${theme === 'light' ? 'bg-[rgba(139,92,246,0.2)] text-[var(--accent-violet-light)] shadow-sm' : 'text-[var(--text-muted)] hover:text-white'}`}
                    >
                      <Sun size={16} /> Light
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3 text-[var(--text-primary)]">Typography</h4>
                  <div className="mb-4">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] mb-2 block">Display Font (Headings)</span>
                    <div className="grid grid-cols-2 gap-2">
                      {displayFonts.map(font => (
                        <button
                          key={font.name}
                          onClick={() => setFontDisplay(font.name)}
                          className={`p-3 rounded-xl border text-left transition-all ${fontDisplay === font.name ? 'border-[var(--accent-violet)] bg-[rgba(139,92,246,0.1)]' : 'border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)]'}`}
                        >
                          <div className="text-sm font-bold text-white mb-1" style={{ fontFamily: `'${font.name}', sans-serif` }}>{font.name}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">{font.preview}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] mb-2 block">Body Font (Content)</span>
                    <div className="grid grid-cols-3 gap-2">
                      {bodyFonts.map(font => (
                        <button
                          key={font.name}
                          onClick={() => setFontBody(font.name)}
                          className={`p-3 rounded-xl border text-left transition-all ${fontBody === font.name ? 'border-[var(--accent-violet)] bg-[rgba(139,92,246,0.1)]' : 'border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)]'}`}
                        >
                          <div className="text-[11px] font-medium text-white mb-1" style={{ fontFamily: `'${font.name}', sans-serif` }}>{font.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
            
            <div className="mt-6">
              <GlassCard title="API Integrations" icon={SettingsIcon}>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Groq API Key (AI Chat)</label>
                    <input 
                      type="password" 
                      value="************************"
                      readOnly
                      className="w-full bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-sm text-[var(--text-muted)] cursor-not-allowed"
                    />
                    <div className="text-[10px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" /> Keys are managed securely via environment variables
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Firebase Project ID</label>
                    <input 
                      type="text" 
                      value={process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "noctrail-interactive"}
                      readOnly
                      className="w-full bg-[rgba(0,0,0,0.2)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-sm text-[var(--text-muted)] cursor-not-allowed"
                    />
                  </div>
                </div>
              </GlassCard>
            </div>
          </motion.div>

          {/* Widget Ordering */}
          <motion.div variants={itemVariants}>
            <GlassCard title="Dashboard Layout" icon={GripVertical}>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                Drag to reorder sections. Toggle the switch to show or hide the widget on your briefing dashboard.
              </p>
              
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={widgets}
                  strategy={verticalListSortingStrategy}
                >
                  {widgets.map((widget) => (
                    <SortableItem key={widget.id} id={widget.id} label={widget.label} active={widget.active} toggle={toggleWidget} />
                  ))}
                </SortableContext>
              </DndContext>
              
            </GlassCard>
          </motion.div>
        </div>

      </motion.div>

      {/* ═══ Terms & Conditions Modal ═══ */}
      {showTerms && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowTerms(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #13131f 0%, #0d0d14 100%)',
              border: '1px solid rgba(139,92,246,0.25)',
              boxShadow: '0 0 60px rgba(139,92,246,0.15), 0 25px 50px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
              style={{
                background: 'linear-gradient(180deg, #13131f 0%, rgba(19,19,31,0.95) 100%)',
                borderBottom: '1px solid rgba(139,92,246,0.15)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-violet), #6d28d9)',
                    boxShadow: '0 0 20px rgba(139,92,246,0.35)',
                  }}
                >
                  <ScrollText size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Terms & Conditions</h2>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">Last updated: April 7, 2026</p>
                </div>
              </div>
              <button
                id="close-terms-button"
                onClick={() => setShowTerms(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget).style.background = 'rgba(239,68,68,0.15)';
                  (e.currentTarget).style.borderColor = 'rgba(239,68,68,0.3)';
                  (e.currentTarget).style.color = '#f87171';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget).style.background = 'rgba(255,255,255,0.05)';
                  (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.1)';
                  (e.currentTarget).style.color = 'var(--text-muted)';
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-6" style={{ maxHeight: 'calc(85vh - 72px)' }}>

              {/* Introduction */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Welcome to <strong className="text-white">BriefAI</strong> (powered by Noctrail Interactive). By accessing or using our platform, you agree to be bound by these Terms and Conditions. Please read them carefully before using our services.
                </p>
              </div>

              {/* Section 1 */}
              <TermsSection icon={Globe} number="1" title="Service Description">
                <p>BriefAI is an AI-powered CEO Morning Briefing Platform designed for Indian business executives and entrepreneurs. The platform provides:</p>
                <ul>
                  <li>AI-generated daily market briefings synthesized from real-time data sources</li>
                  <li>Interactive AI chat assistant for market analysis and business intelligence</li>
                  <li>Real-time market data including NIFTY 50, SENSEX, commodities, and currency rates</li>
                  <li>Portfolio tracking and management tools</li>
                  <li>Curated business news, global events, and VC funding highlights</li>
                  <li>Customizable dashboards and alert notifications</li>
                </ul>
              </TermsSection>

              {/* Section 2 */}
              <TermsSection icon={Shield} number="2" title="User Accounts & Authentication">
                <p>To access BriefAI, you must create an account using Google OAuth or email authentication via Firebase. By creating an account, you agree that:</p>
                <ul>
                  <li>You are at least 18 years of age or have parental consent</li>
                  <li>All information provided during registration is accurate and current</li>
                  <li>You are responsible for maintaining the security of your account credentials</li>
                  <li>You will notify us immediately of any unauthorized access to your account</li>
                  <li>You may not share your account with others or create multiple accounts</li>
                </ul>
                <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in suspicious activity.</p>
              </TermsSection>

              {/* Section 3 */}
              <TermsSection icon={CreditCard} number="3" title="Subscription & Payments">
                <p>BriefAI offers both Free and Premium subscription tiers:</p>
                <ul>
                  <li><strong className="text-white">Free Plan:</strong> Limited features including 3 AI chat messages per day, basic market data, and standard briefings</li>
                  <li><strong className="text-white">Premium Plan:</strong> Unlimited AI chat, PDF &amp; Excel exports, deep analysis, portfolio AI advisor, priority briefings, data backup/restore, and a premium badge</li>
                </ul>
                <p>Premium subscriptions are billed on a recurring basis. By subscribing, you authorize us to charge your selected payment method. You may cancel your subscription at any time through the Settings page, which will take effect immediately. No refunds will be issued for partial billing periods.</p>
              </TermsSection>

              {/* Section 4 */}
              <TermsSection icon={Brain} number="4" title="AI-Generated Content Disclaimer">
                <div className="p-3 rounded-lg mb-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <p style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.8rem' }}>⚠️ Important Investment Disclaimer</p>
                </div>
                <p>All AI-generated content on BriefAI, including but not limited to daily briefings, market analysis, sector insights, risk alerts, and chat responses, is provided for <strong className="text-white">informational and educational purposes only</strong>. This content:</p>
                <ul>
                  <li>Does <strong className="text-white">NOT</strong> constitute financial, investment, legal, or tax advice</li>
                  <li>Should <strong className="text-white">NOT</strong> be relied upon as the sole basis for any investment decision</li>
                  <li>May contain inaccuracies, errors, or hallucinations inherent to AI language models</li>
                  <li>Is generated using Google Gemini and Groq Llama models, which may produce varying results</li>
                  <li>Does not guarantee any financial outcome or market prediction accuracy</li>
                </ul>
                <p>Always consult with a qualified financial advisor before making investment decisions. Past performance data does not guarantee future results. BriefAI and Noctrail Interactive shall not be held liable for any financial losses incurred based on AI-generated content.</p>
              </TermsSection>

              {/* Section 5 */}
              <TermsSection icon={Database} number="5" title="Data Collection & Privacy">
                <p>We collect and process the following data to provide our services:</p>
                <ul>
                  <li><strong className="text-white">Account Data:</strong> Name, email address, profile photo (via Google OAuth / Firebase Auth)</li>
                  <li><strong className="text-white">Usage Data:</strong> Dashboard preferences, widget configurations, theme settings, and font choices</li>
                  <li><strong className="text-white">Briefing History:</strong> AI-generated daily briefings stored in Firebase Firestore</li>
                  <li><strong className="text-white">Portfolio Data:</strong> Stock holdings, transaction history, and portfolio preferences</li>
                  <li><strong className="text-white">Chat Logs:</strong> Conversations with the AI assistant for context continuity</li>
                </ul>
                <p>Your data is stored securely on Firebase (Google Cloud) infrastructure. We do not sell, share, or distribute your personal data to third parties for advertising purposes. You may request data export (backup) or complete data deletion (wipe) at any time through the Settings page.</p>
              </TermsSection>

              {/* Section 6 */}
              <TermsSection icon={Globe} number="6" title="Third-Party Services & APIs">
                <p>BriefAI integrates with the following third-party services to provide real-time intelligence and secure interactions:</p>
                <ul>
                  <li><strong className="text-white">Hugging Face Inference API</strong> — Primary AI engine using Llama-3 models for briefing generation and chat analysis.</li>
                  <li><strong className="text-white">Yahoo Finance</strong> — Source for real-time market indices (NIFTY 50, SENSEX), stock quotes, and historical financial data.</li>
                  <li><strong className="text-white">Alpha Vantage API</strong> — Macro-economic news sentiment analysis and real-time commodities/forex data (Gold, Crude Oil, USD/INR).</li>
                  <li><strong className="text-white">GNews API</strong> — High-speed search and aggregation of latest business and financial news articles.</li>
                  <li><strong className="text-white">Firebase (Google Cloud)</strong> — Secure user authentication, encrypted database storage for briefings, and cloud hosting infrastructure.</li>
                  <li><strong className="text-white">Razorpay</strong> — Secure payment gateway for processing premium subscription upgrades and transactions.</li>
                  <li><strong className="text-white">Resend</strong> — Automated transactional email infrastructure for delivering daily market intelligence reports.</li>
                </ul>
                <p>These services are governed by their own respective terms of service and privacy policies. Noctrail Interactive is not responsible for any downtime, data handling practices, or changes in third-party service availability.</p>
              </TermsSection>

              {/* Section 7 */}
              <TermsSection icon={FileText} number="7" title="Intellectual Property">
                <p>All content, designs, code, branding, logos, and UI elements of BriefAI are the intellectual property of Noctrail Interactive and its developers — Surajit Mondal, Sayandeep Pradhan, and Samiran De. You may not:</p>
                <ul>
                  <li>Copy, reproduce, or redistribute any part of the platform without written permission</li>
                  <li>Reverse-engineer, decompile, or attempt to extract the source code</li>
                  <li>Use scraping tools, bots, or automated scripts to extract data from the platform</li>
                  <li>Modify, create derivative works from, or commercially exploit the platform content</li>
                  <li>Remove or alter any copyright, trademark, or proprietary notices</li>
                </ul>
              </TermsSection>

              {/* Section 8 */}
              <TermsSection icon={Shield} number="8" title="Acceptable Use Policy">
                <p>By using BriefAI, you agree <strong className="text-white">NOT</strong> to:</p>
                <ul>
                  <li>Use the platform for any illegal or unauthorized purpose</li>
                  <li>Attempt to gain unauthorized access to other users&apos; accounts or data</li>
                  <li>Interfere with or disrupt the platform&apos;s infrastructure or services</li>
                  <li>Upload malicious code, viruses, or harmful content</li>
                  <li>Abuse the AI chat system with harmful, offensive, or manipulative prompts</li>
                  <li>Use the platform to spread misinformation about financial markets</li>
                  <li>Circumvent any rate limits, access controls, or subscription restrictions</li>
                </ul>
              </TermsSection>

              {/* Section 9 */}
              <TermsSection icon={Scale} number="9" title="Limitation of Liability">
                <p>To the maximum extent permitted by applicable law:</p>
                <ul>
                  <li>BriefAI and Noctrail Interactive provide the platform on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind</li>
                  <li>We do not guarantee uninterrupted, error-free, or secure access to the platform</li>
                  <li>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Our total liability shall not exceed the amount paid by you for the service in the preceding 12 months</li>
                  <li>We are not responsible for any investment losses, trading decisions, or financial outcomes resulting from the use of AI-generated content</li>
                </ul>
              </TermsSection>

              {/* Section 10 */}
              <TermsSection icon={FileText} number="10" title="Modifications to Terms">
                <p>Noctrail Interactive reserves the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting to the platform. Continued use of BriefAI after modifications constitutes acceptance of the updated terms. We will make reasonable efforts to notify users of significant changes via email or in-app notifications.</p>
              </TermsSection>

              {/* Section 11 */}
              <TermsSection icon={Scale} number="11" title="Governing Law & Dispute Resolution">
                <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these terms or the use of BriefAI shall be subject to the exclusive jurisdiction of the courts in Kolkata, West Bengal, India.</p>
              </TermsSection>

              {/* Section 12 */}
              <TermsSection icon={Mail} number="12" title="Contact Information">
                <p>For questions, concerns, or requests regarding these Terms and Conditions, please contact the development team:</p>
                <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ marginBottom: '0.25rem' }}><strong className="text-white">Noctrail Interactive</strong></p>
                  <p style={{ marginBottom: '0.25rem' }}>Developers: Surajit Mondal, Sayandeep Pradhan, Samiran De</p>
                  <p>Platform: BriefAI — AI-Powered CEO Morning Briefing</p>
                </div>
              </TermsSection>

              {/* Acceptance Footer */}
              <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs text-[var(--text-muted)] text-center leading-relaxed">
                  By continuing to use BriefAI, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                </p>
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setShowTerms(false)}
                    className="btn-primary px-8 py-2.5 text-sm cursor-pointer"
                  >
                    I Understand & Accept
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

/* ═══ Terms Section Component ═══ */
function TermsSection({ icon: Icon, number, title, children }: { icon: any; number: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          <Icon size={14} style={{ color: '#a78bfa' }} />
        </div>
        <h3 className="text-sm font-bold text-white">
          <span style={{ color: '#8b5cf6', marginRight: '0.35rem' }}>{number}.</span>
          {title}
        </h3>
      </div>
      <div className="terms-section-body pl-10 space-y-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {children}
      </div>
    </div>
  );
}
