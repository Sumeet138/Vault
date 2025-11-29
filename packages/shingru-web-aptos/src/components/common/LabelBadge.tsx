import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cnm } from "@/utils/style";

interface LabelBadgeProps {
  label: string;
  onRemove?: (label: string) => void;
  variant?: "default" | "compact";
  className?: string;
}

// Predefined label colors for consistency
const LABEL_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-green-100 text-green-700 border-green-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-pink-100 text-pink-700 border-pink-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-yellow-100 text-yellow-700 border-yellow-200",
  "bg-red-100 text-red-700 border-red-200",
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-gray-100 text-gray-700 border-gray-200",
];

// Generate consistent color for a label based on its text
const getLabelColor = (label: string): string => {
  const hash = label.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return LABEL_COLORS[hash % LABEL_COLORS.length];
};

export default function LabelBadge({
  label,
  onRemove,
  variant = "default",
  className,
}: LabelBadgeProps) {
  const colorClass = getLabelColor(label);

  if (variant === "compact") {
    return (
      <span
        className={cnm(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
          colorClass,
          onRemove && "pr-1",
          className
        )}
      >
        <span className="truncate max-w-[100px]">{label}</span>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(label);
            }}
            className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
          >
            <XMarkIcon className="w-3 h-3" />
          </button>
        )}
      </span>
    );
  }

  return (
    <span
      className={cnm(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        colorClass,
        onRemove && "pr-1.5",
        className
      )}
    >
      <span className="truncate max-w-[120px]">{label}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(label);
          }}
          className="ml-0.5 hover:bg-black/10 rounded-full p-0.5 transition-colors"
          type="button"
        >
          <XMarkIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );
}

