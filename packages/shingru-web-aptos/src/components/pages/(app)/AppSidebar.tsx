"use client";

import { cnm } from "@/utils/style";
import {
  ArrowUpRightIcon,
  Cog6ToothIcon,
  LinkIcon,
  QueueListIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AnnouncementModal from "./AnnouncementModal";
import { motion } from "motion/react";
import { EASE_OUT_QUART } from "@/config/animation";

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
  const pathname = usePathname();
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);

  return (
    <div className="hidden md:flex w-64 h-full flex-shrink-0 border-r border-black/5 flex-col">
      <div className="flex-1">
        {/* Header */}
        <div className="px-5 pt-6">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-gray-900">shingru</div>
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-gray-100 text-gray-600 rounded-md border border-black/5">
              APTOS
            </span>
          </div>
        </div>

        {/* Menus */}
        <nav className="mt-4 px-3 font-sans">
          <div className="flex flex-col gap-1">
            {MENUS.map((item, idx) => (
              <Link
                key={idx}
                href={item.path}
                className={cnm(
                  "group flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition duration-100",
                  "hover:bg-gray-50 hover:text-gray-900",
                  item.path === pathname
                    ? "bg-gray-50 text-gray-900 font-medium"
                    : "text-gray-400 hover:bg-gray-50"
                )}
              >
                <div className="size-5.5 flex items-center justify-center flex-shrink-0">
                  <item.icon className="size-5.5 stroke-2" />
                </div>

                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>



      {/* Footer Links */}

      {/* Announcement Modal */}
      <AnnouncementModal
        isOpen={announcementModalOpen}
        onClose={() => setAnnouncementModalOpen(false)}
      />
    </div>
  );
}
