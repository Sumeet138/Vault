import React from "react";
import EmojiPicture from "@/components/common/EmojiPicture";

type Props = {
  emoji: string;
  color?:
    | "gray"
    | "blue"
    | "purple"
    | "pink"
    | "green"
    | "yellow"
    | "red"
    | "teal";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function SoftEmojiBadge({
  emoji,
  color = "blue",
  size = "md",
  className = "",
}: Props) {
  const sizeMap = { sm: "p-1.5", md: "p-2", lg: "p-2.5" } as const;
  return (
    <div
      className={`rounded-full border border-black/10 bg-background-50 ${sizeMap[size]} ${className}`}
    >
      <EmojiPicture
        emoji={emoji}
        color={color}
        size={size === "lg" ? "lg" : "md"}
      />
    </div>
  );
}
