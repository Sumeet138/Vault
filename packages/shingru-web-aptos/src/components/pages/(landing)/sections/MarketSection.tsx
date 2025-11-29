"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  Variants,
  useMotionValue,
  animate,
  useSpring,
} from "motion/react";
import { EASE_OUT_QUART } from "@/config/animation";
import {
  ArrowLeft,
  ArrowRight,
  Brush,
  Computer,
  ShoppingBag,
  Star,
} from "lucide-react";
import Image from "next/image";

const marketingPoints = [
  {
    title: "Freelancers",
    description: "Different address for each client",
    icon: <Computer className="text-amber-600" />,
    character: "🎧",
    bgColor: "bg-amber-600",
    iconBgColor: "bg-amber-100/70",
    textColor: "text-white",
    descriptionColor: "text-amber-100",
    image: "/assets/freelancer.webp",
  },
  {
    title: "Creators",
    description: "Sell digital products anonymously",
    icon: <Brush className="text-gray-500" />,
    character: "✨",
    bgColor: "bg-gray-500",
    iconBgColor: "bg-gray-100",
    textColor: "text-white",
    descriptionColor: "text-gray-200",
    image: "/assets/creator.webp",
  },
  {
    title: "KOLs",
    description: "Accept tips without doxxing",
    icon: <Star className="text-[#60A5FA]" />,
    character: "🤓",
    bgColor: "bg-[#60A5FA]",
    iconBgColor: "bg-blue-100",
    textColor: "text-white",
    descriptionColor: "text-blue-100",
    image: "/assets/kol.webp",
  },
  {
    title: "Small Biz",
    description: "Keep finances private from competitors",
    icon: <ShoppingBag className="text-[#F87171]" />,
    character: "😊",
    bgColor: "bg-[#F87171]",
    iconBgColor: "bg-[#FEE2E2]",
    textColor: "text-white",
    descriptionColor: "text-red-100",
    image: "/assets/small-biz.webp",
  },
];

export default function MarketSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.7 });
  const carouselRef = useRef<HTMLDivElement>(null);
  const carouselContentRef = useRef<HTMLDivElement>(null);
  const [cursorVariant, setCursorVariant] = useState("default");
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });

  const x = useMotionValue(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 50, stiffness: 700, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  useLayoutEffect(() => {
    const calculateWidths = () => {
      if (
        carouselRef.current &&
        carouselContentRef.current &&
        carouselContentRef.current.children.length > 0
      ) {
        const newCarouselWidth = carouselRef.current.offsetWidth;
        const newContentWidth = carouselContentRef.current.scrollWidth;

        const firstCard = carouselContentRef.current.children[0] as HTMLElement;
        const firstCardWidth = firstCard.offsetWidth;
        const initialX = firstCardWidth / 2;

        x.set(initialX);
        const newConstraints = {
          right: initialX,
          left: newCarouselWidth - newContentWidth - initialX,
        };
        setDragConstraints(newConstraints);
      }
    };
    calculateWidths();
    window.addEventListener("resize", calculateWidths);

    const mouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - 40);
      mouseY.set(e.clientY - 40);
    };
    window.addEventListener("mousemove", mouseMove);

    return () => {
      window.removeEventListener("resize", calculateWidths);
      window.removeEventListener("mousemove", mouseMove);
    };
  }, [x, mouseX, mouseY]);

  const handleNext = () => {
    const nextX = Math.max(x.get() - 400, dragConstraints.left);
    animate(x, nextX, {
      type: "spring",
      stiffness: 400,
      damping: 60,
    });
  };

  const handlePrev = () => {
    const nextX = Math.min(x.get() + 400, dragConstraints.right);
    animate(x, nextX, {
      type: "spring",
      stiffness: 400,
      damping: 60,
    });
  };

  const cursorVariants = {
    default: {
      scale: 0,
    },
    left: {
      scale: 1,
    },
    right: {
      scale: 1,
    },
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        duration: 0.6,
        ease: EASE_OUT_QUART,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: EASE_OUT_QUART,
      },
    },
  };

  return (
    <section ref={ref} className="w-full py-12 md:py-20 flex flex-col">
      <div className="w-full max-w-6xl mx-auto px-5 md:px-12">
        <motion.h2
          variants={itemVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-4xl md:text-6xl font-bold text-center leading-tight tracking-tight"
        >
          Privacy For{" "}
          <span className="text-primary-600 inline-block">Everyone</span> <br />{" "}
          Who Gets Paid
        </motion.h2>
      </div>

      <motion.div
        className="mt-16 w-full relative"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <motion.div
          className="fixed top-0 left-0 w-20 h-20 bg-white rounded-full shadow-lg hidden md:flex items-center justify-center pointer-events-none z-50"
          variants={cursorVariants}
          animate={cursorVariant}
          style={{ x: smoothMouseX, y: smoothMouseY }}
        >
          {cursorVariant === "left" && (
            <ArrowLeft className="w-8 h-8 text-gray-700" />
          )}
          {cursorVariant === "right" && (
            <ArrowRight className="w-8 h-8 text-gray-700" />
          )}
        </motion.div>

        <div className="absolute inset-0 justify-between z-10 hidden md:flex">
          <div
            className="w-1/5 h-full"
            onMouseEnter={() => setCursorVariant("left")}
            onMouseLeave={() => setCursorVariant("default")}
            onClick={handlePrev}
          />
          <div
            className="w-1/5 h-full"
            onMouseEnter={() => setCursorVariant("right")}
            onMouseLeave={() => setCursorVariant("default")}
            onClick={handleNext}
          />
        </div>
        {/* Mobile nav buttons */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 md:hidden z-20 pointer-events-none">
          <button
            type="button"
            aria-label="Previous"
            onClick={handlePrev}
            className="pointer-events-auto bg-white/90 backdrop-blur rounded-full p-2 shadow-md active:scale-95 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={handleNext}
            className="pointer-events-auto bg-white/90 backdrop-blur rounded-full p-2 shadow-md active:scale-95 transition"
          >
            <ArrowRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
        <div
          ref={carouselRef}
          className="overflow-x-hidden overflow-y-visible cursor-none"
        >
          <motion.div
            ref={carouselContentRef}
            className="flex gap-5"
            drag="x"
            dragConstraints={dragConstraints}
            style={{ x }}
          >
            {marketingPoints.map((point) => (
              <motion.div
                key={point.title}
                variants={itemVariants}
                className={`${point.bgColor} p-6 md:p-8 flex flex-col rounded-3xl relative overflow-hidden min-w-[300px] md:min-w-[400px] h-[550px]`}
              >
                <div
                  className={`w-12 h-12 ${point.iconBgColor} rounded-full flex items-center justify-center`}
                >
                  {point.icon}
                </div>

                <h3
                  className={`text-2xl md:text-3xl font-bold ${point.textColor} mt-4`}
                >
                  {point.title}
                </h3>

                <p
                  className={`${point.descriptionColor} font-semibold tracking-normal text-lg mt-2`}
                >
                  {point.description}
                </p>

                <div className="absolute -bottom-20 -right-24 size-[450px] shrink-0 w-full flex rounded-4xl overflow-hidden">
                  <div className="relative size-full rounded-4xl overflow-hidden mt-5">
                    <Image
                      src={point.image}
                      alt={point.title}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
                      fill
                      className="absolute inset-0 w-full h-full object-cover -translate-y-20"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
