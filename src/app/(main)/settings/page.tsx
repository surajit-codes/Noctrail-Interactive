"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import AnimatedGrid from "@/components/AnimatedGrid";
import GlassCard from "@/components/GlassCard";
import { Settings as SettingsIcon, GripVertical, Save, Moon, Sun, Monitor, Type } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
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
      
      {/* Toggle switch for active state */}
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
  
  const [isSaving, setIsSaving] = useState(false);

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
    // Values are already updated via individual setters, 
    // but this button provides explicit confirmation.
    setTimeout(() => {
      setIsSaving(false);
      addToast("Preferences saved successfully", "success");
    }, 600);
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
                  
                  {/* Display Font */}
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

                  {/* Body Font */}
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
