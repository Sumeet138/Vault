"use client";

import React from "react";
import EmojiPicture from "@/components/common/EmojiPicture";

type LinkItem = {
  emoji: string;
  username: string;
  path?: string;
  label?: string;
};

const ROW_A: LinkItem[] = [
  { emoji: "🚀", username: "john", path: "freelance", label: "Freelance" },
  { emoji: "🎁", username: "angela", path: "tip", label: "Tip Jar" },
  { emoji: "🎓", username: "angela", path: "course", label: "Digital Course" },
  { emoji: "💻", username: "john", label: "Personal" },
  { emoji: "🎤", username: "mike", path: "event", label: "Event" },
];

const ROW_B: LinkItem[] = [
  { emoji: "💼", username: "studio", path: "consult", label: "Consulting" },
  { emoji: "✨", username: "angela", path: "premium", label: "Premium" },
  { emoji: "☕", username: "john", path: "coffee", label: "Support" },
  { emoji: "📦", username: "store", path: "digital", label: "Digital Product" },
  { emoji: "🎯", username: "mike", path: "goal", label: "Fundraiser" },
];

function LinkPill({ item }: { item: LinkItem }) {
  const href = `https://vault-aptos.vercel.app/${item.username}${item.path ? `/${item.path}` : ""}`;
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-background-50 px-4 py-2 select-none">
      <EmojiPicture emoji={item.emoji} size="sm" color="blue" />
      <span className="text-foreground/50 text-base">vault-aptos.vercel.app/</span>
      <span className="text-foreground text-base font-semibold">
        {item.username}
      </span>
      {item.path && (
        <>
          <span className="text-foreground/50 text-base">/</span>
          <span className="text-foreground text-base font-semibold">
            {item.path}
          </span>
        </>
      )}
      {item.label && (
        <span className="ml-1 rounded-full bg-gray-50/30 text-foreground/70 text-xs px-2 py-0.5">
          {item.label}
        </span>
      )}
    </div>
  );
}

export default function LinkShowcase() {
  // Duplicate rows for seamless marquee
  const rowA = [...ROW_A, ...ROW_A];
  const rowB = [...ROW_B, ...ROW_B];
  return (
    <div className="w-full overflow-hidden">
      <div className="[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="marquee-row">
          {rowA.map((item, i) => (
            <LinkPill key={`a-${i}`} item={item} />
          ))}
        </div>
        <div className="marquee-row reverse mt-3">
          {rowB.map((item, i) => (
            <LinkPill key={`b-${i}`} item={item} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .marquee-row {
          display: flex;
          gap: 12px;
          width: max-content;
          animation: scroll-left 30s linear infinite;
          will-change: transform;
        }
        .marquee-row.reverse {
          animation-name: scroll-right;
          animation-duration: 38s;
        }
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes scroll-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-row,
          .marquee-row.reverse {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
