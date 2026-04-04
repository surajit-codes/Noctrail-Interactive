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
}

interface DualChartProps {
  data1: OHLCVPoint[];
  data2: OHLCVPoint[];
  name1?: string;
  name2?: string;
  color1?: string;
  color2?: string;
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
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color, fontFamily: "JetBrains Mono, monospace", fontWeight: 600, fontSize: "0.95rem" }}>
            {entry.name}: ₹{entry.value?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function DualChart({ 
  data1, 
  data2, 
  name1 = "NIFTY 50", 
  name2 = "SENSEX",
  color1 = "#8b5cf6",
  color2 = "#10b981"
}: DualChartProps) {
  const gradientId1 = `grad-dual-1`;
  const gradientId2 = `grad-dual-2`;

  // Merge data based on date (use raw ISO date for mapping and sorting)
  const mergedDataMap = new Map();
  
  data1.forEach((d) => {
    const rawDate = d.date ? d.date.split('T')[0] : "";
    const displayDate = d.date ? new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "";
    mergedDataMap.set(rawDate, { rawDate, date: displayDate, value1: d.close });
  });

  data2.forEach((d) => {
    const rawDate = d.date ? d.date.split('T')[0] : "";
    const displayDate = d.date ? new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "";
    if (mergedDataMap.has(rawDate)) {
      mergedDataMap.get(rawDate).value2 = d.close;
    } else {
      mergedDataMap.set(rawDate, { rawDate, date: displayDate, value2: d.close });
    }
  });

  const formattedData = Array.from(mergedDataMap.values()).sort((a, b) => {
    return new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime();
  });

  // Calculate distinct domains
  const prices1 = data1.map((d) => d.close).filter(Boolean);
  const minPrice1 = Math.min(...prices1) * 0.99;
  const maxPrice1 = Math.max(...prices1) * 1.01;

  const prices2 = data2.map((d) => d.close).filter(Boolean);
  const minPrice2 = Math.min(...prices2) * 0.99;
  const maxPrice2 = Math.max(...prices2) * 1.01;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formattedData} margin={{ top: 5, right: 30, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId1} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color1} stopOpacity={0.3} />
            <stop offset="60%" stopColor={color1} stopOpacity={0.08} />
            <stop offset="100%" stopColor={color1} stopOpacity={0} />
          </linearGradient>
          <linearGradient id={gradientId2} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color2} stopOpacity={0.3} />
            <stop offset="60%" stopColor={color2} stopOpacity={0.08} />
            <stop offset="100%" stopColor={color2} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.07)" vertical={false} />
        
        <XAxis
          dataKey="date"
          tick={{ fill: "#5c5874", fontSize: 10, fontFamily: "Inter, sans-serif" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={30}
        />
        
        {/* Left Y Axis for NIFTY */}
        <YAxis
          yAxisId="left"
          domain={[minPrice1, maxPrice1]}
          tick={{ fill: "#5c5874", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toFixed(0)}
          width={45}
        />
        
        {/* Right Y Axis for SENSEX */}
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[minPrice2, maxPrice2]}
          tick={{ fill: "#5c5874", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toFixed(0)}
          width={45}
        />

        <Tooltip content={<CustomTooltip />} />
        
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="value1"
          name={name1}
          stroke={color1}
          strokeWidth={2.5}
          fill={`url(#${gradientId1})`}
          dot={false}
          activeDot={{ r: 5, fill: color1, stroke: "rgba(13,13,20,0.9)", strokeWidth: 2 }}
        />
        
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="value2"
          name={name2}
          stroke={color2}
          strokeWidth={2.5}
          fill={`url(#${gradientId2})`}
          dot={false}
          activeDot={{ r: 5, fill: color2, stroke: "rgba(13,13,20,0.9)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
