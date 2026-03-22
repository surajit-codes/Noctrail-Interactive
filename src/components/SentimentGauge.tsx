"use client";

import { useEffect, useState } from "react";

interface SentimentGaugeProps {
  score: number; // -1.0 to 1.0
  size?: number;
}

export default function SentimentGauge({ score, size = 140 }: SentimentGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedScore(score);
    }, 300);
    return () => clearTimeout(timeout);
  }, [score]);

  const radius = (size / 2) * 0.75;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 10;
  const circumference = Math.PI * radius; // half circle arc

  // Normalize score (-1 to 1) → 0 to 1
  const normalized = (animatedScore + 1) / 2;
  const dashOffset = circumference * (1 - normalized);

  // Color gradient based on score
  const color =
    score >= 0.3
      ? "#10b981" // green
      : score <= -0.3
      ? "#ef4444" // red
      : "#f59e0b"; // amber

  const label =
    score >= 0.3 ? "BULLISH" : score <= -0.3 ? "BEARISH" : "NEUTRAL";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size / 2 + 20}
        viewBox={`0 0 ${size} ${size / 2 + 20}`}
        style={{ overflow: "visible" }}
      >
        {/* Background arc */}
        <path
          d={describeArc(cx, cy, radius, 180, 360)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Animated fill arc */}
        <path
          d={describeArc(cx, cy, radius, 180, 360)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease",
            filter: `drop-shadow(0 0 6px ${color}60)`,
          }}
        />
        {/* Score text */}
        <text
          x={cx}
          y={cy - 5}
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill={color}
          fontFamily="JetBrains Mono, monospace"
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        >
          {score >= 0 ? "+" : ""}{animatedScore.toFixed(2)}
        </text>
        {/* Min/Max labels */}
        <text x={cx - radius - 4} y={cy + 18} textAnchor="middle" fontSize="9" fill="rgba(100,116,139,0.8)" fontFamily="Inter, sans-serif">BEAR</text>
        <text x={cx + radius + 4} y={cy + 18} textAnchor="middle" fontSize="9" fill="rgba(100,116,139,0.8)" fontFamily="Inter, sans-serif">BULL</text>
      </svg>
      <span
        className="text-xs font-bold tracking-widest font-mono"
        style={{ color, textShadow: `0 0 10px ${color}60` }}
      >
        {label}
      </span>
    </div>
  );
}

// Helper to describe an SVG arc path
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
