import { motion, Variants } from "motion/react";
import {} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import WalletConnectModal from "./WalletConnectModal";
import { useEffect, useState } from "react";
import { useModalStore } from "@/store/modal-store";
import Twitter from "@/components/icons/socials/Twitter";
import Facebook from "@/components/icons/socials/Facebook";
import Google from "@/components/icons/socials/Google";
import MetaMask from "@/components/icons/wallets/Metamask";
import Slush from "@/components/icons/wallets/Slush";
import Phantom from "@/components/icons/wallets/Phantom";
import { UserCircleIcon, WalletIcon } from "@heroicons/react/24/outline";

function LoginForm({ onBack }: { onBack: () => void }) {
  const { isSigningIn } = useAuth();

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const { setOpen: setGlobalModalOpen } = useModalStore();

  useEffect(() => {
    setGlobalModalOpen(false);
  }, [setGlobalModalOpen]);

  useEffect(() => {
    setIsLoggingIn(isSigningIn);
  }, [isSigningIn]);

  const buttonVariants: Variants = {
    rest: { scale: 1 },
    tap: { scale: 0.98 },
  };

  const socialIconVariants: Variants = {
    rest: { scale: 1, opacity: 1 },
    hover: { scale: 0.1, opacity: 0 },
  };

  const topLeftCircle: Variants = {
    rest: { scale: 0, opacity: 0, x: 0, y: 0 },
    hover: {
      scale: 1,
      opacity: 1,
      x: -8,
      y: -8,
      transition: {
        delay: 0.15,
        type: "spring",
        duration: 0.3,
        bounce: 0.25,
      },
    },
  };
  const topRightCircle: Variants = {
    rest: { scale: 0, opacity: 0, x: 0, y: 0 },
    hover: {
      scale: 1,
      opacity: 1,
      x: 8,
      y: -8,
      transition: {
        delay: 0.2,
        type: "spring",
        duration: 0.3,
        bounce: 0.25,
      },
    },
  };
  const bottomCircle: Variants = {
    rest: { scale: 0, opacity: 0, x: 0, y: 0 },
    hover: {
      scale: 1.4,
      opacity: 1,
      x: 0,
      y: 12,
      transition: {
        delay: 0.1,
        type: "spring",
        duration: 0.3,
        bounce: 0.25,
      },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 w-full">
      <WalletConnectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
      {
        <>
          {/* <div className="w-full max-w-md mb-4">
            <button
              onClick={() => onBack()}
              className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div> */}

          {/* Social Login Button */}
          <motion.div
            variants={buttonVariants}
            initial="rest"
            animate={isLoggingIn ? "loading" : "rest"}
            whileHover={!isLoggingIn ? "hover" : undefined}
            whileTap={!isLoggingIn ? "tap" : undefined}
            className="w-full max-w-md"
          >
            <button
              className={`h-[5.5rem] px-6 w-full rounded-3xl transition-colors duration-200 ${
                isLoggingIn
                  ? "bg-gray-50/50 cursor-not-allowed"
                  : "bg-gray-50 hover:bg-gray-100 cursor-pointer"
              }`}
              onClick={() => {
                if (isLoggingIn) return;
                setIsWalletModalOpen(true);
              }}
              disabled={isLoggingIn}
            >
              <div className="flex flex-row items-center w-full gap-5">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  {isLoggingIn ? (
                    <div className="absolute">
                      <div className="size-7 loading loading-spinner text-gray-500" />
                    </div>
                  ) : (
                    <>
                      <motion.div
                        variants={socialIconVariants}
                        className="absolute"
                      >
                        <UserCircleIcon className="size-7 text-gray-900" />
                      </motion.div>

                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          variants={topLeftCircle}
                          className="absolute size-3  rounded-full -translate-x-1 shrink-0 flex items-center justify-center"
                        >
                          <Twitter className="size-3" />
                        </motion.div>

                        <motion.div
                          variants={topRightCircle}
                          className="absolute size-4 rounded-full -translate-y-1 shrink-0 flex items-center justify-center"
                        >
                          <Facebook className="size-4" />
                        </motion.div>

                        <motion.div
                          variants={bottomCircle}
                          className="absolute size-5 rounded-full shrink-0 flex items-center justify-center"
                        >
                          <Google className="size-4" />
                        </motion.div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-col items-start w-full gap-0">
                  <div
                    className={`font-medium ${
                      isLoggingIn ? "text-gray-500" : "text-gray-900"
                    }`}
                  >
                    {isLoggingIn ? "Connecting..." : "Login with Socials"}
                  </div>
                </div>
              </div>
            </button>
          </motion.div>

          <motion.div
            variants={buttonVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            className="w-full max-w-md"
          >
            <button
              className="h-[5.5rem] bg-gray-50 px-6 w-full rounded-3xl cursor-pointer hover:bg-gray-100 transition-colors duration-200"
              onClick={() => {
                setIsWalletModalOpen(true);
              }}
            >
              <div className="flex flex-row items-center w-full gap-5">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <motion.div
                    variants={socialIconVariants}
                    className="absolute"
                  >
                    <WalletIcon className="size-7 text-gray-900" />
                  </motion.div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      variants={topLeftCircle}
                      className="absolute size-3.5 rounded-full -translate-x-0.5 -translate-y-1 shrink-0 flex items-center justify-center"
                    >
                      <MetaMask className="size-3.5" />
                    </motion.div>

                    <motion.div
                      variants={topRightCircle}
                      className="absolute size-5 rounded-full -translate-y-1 translate-x-1 shrink-0 flex items-center justify-center"
                    >
                      <Slush className="size-4" />
                    </motion.div>

                    <motion.div
                      variants={bottomCircle}
                      className="absolute size-5 rounded-full shrink-0 flex items-center justify-center"
                    >
                      <Phantom className="size-4" />
                    </motion.div>
                  </div>
                </div>

                <div className="flex flex-col items-start w-full gap-0">
                  <div className="font-medium text-gray-900">
                    Connect Wallet
                  </div>
                  <div className="text-sm text-gray-400 font-medium -mt-1">
                    Use your existing wallet
                  </div>
                </div>
              </div>
            </button>
          </motion.div>
        </>
      }
    </div>
  );
}

export default LoginForm;
