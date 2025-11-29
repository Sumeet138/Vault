import React from "react";
import { motion } from "motion/react";
import CuteButton from "./CuteButton";
import MainButton from "./MainButton";

interface MenuItemProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "solid" | "flat" | "bordered" | "ghost";
  disabled?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  children,
  onClick,
  className = "",
  size = "md",
  variant = "light",
  disabled = false,
}) => {
  const sizeClasses = {
    sm: {
      icon: "w-4 h-4",
      text: "text-sm",
      padding: "py-3",
    },
    md: {
      icon: "w-5 h-5",
      text: "text-md",
      padding: "py-4",
    },
    lg: {
      icon: "w-6 h-6",
      text: "text-lg",
      padding: "py-5",
    },
  };

  const currentSize = sizeClasses[size];

  const iconWithSize = icon ? (
    <div
      className={`${currentSize.icon} flex items-center justify-center flex-shrink-0`}
    >
      {icon}
    </div>
  ) : null;

  return (
    <motion.div whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
      <MainButton
        onClick={onClick}
        classNameContainer="flex-1"
        className={`w-full justify-start ${currentSize.text} ${currentSize.padding} h-auto font-medium [&>span:first-child]:mr-3 ${className}`}
        disabled={disabled}
      >
        <div className="flex items-center justify-center gap-2">
          {iconWithSize}
          {children}
        </div>
      </MainButton>
    </motion.div>
  );
};

export default MenuItem;
