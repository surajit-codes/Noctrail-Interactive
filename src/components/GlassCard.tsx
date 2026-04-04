"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
  glowColor?: "cyan" | "green" | "red" | "purple" | "amber" | "violet";
  pulseRed?: boolean;
  title?: string;
  icon?: any;
}

export default function GlassCard({
  children,
  className = "",
  glowColor,
  pulseRed = false,
  title,
  icon: Icon,
  ...motionProps
}: GlassCardProps) {
  const glowClass = glowColor ? `glow-${glowColor === "cyan" ? "violet" : glowColor}` : "";
  const pulseClass = pulseRed ? "pulse-red" : "";

  return (
    <motion.div
      className={`glass-card p-5 ${glowClass} ${pulseClass} ${className}`}
      whileHover={{ scale: 1.005 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      {...motionProps}
    >
      {title && (
        <div className="flex items-center gap-2 mb-4 text-[var(--accent-violet)] text-sm font-bold uppercase tracking-wider">
          {Icon && <Icon size={18} />}
          <span>{title}</span>
        </div>
      )}
      {children}
    </motion.div>
  );
}
