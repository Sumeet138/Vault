"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Onboarding page - Deprecated
 * 
 * Onboarding is now handled by the consolidated /login page.
 * Redirecting to /login for a seamless experience.
 */
export default function Onboarding() {
  const router = useRouter();

  useEffect(() => {
    console.log("🔄 /onboarding is deprecated, redirecting to /login");
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center justify-center gap-1">
        <div className="loading loading-dots w-12 text-gray-600"></div>
        <div className="text-center text-gray-400 font-medium">
          Redirecting to login...
        </div>
      </div>
    </div>
  );
}
