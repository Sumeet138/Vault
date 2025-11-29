"use client";

import { EASE_OUT_QUART } from "@/config/animation";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function NavSection() {
  return (
    <nav className="w-full flex justify-center md:py-8 py-4 px-4">
      <div className="w-full max-w-5xl flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "tween",
            duration: 0.65,
            ease: EASE_OUT_QUART,
          }}
          className="text-2xl md:text-3xl font-bold text-gray-900"
        >
          shingru
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "tween",
            duration: 0.65,
            ease: EASE_OUT_QUART,
            delay: 0.05,
          }}
          className="flex items-center gap-3"
        >
          <Link
            href="/login"
            className="cursor-pointer rounded-full bg-gray-950 hover:bg-gray-900 transition px-5 py-3 text-sm text-white font-medium flex items-center gap-1"
          >
            App{" "}
            <span className="inline-block">
              <ArrowUpRight className="size-4" />
            </span>
          </Link>
        </motion.div>
      </div>
    </nav>
  );
}
