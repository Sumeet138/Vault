"use client";

import AppLayout from "@/components/layouts/AppLayout";
import { useAuth } from "@/providers/AuthProvider";
import { PropsWithChildren, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import FullscreenLoader from "@/components/common/FullscreenLoader";

export default function MainAppLayout({ children }: PropsWithChildren) {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/login");
    }
  }, [isSignedIn, router]);

  if (!isSignedIn) {
    return <FullscreenLoader text="Checking your session" />;
  }

  return (
    <AuthGuard>
      <AppLayout>{children}</AppLayout>
    </AuthGuard>
  );
}
