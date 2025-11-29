import { motion, Variants } from "motion/react";
import { CuteModal } from "@/components/common/CuteModal";
import { User, Wallet } from "lucide-react";
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

function LoginModal({
  isOpen,
  onClose,
  isDesktop = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  isDesktop?: boolean;
}) {
  const { isSigningIn } = useAuth();

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const { setOpen: setGlobalModalOpen } = useModalStore();

  useEffect(() => {
    setGlobalModalOpen(isOpen);
  }, [isOpen]);

  // Animation variants for buttons
  const buttonVariants = {};

  // Animation variants for icons
  const iconVariants = {
    rest: { rotate: 0 },
    hover: { rotate: 10 },
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
    <CuteModal
      isOpen={isOpen}
      onClose={onClose}
      fullscreen
      withHandle={true}
      title="Login"
    >
      <div className="flex flex-col items-center gap-2 py-2 h-full">
        {/* Social Login Button */}
        <motion.div
          variants={buttonVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          className="w-full"
        >
          <button
            className="h-[5.5rem] px-6 w-full bg-gray-50 rounded-3xl hover:bg-gray-100 transition-colors duration-20 cursor-pointer"
            onClick={() => {
              onClose();
            }}
          >
            <div className="flex flex-row items-center w-full gap-5">
              <div className="relative w-8 h-8 flex items-center justify-center">
                {/* Original User Icon */}
                <motion.div variants={socialIconVariants} className="absolute">
                  <User className="size-7 text-gray-600" />
                </motion.div>

                {/* Social Circles Animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Top Left Circle (Small) */}
                  <motion.div
                    variants={topLeftCircle}
                    className="absolute size-3  rounded-full -translate-x-1 shrink-0 flex items-center justify-center"
                  >
                    <Twitter className="size-3" />
                  </motion.div>

                  {/* Top Right Circle (Small) */}
                  <motion.div
                    variants={topRightCircle}
                    className="absolute size-4 rounded-full -translate-y-1 shrink-0 flex items-center justify-center"
                  >
                    <Facebook className="size-4" />
                  </motion.div>

                  {/* Bottom Circle (Large) */}
                  <motion.div
                    variants={bottomCircle}
                    className="absolute size-5 rounded-full shrink-0 flex items-center justify-center"
                  >
                    <Google className="size-4" />
                  </motion.div>
                </div>
              </div>

              <div className="flex flex-col items-start w-full gap-0">
                <div className="font-medium text-gray-900">
                  Login with Socials
                </div>
                <div className="text-xs md:text-sm text-gray-600 font-medium -mt-1 text-start">
                  Convenient access to your wallet
                </div>
              </div>
            </div>
          </button>
        </motion.div>

        {/* Wallet Connect Button */}
        <motion.div
          variants={buttonVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          className="w-full"
        >
          <button
            className="h-[5.5rem] bg-gray-50 px-6 w-full rounded-3xl cursor-pointer"
            onClick={() => {
              setIsWalletModalOpen(true);
            }}
          >
            <div className="flex flex-row items-center w-full gap-5">
              <div className="relative w-8 h-8 flex items-center justify-center">
                {/* Original User Icon */}
                <motion.div variants={socialIconVariants} className="absolute">
                  <Wallet className="size-7 text-gray-600" />
                </motion.div>

                {/* Social Circles Animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Top Left Circle (Small) */}
                  <motion.div
                    variants={topLeftCircle}
                    className="absolute size-3.5 rounded-full -translate-x-0.5 -translate-y-1 shrink-0 flex items-center justify-center"
                  >
                    <MetaMask className="size-3.5" />
                  </motion.div>

                  {/* Top Right Circle (Small) */}
                  <motion.div
                    variants={topRightCircle}
                    className="absolute size-5 rounded-full -translate-y-1 translate-x-1 shrink-0 flex items-center justify-center"
                  >
                    <Slush className="size-4" />
                  </motion.div>

                  {/* Bottom Circle (Large) */}
                  <motion.div
                    variants={bottomCircle}
                    className="absolute size-5 rounded-full shrink-0 flex items-center justify-center"
                  >
                    <Phantom className="size-4" />
                  </motion.div>
                </div>
              </div>

              <div className="flex flex-col items-start w-full gap-0">
                <div className="font-medium text-gray-900">Connect Wallet</div>
                <div className="text-xs md:*:text-sm text-gray-600 font-medium -mt-1">
                  Use your existing wallet
                </div>
              </div>
            </div>
          </button>
        </motion.div>
      </div>

      {/* Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </CuteModal>
  );
}

export default LoginModal;
