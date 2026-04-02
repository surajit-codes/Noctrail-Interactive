"use client";

import { motion } from "framer-motion";
import { BrainCircuit } from "lucide-react";

export default function Preloader() {
  return (
    <div className="flex flex-col h-screen w-full items-center justify-center relative overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* Background Animated Gradient */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(139,92,246,0.08) 0%, transparent 40%)",
            "radial-gradient(circle at 80% 50%, rgba(139,92,246,0.12) 0%, transparent 40%)",
            "radial-gradient(circle at 20% 50%, rgba(139,92,246,0.08) 0%, transparent 40%)",
          ],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Glow effect behind icon */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90px",
            height: "90px",
            background: "var(--accent-violet)",
            filter: "blur(30px)",
            borderRadius: "50%",
            zIndex: -1,
          }}
        />

        {/* Brain Icon Box */}
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 76,
            height: 76,
            borderRadius: "20px",
            background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(109,40,217,0.1))",
            border: "1px solid rgba(139,92,246,0.3)",
            boxShadow: "0 0 40px rgba(139,92,246,0.2), inset 0 0 20px rgba(139,92,246,0.05)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <motion.div
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <BrainCircuit size={38} style={{ color: "var(--accent-violet-light)" }} />
          </motion.div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <h2 className="text-2xl font-bold display-font" style={{ color: "white", letterSpacing: "0.05em" }}>BriefAI</h2>
          <div className="flex gap-1.5 mt-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--accent-violet-light)",
                  boxShadow: "0 0 8px var(--accent-violet-light)",
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
