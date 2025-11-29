"use client";

import React, { useRef, useLayoutEffect, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircleIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { getTransitionConfig } from "@/config/animation";
import { Sound, useSound } from "@/providers/SoundProvider";

interface UsernameAvailStatusPillProps {
  validationError: string | null;
  isChecking: boolean;
  isAvailable: boolean | null;
  username: string;
  debouncedUsername: string;
  originalUsername?: string;
  restrictedUsernames: string[];
}

export default function UsernameAvailStatusPill({
  validationError,
  isChecking,
  isAvailable,
  username,
  debouncedUsername,
  originalUsername = "",
  restrictedUsernames = [],
}: UsernameAvailStatusPillProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  // We keep a visible status key and update it only when a final state is known.
  // This avoids intermediate "default" or "checking" flashes while fetching.
  const [visibleKey, setVisibleKey] = useState<string>("default");
  const [lastErrorText, setLastErrorText] = useState<string | null>(null);
  const { playSound } = useSound();

  useEffect(() => {
    if (validationError) {
      setLastErrorText(validationError);
    }
  }, [validationError]);

  // Decide when to update the visible status key
  useEffect(() => {
    // Immediate local validations
    if (validationError) {
      setVisibleKey("error");
      return;
    }

    if (restrictedUsernames.includes(username)) {
      setVisibleKey("unavailable");
      return;
    }

    // While typing or checking external availability, keep the current view
    if (username !== debouncedUsername || isChecking) {
      return;
    }

    // At this point, input is stable and not checking. Move directly to resolved state.
    if (isAvailable === true && username && username !== originalUsername) {
      setVisibleKey("available");
      return;
    }

    if (isAvailable === false) {
      setVisibleKey("unavailable");
      return;
    }

    // Fallback when nothing is decided
    setVisibleKey("default");
  }, [
    validationError,
    restrictedUsernames,
    username,
    debouncedUsername,
    isChecking,
    isAvailable,
    originalUsername,
    playSound,
  ]);

  const getStatusContentFromKey = (key: string) => {
    switch (key) {
      case "error":
        return {
          key: "error",
          text: validationError ?? lastErrorText ?? "Invalid username",
          icon: <XCircleIcon className="w-4 h-4 stroke-2" />,
          bgColor: "#ffe2e2",
          color: "#ff4545",
        };
      case "available":
        return {
          key: "available",
          text: "Username is available!",
          icon: <CheckCircleIcon className="w-4 h-4 stroke-2" />,
          bgColor: "#e2ffe2",
          color: "#24ce62",
        };
      case "unavailable":
        return {
          key: "unavailable",
          text: "Username is not available",
          icon: <XCircleIcon className="w-4 h-4 stroke-2" />,
          bgColor: "#ffe2e2",
          color: "#ff4545",
        };
      case "checking":
        return {
          key: "checking",
          text: "Checking availability...",
          icon: <div className="loading loading-spinner loading-sm stroke-2" />,
          bgColor: "#e2f5ff",
          color: "#45a3ff",
        };
      default:
        return {
          key: "default",
          text: "Enter your new username",
          icon: <MagnifyingGlassIcon className="w-4 h-4 stroke-2" />,
          bgColor: "#f9fafb",
          color: "#454545",
        };
    }
  };

  const statusContent = getStatusContentFromKey(visibleKey);

  useLayoutEffect(() => {
    const measure = () => {
      const contentEl = contentRef.current;
      const containerEl = containerRef.current;
      if (!contentEl || !containerEl) return;

      const contentWidth = contentEl.offsetWidth;
      const styles = getComputedStyle(containerEl);
      const paddingLeft = parseFloat(styles.paddingLeft) || 0;
      const paddingRight = parseFloat(styles.paddingRight) || 0;

      setMeasuredWidth(contentWidth + paddingLeft + paddingRight);
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    if (contentRef.current) ro.observe(contentRef.current);

    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [visibleKey, lastErrorText, validationError]);

  return (
    <div className="flex justify-center w-full items-center">
      <motion.div
        ref={containerRef}
        initial={false}
        animate={{
          // Animate to a concrete numeric width; "auto" isn't animatable
          width: measuredWidth ?? undefined,
          backgroundColor: statusContent.bgColor,
        }}
        transition={{
          ...getTransitionConfig("SPRING_SMOOTH_TWO"),
        }}
        className="rounded-full flex items-center gap-2 px-2.5 py-1 h-7 text-xs font-medium overflow-hidden relative"
      >
        {/* Invisible content for measuring the width */}
        <div
          ref={contentRef}
          className="invisible whitespace-nowrap flex items-center gap-1.5"
        >
          {statusContent.icon}
          <p className="whitespace-nowrap">{statusContent.text}</p>
        </div>

        {/* AnimatePresence for the visible content */}
        <AnimatePresence initial={false}>
          <motion.div
            key={statusContent.key}
            initial={{ opacity: 0, y: "-100%", scale: 0.9 }}
            animate={{
              opacity: 1,
              y: "0%",
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: "100%",
              scale: 0.9,
            }}
            transition={{
              ...getTransitionConfig("SPRING_SMOOTH_TWO"),
            }}
            className="flex items-center gap-1.5 text-xs font-medium absolute inset-0 justify-center"
            style={{ color: statusContent.color }}
          >
            {statusContent.icon}
            <p className="whitespace-nowrap">{statusContent.text}</p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
