import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface CustomPinInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  isLoading?: boolean;
  showIndicator?: boolean;
  hideNumbers?: boolean;
}

export default function CustomPinInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  isLoading = false,
  showIndicator = true,
  hideNumbers = false,
}: CustomPinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Check for completion when value changes
  const prevValueRef = useRef(value);
  useEffect(() => {
    const prevValue = prevValueRef.current;
    prevValueRef.current = value;

    // Only trigger completion if value became complete and wasn't complete before
    const isNowComplete = value.length === length && /^\d+$/.test(value);
    const wasComplete = prevValue.length === length && /^\d+$/.test(prevValue);

    if (isNowComplete && !wasComplete && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  // This effect correctly manages focus when the component is enabled/disabled
  useEffect(() => {
    if (!disabled) {
      // Find the first empty input and focus it
      const firstEmptyIndex = value.length;
      if (inputRefs.current[firstEmptyIndex]) {
        setTimeout(() => inputRefs.current[firstEmptyIndex]?.focus(), 0);
      }
    } else {
      setActiveIndex(null);
    }
  }, [disabled, value.length]);

  const handleInputChange = (index: number, inputValue: string) => {
    const digits = inputValue.replace(/\D/g, "");

    if (digits.length > 0) {
      const digit = digits.slice(-1);
      // Clear all subsequent fields for a clean re-entry experience
      const updatedValue = value.substring(0, index) + digit;
      onChange(updatedValue);

      if (index < length - 1) {
        setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      e.preventDefault();

      // If the cursor is at the end (in an empty box after the last digit),
      // just delete the last digit.
      if (index === value.length && value.length > 0) {
        onChange(value.slice(0, -1));
      } else {
        // If the cursor is in the middle of the filled inputs,
        // clear from that point forward.
        onChange(value.substring(0, index));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    onChange(pastedData);
  };

  const shouldShowIndicator =
    activeIndex !== null && !disabled && showIndicator;

  const renderInput = (index: number) => {
    const hasValue = !!value[index];

    return (
      <motion.div key={index} className="relative">
        {/* Sliding indicator inside each input container */}
        {shouldShowIndicator && activeIndex === index && (
          <motion.div
            layoutId="pin-indicator"
            className="absolute inset-0 size-11 md:size-14 rounded-xl border-2 border-primary pointer-events-none z-10"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          />
        )}
        <motion.div
          className={`
            relative size-11 md:size-14 rounded-xl bg-gray-100 border-2 border-transparent transition-all duration-300
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          animate={{
            scale: hasValue ? 1.05 : 1,
          }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {/* Placeholder "0" */}
          <AnimatePresence>
            {!hasValue && (
              <motion.div
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold text-lg pointer-events-none"
              >
                0
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden Input - completely invisible */}
          <input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ""}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
            onClick={() => {
              // Just ensure focus, no selection to avoid stuck behavior
              inputRefs.current[index]?.focus();
            }}
            disabled={disabled}
            className="absolute inset-0 w-full h-full bg-transparent border-none outline-none text-transparent caret-transparent cursor-pointer"
            style={{
              caretColor: "transparent",
              color: "transparent",
            }}
          />

          {/* Animated number overlay */}
          <AnimatePresence>
            {hasValue && (
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{
                  duration: 0.15,
                  ease: [0.4, 0, 0.2, 1], // More tactile easing
                }}
                className={`absolute inset-0 flex items-center justify-center text-gray-900 font-bold text-lg pointer-events-none z-20 ${
                  isLoading ? "text-shimmer" : ""
                }`}
              >
                {hideNumbers ? (
                  <div className="size-3 rounded-full bg-gray-950"></div>
                ) : (
                  value[index]
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="relative flex justify-center items-center gap-2 md:gap-3 max-w-sm mx-auto w-full">
      {/* Opacity wrapper for the indicator system */}
      <AnimatePresence>
        {shouldShowIndicator && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>

      {/* First group of 3 inputs */}
      <div className="flex gap-2 md:gap-3">
        {Array.from({ length: 3 }, (_, index) => renderInput(index))}
      </div>

      {/* Light stripe separator */}
      <div>
        <div className="h-[2px] bg-gray-300 mx-2 w-4 rounded-full"></div>
      </div>

      {/* Second group of 3 inputs */}
      <div className="flex gap-2 md:gap-3">
        {Array.from({ length: 3 }, (_, index) => renderInput(index + 3))}
      </div>
    </div>
  );
}
