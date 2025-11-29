"use client";

import React from "react";
import { cnm } from "@/utils/style";
import { COLOR_PICKS } from "@/config/styling";
import { motion, AnimatePresence, Transition } from "motion/react";
import Spinner from "../ui/spinner";

interface CuteButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  radius?: "none" | "sm" | "md" | "lg" | "full";
  variant?:
    | "solid"
    | "flat"
    | "bordered"
    | "light"
    | "faded"
    | "shadow"
    | "ghost";
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  isDisabled?: boolean;
  isLoading?: boolean;
  onPress?: () => void;
  fullWidth?: boolean;
  isIconOnly?: boolean;
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "default"
    | "gray"
    | "blue"
    | "purple"
    | "pink"
    | "green"
    | "yellow"
    | "red"
    | "teal";
}

export default function CuteButton({
  children,
  className = "",
  size = "lg",
  radius = "lg",
  variant = "solid",
  startContent,
  endContent,
  isDisabled,
  isLoading,
  onPress,
  fullWidth = false,
  isIconOnly = false,
  color = "primary",
  onClick,
  ...props
}: CuteButtonProps) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-14 h-14",
  };

  const sizeClasses = {
    sm: isIconOnly ? iconSizes.sm : "btn-sm",
    md: isIconOnly ? iconSizes.md : "btn-md",
    lg: isIconOnly ? iconSizes.lg : "btn-lg",
    xl: isIconOnly ? iconSizes.xl : "btn-lg px-8 py-4 text-xl",
  };

  const radiusClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  // Check if color is from COLOR_PICKS
  const customColor = COLOR_PICKS.find((pick) => pick.id === color);
  const isCustomColor = !!customColor;

  // DaisyUI color mapping
  const daisyUIColorMap = {
    primary:
      "bg-primary border-none text-gray-900 hover:bg-primary/80 disabled:bg-gray-200",
    secondary: "btn-secondary",
    success: "btn-success",
    warning: "btn-warning",
    danger: "btn-error",
    default: "btn-neutral",
    gray: "btn-neutral",
    blue: "btn-info",
    purple: "btn-secondary",
    pink: "btn-secondary",
    green: "btn-success",
    yellow: "btn-warning",
    red: "btn-error",
    teal: "btn-info",
  };

  // DaisyUI variant mapping
  const variantClasses = {
    solid: "",
    flat: "btn-ghost",
    bordered: "btn-outline",
    light: "btn-ghost",
    faded: "btn-ghost",
    shadow: "shadow-lg",
    ghost: "btn-ghost",
  };

  const baseClasses = [
    "relative",
    "btn",
    "font-semibold",
    "tracking-tight",
    "transition-all",
    "duration-200",
    "shadow-none",
    "flex items-center justify-center",
    "overflow-hidden",
    fullWidth ? "w-full" : "",
    sizeClasses[size],
    radiusClasses[radius],
    variantClasses[variant],
    !isCustomColor ? daisyUIColorMap[color] || daisyUIColorMap.primary : "",
    isIconOnly
      ? "aspect-square !p-0 flex items-center justify-center min-w-0"
      : "",
    isLoading ? "pointer-events-none" : "", // Disable pointer events when loading
  ]
    .filter(Boolean)
    .join(" ");

  // Custom color classes for COLOR_PICKS
  const getCustomColorClasses = () => {
    if (!customColor) return "";

    switch (variant) {
      case "solid":
        return "border-transparent hover:opacity-90 active:opacity-80";
      case "bordered":
        return "border-2 bg-transparent hover:bg-opacity-10 active:bg-opacity-20";
      case "light":
        return "border-transparent hover:bg-opacity-20 active:bg-opacity-30";
      case "flat":
        return "border-transparent hover:bg-opacity-90 active:bg-opacity-80";
      case "faded":
        return "border border-opacity-20 bg-opacity-10 hover:bg-opacity-20 active:bg-opacity-30";
      case "ghost":
        return "border-transparent bg-transparent hover:bg-opacity-10 active:bg-opacity-20";
      case "shadow":
        return "text-white border-transparent hover:opacity-90 active:opacity-80 shadow-lg";
      default:
        return "text-white border-transparent hover:opacity-90 active:opacity-80";
    }
  };

  const getCustomStyle = () => {
    if (!customColor) return {};

    const mainColor = customColor.value;
    const lightColor = customColor.light;

    switch (variant) {
      case "solid":
      case "shadow":
        return {
          backgroundColor: mainColor,
          borderColor: mainColor,
        };
      case "bordered":
        return {
          borderColor: mainColor,
          color: mainColor,
          backgroundColor: "transparent",
        };
      case "light":
        return {
          backgroundColor: lightColor,
          color: mainColor,
        };
      case "flat":
        return {
          backgroundColor: lightColor,
          color: mainColor,
        };
      case "faded":
        return {
          backgroundColor: `${mainColor}1A`, // 10% opacity
          borderColor: `${mainColor}33`, // 20% opacity
          color: mainColor,
        };
      case "ghost":
        return {
          color: mainColor,
          backgroundColor: "transparent",
        };
      default:
        return {
          backgroundColor: mainColor,
          borderColor: mainColor,
        };
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onPress) {
      onPress();
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      className={cnm(
        baseClasses,
        isCustomColor ? getCustomColorClasses() : "",
        className
      )}
      style={isCustomColor ? getCustomStyle() : {}}
      disabled={isDisabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      <AnimatePresence initial={false} mode="wait">
        {isLoading ? (
          <motion.div
            key="spinner"
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: "0%" }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute"
          >
            <Spinner />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: "0%" }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="flex items-center justify-center absolute"
          >
            {startContent && <span className="mr-2">{startContent}</span>}
            {children}
            {endContent && <span className="ml-2">{endContent}</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
