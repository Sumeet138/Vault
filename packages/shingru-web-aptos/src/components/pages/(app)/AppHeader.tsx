"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useAppHeaderStore } from "@/store/app-header-store";

const getPageTitle = (title: string): string | undefined => {
  // Check if the path matches /app/links/<some-id>
  if (title.startsWith("/app/links/") && title.split("/").length === 4) {
    return "";
  }

  switch (title) {
    case "/app":
      return "Dashboard";
    case "/app/links":
      return "Links";
    case "/app/create-link":
      return "Create Link";
    case "/app/settings":
      return "Settings";
    case "/app/activities":
      return "Activities";
    default:
      return undefined;
  }
};

export default function AppHeader() {
  const pathname = usePathname();
  const { override } = useAppHeaderStore();

  const isLinkDetailRoute = useMemo(
    () =>
      pathname.startsWith("/app/links/") && pathname.split("/").length === 4,
    [pathname]
  );

  const hasExplicitOverrideTitle = useMemo(
    () =>
      override !== null &&
      Object.prototype.hasOwnProperty.call(override ?? {}, "title"),
    [override]
  );

  const overrideTitle = hasExplicitOverrideTitle
    ? override?.title ?? ""
    : undefined;

  const title = useMemo(() => {
    const pageTitle = getPageTitle(pathname);

    if (overrideTitle !== undefined) {
      return overrideTitle;
    }
    if (pageTitle !== undefined) {
      return pageTitle;
    }
    if (isLinkDetailRoute) {
      return "";
    }
    return hasExplicitOverrideTitle ? "" : "VAULT";
  }, [pathname, overrideTitle, hasExplicitOverrideTitle, isLinkDetailRoute]);

  const handleBackClick = () => {
    if (override?.onBack) {
      override.onBack();
    }
  };

  const showBackButton = override?.showBackButton && Boolean(override?.onBack);

  return (
    <div
      className={cn(
        "relative z-30 flex h-14 md:h-15 w-full items-center justify-center px-5 backdrop-blur-xl",
        "dark:bg-zinc-900/50"
      )}
    >
      <AnimatePresence>
        {showBackButton && (
          <motion.div
            key="header-back"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-5"
          >
            <button
              type="button"
              onClick={handleBackClick}
              className="cursor-pointer flex items-center justify-center text-gray-600 hover:text-black transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {override?.rightButton && (
          <motion.div
            key="header-right"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-5"
          >
            <button
              type="button"
              aria-label={override.rightButton.ariaLabel || "Action"}
              onClick={override.rightButton.onPress}
              className="cursor-pointer size-9 rounded-xl p-0 text-gray-500 flex items-center justify-center relative group"
            >
              <div className="absolute w-full h-full bg-gray-100 rounded-xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 group-hover:scale-100 scale-0 transition duration-150 ease-out opacity-0 group-hover:opacity-100" />
              <div className="relative z-10">{override.rightButton.icon}</div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative overflow-hidden py-1">
        <AnimatePresence mode="wait">
          <motion.p
            key={title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25, type: "tween", ease: "easeOut" }}
            className="font-semibold font-sans text-lg truncate"
          >
            {title}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
