"use client";

import { motion } from "framer-motion";

export default function AnimatedLogo() {
  const lineVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.15, duration: 0.6, ease: "easeInOut" },
        opacity: { delay: i * 0.15, duration: 0.3 },
      },
    }),
  };

  const containerVariants = {
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <div className="relative w-16 h-16">
      <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2">
        <motion.g
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-indigo-500"
        >
          {/* Left circle */}
          <motion.circle cx="20" cy="20" r="8" custom={0} variants={lineVariants} />
          
          {/* Right circle */}
          <motion.circle cx="44" cy="20" r="8" custom={1} variants={lineVariants} />
          
          {/* Bottom circle */}
          <motion.circle cx="32" cy="44" r="8" custom={2} variants={lineVariants} />
          
          {/* Left to Bottom */}
          <motion.line x1="24" y1="26" x2="28" y2="38" custom={3} variants={lineVariants} />
          
          {/* Right to Bottom */}
          <motion.line x1="40" y1="26" x2="36" y2="38" custom={4} variants={lineVariants} />
          
          {/* Left to Right */}
          <motion.line x1="28" y1="18" x2="36" y2="18" custom={5} variants={lineVariants} />
        </motion.g>
      </svg>

      {/* Pulsing background glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
