"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  color?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(13,13,20,0.97)",
          border: "1px solid rgba(139,92,246,0.3)",
          borderRadius: "10px",
          padding: "0.75rem 1rem",
          boxShadow: "0 4px 24px rgba(139,92,246,0.2)",
        }}
      >
        <p style={{ color: "#5c5874", fontSize: "0.68rem", marginBottom: "4px" }}>{label}</p>
        <p style={{ color: "#a78bfa", fontFamily: "JetBrains Mono, monospace", fontWeight: 600, fontSize: "0.95rem" }}>
          ₹{payload[0].value?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
}

export default function NiftyChart({ data, name = "NIFTY 50", color = "#8b5cf6" }: NiftyChartProps) {
  const gradientId = `grad-${name.replace(/\s/g, "")}`;

  const isPositive =
    data.length >= 2 && data[data.length - 1].close >= data[0].close;

  const chartColor = isPositive ? color : "#ef4444";

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
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <YAxis
          domain={[minPrice, maxPrice]}
          tick={{ fill: "#5c5874", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toFixed(0)
          }
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="close"
          stroke={chartColor}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 5, fill: chartColor, stroke: "rgba(13,13,20,0.9)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
