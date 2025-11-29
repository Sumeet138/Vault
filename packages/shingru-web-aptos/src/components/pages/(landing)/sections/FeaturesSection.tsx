"use client";

import { EASE_OUT_QUART } from "@/config/animation";
import {
  CloudArrowUpIcon,
  GlobeAltIcon,
  LinkIcon,
  LockClosedIcon,
  QueueListIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { motion } from "motion/react";

export default function FeaturesSection() {
  const features = [
    {
      name: "Create",
      description:
        "Craft payment links for any purpose, fresh address on every payment.",
      icon: LinkIcon,
      bgColor: "bg-[#34D399]",
      iconColor: "text-white",
      funnyTitle: "Create (but make it spicy)",
      funnyDescription: "Spin up links faster than you can say ‘qr-code me’.",
    },
    {
      name: "Receive",
      description:
        "Accept payments privately without exposing your main wallet.",
      icon: WalletIcon,
      bgColor: "bg-[#FBBF24]",
      iconColor: "text-white",
      funnyTitle: "Receive like a ninja",
      funnyDescription: "Stealth payments. Your wallet stays incognito.",
    },
    {
      name: "Self-Custody",
      description: "Full control of your funds, we never touch your keys.",
      icon: LockClosedIcon,
      bgColor: "bg-[#A78BFA]",
      iconColor: "text-white",
      funnyTitle: "Keys stay with you",
      funnyDescription: "We couldn’t touch them even if we wanted to.",
    },
    {
      name: "Track",
      description: "All your payment data organized and accessible.",
      icon: QueueListIcon,
      bgColor: "bg-[#F87171]",
      iconColor: "text-white",
      funnyTitle: "Spreadsheet energy",
      funnyDescription: "Numbers that actually make sense. Finally.",
    },
    {
      name: "Sell",
      description:
        "Share digital products with automatic delivery after payment.",
      icon: CloudArrowUpIcon,
      bgColor: "bg-[#60A5FA]",
      iconColor: "text-white",
      funnyTitle: "Sell while you sleep",
      funnyDescription: "Money in, files out. Auto-pilot mode.",
    },
    {
      name: "Real World Assets",
      description: "Tokenize and trade real-world assets with ease.",
      icon: GlobeAltIcon,
      bgColor: "bg-[#14B8A6]",
      iconColor: "text-white",
      funnyTitle: "Reality, but on-chain",
      funnyDescription: "From houses to ham sandwiches. Tokenize it all.",
    },
  ];

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const featureVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  const textVariants = {
    rest: { color: "rgb(75 85 99)" }, // text-gray-500
    hover: { color: "#ffffff" },
  };

  const titleVariants = {
    rest: { color: "rgb(17 24 39)" }, // text-gray-900
    hover: { color: "#ffffff" },
  };

  const circleVariants = {
    rest: { clipPath: "circle(0px at 44px 44px)" },
    hover: {
      clipPath: "circle(150% at 44px 44px)",
      transition: {
        type: "tween" as const,
        duration: 0.6,
        ease: EASE_OUT_QUART,
      },
    },
  };

  const secondaryContentVariants = {
    rest: { opacity: 0, y: 8 },
    hover: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, delay: 0.05 },
    },
  };

  const primaryContentVariants = {
    rest: { opacity: 1, y: 0 },
    hover: { opacity: 0, y: -4, transition: { duration: 0.25 } },
  };
  const overlayContentVariants = secondaryContentVariants;

  return (
    <section className="py-20 w-full flex flex-col items-center px-2 md:px-12">
      <div className="w-full max-w-6xl">
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            type: "tween",
            duration: 0.65,
            ease: EASE_OUT_QUART,
          }}
          viewport={{
            once: true,
            amount: 0.4,
          }}
          className="bg-gray-100/80 rounded-[40px] p-4 sm:p-6 flex flex-col gap-5"
        >
          {/* Grid section */}
          <motion.div
            className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={gridVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.name}
                className="bg-white rounded-3xl w-full p-6 flex flex-col gap-4 relative overflow-hidden"
                variants={featureVariants}
                whileHover="hover"
                initial="rest"
              >
                {/* Color overlay revealed via clip-path expanding from the icon center */}
                <motion.div
                  className={`absolute inset-0 ${feature.bgColor} z-20`}
                  style={{ willChange: "clip-path" }}
                  variants={circleVariants}
                  transition={{
                    type: "tween",
                    duration: 0.6,
                    ease: EASE_OUT_QUART,
                  }}
                >
                  {/* Overlay content lives inside the clipped layer */}
                  <motion.div
                    className="absolute inset-0 p-6 flex flex-col gap-4 text-white"
                    variants={overlayContentVariants}
                  >
                    <div className="flex flex-col gap-1">
                      <h3 className="font-semibold text-lg">
                        {feature.funnyTitle}
                      </h3>
                      <p className="text-white/90 font-medium">
                        {feature.funnyDescription}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
                <motion.div
                  className="relative z-10 flex flex-col gap-4"
                  variants={primaryContentVariants}
                >
                  <div
                    className={`size-10 rounded-full flex items-center justify-center ${feature.bgColor}`}
                  >
                    <feature.icon
                      className="size-5 text-white"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <motion.h3
                      className="font-semibold text-lg"
                      variants={titleVariants}
                    >
                      {feature.name}
                    </motion.h3>
                    <motion.p
                      className="text-gray-500 font-medium"
                      variants={textVariants}
                    >
                      {feature.description}
                    </motion.p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
