"use client";

import React, { useEffect, useRef } from "react";
import SoftEmojiBadge from "@/components/pages/(landing)/SoftEmojiBadge";

type Benefit = {
  emoji: string;
  color:
  | "blue"
  | "purple"
  | "pink"
  | "green"
  | "yellow"
  | "red"
  | "teal"
  | "gray";
  title: string;
  desc: string;
};

const BENEFITS: Benefit[] = [
  {
    emoji: "lock",
    color: "green",
    title: "Private by default",
    desc: "Fresh addresses for every payment—no shared trails.",
  },
  {
    emoji: "target",
    color: "purple",
    title: "Purposeful links",
    desc: "Freelance, tips, courses—spin up a link for each.",
  },
  {
    emoji: "rocket",
    color: "blue",
    title: "Self-custody",
    desc: "Funds are yours immediately. No custodial holds.",
  },
  {
    emoji: "credit-card",
    color: "pink",
    title: "Converts on mobile",
    desc: "Simple, frictionless payment flow that feels native.",
  },
  {
    emoji: "sparkles",
    color: "yellow",
    title: "Share anywhere",
    desc: "Drop your link in DMs, invoices, or embed it.",
  },
];

export default function BenefitsSection() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = Array.from(
      root.querySelectorAll<HTMLElement>("[data-benefit]")
    );
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.2 }
    );
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, []);

  return (
    <section className="relative bg-background-50 border-y border-black/10">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 10%, rgba(0,0,0,0.04), transparent 35%), radial-gradient(circle at 90% 20%, rgba(0,0,0,0.04), transparent 35%)",
        }}
      />
      <div
        ref={ref}
        className="relative max-w-7xl mx-auto px-4 py-clamp-responsive"
      >
        <div className="text-center">
          <div className="text-xs tracking-widest uppercase text-foreground/60">
            Why VAULT
          </div>
          <h2 className="mt-2 text-3xl md:text-5xl font-semibold">
            Built to convert, designed for privacy
          </h2>
          <p className="mt-3 text-foreground/70 max-w-2xl mx-auto">
            Everything you need to receive payments easily—without exposing your
            wallet.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {BENEFITS.map((b, i) => (
            <div
              key={i}
              data-benefit
              className="opacity-0 translate-y-2 transition-all duration-700 rounded-2xl border border-black/10 bg-white p-5 md:p-6 flex flex-col"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-3">
                <SoftEmojiBadge emoji={b.emoji} color={b.color} size="md" />
                <div className="text-xs rounded-full px-2 py-0.5 bg-gray-50/30 text-foreground/70">
                  0{i + 1}
                </div>
              </div>
              <div className="mt-3 text-lg md:text-xl font-semibold">
                {b.title}
              </div>
              <div className="mt-1 text-foreground/70 flex-1">{b.desc}</div>
              <div className="mt-4 h-[3px] w-16 bg-primary/50 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        [data-benefit].visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
}
