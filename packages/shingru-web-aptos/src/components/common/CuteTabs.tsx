import React, { useState } from "react";

export interface CuteTabItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}

type CustomVariant = "solid" | "bordered" | "light" | "underlined" | "text";

interface CuteTabsProps {
  items: CuteTabItem[];
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: CustomVariant;
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  isVertical?: boolean;
  placement?: "top" | "bottom" | "start" | "end";
  fullWidth?: boolean;
  animated?: boolean;
  selectedKey?: string;
  defaultSelectedKey?: string;
  onSelectionChange?: (key: string | number) => void;
}

// Utility function to combine class names
const cn = (...classes: (string | undefined | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

const CuteTabs = React.memo(function CuteTabs({
  items,
  className = "",
  size = "md",
  variant = "solid",
  color = "primary",
  radius = "2xl",
  isVertical = false,
  placement = "top",
  fullWidth = false,
  animated = true,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
}: CuteTabsProps) {
  const [internalSelectedKey, setInternalSelectedKey] = useState(
    defaultSelectedKey || items[0]?.id || ""
  );

  const currentSelectedKey =
    selectedKey !== undefined ? selectedKey : internalSelectedKey;

  const handleSelectionChange = (key: string) => {
    if (selectedKey === undefined) {
      setInternalSelectedKey(key);
    }
    onSelectionChange?.(key);
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-sm gap-1",
    md: "px-3 py-2 text-sm gap-2",
    lg: "px-4 py-3 text-base gap-2",
  };

  const radiusClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  };

  // Get color classes based on color prop
  const getColorClasses = (isSelected: boolean, variant: string) => {
    const colorMap = {
      default: isSelected
        ? "bg-white text-gray-900"
        : "text-gray-500 hover:text-gray-700",
      primary: isSelected
        ? "bg-gray-950 text-white"
        : "text-gray-500 hover:text-gray-800",
      secondary: isSelected
        ? "bg-purple-500 text-white"
        : "text-purple-600 hover:text-purple-700",
      success: isSelected
        ? "bg-green-500 text-white"
        : "text-green-600 hover:text-green-700",
      warning: isSelected
        ? "bg-yellow-500 text-white"
        : "text-yellow-600 hover:text-yellow-700",
      danger: isSelected
        ? "bg-red-500 text-white"
        : "text-red-600 hover:text-red-700",
    };

    if (variant === "solid") {
      return colorMap[color];
    }

    // For other variants, use simpler text-only styling
    return isSelected
      ? "text-gray-900 font-semibold"
      : "text-gray-500 hover:text-gray-700";
  };

  // Custom text variant implementation
  if (variant === "text") {
    return (
      <div className={cn("cute-tabs-container", className)}>
        <div
          className={cn(
            "flex items-center gap-1",
            isVertical ? "flex-col items-start" : "flex-row"
          )}
        >
          {items.map((item) => {
            const isSelected = currentSelectedKey === item.id;
            const isDisabled = item.disabled;

            return (
              <button
                key={item.id}
                disabled={isDisabled}
                onClick={() => !isDisabled && handleSelectionChange(item.id)}
                className={cn(
                  "relative font-medium transition-all duration-200 ease-out rounded-md",
                  sizeClasses[size],
                  getColorClasses(isSelected, "text"),
                  isDisabled && "opacity-50 cursor-not-allowed",
                  !isDisabled && !isSelected && "hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-2">
                  {item.icon && (
                    <span className="text-current">{item.icon}</span>
                  )}
                  <span>{item.title}</span>
                </div>

                {isSelected && (
                  <div
                    className={cn(
                      "absolute bottom-0 left-0 right-0 h-0.5 bg-gray-950 rounded-full",
                      animated && "transition-all duration-200"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          {items.find((item) => item.id === currentSelectedKey)?.content}
        </div>
      </div>
    );
  }

  // Main tab variants
  const TabList = () => (
    <div
      className={cn(
        "relative flex",
        isVertical ? "flex-col" : "flex-row",
        variant === "solid" && "bg-gray-100",
        variant === "bordered" && "border border-gray-300",
        radiusClasses[radius],
        fullWidth && "w-full"
      )}
    >
      {items.map((item) => {
        const isSelected = currentSelectedKey === item.id;
        const isDisabled = item.disabled;

        let tabClasses = cn(
          "relative font-medium transition-all duration-300 ease-out flex items-center justify-center cursor-pointer",
          sizeClasses[size],
          radiusClasses[radius],
          fullWidth && "flex-1"
        );

        // Apply variant styling
        if (variant === "solid") {
          tabClasses = cn(
            tabClasses,
            getColorClasses(isSelected, "solid"),
            !isSelected && "opacity-70 hover:opacity-100"
          );
        } else if (variant === "bordered") {
          tabClasses = cn(
            tabClasses,
            "border",
            isSelected
              ? "border-gray-400 bg-gray-50 text-gray-900"
              : "border-gray-300 text-gray-700 hover:text-gray-900"
          );
        } else if (variant === "light") {
          tabClasses = cn(
            tabClasses,
            isSelected
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          );
        } else if (variant === "underlined") {
          tabClasses = cn(
            tabClasses,
            "border-b-2",
            isSelected
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-600 hover:text-gray-900"
          );
        }

        if (isDisabled) {
          tabClasses = cn(tabClasses, "opacity-50 cursor-not-allowed");
        }

        return (
          <button
            key={item.id}
            disabled={isDisabled}
            onClick={() => !isDisabled && handleSelectionChange(item.id)}
            className={tabClasses}
          >
            <div className="flex items-center gap-2">
              {item.icon && <span className="text-current">{item.icon}</span>}
              <span>{item.title}</span>
            </div>
          </button>
        );
      })}
    </div>
  );

  const Content = () => (
    <div className="mt-3">
      {items.find((item) => item.id === currentSelectedKey)?.content}
    </div>
  );

  // Handle different placements
  const renderTabs = () => {
    if (placement === "bottom") {
      return (
        <>
          <Content />
          <TabList />
        </>
      );
    } else if (placement === "start" && isVertical) {
      return (
        <div className="flex gap-4">
          <TabList />
          <div className="flex-1">
            <Content />
          </div>
        </div>
      );
    } else if (placement === "end" && isVertical) {
      return (
        <div className="flex gap-4">
          <div className="flex-1">
            <Content />
          </div>
          <TabList />
        </div>
      );
    } else {
      return (
        <>
          <TabList />
          <Content />
        </>
      );
    }
  };

  return (
    <div
      className={cn(
        "cute-tabs-container",
        fullWidth ? "w-full" : "",
        isVertical && (placement === "start" || placement === "end")
          ? "flex"
          : "",
        className
      )}
    >
      {renderTabs()}
    </div>
  );
});

export default CuteTabs;
