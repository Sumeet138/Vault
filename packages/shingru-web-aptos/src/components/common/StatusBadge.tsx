"use client";

import React from "react";
import { motion } from "motion/react";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  BoltIcon,
} from "@heroicons/react/24/solid";
import { cnm } from "@/utils/style";

export type PaymentStatus = "pending" | "paid" | "unpaid" | "expired" | "active";

interface StatusBadgeProps {
  status: PaymentStatus;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

const statusConfig: Record<
  PaymentStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    colors: {
      bg: string;
      text: string;
      border: string;
      glow: string;
    };
  }
> = {
  pending: {
    label: "Pending",
    icon: ClockIcon,
    colors: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      border: "border-yellow-300",
      glow: "shadow-yellow-200",
    },
  },
  paid: {
    label: "Paid",
    icon: CheckCircleIcon,
    colors: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-300",
      glow: "shadow-green-200",
    },
  },
  unpaid: {
    label: "Unpaid",
    icon: XCircleIcon,
    colors: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-300",
      glow: "shadow-red-200",
    },
  },
  expired: {
    label: "Expired",
    icon: ExclamationTriangleIcon,
    colors: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-300",
      glow: "shadow-gray-200",
    },
  },
  active: {
    label: "Active",
    icon: BoltIcon,
    colors: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-300",
      glow: "shadow-blue-200",
    },
  },
};

export default function StatusBadge({
  status,
  size = "md",
  animated = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <motion.div
      initial={animated ? { scale: 0.8, opacity: 0 } : false}
      animate={animated ? { scale: 1, opacity: 1 } : false}
      whileHover={animated ? { scale: 1.05 } : false}
      whileTap={animated ? { scale: 0.95 } : false}
      className={cnm(
        "inline-flex items-center rounded-full font-semibold border-2 transition-all duration-300",
        config.colors.bg,
        config.colors.text,
        config.colors.border,
        sizeClasses[size],
        animated && `shadow-lg ${config.colors.glow}`,
        className
      )}
    >
      <motion.div
        animate={
          animated && status === "pending"
            ? {
                rotate: [0, 360],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                },
              }
            : animated && status === "paid"
            ? {
                scale: [1, 1.2, 1],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }
            : animated && status === "active"
            ? {
                opacity: [1, 0.5, 1],
                transition: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }
            : {}
        }
      >
        <Icon className={iconSizes[size]} />
      </motion.div>
      <span className="font-bold">{config.label}</span>
      {animated && status === "pending" && (
        <motion.span
          className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
}

