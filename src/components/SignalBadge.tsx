type Signal = "BUY" | "HOLD" | "AVOID";
type Severity = "HIGH" | "MEDIUM" | "LOW";
type Urgency = "HIGH" | "MEDIUM" | "LOW";
type Momentum = "STRONG" | "MODERATE" | "WEAK";

interface SignalBadgeProps {
  value: Signal | Severity | Urgency | Momentum | string;
  size?: "sm" | "md";
}

function getClass(value: string): string {
  switch (value) {
    case "BUY":
    case "STRONG":
      return "badge-buy";
    case "HOLD":
    case "MODERATE":
      return "badge-hold";
    case "AVOID":
    case "HIGH":
    case "WEAK":
      return "badge-avoid";
    case "MEDIUM":
    case "LOW":
      return "badge-hold";
    default:
      return "badge-hold";
  }
}

export default function SignalBadge({ value, size = "sm" }: SignalBadgeProps) {
  const cls = getClass(value);
  const fontSize = size === "md" ? "text-xs" : "";
  return (
    <span className={`${cls} ${fontSize} font-mono`}>
      {value}
    </span>
  );
}
