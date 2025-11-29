"use client";

import React, { useState, useRef } from "react";
import {
  motion,
  PanInfo,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "motion/react";
import { createPortal } from "react-dom";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { EASE_OUT_QUART, EASE_OUT_QUINT } from "@/config/animation";
import { cnm } from "@/utils/style";
import MainButton from "./MainButton";
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useIsMobile } from "@/hooks/use-is-mobile";

interface CuteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  title?: string;
  children: React.ReactNode;
  size?:
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "full";
  hideCloseButton?: boolean;
  footer?: React.ReactNode;
  className?: string;
  fullscreen?: boolean;
  withHeader?: boolean;
  withHandle?: boolean;
  headerVariant?: "default" | "simple";
}

const getSizeClass = (size: string) => {
  const sizes: Record<string, string> = {
    xs: "max-w-xs",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    full: "max-w-full",
  };
  return sizes[size] || sizes.md;
};

export const CuteModal: React.FC<CuteModalProps> = ({
  isOpen,
  onClose,
  onBack,
  title,
  children,
  size = "lg",
  hideCloseButton = false,
  footer,
  className = "",
  fullscreen = false,
  withHeader = true,
  withHandle = false,
  headerVariant = "default",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCloseButtonHovered, setCloseButtonHovered] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0.8]);
  const isMounted = useIsMounted();
  const isMobile = useIsMobile();

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false);
    const modalHeight = modalRef.current?.offsetHeight || 400;
    const dragDistance = info.offset.y;

    if (dragDistance > modalHeight * 0.2) {
      onClose();
    } else {
      y.set(0);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalSize = !isMobile ? size : "xl";

  const variants = !isMobile
    ? {
        initial: { opacity: 0, scale: 0.98, y: 10 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.98, y: 10 },
      }
    : {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" },
      };

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT_QUINT }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={handleBackdropClick}
          />

          <div
            className={cnm(
              "fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none",
              fullscreen ? "p-0" : "p-4 md:p-0"
            )}
          >
            <motion.div
              ref={modalRef}
              className={cnm(
                "w-full overflow-hidden pointer-events-auto flex flex-col",
                "bg-white rounded-[2rem]",
                getSizeClass(modalSize),
                fullscreen ? "max-h-[90vh]" : "max-h-[85vh]",
                className
              )}
              style={!isMobile ? {} : { y, opacity }}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                type: "tween",
                ease: EASE_OUT_QUINT,
                duration: 0.3,
              }}
              drag={isMobile && withHandle ? "y" : false}
              dragConstraints={{ top: 0, bottom: 300 }}
              dragElastic={0}
              dragMomentum={false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {withHandle && isMobile && (
                <div
                  className={cnm(
                    "flex justify-center pt-4 pb-0 cursor-grab",
                    isDragging && "cursor-grabbing"
                  )}
                  role="button"
                  aria-label="Drag to close modal"
                >
                  <div className="w-12 h-1 bg-gray-950/20 rounded-full" />
                </div>
              )}

              {withHeader && title ? (
                <div
                  className={cnm(
                    "flex-shrink-0",
                    headerVariant === "simple"
                      ? "flex justify-cente items-center pt-4 pb-2"
                      : "py-2"
                  )}
                >
                  {headerVariant === "simple" ? (
                    <h3 className="text-xl font-semibold text-gray-900 p-2">
                      {title}
                    </h3>
                  ) : (
                    <div className="flex items-center justify-between w-full rounded-full p-2">
                      <div className="flex items-center space-x-3">
                        {onBack && (
                          <button
                            onClick={onBack}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150 active:scale-95"
                            type="button"
                          >
                            <ArrowLeftIcon className="w-5 h-5" />
                          </button>
                        )}
                        <h3 className="text-xl font-semibold text-gray-900 truncate ml-4">
                          {title}
                        </h3>
                      </div>
                      {!hideCloseButton && !isMobile ? (
                        <MainButton
                          onClick={onClose}
                          className="bg-white hover:bg-gray-100 size-10 mr-2 rounded-full"
                          onMouseEnter={() => setCloseButtonHovered(true)}
                          onMouseLeave={() => setCloseButtonHovered(false)}
                        >
                          <motion.div
                            animate={{
                              color: isCloseButtonHovered
                                ? "#000000"
                                : "#9ca3af",
                              scale: isCloseButtonHovered ? 1.1 : 1,
                            }}
                            transition={{
                              ease: EASE_OUT_QUART,
                            }}
                          >
                            <XMarkIcon className="w-6 h-6 stroke-2" />
                          </motion.div>
                        </MainButton>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-shrink-0 px-6 py-2" />
              )}

              <div
                className={
                  "flex-1 px-5 pb-5 md:px-6 pt-2 md:pb-6 overflow-y-auto w-full"
                }
              >
                {children}
              </div>

              {footer && (
                <div className="flex-shrink-0 px-6 pb-6">{footer}</div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body!
  );
};

export default CuteModal;
