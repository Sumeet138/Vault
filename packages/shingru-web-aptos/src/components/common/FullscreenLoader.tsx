"use client";

import { AnimatePresence, motion } from "motion/react";

export default function FullscreenLoader({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center justify-center gap-1">
        <div className="loading loading-dots w-10 text-gray-600"></div>

        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={text}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-gray-600 font-medium"
            >
              {text}
            </motion.p>
          </AnimatePresence>
        </div>
        {/* <AnimatedShinyText text={text} className="font-medium" /> */}
      </div>
    </div>
  );
}
