import React from "react";

export default function HeroTrustBar() {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-foreground/60">
      <span className="text-foreground/20">|</span>
      <div className="inline-flex items-center gap-2">
        <span className="text-foreground/60">No KYC</span>
      </div>
      <span className="text-foreground/20">|</span>
      <div className="inline-flex items-center gap-2">
        <span className="text-foreground/60">Self-custody</span>
      </div>
    </div>
  );
}
