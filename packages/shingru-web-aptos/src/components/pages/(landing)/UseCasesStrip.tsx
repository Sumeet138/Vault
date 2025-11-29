import React from "react";

type Case = { label: string };

const CASES: Case[] = [
  { label: "Freelance" },
  { label: "Tips" },
  { label: "Courses" },
  { label: "Consulting" },
  { label: "Events" },
  { label: "Digital Products" },
];

export default function UseCasesStrip() {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {CASES.map((c, i) => (
        <span
          key={i}
          className="rounded-full border border-black/10 bg-background-50 px-3 py-1 text-sm text-foreground/80"
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}
