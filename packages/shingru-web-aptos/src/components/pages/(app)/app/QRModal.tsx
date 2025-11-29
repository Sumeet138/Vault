import React, { useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
} from "motion/react";
import { createPortal } from "react-dom";
import ColorCard from "@/components/common/ColorCard";
import { EASE_OUT_QUART } from "@/config/animation";
import { useIsMounted } from "@/hooks/use-is-mounted";
import CuteQrCode from "@/components/common/CuteQrCode/CuteQrCode";
import AnimateComponent from "@/components/common/AnimateComponent";
import BlackShingruIcon from "@/components/icons/BlackShingruIcon";
import { XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";
import { COLOR_PICKS } from "@/config/styling";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  label: string;
  color: string;
}

export default function QRModal({
  isOpen,
  onClose,
  url,
  label,
  color,
}: QRModalProps) {
  const isMounted = useIsMounted();
  const [copied, setCopied] = useState(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springValues = {
    damping: 30,
    stiffness: 100,
    mass: 2,
  };

  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);

  const rotateAmplitude = 14;
  const scaleOnHover = 1.05; // a bit more subtle

  function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);

    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  }

  function handleMouseEnter() {
    scale.set(scaleOnHover);
  }

  function handleMouseLeave() {
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCopyToClipboard = async () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    timeout.current = setTimeout(() => setCopied(false), 2000);
  };

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Fullscreen Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT_QUART }}
            className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center"
            onClick={handleBackdropClick}
          >
            {/* Close Button */}
            <motion.button
              onClick={onClose}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.3,
                duration: 0.3,
                type: "spring",
                bounce: 0.3,
              }}
              className="cursor-pointer absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600" />
            </motion.button>

            {/* Content */}
            <motion.div
              className="flex flex-col items-center justify-center text-center px-6 max-w-md w-full"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.2,
                  },
                },
              }}
              initial="hidden"
              animate="visible"
            >
              {/* Title */}
              <motion.div
                variants={{
                  hidden: { y: 10, opacity: 0 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    transition: {
                      type: "tween",
                      duration: 0.2,
                      ease: EASE_OUT_QUART,
                    },
                  },
                }}
                className="mb-8"
              >
                <h3 className="text-2xl font-semibold text-gray-900 mb-1.5 capitalize">
                  {label}
                </h3>
                <p className="text-gray-500 text-sm">
                  Scan to open payment link
                </p>
              </motion.div>

              {/* QR Code */}
              <motion.div
                variants={{
                  hidden: { y: 10, opacity: 0 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    transition: {
                      type: "tween",
                      duration: 0.2,
                      ease: EASE_OUT_QUART,
                    },
                  },
                }}
                className="mb-8"
              >
                {/* <ColorCard className="rounded-[40px] p-2" color={color}>
                  <div className="bg-black p-6 rounded-[32px]">
                    <AnimateComponent>
                      <CuteQrCode
                        value={url}
                        size={240}
                        level="H"
                        bgColor="#000000"
                        fgColor="#FFFFFF"
                        logo={<BlackShingruIcon className="!w-12 !h-12" />}
                        logoSize={64}
                      />
                    </AnimateComponent>
                  </div>
                </ColorCard> */}
                <motion.div
                  ref={ref}
                  onMouseMove={handleMouse}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className="[perspective:800px]"
                >
                  <motion.div
                    style={{
                      rotateX,
                      rotateY,
                      scale,
                    }}
                    className="[transform-style:preserve-3d]"
                  >
                    <AnimateComponent>
                      <ColorCard color={color} className="rounded-[4rem] p-2">
                        <div className="bg-white p-6 rounded-[3.5rem]">
                          <CuteQrCode
                            value={url}
                            size={240}
                            level="H"
                            logo={<BlackShingruIcon className="!w-12 !h-12" />}
                            logoSize={64}
                            color={color}
                          />
                        </div>
                      </ColorCard>
                    </AnimateComponent>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* URL Display */}
              <motion.div
                variants={{
                  hidden: { y: 10, opacity: 0 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    transition: {
                      type: "tween",
                      duration: 0.2,
                      ease: EASE_OUT_QUART,
                    },
                  },
                }}
                className="relative mb-6 w-full"
              >
                <button
                  onClick={handleCopyToClipboard}
                  className="relative overflow-hidden w-fit mx-auto text-sm break-all px-8 font-semibold bg-gray-100 hover:bg-gray-100 py-4 rounded-2xl transition-colors cursor-pointer group flex items-center justify-center gap-2"
                >
                  <div className="invisible">{url}</div>
                  <AnimatePresence initial={false} mode="sync">
                    {copied ? (
                      <motion.div
                        key="copied"
                        initial={{
                          opacity: 0,
                          y: "-100%",
                          scale: 0.9,
                        }}
                        animate={{
                          opacity: 1,
                          y: "0%",
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          y: "100%",
                          scale: 0.9,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 32,
                        }}
                        onClick={handleCopyToClipboard}
                        className="absolute inset-0 flex items-center justify-center gap-2 bg-green-100 text-green-700 text-sm font-medium"
                      >
                        <CheckIcon className="w-4 h-4" />
                        Copied!
                      </motion.div>
                    ) : (
                      <motion.div
                        key="url"
                        initial={{
                          opacity: 0,
                          y: "-100%",
                          scale: 0.9,
                        }}
                        animate={{
                          opacity: 1,
                          y: "0%",
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          y: "100%",
                          scale: 0.9,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 32,
                        }}
                        className="absolute inset-0 flex items-center justify-center font-semibold"
                      >
                        {url}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>

              {/* Logo */}
              <motion.div
                variants={{
                  hidden: { y: 10, opacity: 0 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    transition: {
                      type: "tween",
                      duration: 0.2,
                      ease: EASE_OUT_QUART,
                    },
                  },
                }}
                className="text-xl font-bold text-gray-900 opacity-40"
              >
                shingru
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body!
  );
}
