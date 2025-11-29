"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import FullscreenLoader from "../common/FullscreenLoader";

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { isSignedIn, me, isSigningIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is not signed in, redirect to login
    if (!isSignedIn) {
      router.replace("/login");
      return;
    }

    // If user is signed in and has a username, redirect to app
    if (isSignedIn && me && me.username) {
      router.replace("/app");
    }
  }, [isSignedIn, me, router]);

  // Show loading state while checking authentication
  if (isSigningIn) {
    return <FullscreenLoader text="Just a moment" />;
  }

  // If user is not signed in or already has username, don't render onboarding (redirect will happen)
  if (!isSignedIn || (isSignedIn && me && me.username)) {
    return null;
  }

  // User is signed in but needs onboarding, show onboarding page
  return <>{children}</>;
}
