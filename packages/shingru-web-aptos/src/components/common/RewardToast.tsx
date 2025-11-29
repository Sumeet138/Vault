"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export interface RewardToastProps {
  isOpen: boolean;
  onClose: () => void;
  tokenAmount: number;
  tokenSymbol: string;
  eventType: string;
  autoCloseDuration?: number;
}

export function RewardToast({
  isOpen,
  onClose,
  tokenAmount,
  tokenSymbol,
  eventType,
  autoCloseDuration = 5000,
}: RewardToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isOpen) {
      setProgress(100);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoCloseDuration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, autoCloseDuration, onClose]);

  const getEventMessage = () => {
    switch (eventType) {
      case "link_created":
        return "Payment link created";
      case "payment_completed":
        return "Payment received";
      default:
        return "Action completed";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
          className="fixed top-4 right-4 z-50 max-w-sm w-full"
        >
          <div className="bg-white rounded-2xl shadow-supa-smooth border border-black/5 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-xl">🎉</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Reward Earned!
                      </h3>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {getEventMessage()}
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Close"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-lg font-bold text-green-600">
                      +{tokenAmount}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {tokenSymbol}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
              <motion.div
                className="h-full bg-green-500"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.05, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
