"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
  glowColor?: "cyan" | "green" | "red" | "purple" | "amber";
  pulseRed?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  glowColor,
  pulseRed = false,
  ...motionProps
}: GlassCardProps) {
  const glowClass = glowColor ? `glow-${glowColor}` : "";
  const pulseClass = pulseRed ? "pulse-red" : "";

  return (
    <motion.div
      className={`glass-card p-6 ${glowClass} ${pulseClass} ${className}`}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
