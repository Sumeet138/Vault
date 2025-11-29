"use client";

import { useEffect, useRef, ReactNode, useState, useMemo } from "react";
import {
  motion,
  useInView,
  useAnimation,
  Variants,
  Transition,
} from "motion/react";

// Type definition for animation types
type AnimationType =
  | "playful"
  | "fadeInUp"
  | "fadeInDown"
  | "fadeInLeft"
  | "fadeInRight";

// Interface for component props
interface AnimateComponentProps {
  entry?: AnimationType;
  delay?: number;
  className?: string;
  children: ReactNode;
  onScroll?: boolean;
  threshold?: number;
  resetOnLeave?: boolean;
  show?: boolean;
  customVariants?: Variants;
  customTransition?: Transition;
}

/**
 * Gets a random rotation value that's either between -10 to -5 or 5 to 10 degrees
 * Only called on client side to avoid hydration mismatches
 * @returns {number} Random rotation value
 */
function getRandomRotation(): number {
  const isNegative = Math.random() < 0.5;
  return isNegative ? -(Math.random() * 5 + 5) : Math.random() * 5 + 5;
}

/**
 * Get animation variants based on the animation type
 * @param {AnimationType} type - Animation type
 * @param {number} delay - Delay in seconds
 * @param {number} rotation - Random rotation value to apply
 * @returns {Variants} Framer Motion variants
 */
const getAnimationVariants = (
  type: AnimationType,
  delay: number = 0,
  rotation: number = 0
): Variants => {
  const baseTransition: Transition = {
    type: "spring",
    bounce: 0.45,
    duration: 0.8,
    delay,
  };

  switch (type) {
    case "playful":
      return {
        initial: {
          y: 60,
          rotate: rotation,
          scale: 0.8,
          opacity: 0,
        },
        animate: {
          y: 0,
          rotate: 0,
          scale: 1,
          opacity: 1,
          transition: baseTransition,
        },
        exit: {
          y: 50,
          opacity: 0,
          transition: { ...baseTransition, duration: 0.4 },
        },
      };
    case "fadeInUp":
      return {
        initial: { y: 50, opacity: 0 },
        animate: {
          y: 0,
          opacity: 1,
          transition: baseTransition,
        },
        exit: {
          y: -50,
          opacity: 0,
          transition: { ...baseTransition, duration: 0.4 },
        },
      };
    case "fadeInDown":
      return {
        initial: { y: -50, opacity: 0 },
        animate: {
          y: 0,
          opacity: 1,
          transition: baseTransition,
        },
        exit: {
          y: 50,
          opacity: 0,
          transition: { ...baseTransition, duration: 0.4 },
        },
      };
    case "fadeInLeft":
      return {
        initial: { x: -50, opacity: 0 },
        animate: {
          x: 0,
          opacity: 1,
          transition: baseTransition,
        },
        exit: {
          x: -50,
          opacity: 0,
          transition: { ...baseTransition, duration: 0.4 },
        },
      };
    case "fadeInRight":
      return {
        initial: { x: 50, opacity: 0 },
        animate: {
          x: 0,
          opacity: 1,
          transition: baseTransition,
        },
        exit: {
          x: 50,
          opacity: 0,
          transition: { ...baseTransition, duration: 0.4 },
        },
      };
    default:
      return {
        initial: {
          y: 60,
          rotate: rotation,
          scale: 0.8,
          opacity: 0,
        },
        animate: {
          y: 0,
          rotate: 0,
          scale: 1,
          opacity: 1,
          transition: baseTransition,
        },
        exit: {
          y: 50,
          opacity: 0,
          transition: { ...baseTransition, duration: 0.4 },
        },
      };
  }
};

/**
 * A component that adds Framer Motion-powered entrance and exit animations to its children
 * @param {AnimateComponentProps} props - Component properties
 * @returns {JSX.Element}
 */
const AnimateComponent = ({
  entry = "playful",
  delay = 50, // Default 50ms delay
  className,
  children,
  onScroll = false,
  threshold = 0.4,
  resetOnLeave = false,
  show,
  customVariants,
  customTransition,
}: AnimateComponentProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [randomRotation, setRandomRotation] = useState(0); // Always start with 0 for SSR compatibility
  const [rotationReady, setRotationReady] = useState(false); // Track when rotation is set

  const isInView = useInView(ref, {
    once: !resetOnLeave,
    amount: threshold,
    margin: "-25% 0px",
  });
  const controls = useAnimation();

  // Use custom variants if provided, otherwise use default animations
  const variants = useMemo(
    () =>
      customVariants ||
      getAnimationVariants(entry, delay / 1000, randomRotation),
    [entry, delay, randomRotation, customVariants]
  );

  // Track when component is mounted and set random rotation after hydration
  useEffect(() => {
    setIsMounted(true);
    // Set random rotation only after hydration for playful animations
    if (entry === "playful" || entry === undefined) {
      // Generate fresh random rotation for each component instance
      const newRotation = getRandomRotation();
      setRandomRotation(newRotation);
    }
    // Mark rotation as ready (either random for playful or 0 for others)
    setRotationReady(true);
  }, []); // Remove entry dependency to prevent regeneration

  // Handle animation state changes - restart animation when rotation is ready
  useEffect(() => {
    if (!isMounted || !rotationReady) return;

    const shouldAnimate = show === undefined ? true : show;

    if ((!onScroll || isInView) && shouldAnimate) {
      // Force restart from initial state with correct rotation
      controls.set("initial");
      controls.start("animate");
    } else if ((resetOnLeave && !isInView) || !shouldAnimate) {
      controls.start("initial");
    }
  }, [
    isInView,
    controls,
    onScroll,
    resetOnLeave,
    show,
    isMounted,
    rotationReady,
    randomRotation,
  ]);

  // Determine initial animation state - only show if rotation is ready
  const shouldShowInitially =
    !onScroll && (show === undefined || show) && isMounted && rotationReady;

  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate={shouldShowInitially ? "animate" : controls}
      exit="exit"
      variants={variants}
      transition={customTransition}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
};

export default AnimateComponent;
