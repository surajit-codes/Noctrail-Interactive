"use client";

import { motion } from "framer-motion";

export default function Preloader() {
  const title = "BriefAI";
  const tagline = "CEO Morning Briefing Platform";

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
    exit: {
      opacity: 0,
      transition: { ease: "easeInOut", duration: 0.5 },
    },
  };

  const letterVariants = {
    initial: { y: 20, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.6, 0.05, -0.01, 0.9],
      },
    },
  };

  const taglineVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 1.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={containerVariants}
    >
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
            filter: "blur(60px)",
            borderRadius: "50%",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Title */}
        <div className="flex overflow-hidden">
          {title.split("").map((char, index) => (
            <motion.span
              key={index}
              variants={letterVariants}
              className="text-4xl md:text-6xl font-bold tracking-tight display-font text-white"
              style={{
                textShadow: "0 0 20px rgba(255, 255, 255, 0.1)",
                display: "inline-block",
              }}
            >
              {char}
            </motion.span>
          ))}
        </div>

        {/* Animated Tagline */}
        <motion.p
          variants={taglineVariants}
          className="mt-6 text-sm md:text-base font-medium tracking-[0.2em] uppercase text-slate-400 text-center px-4"
          style={{
            fontFamily: "var(--font-body)",
            letterSpacing: "0.25em",
          }}
        >
          {tagline}
        </motion.p>
      </div>

      {/* Modern Minimalist Loader Line */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent w-full"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{
          duration: 2.5,
          ease: "easeInOut",
          repeat: Infinity,
        }}
        style={{ originX: 0.5 }}
      />
    </motion.div>
  );
}
