import React from "react";
import { motion } from "framer-motion";

export const LivingBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-neutral-950 pointer-events-none">
      {/* Gradient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] bg-indigo-900/20 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -60, 0],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
        className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] bg-cyan-900/20 rounded-full blur-[120px]"
      />
      
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};
