"use client";

import AppSidebar from "../pages/(app)/AppSidebar";
import AppHeader from "../pages/(app)/AppHeader";
import MobileBottomNav from "../pages/(app)/MobileBottomNav";
import { ReactNode } from "react";
import { motion } from "motion/react";
import { useModalStore } from "@/store/modal-store";
import { EASE_OUT_QUINT } from "@/config/animation";
import PageTransition from "../common/PageTransition";
import { useIsMobile } from "@/hooks/use-is-mobile";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isOpen } = useModalStore();
  const isMobile = useIsMobile();
  return (
    <div className="h-dvh overflow-hidden flex justify-center bg-[url(https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/hero/gradientBackground.png)] bg-cover bg-top bg-no-repeat font-sans text-foreground">
      <motion.div
        id="main-container"
        initial={{
          scale: 1,
        }}
        animate={{
          scale: isOpen ? 0.98 : 1,
        }}
        transition={{
          duration: 0.25,
          ease: EASE_OUT_QUINT,
        }}
        className="main-container flex relative w-full bg-transparent"
      >
        <AppSidebar />
        <MobileBottomNav />
        <div className="flex-1 overflow-hidden flex flex-col z-0 relative">
          {!isMobile && <AppHeader />}
          <div
            id="main-content"
            className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent px-4 z-0"
          >
            <PageTransition>
              <>{children}</>
            </PageTransition>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
