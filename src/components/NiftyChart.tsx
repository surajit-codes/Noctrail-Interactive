"use client";

import { useRef, useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { LineChart as LineIcon, CandlestickChart } from "lucide-react";
import { useData } from "@/context/DataContext";
import { t } from "@/lib/i18n";

interface OHLCVPoint {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
}

interface NiftyChartProps {
  data: OHLCVPoint[];
  name?: string;
  mode?: "line" | "candle";
  onModeChange?: (mode: "line" | "candle") => void;
}

/* ─── Line Chart Tooltip ─── */
function LineTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "rgba(13,13,20,0.97)",
        border: "1px solid rgba(139,92,246,0.3)",
        borderRadius: "10px",
        padding: "0.75rem 1rem",
        boxShadow: "0 4px 24px rgba(139,92,246,0.2)",
      }}>
        <p style={{ color: "#5c5874", fontSize: "0.68rem", marginBottom: "4px" }}>{label}</p>
        <p style={{ color: "#a78bfa", fontFamily: "JetBrains Mono, monospace", fontWeight: 600, fontSize: "0.95rem" }}>
          ₹{payload[0].value?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
}

/* ─── Pure Canvas Candlestick Chart ─── */
function CanvasCandles({ data }: { data: OHLCVPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { language } = useData();
  const i = t(language);
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; d: OHLCVPoint; visible: boolean;
  }>({ x: 0, y: 0, d: data[0], visible: false });

  const drawChart = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || data.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const W = rect.width;
    const H = 220;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const padding = { top: 10, right: 10, bottom: 25, left: 50 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    // Price range
    const allPrices = data.flatMap(d => [d.close, d.open ?? d.close, d.high ?? d.close, d.low ?? d.close]);
    const minP = Math.min(...allPrices) * 0.997;
    const maxP = Math.max(...allPrices) * 1.003;
    const priceRange = maxP - minP;

    const toY = (price: number) => padding.top + (1 - (price - minP) / priceRange) * chartH;

    // Grid lines
    ctx.strokeStyle = "rgba(139,92,246,0.07)";
    ctx.setLineDash([3, 3]);
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (i / gridLines) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      const price = maxP - (i / gridLines) * priceRange;
      ctx.fillStyle = "#5c5874";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      const label = price >= 1000 ? `${(price / 1000).toFixed(1)}K` : price.toFixed(0);
      ctx.fillText(label, padding.left - 6, y + 3);
    }
    ctx.setLineDash([]);

    // Candles
    const barW = chartW / data.length;
    const candleW = Math.max(Math.min(barW * 0.6, 12), 3);

    data.forEach((d, idx) => {
      const cx = padding.left + (idx + 0.5) * barW;
      const open = d.open ?? d.close;
      const close = d.close;
      const high = d.high ?? Math.max(open, close);
      const low = d.low ?? Math.min(open, close);
      const isUp = close >= open;
      const color = isUp ? "#10b981" : "#ff4d4d"; // Vibrant Red/Emerald
      const glowColor = isUp ? "rgba(16,185,129,0.2)" : "rgba(255,77,77,0.2)";

      const yH = toY(high);
      const yL = toY(low);
      const yO = toY(open);
      const yC = toY(close);

      const bodyTop = Math.min(yO, yC);
      const bodyH = Math.max(Math.abs(yO - yC), 1.5);

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, yH);
      ctx.lineTo(cx, yL);
      ctx.stroke();

      // Body Glow (only for significant candles)
      if (bodyH > 4) {
        ctx.shadowBlur = 4;
        ctx.shadowColor = glowColor;
      }

      // Body
      ctx.fillStyle = color;
      ctx.fillRect(cx - candleW / 2, bodyTop, candleW, bodyH);

      // Body border for clarity
      ctx.strokeStyle = isUp ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(cx - candleW / 2, bodyTop, candleW, bodyH);
      
      // Reset shadow
      ctx.shadowBlur = 0;
    });

    // X-axis labels (every Nth)
    const labelInterval = Math.max(1, Math.floor(data.length / 6));
    ctx.fillStyle = "#5c5874";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    data.forEach((d, idx) => {
      if (idx % labelInterval !== 0) return;
      const cx = padding.left + (idx + 0.5) * barW;
      const label = d.date
        ? new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
        : "";
      ctx.fillText(label, cx, H - 5);
    });
  };

  useEffect(() => {
    drawChart();
    const onResize = () => drawChart();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [data]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const W = rect.width;
    const padding = { left: 50, right: 10 };
    const chartW = W - padding.left - padding.right;
    const barW = chartW / data.length;
    const idx = Math.floor((mouseX - padding.left) / barW);
    if (idx >= 0 && idx < data.length) {
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, d: data[idx], visible: true });
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  };

  const d = tooltip.d;
  const isUp = d && (d.close >= (d.open ?? d.close));
  const tColor = isUp ? "#10b981" : "#ef4444";

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: 220 }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(prev => ({ ...prev, visible: false }))}
      />
      {tooltip.visible && d && (
        <div style={{
          position: "absolute",
          left: Math.min(tooltip.x + 12, (containerRef.current?.clientWidth ?? 300) - 160),
          top: Math.max(tooltip.y - 80, 0),
          background: "rgba(13,13,20,0.97)",
          border: `1px solid ${tColor}60`,
          borderRadius: "10px",
          padding: "0.65rem 0.85rem",
          boxShadow: `0 4px 24px ${tColor}30`,
          minWidth: "130px",
          pointerEvents: "none",
          zIndex: 50,
        }}>
          <p style={{ color: "#5c5874", fontSize: "0.68rem", marginBottom: "4px" }}>
            {d.date ? new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "1px 8px", fontFamily: "JetBrains Mono, monospace", fontSize: "0.78rem" }}>
            <span style={{ color: "#6b7280" }}>{i.open}</span>
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>₹{(d.open ?? d.close)?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            <span style={{ color: "#6b7280" }}>{i.high}</span>
            <span style={{ color: "#10b981", fontWeight: 600 }}>₹{(d.high ?? d.close)?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            <span style={{ color: "#6b7280" }}>{i.low}</span>
            <span style={{ color: "#ef4444", fontWeight: 600 }}>₹{(d.low ?? d.close)?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            <span style={{ color: "#6b7280" }}>{i.close}</span>
            <span style={{ color: tColor, fontWeight: 700 }}>₹{d.close?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export default function NiftyChart({ data, name = "NIFTY 50", mode = "line", onModeChange }: NiftyChartProps) {
  const { language } = useData();
  const i = t(language);
  const chartName = name === "NIFTY 50" ? i.nifty50 : name === "SENSEX" ? i.sensexLabel : name;
  const gradientId = `grad-${chartName.replace(/\s/g, "")}`;
  const isPositive = data.length >= 2 && data[data.length - 1].close >= data[0].close;
  const chartColor = isPositive ? "#10b981" : "#ef4444";

  const formattedData = data.map((d) => ({
    date: d.date
      ? new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
      : d.date,
    close: d.close,
  }));

  const prices = data.map((d) => d.close).filter(Boolean);
  const minPrice = Math.min(...prices) * 0.998;
  const maxPrice = Math.max(...prices) * 1.002;

  return (
    <div>
      {/* ─── Mode Toggle ─── */}
      {onModeChange && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
          <div style={{
            display: "inline-flex",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            padding: "3px",
            gap: "2px",
          }}>
            <button
              onClick={() => onModeChange("line")}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "5px 12px", borderRadius: "8px", border: "none", cursor: "pointer",
                fontSize: "0.7rem", fontWeight: 600, transition: "all 0.2s",
                background: mode === "line" ? "rgba(139,92,246,0.2)" : "transparent",
                color: mode === "line" ? "#a78bfa" : "#6b7280",
              }}
            >
              <LineIcon size={13} /> {i.chartLine}
            </button>
            <button
              onClick={() => onModeChange("candle")}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "5px 12px", borderRadius: "8px", border: "none", cursor: "pointer",
                fontSize: "0.7rem", fontWeight: 600, transition: "all 0.2s",
                background: mode === "candle" ? "rgba(139,92,246,0.2)" : "transparent",
                color: mode === "candle" ? "#a78bfa" : "#6b7280",
              }}
            >
              <CandlestickChart size={13} /> {i.chartCandle}
            </button>
          </div>
        </div>
      )}

      {mode === "line" ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={formattedData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="60%" stopColor={chartColor} stopOpacity={0.08} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.07)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#5c5874", fontSize: 10, fontFamily: "Inter, sans-serif" }}
              tickLine={false} axisLine={false} interval={4}
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              tick={{ fill: "#5c5874", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
              tickLine={false} axisLine={false}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toFixed(0)}
              width={45}
            />
            <Tooltip content={<LineTooltip />} />
            <Area
              type="monotone" dataKey="close" stroke={chartColor} strokeWidth={2.5}
              fill={`url(#${gradientId})`} dot={false}
              activeDot={{ r: 5, fill: chartColor, stroke: "rgba(13,13,20,0.9)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <CanvasCandles data={data} />
      )}
    </div>
  );
}
