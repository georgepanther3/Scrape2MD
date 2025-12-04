import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export const TerminalLog: React.FC = () => {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const steps = [
      "Initializing chromium instance...",
      "Masking user-agent...",
      "Connecting to target URL...",
      "Waiting for network idle...",
      "Bypassing anti-bot checks...",
      "Extracting DOM content...",
      "Cleaning HTML nodes...",
      "Converting to Markdown...",
      "Optimizing output..."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setLines(prev => [...prev, steps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto mt-8 font-mono text-sm"
    >
      <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-4 h-48 overflow-hidden shadow-inner">
        <div className="flex flex-col gap-1">
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-emerald-400/80 flex items-center gap-2"
            >
              <span className="text-white/20">➜</span>
              {line}
            </motion.div>
          ))}
          <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="w-2 h-4 bg-emerald-500 mt-1"
          />
        </div>
      </div>
    </motion.div>
  );
};
