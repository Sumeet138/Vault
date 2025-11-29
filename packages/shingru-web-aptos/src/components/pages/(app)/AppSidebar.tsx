"use client";

import {
  ArrowUpRightIcon,
  Cog6ToothIcon,
  LinkIcon,
  QueueListIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from "motion/react";

const MENUS = [
  {
    path: "/app",
    title: "Dashboard",
    icon: Squares2X2Icon,
  },
  {
    path: "/app/links",
    title: "Links",
    icon: LinkIcon,
  },
  {
    path: "/app/activities",
    title: "Activities",
    icon: QueueListIcon,
  },
  {
    path: "/app/settings",
    title: "Settings",
    icon: Cog6ToothIcon,
  },
];

export default function AppSidebar() {
  const mouseY = useMotionValue(Infinity);

  // Helper function to check if a pathname matches a route (handles nested routes)
  const isRouteActive = (href: string, currentPathname: string) => {
    if (href === "/app") {
      // Home route should only match exactly "/app"
      return currentPathname === "/app";
    }
    // For other routes, check if pathname starts with the href
    return currentPathname === href || currentPathname.startsWith(href + "/");
  };

  return (
    <div className="hidden md:flex h-full flex-col items-center justify-center py-8 px-4 z-50 w-24 relative">
      {/* Branding */}
      <Link href="/app" className="absolute top-8 font-bold text-xl tracking-tight text-gray-900">
        Vault
      </Link>

      {/* Dock Container */}
      <motion.div
        onMouseMove={(e) => mouseY.set(e.pageY)}
        onMouseLeave={() => mouseY.set(Infinity)}
        className="flex flex-col gap-4 items-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-3 py-4 shadow-lg"
      >
        {MENUS.map((item, idx) => (
          <DockItem key={idx} mouseY={mouseY} item={item} />
        ))}
      </motion.div>
    </div>
  );
}

function DockItem({
  mouseY,
  item,
}: {
  mouseY: MotionValue;
  item: (typeof MENUS)[0];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isActive = pathname === item.path;

  let distance = useTransform(mouseY, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
    return val - bounds.y - bounds.height / 2;
  });

  let widthSync = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  let width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <Link href={item.path}>
      <motion.div
        ref={ref}
        style={{ width, height: width }}
        className={`rounded-xl flex items-center justify-center relative group transition-colors ${isActive
          ? "bg-gray-900 text-white shadow-md"
          : "bg-white/50 text-gray-500 hover:bg-white hover:text-gray-900"
          }`}
      >
        <item.icon className="w-1/2 h-1/2 stroke-2" />

        {/* Tooltip */}
        <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {item.title}
        </div>
      </motion.div>
    </Link>
  );
}
