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
          background: "rgba(10,22,40,0.95)",
          border: "1px solid rgba(0,212,255,0.2)",
          borderRadius: "0.5rem",
          padding: "0.75rem 1rem",
        }}
      >
        <p style={{ color: "#64748b", fontSize: "0.7rem", marginBottom: "4px" }}>{label}</p>
        <p style={{ color: "#00d4ff", fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>
          ₹{payload[0].value?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
}

export default function NiftyChart({ data, name = "NIFTY 50", color = "#00d4ff" }: NiftyChartProps) {
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
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formattedData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
            <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#64748b", fontSize: 10, fontFamily: "Inter, sans-serif" }}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <YAxis
          domain={[minPrice, maxPrice]}
          tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
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
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: chartColor, stroke: "rgba(10,22,40,0.8)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
