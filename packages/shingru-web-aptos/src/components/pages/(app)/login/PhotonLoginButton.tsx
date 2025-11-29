"use client";

import { useState } from "react";
import { motion, Variants } from "motion/react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/providers/AuthProvider";
import { useAttributionTracking } from "@/hooks/useAttributionTracking";

interface PhotonLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export default function PhotonLoginButton({
  onSuccess,
  onError,
  disabled = false,
}: PhotonLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authenticateWithPhoton } = useAuth();
  const { trackButtonClick } = useAttributionTracking();

  const handleClick = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      console.log("Photon authentication clicked");
      
      // Track button click attribution
      trackButtonClick('photon-login-button', { action: 'login_attempt' });
      
      await authenticateWithPhoton();
      
      onSuccess?.();
    } catch (error) {
      console.error("Photon authentication error:", error);
      const errorMessage = error instanceof Error ? error.message : "Authentication failed";
      setError(errorMessage);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonVariants: Variants = {
    rest: { scale: 1 },
    tap: { scale: 0.98 },
  };

  const iconVariants: Variants = {
    rest: { scale: 1, rotate: 0 },
    hover: { scale: 1.1, rotate: 15 },
  };

  return (
    <div className="w-full space-y-2">
      <motion.div
        variants={buttonVariants}
        initial="rest"
        whileHover={!isLoading && !disabled ? "hover" : undefined}
        whileTap={!isLoading && !disabled ? "tap" : undefined}
        className="w-full"
      >
        <button
          className={`h-16 md:h-14 px-6 w-full rounded-3xl md:rounded-2xl transition-colors duration-200 ${
            isLoading || disabled
              ? "bg-gray-50/50 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 cursor-pointer"
          }`}
          onClick={handleClick}
          disabled={isLoading || disabled}
        >
          <div className="flex flex-row items-center w-full gap-5">
            <div className="relative w-8 h-8 flex items-center justify-center">
              {isLoading ? (
                <div className="absolute">
                  <div className="size-7 loading loading-spinner text-purple-500" />
                </div>
              ) : (
                <motion.div variants={iconVariants} className="absolute">
                  <SparklesIcon className="size-7 text-purple-600" />
                </motion.div>
              )}
            </div>

            <div className="flex flex-col items-start w-full gap-0">
              <div className="flex items-center gap-2">
                <div
                  className={`font-medium ${
                    isLoading || disabled ? "text-gray-500" : "text-gray-900"
                  }`}
                >
                  {isLoading ? "Connecting..." : "Login with Photon"}
                </div>
                {process.env.NEXT_PUBLIC_PHOTON_DEMO_MODE === 'true' && !isLoading && (
                  <span className="px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded">
                    Demo
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400 font-medium -mt-1">
                {process.env.NEXT_PUBLIC_PHOTON_DEMO_MODE === 'true' 
                  ? "Demo mode - mock authentication"
                  : "Passwordless authentication"
                }
              </div>
            </div>
          </div>
        </button>
      </motion.div>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700"
        >
          <p className="font-medium">Authentication failed</p>
          <p className="text-xs mt-1">{error}</p>
          <p className="text-xs mt-2 text-red-600">
            Please try using the Petra wallet option instead.
          </p>
        </motion.div>
      )}
    </div>
  );
}
