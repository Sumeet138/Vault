"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

interface CustomDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  align?: "left" | "right";
  sideOffset?: number;
  triggerClassName?: string;
  contentClassName?: string;
  wrapperClassName?: string;
  ariaLabel?: string;
}

function CustomDropdown({
  open,
  onOpenChange,
  trigger,
  children,
  disabled = false,
  align = "left",
  sideOffset = 8,
  triggerClassName,
  contentClassName,
  wrapperClassName,
  ariaLabel,
}: CustomDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuIdRef = useRef<string>(
    `custom-dropdown-${Math.random().toString(36).slice(2, 9)}`
  );

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        onOpenChange(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (disabled && open) {
      onOpenChange(false);
    }
  }, [disabled, open, onOpenChange]);

  const handleToggle = () => {
    if (disabled) return;
    onOpenChange(!open);
  };

  return (
    <div className={cn("relative", wrapperClassName)} ref={dropdownRef}>
      <button
        type="button"
        ref={buttonRef}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          triggerClassName
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuIdRef.current}
        onClick={handleToggle}
      >
        {trigger}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="custom-dropdown-content"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            role="menu"
            aria-label={ariaLabel}
            id={menuIdRef.current}
            className={cn(
              "absolute z-50 rounded-xl border border-gray-100 bg-white shadow-xl",
              align === "right" ? "right-0" : "left-0",
              contentClassName
            )}
            style={{ marginTop: sideOffset }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CustomDropdown;
