import React from "react";
import { COLOR_PICKS, EMOJI_PICKS } from "@/config/styling";

interface EmojiPictureProps {
  emoji: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl" | "jumbo";
  className?: string;
}

export default function EmojiPicture({
  emoji,
  color = "blue",
  size = "md",
  className = "",
}: EmojiPictureProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-lg",
    md: "w-10 h-10 text-xl",
    lg: "w-12 h-12 text-xl",
    xl: "w-16 h-16 text-4xl",
    jumbo: "w-32 h-32 text-[4.5rem]",
  };

  const colorData = COLOR_PICKS.find((pick) => pick.id === color);
  const backgroundColor = colorData?.value || COLOR_PICKS[1].value; // Default to blue if color not found

  // Check if emoji is an ID from EMOJI_PICKS
  const emojiData = EMOJI_PICKS.find((pick) => pick.id === emoji);
  const displayEmoji = emojiData ? emojiData.emoji : emoji;

  return (
    <div
      className={`rounded-full flex items-center justify-center ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: backgroundColor,
      }}
    >
      {displayEmoji}
    </div>
  );
}
