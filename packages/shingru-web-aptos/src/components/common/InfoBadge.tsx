import { cnm } from "@/utils/style";
import React from "react";

type ColorVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "danger"
  | "warning"
  | "success"
  | "info"
  | "background"
  | "neutral";

function InfoBadge({
  children,
  title,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  title?: React.ReactNode;
  variant?: ColorVariant;
  className?: string;
}) {
  const getBgColor = () => {
    switch (variant) {
      case "primary":
        return "bg-primary-600";
      case "secondary":
        return "bg-secondary-600";
      case "tertiary":
        return "bg-tertiary-600";
      case "danger":
        return "bg-danger-600";
      case "warning":
        return "bg-warning-600";
      case "success":
        return "bg-success-600";
      case "info":
        return "bg-info-600";
      case "background":
        return "bg-gray-50";
      case "neutral":
        return "bg-neutral-200 text-neutral-800";
      default:
        return "bg-primary-600";
    }
  };

  return (
    <div
      className={cnm(
        `flex flex-col text-white rounded-[1.6rem] p-1`,
        getBgColor(),
        className
      )}
    >
      {title && (
        <div className="flex items-center justify-center gap-2 text-center text-sm py-1.5 -mt-1 font-semibold">
          {title}
        </div>
      )}
      <div className="bg-white text-gray-900 rounded-[1.4rem] p-4">{children}</div>
    </div>
  );
}

export default InfoBadge;
