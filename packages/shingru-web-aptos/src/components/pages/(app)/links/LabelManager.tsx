"use client";

import React, { useState, useRef, useEffect } from "react";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";
import LabelBadge from "@/components/common/LabelBadge";
import { motion, AnimatePresence } from "motion/react";

interface LabelManagerProps {
  labels: string[];
  onLabelsChange: (labels: string[]) => void;
  availableLabels?: string[]; // Suggested/common labels
  maxLabels?: number;
}

// Common predefined labels
const COMMON_LABELS = [
  "payments done",
  "created",
  "expired",
  "active",
  "pending",
  "completed",
  "draft",
  "urgent",
];

export default function LabelManager({
  labels,
  onLabelsChange,
  availableLabels = COMMON_LABELS,
  maxLabels = 10,
}: LabelManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter out labels that are already added
  const availableSuggestions = availableLabels.filter(
    (label) => !labels.includes(label.toLowerCase().trim())
  );

  const handleAddLabel = (labelText?: string) => {
    const labelToAdd = (labelText || newLabel).toLowerCase().trim();
    
    if (!labelToAdd) return;
    
    // Check if label already exists
    if (labels.includes(labelToAdd)) {
      setNewLabel("");
      setIsAdding(false);
      return;
    }

    // Check max labels limit
    if (labels.length >= maxLabels) {
      alert(`Maximum ${maxLabels} labels allowed`);
      return;
    }

    // Add label
    onLabelsChange([...labels, labelToAdd]);
    setNewLabel("");
    setIsAdding(false);
    setShowSuggestions(false);
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    onLabelsChange(labels.filter((label) => label !== labelToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddLabel();
    } else if (e.key === "Escape") {
      setIsAdding(false);
      setNewLabel("");
      setShowSuggestions(false);
    }
  };

  // Focus input when adding
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Existing labels */}
        <AnimatePresence>
          {labels.map((label) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <LabelBadge label={label} onRemove={handleRemoveLabel} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add label button/input */}
        {!isAdding && labels.length < maxLabels && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors"
            type="button"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Add Label</span>
          </button>
        )}

        {/* Input for new label */}
        {isAdding && (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={newLabel}
              onChange={(e) => {
                setNewLabel(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                // Delay to allow clicking on suggestions
                setTimeout(() => {
                  if (!newLabel.trim()) {
                    setIsAdding(false);
                  }
                  setShowSuggestions(false);
                }, 200);
              }}
              placeholder="Type label name..."
              className="px-2.5 py-1 rounded-full text-xs font-medium border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]"
            />

            {/* Suggestions dropdown */}
            {showSuggestions && availableSuggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto min-w-[200px]">
                {availableSuggestions
                  .filter((suggestion) =>
                    suggestion.toLowerCase().includes(newLabel.toLowerCase())
                  )
                  .slice(0, 5)
                  .map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleAddLabel(suggestion)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {labels.length === 0 && !isAdding && (
        <p className="text-xs text-gray-400">No labels added yet</p>
      )}
    </div>
  );
}

