"use client";

import { useRef, useEffect, useState } from "react";
import AnimatedGrid from "@/components/AnimatedGrid";
import { useData } from "@/context/DataContext";
import { BrainCircuit, Send, Trash2, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "Good day. I'm BriefAI — your AI-powered CEO intelligence assistant. I'm synced with today's market data and briefing. How can I help you make better decisions today?",
  },
];

const QUICK_PROMPTS = [
  "Summarize today's market outlook",
  "What are the top risks today?",
  "Best sectors to watch?",
  "Any VC funding highlights?",
];

export default function ChatPage() {
  const { marketData } = useData();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Build messages array for API
    const apiMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, marketData }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || errorData.error || `Server responded with ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      const assistantId = Date.now().toString() + "-ai";
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            // Parser for Vercel AI SDK format (0:"text")
            if (line.startsWith('0:')) {
              try {
                const jsonStr = line.slice(2);
                const parsed = JSON.parse(jsonStr);
                assistantText += parsed;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: assistantText } : m
                  )
                );
              } catch (e) {
                // If it's not JSON, maybe it's raw text?
                const raw = line.slice(2);
                if (raw && !raw.startsWith('"')) {
                   assistantText += raw;
                   setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: assistantText } : m
                    )
                  );
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Chat message error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "-err",
          role: "assistant",
          content: `❌ **Error:** ${err.message || "I encountered an issue processing your request. Please check your internet connection or try again later."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages(INITIAL_MESSAGES);
    setInput("");
  };

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      <AnimatedGrid />
      
      {/* Main chat container — using flex-1 and min-h-0 to ensure it fills the space correctly without being blank */}
      <div className="relative z-10 flex flex-col h-full max-w-4xl mx-auto w-full pt-4 px-4 sm:px-6">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 rounded-t-2xl border-x border-t border-[rgba(139,92,246,0.2)]"
          style={{
            background: "rgba(13,13,22,0.85)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(109,40,217,0.2))",
                border: "1px solid rgba(139,92,246,0.4)",
              }}
            >
              <BrainCircuit size={20} className="text-[var(--accent-violet-light)]" />
            </div>
            <div>
              <h2 className="font-bold display-font text-sm text-[var(--text-primary)]">
                BriefAI Assistant
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  Live Synced
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={clearChat}
            className="p-2 rounded-lg transition-all hover:bg-red-400/10 text-[var(--text-muted)] hover:text-red-400"
            title="Clear Chat"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Messages area — scrollable */}
        <div
          className="flex-1 overflow-y-auto px-5 py-6 space-y-6 border-x border-[rgba(139,92,246,0.2)]"
          style={{
            background: "rgba(10,10,18,0.7)",
            backdropFilter: "blur(20px)",
          }}
        >
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-1 shadow-sm"
                style={{
                  background:
                    m.role === "user"
                      ? "rgba(255,255,255,0.08)"
                      : "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(109,40,217,0.3))",
                  border: m.role === "assistant" ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {m.role === "user" ? (
                  <User size={14} className="text-[var(--text-secondary)]" />
                ) : (
                  <BrainCircuit size={14} className="text-[var(--accent-violet-light)]" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                  m.role === "user" ? "rounded-tr-sm bg-[rgba(139,92,246,0.15)] text-[var(--text-primary)] border border-[rgba(139,92,246,0.2)]" 
                  : "rounded-tl-sm bg-[rgba(255,255,255,0.03)] text-[var(--text-primary)] border border-[rgba(255,255,255,0.08)]"
                }`}
              >
                <div 
                  className="prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: m.content
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n/g, "<br/>"),
                  }}
                />
              </div>
            </div>
          ))}
          
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
               <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ background: "rgba(139,92,246,0.4)", border: "1px solid rgba(139,92,246,0.3)" }}>
                 <BrainCircuit size={14} className="text-[var(--accent-violet-light)]" />
               </div>
               <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-2xl rounded-tl-sm px-4 py-3">
                 <div className="flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-violet-light)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-violet-light)] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-violet-light)] animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
               </div>
            </div>
          )}

          <div ref={bottomRef} className="h-4" />
        </div>

        {/* Input box */}
        <div
          className="px-5 py-4 rounded-b-2xl border-x border-b border-[rgba(139,92,246,0.2)] mb-4"
          style={{
            background: "rgba(13,13,22,0.9)",
            backdropFilter: "blur(20px)",
          }}
        >
          {messages.length === 1 && (
            <div className="mb-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] flex items-center gap-1.5 mb-2.5">
                <Sparkles size={11} className="text-amber-400" />
                Quick Actions
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-[11px] px-3 py-1.5 rounded-lg border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.05)] text-[var(--accent-violet-light)] hover:bg-[rgba(139,92,246,0.1)] transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-3 items-center">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] focus:border-[rgba(139,92,246,0.5)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] transition-all outline-none"
              placeholder="Ask me anything..."
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-tr from-[var(--accent-violet)] to-purple-600 shadow-lg shadow-purple-900/20 disabled:grayscale disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
            >
              <Send size={18} color="white" strokeWidth={2.5} />
            </button>
          </form>
          <div className="flex justify-between items-center mt-3">
            <span className="text-[9px] font-mono text-[var(--text-muted)] tracking-tighter uppercase">
              Powered by LLaMA 3.1 8B • Ultra Fast
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
