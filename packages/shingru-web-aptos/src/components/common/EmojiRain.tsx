"use client";

import React from "react";
import { cn } from "@/lib/utils";

const EmojiRain = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const emojis = ["💸", "✨", "🏷️", "🔗", "😊", "🤑", "😎", "🤩"];
  const emojiElements = Array.from({ length: 30 }).map((_, i) => {
    const style = {
      left: `${Math.random() * 100}vw`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${5 + Math.random() * 5}s`,
      fontSize: `${1 + Math.random()}rem`,
    };
    return (
      <span key={i} className="emoji-rain-emoji" style={style}>
        {emojis[i % emojis.length]}
      </span>
    );
  });

  return (
    <div className={cn("emoji-rain-container", className)} {...props}>
      {emojiElements}
    </div>
  );
};

export default EmojiRain;
