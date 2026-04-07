"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import AnimatedGrid from "@/components/AnimatedGrid";
import GlassCard from "@/components/GlassCard";
import { Settings as SettingsIcon, GripVertical, Save, Moon, Sun, Monitor, Crown, AlertTriangle, Database, Download, Trash2, Upload } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useRouter } from "next/navigation";
import { wipeUserHistory, getDailyBriefingHistory, restoreUserHistory } from "@/lib/firebaseClient";
import SectionHeader from "@/components/SectionHeader";

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
    fontBody, setFontBody
  } = useData();
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </>
  );
}
