"use client";

import BlueCloud from "@/components/icons/BlueCloud";
import GreenCloud from "@/components/icons/GreenCloud";
import RedCloud from "@/components/icons/RedCloud";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export default function SolutionSection() {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const mainOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  const mainScale = useTransform(scrollYProgress, [0, 0.1], [0.95, 1]);
  const mainY = useTransform(scrollYProgress, [0, 0.1], [100, 0]);

  const line1Opacity = useTransform(scrollYProgress, [0.1, 0.2], [0, 1]);
  const line1Y = useTransform(scrollYProgress, [0.1, 0.2], [40, 0]);

  const line3Opacity = useTransform(scrollYProgress, [0.7, 0.8], [0, 1]);
  const line3Y = useTransform(scrollYProgress, [0.7, 0.8], [40, 0]);

  const privateOpacity = useTransform(scrollYProgress, [0.25, 0.35], [0, 1]);
  const privateY = useTransform(scrollYProgress, [0.25, 0.35], [20, 0]);
  const privateBgOpacity = useTransform(scrollYProgress, [0.25, 0.35], [0, 1]);
  const privateTextBlur = useTransform(
    scrollYProgress,
    [0.3, 0.4],
    ["blur(8px)", "blur(0px)"]
  );

  const seamlessOpacity = useTransform(scrollYProgress, [0.4, 0.5], [0, 1]);
  const seamlessY = useTransform(scrollYProgress, [0.4, 0.5], [20, 0]);
  const seamlessBgOpacity = useTransform(scrollYProgress, [0.4, 0.5], [0, 1]);
  const seamlessShimmerX = useTransform(
    scrollYProgress,
    [0.45, 0.65],
    ["-100%", "200%"]
  );

  const custodialOpacity = useTransform(scrollYProgress, [0.55, 0.65], [0, 1]);
  const custodialY = useTransform(scrollYProgress, [0.55, 0.65], [20, 0]);
  const custodialBgOpacity = useTransform(
    scrollYProgress,
    [0.55, 0.65],
    [0, 1]
  );
  const custodialLetterSpacing = useTransform(
    scrollYProgress,
    [0.6, 0.7],
    ["0.15em", "0em"]
  );

  return (
    <section
      ref={containerRef}
      className="w-full h-[250vh] relative px-5 md:px-12"
    >
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/10 to-transparent"
          style={{
            filter: useTransform(
              scrollYProgress,
              [0, 0.1],
              ["blur(10px)", "blur(0px)"]
            ),
          }}
        />

        <div className="w-full max-w-7xl flex flex-col items-center relative z-10">
          <motion.div
            className="font-medium text-3xl md:text-5xl text-gray-800 text-center leading-tight"
            style={{
              opacity: mainOpacity,
              scale: mainScale,
              y: mainY,
            }}
          >
            <motion.div
              className="text-gray-500"
              style={{ opacity: line1Opacity, y: line1Y }}
            >
              Fixing everything Web3 payments got wrong.
            </motion.div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 md:gap-x-4">
              <motion.span
                className="relative flex items-center gap-2"
                style={{ opacity: privateOpacity, y: privateY }}
              >
                <motion.div
                  className="absolute inset-0 bg-blue-500/10 rounded-full"
                  style={{ opacity: privateBgOpacity }}
                />
                <motion.span
                  className="relative flex items-center gap-2 pr-6 pl-3 py-1"
                  style={{ filter: privateTextBlur }}
                >
                  <BlueCloud />
                  <motion.span className="font-semibold text-blue-500 text-lg md:text-5xl">
                    Private
                  </motion.span>
                </motion.span>
              </motion.span>

              <motion.span
                className="relative flex items-center gap-2"
                style={{ opacity: seamlessOpacity, y: seamlessY }}
              >
                <motion.div
                  className="absolute inset-0 bg-primary-500/10 rounded-full"
                  style={{ opacity: seamlessBgOpacity }}
                />
                <span className="relative flex items-center gap-2 pr-6 pl-3 py-1 overflow-hidden">
                  <GreenCloud />
                  <span className="font-semibold text-primary-600 text-lg md:text-5xl">
                    Seamless
                  </span>
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      x: seamlessShimmerX,
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)",
                    }}
                  />
                </span>
              </motion.span>

              <motion.span
                className="relative flex items-center gap-2"
                style={{ opacity: custodialOpacity, y: custodialY }}
              >
                <motion.div
                  className="absolute inset-0 bg-red-500/10 rounded-full"
                  style={{ opacity: custodialBgOpacity }}
                />
                <span className="relative flex items-center gap-2 pl-3 pr-6 py-1">
                  <RedCloud />
                  <motion.span
                    className="font-semibold text-red-500 text-lg md:text-5xl"
                    style={{
                      letterSpacing: custodialLetterSpacing,
                    }}
                  >
                    Self-custodial
                  </motion.span>
                </span>
              </motion.span>
            </div>

            <motion.div
              className="mt-4 text-gray-500"
              style={{ opacity: line3Opacity, y: line3Y }}
            >
              This is crypto payments done right.
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
