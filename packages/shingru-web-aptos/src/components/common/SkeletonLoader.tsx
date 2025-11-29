"use client";

import { HTMLAttributes, ReactNode, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  isLoading: boolean;
  minDisplayTime?: number;
  skeletonClassName?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  children,
  isLoading,
  minDisplayTime = 200,
  skeletonClassName,
  className,
  ...props
}) => {
  const [showSkeleton, setShowSkeleton] = useState(isLoading);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now();
      setShowSkeleton(true);
    } else {
      if (startTimeRef.current) {
        const elapsedTime = Date.now() - startTimeRef.current;
        const remainingTime = minDisplayTime - elapsedTime;

        if (remainingTime > 0) {
          const timer = setTimeout(() => {
            setShowSkeleton(false);
          }, remainingTime);
          return () => clearTimeout(timer);
        }
      }
      setShowSkeleton(false);
    }
  }, [isLoading, minDisplayTime]);

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence>
        {showSkeleton && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <div className={cn("skeleton", skeletonClassName)} {...props} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!showSkeleton && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full w-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SkeletonLoader;
