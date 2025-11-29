"use client";

import { getTransitionConfig } from "@/config/animation";
import { motion } from "motion/react";
import { useAuth } from "@/providers/AuthProvider";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { ChevronLeft } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
  showBackButton?: boolean;
}

export default function StepIndicator({
  currentStep,
  totalSteps,
  className = "",
  showBackButton = false,
}: StepIndicatorProps) {
  const { disconnect } = useAuth();
  const isAllCompleted = currentStep >= totalSteps;
  return (
    <motion.div
      className={`flex items-center justify-center ${className} fixed w-full top-0 left-0 py-8 px-6`}
      initial={{ y: "-100%" }}
      animate={{ y: "0%" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {showBackButton && (
        <button
          onClick={disconnect}
          className="absolute left-5 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
      )}
      {/* Simple Dotted Step Indicator */}
      <div className="flex items-center w-full max-w-[180px]">
        <motion.div
          className="flex-1 h-3 relative overflow-hidden bg-gray-100 rounded-full"
          // animate={{
          //   marginRight: isAllCompleted ? 0 : 12,
          //   borderTopRightRadius: isAllCompleted ? (isLast ? 12 : 0) : 12,
          //   borderBottomRightRadius: isAllCompleted
          //     ? isLast
          //       ? 12
          //       : 0
          //     : 12,
          //   borderTopLeftRadius: isAllCompleted ? (isFirst ? 12 : 0) : 12,
          //   borderBottomLeftRadius: isAllCompleted
          //     ? isFirst
          //       ? 12
          //       : 0
          //     : 12,
          // }}
          transition={{ ...(getTransitionConfig("SPRING_SMOOTH_ONE") as any) }}
        >
          <motion.div
            className="size-full bg-black origin-left absolute inset-0"
            initial={{
              scaleX: 0,
            }}
            animate={{
              scaleX: currentStep * (1 / totalSteps),
              backgroundColor: isAllCompleted
                ? "oklch(0.747 0.199 149.47)"
                : "#030712",
            }}
            transition={{
              ...(getTransitionConfig("SPRING_SMOOTH_ONE") as any),
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
