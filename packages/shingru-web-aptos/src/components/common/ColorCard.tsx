import { COLOR_PICKS } from "@/config/styling";
import React, { ReactNode } from "react";

interface ColorCardProps {
  children: ReactNode;
  className?: string;
  color?: string;
  onClick?: () => void;
}

export default function ColorCard({
  children,
  className = "",
  color = "blue",
  onClick,
}: ColorCardProps) {
  // Get color object for all colors including primary
  const colorObj = COLOR_PICKS.find((c) => c.id === color) || COLOR_PICKS[0];

  return (
    <div
      className={`relative flex flex-col overflow-hidden transition-all ${className}`}
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, ${colorObj.value} 0%, ${colorObj.value}60 100%)`,
      }}
    >
      {/* Decorative corner accent */}
      {/* <div
        className="absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 rotate-45 opacity-50"
        style={{ background: colorObj.value }}
      /> */}

      {/* White background container */}
      {children}
    </div>
  );
}
