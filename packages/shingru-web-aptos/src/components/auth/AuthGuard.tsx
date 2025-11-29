"use client";

import { useEffect, ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useMetaKeys } from "@/providers/MetaKeysProvider";
import { useRouter } from "next/navigation";
import FullScreenLoader from "../common/FullscreenLoader";

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * AuthGuard - Simplified to work with consolidated /login page
 * 
 * This guard only protects /app routes. It checks:
 * 1. User is signed in (has token + profile)
 * 2. User has completed all auth steps (username, profile image, meta keys unlocked)
 * 
 * If any step is incomplete, redirects to /login which handles all auth states.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { isSignedIn, isSigningIn, me } = useAuth();
  const { isMetaKeysLoaded, isSessionLoadingComplete } = useMetaKeys();
  const router = useRouter();

  useEffect(() => {
    // Not signed in - go to login
    if (!isSignedIn && !isSigningIn) {
      console.log("🔐 AuthGuard: Not signed in, redirecting to /login");
      router.replace("/login");
      return;
    }

    // Signed in but session not loaded yet - wait
    if (isSignedIn && !isSessionLoadingComplete) {
      return;
    }

    // Signed in, check if fully authenticated
    if (isSignedIn && me && isSessionLoadingComplete) {
      // Check if profile is incomplete
      if (!me.username || !me.profileImage) {
        console.log("🔐 AuthGuard: Profile incomplete, redirecting to /login");
        router.replace("/login");
        return;
      }

      // Check if meta keys need to be unlocked
      const hasBackendMetaKeys = me.wallets?.some(
        (wallet) => wallet.metaKeys?.metaSpendPub
      );
      
      if (hasBackendMetaKeys && !isMetaKeysLoaded) {
        console.log("🔐 AuthGuard: Meta keys not unlocked, redirecting to /login");
        router.replace("/login");
        return;
      }

      // All checks passed - user is fully authenticated
      console.log("✅ AuthGuard: User is fully authenticated");
    }
  }, [isSignedIn, isSigningIn, me, isMetaKeysLoaded, isSessionLoadingComplete, router]);

  // Show loading while checking
  if (isSigningIn || !isSessionLoadingComplete) {
    return <FullScreenLoader text="Loading your session" />;
  }

  // Not signed in - don't render (redirect will happen)
  if (!isSignedIn || !me) {
    return <FullScreenLoader text="Redirecting to login" />;
  }

  // Check if profile is complete
  const hasBackendMetaKeys = me.wallets?.some(
    (wallet) => wallet.metaKeys?.metaSpendPub
  );

  if (!me.username || !me.profileImage || (hasBackendMetaKeys && !isMetaKeysLoaded)) {
    return <FullScreenLoader text="Redirecting to complete setup" />;
  }

  // All good - render protected content
  return <>{children}</>;
}
