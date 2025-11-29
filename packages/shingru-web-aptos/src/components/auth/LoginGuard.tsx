"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import FullscreenLoader from "../common/FullscreenLoader";
import { determineLoginRedirectPath } from "@/utils/auth-utils";

interface LoginGuardProps {
  children: React.ReactNode;
}

export default function LoginGuard({ children }: LoginGuardProps) {
  const { isSignedIn, me, isSigningIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const lastRedirectRef = useRef<number>(0);

  useEffect(() => {
    if (isSignedIn && me) {
      // Don't redirect if we're already on protected pages like unlock or onboarding
      if (pathname === "/unlock" || pathname === "/onboarding") {
        return;
      }

      // Prevent rapid redirects (at least 3 seconds between redirects)
      const now = Date.now();
      if (now - lastRedirectRef.current < 3000) {
        console.log("⚠️ LoginGuard: Preventing rapid redirect");
        return;
      }

      const redirectPath = determineLoginRedirectPath(me);
      console.log(`LoginGuard: Redirecting authenticated user to ${redirectPath}`);
      lastRedirectRef.current = now;
      router.replace(redirectPath);
    }
  }, [isSignedIn, me, router, pathname]);

  // Show loading state while checking authentication
  if (isSigningIn) {
    return <FullscreenLoader text="Just a moment" />;
  }

  // If user is signed in, don't render login page (redirect will happen)
  if (isSignedIn && me) {
    return null;
  }

  // User is not signed in, show login page
  return <>{children}</>;
}
