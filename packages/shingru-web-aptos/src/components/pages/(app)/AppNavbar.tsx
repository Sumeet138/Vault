import { cnm } from "@/utils/style";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ActivitiesIcon,
  HomeIcon,
  LinksIcon,
  SettingsIcon,
} from "@/components/icons/NavIcons";

interface AppNavbarProps {
  variant?: "floating" | "sticky";
  className?: string;
}

function AppNavbar({ variant = "floating", className }: AppNavbarProps) {
  const pathname = usePathname();

  const NAV_ITEMS = [
    {
      id: "home",
      icon: HomeIcon,
      label: "Home",
      href: "/app",
    },
    {
      id: "links",
      icon: LinksIcon,
      label: "Links",
      href: "/app/links",
    },
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

  // Helper function to check if a pathname matches a route (handles nested routes)
  const isRouteActive = (href: string, currentPathname: string) => {
    if (href === "/app") {
      // Home route should only match exactly "/app"
      return currentPathname === "/app";
    }
    // For other routes, check if pathname starts with the href
    return currentPathname === href || currentPathname.startsWith(href + "/");
  };

  // Find the active tab index
  const activeIndex = NAV_ITEMS.findIndex((item) => isRouteActive(item.href, pathname));

  const containerClasses = cnm(
    "bg-white p-1 border border-black/5 shadow-lg w-full",
    variant === "floating" ? "rounded-full" : "rounded-t-[2rem]",
    className
  );

  const navItemsClasses = "flex justify-around items-center relative";

  return (
    <div className={containerClasses}>
      <div className={navItemsClasses}>
        {/* Sliding active indicator */}
        <motion.div
          className={cnm(
            "absolute bg-primary/20 h-[4.4rem] z-10",
            variant === "floating"
              ? "rounded-full"
              : "rounded-t-[1.8rem] rounded-b-lg"
          )}
          animate={{
            x: activeIndex !== -1 ? `${activeIndex * 100}%` : "0%",
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
          style={{
            width: "25%",
            left: "0%",
          }}
        />

        {NAV_ITEMS.map((item, index) => {
          const isActive = isRouteActive(item.href, pathname);
          const IconComponent = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-col items-center justify-center p-2 rounded-full transition-all duration-200 ease-in-out relative flex-1"
            >
              <motion.div
                whileHover={
                  !isActive
                    ? {
                        scale: 1.05,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        },
                      }
                    : {}
                }
                whileTap={{
                  scale: 0.95,
                  transition: { type: "spring", stiffness: 400, damping: 25 },
                }}
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className="relative flex flex-col items-center justify-center p-2 rounded-full z-10"
              >
                <IconComponent
                  size={32}
                  color={isActive ? "#00CE2B" : "#C8C8C8"}
                />
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default AppNavbar;
