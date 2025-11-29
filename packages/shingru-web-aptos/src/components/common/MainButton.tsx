import { AnimatePresence, motion } from "motion/react";
import { cnm } from "@/utils/style";
import { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { buttonColors } from "@/config/styling";

type Color = keyof typeof buttonColors;
type Variant = "default" | "light";

export default function MainButton({
  className,
  classNameContainer,
  isLoading,
  children,
  loadingMessage = "Please wait...",
  disabled = false,
  isLoader = false,
  color = "primary",
  variant = "default",
  customLoading,
  ...props
}: PropsWithChildren<
  {
    className?: string;
    classNameContainer?: string;
    isLoading?: boolean;
    loadingMessage?: string;
    disabled?: boolean;
    isLoader?: boolean;
    color?: Color;
    variant?: Variant;
    customLoading?: ReactNode;
  } & HTMLAttributes<HTMLButtonElement>
>) {
  const shouldShowLoader = typeof isLoading !== "undefined" || isLoader;
  return (
    <motion.div
      whileTap={{
        scale: 0.99,
      }}
      animate={{
        scale: isLoading ? 0.98 : 1,
      }}
      className={classNameContainer}
    >
      <button
        className={cnm(
          "cursor-pointer w-auto min-h-[3rem] rounded-xl flex items-center justify-center font-semibold text-lg",
          "transition disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative",
          buttonColors[color][variant],
          className
        )}
        disabled={disabled}
        {...props}
      >
        {shouldShowLoader ? (
          <>
            <div className="invisible">{children}</div>
            <AnimatePresence initial={false} mode="sync">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{
                    opacity: 0,
                    y: isLoading ? "-100%" : "0%",
                    scale: 0.9,
                  }}
                  animate={{
                    opacity: 1,
                    y: "0%",
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: isLoading ? "100%" : "0%",
                    scale: 0.9,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 32,
                  }}
                  className="absolute inset-0 flex items-center justify-center gap-2"
                >
                  {customLoading || (
                    <div className="size-5 loading loading-spinner loading-sm" />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{
                    opacity: 0,
                    y: isLoading ? "0%" : "-100%",
                    scale: 0.9,
                  }}
                  animate={{
                    opacity: 1,
                    y: "0%",
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: isLoading ? "0%" : "100%",
                    scale: 0.9,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 32,
                  }}
                  className="absolute inset-0 flex items-center justify-center font-semibold"
                >
                  {children}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          children
        )}
      </button>
    </motion.div>
  );
}
