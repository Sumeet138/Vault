"use client";

import { cnm } from "@/utils/style";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HomeIcon,
  LinksIcon,
  ActivitiesIcon,
  SettingsIcon,
} from "@/components/icons/NavIcons";

const NAV_ITEMS = [
  { id: "home", icon: HomeIcon, label: "Home", href: "/app" },
  { id: "links", icon: LinksIcon, label: "Links", href: "/app/links" },
  {
    id: "activities",
    icon: ActivitiesIcon,
    label: "Activities",
    href: "/app/activities",
  },
  {
    id: "settings",
    icon: SettingsIcon,
    label: "Settings",
    href: "/app/settings",
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  const variants = {
    hidden: { y: 100, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const isHidden = useMemo(() => {
    const pathsToHide = [
      /^\/app\/links\/[^/]+\/edit$/,
      /^\/app\/links\/[^/]+$/,
      /^\/app\/create-link$/,
    ];
    return pathsToHide.some((pattern) => pattern.test(pathname));
  }, [pathname]);

  return (
    <motion.div
      initial="hidden"
      animate={isHidden ? "hidden" : "visible"}
      variants={variants}
      transition={{
        type: "spring",
        stiffness: 800,
        damping: 80,
        mass: 4,
      }}
      className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[50]"
    >
      <nav className="bg-white rounded-full p-2 shadow-smooth-enough border border-black/5">
        <ul className="flex items-center justify-around">
          <AnimatePresence>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const IconComponent = item.icon;

              return (
                <li key={item.id} className="relative">
                  <Link
                    href={item.href}
                    className="relative z-10 flex items-center justify-center py-3 px-6"
                  >
                    <IconComponent
                      color="currentColor"
                      size={32}
                      className={cnm(
                        "transition-colors duration-300",
                        isActive ? "text-primary-600" : "text-gray-400"
                      )}
                    />
                  </Link>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      className="absolute inset-0 rounded-full bg-primary-50 z-0"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </li>
              );
            })}
          </AnimatePresence>
        </ul>
      </nav>
    </motion.div>
  );
}
