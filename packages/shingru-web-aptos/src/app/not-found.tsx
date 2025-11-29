"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import MainButton from "@/components/common/MainButton";

export default function NotFound() {
  // Animation variant for center ghost
  const centerGhostVariants = {
    hidden: {
      scale: 0,
      opacity: 0,
      rotate: -45,
      y: 50,
    },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: -6,
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.4,
        duration: 0.8,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-50 via-background-100 to-background-200 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorative elements */}

      {/* Main content */}
      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Ghost with floating animation */}
        <motion.div
          variants={centerGhostVariants}
          initial="hidden"
          animate="visible"
          className="relative w-48 h-48 mx-auto"
        >
          <motion.div
            animate={{
              rotate: [-6, -4, -8, -6],
              y: [0, -8, 0],
              x: [0, 3, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="w-full h-full relative"
          >
            <Image
              src="/assets/cute/cloud-sad.svg"
              width={200}
              height={200}
              className="object-contain size-full"
              alt="Error Cloud"
            />
          </motion.div>
        </motion.div>

        {/* 404 Text */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="mb-4"
        >
          <h1 className="text-6xl md:text-8xl font-bold text-foreground tracking-tight">
            404
          </h1>
        </motion.div>

        {/* Main message */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-2"
        >
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Oops! Page not found
          </h2>
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
            The page you&apos;re looking for seems to have vanished into the
            void. But don&apos;t worry, our sad cloud is here to guide you back
            home!
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/">
            <MainButton className="font-semibold px-8">Take Me Home</MainButton>
          </Link>
        </motion.div>

        {/* Additional helpful links */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-12"
        >
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              href="/privacy"
              className="text-gray-500 hover:text-primary transition-colors duration-200"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-gray-500 hover:text-primary transition-colors duration-200"
            >
              Terms
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
