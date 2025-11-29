import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { SettingItem as SettingItemType } from "@/config/settings";

interface SettingItemProps {
  setting: SettingItemType;
  onClick: (settingId: string) => void;
  isGrouped?: boolean;
}

export default function SettingItem({
  setting,
  onClick,
  isGrouped = false,
}: SettingItemProps) {
  const handleClick = () => {
    onClick(setting.id);
  };
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`${
        isGrouped
          ? "px-5 py-4 cursor-pointer relative overflow-hidden"
          : "bg-white rounded-3xl overflow-hidden border border-black/5 shadow-supa-smooth transition-shadow px-4 py-4 cursor-pointer relative"
      } flex flex-row items-center justify-between w-full h-fit`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cute hover indicator */}
      <motion.div
        className="absolute inset-0 bg-background-500 z-0"
        animate={{
          scale: isHovered ? 1 : 0.4,
          opacity: isHovered ? 1 : 0,
        }}
        transition={{
          duration: 0.12,
          ease: "easeInOut",
        }}
      />
      <div className="flex flex-row items-center gap-2 relative z-10">
        <Image
          src={setting.icon}
          alt={setting.label}
          width={32}
          height={32}
          className="rounded-full w-8 h-8 mr-1"
        />
        <div className="text-base font-semibold">{setting.label}</div>
      </div>

      <div className="flex flex-row items-center gap-2 justify-end relative z-10">
        {setting.type !== "action" && setting.currentValue && (
          <div className="text-sm font-semibold text-black/40">
            {setting.currentValue}
          </div>
        )}
        {setting.type !== "action" && (
          <Image
            src="/assets/icons/three-dots.svg"
            alt=""
            width={24}
            height={24}
            className="w-5 h-5 opacity-40"
          />
        )}
      </div>
    </div>
  );
}
