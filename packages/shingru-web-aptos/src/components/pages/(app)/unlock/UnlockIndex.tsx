"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * UnlockIndex - Deprecated
 * 
 * The unlock functionality has been merged into the consolidated /login page.
 * If you access /unlock directly, you'll be redirected to /login which handles
 * all auth states (including unlock) in one place without multiple redirects.
 * 
 * This eliminates redirect loops and provides a seamless authentication flow.
 */
export default function UnlockIndex() {
  const router = useRouter();

  useEffect(() => {
    console.log("🔄 /unlock is deprecated, redirecting to /login");
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
