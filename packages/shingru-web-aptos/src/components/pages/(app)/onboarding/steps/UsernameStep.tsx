import { useState, useEffect } from "react";
import { useDebounce } from "@uidotdev/usehooks";
// highlight-next-line
import UsernameAvailStatusPill from "@/components/common/UsernameAvailStatusPill"; // Make sure the path is correct
import { motion } from "motion/react";
import { RESTRICTED_USERNAME } from "@/config/restricted-username";
import { useAuth } from "@/providers/AuthProvider";
import { Input } from "@/components/ui/input";
import { EASE_OUT_QUART } from "@/config/animation";
import { useIsMounted } from "@/hooks/use-is-mounted";
import MainButton from "@/components/common/MainButton";
import { checkUsernameAvailability, updateUsername, updateUsernameByWallet } from "@/lib/supabase/users";
import { getBaseHostname } from "@/utils/url";

interface UsernameStepProps {
  savedUsername?: string;
  onUsernameChange?: (username: string) => void;
}

export function UsernameStep({
  savedUsername,
  onUsernameChange,
}: UsernameStepProps) {
  const { backendToken, fetchMe, me, wallets, updateMeProfile } = useAuth();
  const isMounted = useIsMounted();
  const [username, setUsername] = useState(savedUsername || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Force lowercase and validate input
  const handleUsernameChange = (value: string) => {
    const lowercaseValue = value.toLowerCase();
    // Only allow alphanumeric characters
    if (lowercaseValue !== "" && !/^[a-z0-9]+$/.test(lowercaseValue)) {
      setValidationError("Only letters and numbers are allowed");
    } else if (lowercaseValue.length > 0 && lowercaseValue.length < 2) {
      setValidationError("Must be at least 2 characters");
    } else {
      setValidationError(null);
    }
    setUsername(lowercaseValue);
    // Update persistence
    if (onUsernameChange) {
      onUsernameChange(lowercaseValue);
    }
  };

  const debouncedUsername = useDebounce(username, 500);

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      // Don't check if the input is invalid or empty
      if (!debouncedUsername || validationError) {
        setIsAvailable(null);
        return;
      }

      // Check against restricted usernames first
      if (RESTRICTED_USERNAME.includes(debouncedUsername)) {
        setIsAvailable(false);
        return;
      }

      try {
        setIsChecking(true);
        // Check username availability in Supabase
        const isAvailable = await checkUsernameAvailability(debouncedUsername);
        setIsAvailable(isAvailable);
      } catch (error) {
        console.error("Error checking username:", error);
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    };

    checkUsername();
  }, [debouncedUsername, validationError]);

  const handleSubmitUsername = async () => {
    if (!isAvailable || !backendToken) return;
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Get wallet address from multiple sources
      let walletAddress: string | null = null;

      // 1. Try from wallets prop
      const aptosWallet = wallets?.find((w) => w.chain === "APTOS");
      if (aptosWallet) {
        walletAddress = aptosWallet.address;
        console.log("Got wallet from wallets prop:", walletAddress);
      }

      // 2. Try from localStorage
      if (!walletAddress) {
        const storedWallets = localStorage.getItem("shingru-wallets");
        if (storedWallets) {
          const parsedWallets = JSON.parse(storedWallets);
          const aptos = parsedWallets.find((w: any) => w.chain === "APTOS");
          if (aptos) {
            walletAddress = aptos.address;
            console.log("Got wallet from localStorage:", walletAddress);
          }
        }
      }

      // 3. Try from Petra wallet directly (similar to WalletConnectModal)
      if (!walletAddress && typeof window !== "undefined") {
        const petra = (window as any).aptos;
        if (petra) {
          try {
            // First, try to get account directly (if already connected)
            try {
              const account = await petra.account();
              if (account?.address) {
                walletAddress = account.address;
                console.log("Got wallet from Petra account():", walletAddress);
              }
            } catch (accountError) {
              console.log("petra.account() failed, trying connect():", accountError);
              // If account() fails, try connect()
              try {
                const response = await petra.connect();
                if (response?.address) {
                  walletAddress = response.address;
                  console.log("Got wallet from Petra connect():", walletAddress);
                } else if (response) {
                  // Some wallets return the account object directly
                  const account = await petra.account();
                  if (account?.address) {
                    walletAddress = account.address;
                    console.log("Got wallet from Petra after connect():", walletAddress);
                  }
                }
              } catch (connectError) {
                console.error("Failed to connect to Petra:", connectError);
              }
            }
          } catch (e) {
            console.error("Failed to get wallet from Petra:", e);
          }
        }
      }

      if (!walletAddress) {
        console.error("No wallet found in any source");
        console.error("wallets prop:", wallets);
        console.error("localStorage wallets:", localStorage.getItem("shingru-wallets"));
        console.error("window.aptos:", typeof window !== "undefined" ? (window as any).aptos : "N/A");
        throw new Error("Wallet address not found. Please make sure your wallet is connected and try refreshing the page.");
      }

      console.log("Updating username for wallet:", walletAddress);

      // Update username in Supabase using wallet address
      // This function will create user if doesn't exist, or update if exists
      const updatedUser = await updateUsernameByWallet(
        walletAddress,
        "APTOS",
        username
      );

      if (!updatedUser) {
        throw new Error("Failed to update username in database. Please try again.");
      }

      console.log("✅ Username updated successfully:", updatedUser);

      // Update me state directly with the updated user data
      // This ensures immediate state update without waiting for fetchMe
      updateMeProfile({
        username: updatedUser.username,
      });

      // Also refetch from Supabase to ensure we have the latest data
      // But don't wait for it - the state is already updated
      fetchMe().catch((error) => {
        console.error("Error fetching user profile after username update:", error);
      });

      // Notify parent component that username was set
      if (onUsernameChange) {
        onUsernameChange(username);
      }

    } catch (error: any) {
      console.error("Error setting username:", error);
      setSubmitError(error.message || "Failed to update username. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Main content */}
      <motion.div
        className="text-center mb-12"
        initial={!isMounted ? { opacity: 0, y: 10 } : {}}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, type: "tween", ease: EASE_OUT_QUART }}
      >
        <motion.p
          className="text-4xl font-semibold text-gray-900 mb-4 font-sans tracking-tight"
          initial={!isMounted ? { y: 10, opacity: 0 } : {}}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.05,
            duration: 0.4,
            type: "tween",
            ease: EASE_OUT_QUART,
          }}
        >
          What&apos;s your username?
        </motion.p>
        <motion.p
          className="text-gray-500 text-lg leading-tight max-w-lg text-balance mx-auto"
          initial={!isMounted ? { y: 10, opacity: 0 } : {}}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.1,
            duration: 0.4,
            type: "tween",
            ease: EASE_OUT_QUART,
          }}
        >
          Set up your username so others can easily find and pay you.
        </motion.p>
      </motion.div>

      <motion.div
        className="mb-8"
        initial={!isMounted ? { opacity: 0, y: 10 } : {}}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.15,
          duration: 0.4,
          type: "tween",
          ease: EASE_OUT_QUART,
        }}
      >
        <div className="w-full space-y-2">
          <div className="relative flex items-center">
            <span className="absolute left-5 z-10 font-semibold text-gray-500 pointer-events-none select-none">
              {getBaseHostname()}/
            </span>
            <Input
              id="username"
              placeholder="enter-your-username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className="pl-[7rem] pr-5 h-16 w-full text-base border-none font-medium bg-gray-50 rounded-2xl focus-visible:ring-gray-200 focus-visible:ring-3"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>
        </div>

        {/* --- REPLACEMENT SECTION --- */}
        <div className="mt-4">
          <UsernameAvailStatusPill
            username={username}
            debouncedUsername={debouncedUsername}
            isAvailable={isAvailable}
            isChecking={isChecking}
            validationError={validationError}
            restrictedUsernames={RESTRICTED_USERNAME}
          // `originalUsername` is not needed here as it's for new user creation
          />
        </div>
        {/* --- END REPLACEMENT --- */}

        {/* Error message */}
        {submitError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

      </motion.div>

      {/* Continue button */}
      <motion.div
        className="mt-8"
        initial={!isMounted ? { opacity: 0, y: 10 } : {}}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.2,
          duration: 0.4,
          type: "tween",
          ease: EASE_OUT_QUART,
        }}
      >
        <MainButton
          onClick={handleSubmitUsername}
          isLoading={isSubmitting}
          className="w-full h-14 rounded-2xl text-lg font-semibold bg-green-600 hover:bg-green-400 text-white disabled:bg-gray-200 disabled:text-gray-400"
          disabled={
            !username || !isAvailable || isChecking || !!validationError
          }
        >
          Continue
        </MainButton>
      </motion.div>
    </div>
  );
}