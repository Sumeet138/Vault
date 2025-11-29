"use client";

import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { useState, useEffect, useMemo } from "react";
import WalletConnectModal from "@/components/pages/(app)/login/WalletConnectModal";
import { motion } from "motion/react";
import AnimateComponent from "@/components/common/AnimateComponent";
import ShingruLogo from "@/components/icons/ShingruLogo";
import { EASE_OUT_QUART } from "@/config/animation";
import { useIsMounted } from "@/hooks/use-is-mounted";
import MainButton from "@/components/common/MainButton";
import InfoBadge from "@/components/common/InfoBadge";
// Aptos is the only supported chain
import { useMetaKeys } from "@/providers/MetaKeysProvider";
import { useRouter } from "next/navigation";
import { UsernameStep } from "../onboarding/steps/UsernameStep";
import { ProfileImageStep } from "../onboarding/steps/ProfileImageStep";
import { PinStep } from "../onboarding/steps/PinStep";
// Aptos wallet connection handled via window.aptos
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import StepIndicator from "@/components/common/StepIndicator";
import PhotonLoginButton from "./PhotonLoginButton";

// Auth states - single source of truth
enum AuthState {
  NOT_SIGNED_IN = "NOT_SIGNED_IN",
  NEEDS_USERNAME = "NEEDS_USERNAME",
  NEEDS_PROFILE_IMAGE = "NEEDS_PROFILE_IMAGE",
  NEEDS_META_KEYS = "NEEDS_META_KEYS",
  NEEDS_WALLET_CONNECTION = "NEEDS_WALLET_CONNECTION",
  NEEDS_UNLOCK = "NEEDS_UNLOCK",
  FULLY_AUTHENTICATED = "FULLY_AUTHENTICATED",
  LOADING = "LOADING",
}

export default function LoginIndex() {
  const { me, isSignedIn, isSigningIn, disconnect, backendToken } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Show loading while signing in or checking auth
  if (isSigningIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="loading loading-dots w-12 text-gray-600"></div>
          <div className="text-center text-gray-400 font-medium">
            Signing In...
          </div>
        </div>
      </div>
    );
  }

  // If we have a token but profile is loading, show loading
  if (backendToken && !me) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="loading loading-dots w-12 text-gray-600"></div>
          <div className="text-center text-gray-400 font-medium">
            Loading your profile...
          </div>
        </div>
      </div>
    );
  }

  // If fully authenticated, redirect to app (AuthenticatedLogin will handle the redirect)
  if (isSignedIn && me) {
    return <AuthenticatedLogin />;
  }

  // Not signed in - show welcome screen
  return (
    <div className="w-full h-dvh overflow-y-auto bg-white">
      <WelcomeScreen onConnect={() => setIsModalOpen(true)} onLogout={disconnect} />
      <WalletConnectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

// This component is only rendered when user is signed in and has MetaKeysProvider available
function AuthenticatedLogin() {
  const { me, disconnect } = useAuth();
  const { isMetaKeysLoaded, hasEncryptedMetaKeys, isSessionLoadingComplete } = useMetaKeys();
  const router = useRouter();

  // Get Aptos wallet
  const getAptosWallet = () => {
    if (typeof window === "undefined") return null;
    return (window as any).aptos;
  };

  const [aptosAccount, setAptosAccount] = useState<string | null>(null);

  useEffect(() => {
    const checkWallet = async () => {
      const wallet = getAptosWallet();
      if (wallet) {
        try {
          const account = await wallet.account();
          setAptosAccount(account?.address || null);
        } catch {
          setAptosAccount(null);
        }
      } else {
        setAptosAccount(null);
      }
    };
    checkWallet();
    const interval = setInterval(checkWallet, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine current auth state - single source of truth
  const getCurrentAuthState = (): AuthState => {
    if (!me) {
      return AuthState.LOADING;
    }

    // Check profile completeness
    if (!me.username) {
      return AuthState.NEEDS_USERNAME;
    }

    if (!me.profileImage) {
      return AuthState.NEEDS_PROFILE_IMAGE;
    }

    // Check if meta keys are set up locally (backend-less mode)
    if (!isSessionLoadingComplete) {
      return AuthState.LOADING;
    }

    // Check if we have encrypted meta keys stored locally
    const hasLocalMetaKeys = hasEncryptedMetaKeys();

    if (!hasLocalMetaKeys) {
      // Need to set up meta keys for the first time
      // But first need wallet connected
      if (!aptosAccount) {
        return AuthState.NEEDS_WALLET_CONNECTION;
      }
      return AuthState.NEEDS_META_KEYS;
    }

    // Has meta keys locally, check if unlocked
    if (!isMetaKeysLoaded) {
      // Meta keys exist but not unlocked
      if (!aptosAccount) {
        return AuthState.NEEDS_WALLET_CONNECTION;
      }
      return AuthState.NEEDS_UNLOCK;
    }

    // Everything is ready!
    return AuthState.FULLY_AUTHENTICATED;
  };

  const authState = useMemo(() => {
    const state = getCurrentAuthState();
    console.log("🔍 Auth state calculated:", {
      state,
      isMetaKeysLoaded,
      isSessionLoadingComplete,
      aptosAccount,
    });
    return state;
  }, [
    me,
    aptosAccount,
    isMetaKeysLoaded,
    isSessionLoadingComplete,
  ]);

  // Redirect to app when fully authenticated
  useEffect(() => {
    if (authState === AuthState.FULLY_AUTHENTICATED) {
      console.log("✅ Fully authenticated, redirecting to /app");
      router.push("/app");
    }
  }, [authState, router]);

  // Handle successful username submission
  const handleUsernameComplete = async () => {
    // fetchMe is called within UsernameStep, just wait for state to update
    console.log("✅ Username set, state will update automatically");
  };

  // Handle successful profile image submission
  const handleProfileImageComplete = () => {
    // fetchMe is called within ProfileImageStep, just wait for state to update
    console.log("✅ Profile image set, state will update automatically");
  };

  // Handle successful PIN setup/unlock
  const handlePinComplete = () => {
    console.log("✅ PIN complete, state will update automatically");
  };

  // Handle wallet connection
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const handleConnectWallet = async () => {
    // Open the Aptos wallet connect modal
    setIsWalletModalOpen(true);
  };

  // Render based on auth state
  switch (authState) {
    case AuthState.LOADING:
      return (
        <div className="w-full h-dvh overflow-y-auto bg-white">
          <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="loading loading-dots w-12 text-gray-600"></div>
              <div className="text-center text-gray-400 font-medium">
                Loading...
              </div>
            </div>
          </div>
        </div>
      );

    case AuthState.NEEDS_USERNAME:
      return (
        <div className="w-full h-dvh overflow-y-auto bg-white">
          <OnboardingLayout
            currentStep={1}
            totalSteps={3}
            onBack={disconnect}
          >
            <UsernameStep
              savedUsername={me?.username || undefined}
              onUsernameChange={handleUsernameComplete}
            />
          </OnboardingLayout>
        </div>
      );

    case AuthState.NEEDS_PROFILE_IMAGE:
      return (
        <div className="w-full h-dvh overflow-y-auto bg-white">
          <OnboardingLayout
            currentStep={2}
            totalSteps={3}
            onBack={disconnect}
          >
            <ProfileImageStep
              onNext={handleProfileImageComplete}
              savedProfileImage={me?.profileImage ? JSON.stringify(me.profileImage) : undefined}
            />
          </OnboardingLayout>
        </div>
      );

    case AuthState.NEEDS_WALLET_CONNECTION:
      return (
        <div className="w-full h-dvh overflow-y-auto bg-white">
          <OnboardingLayout
            currentStep={3}
            totalSteps={3}
            onBack={disconnect}
            showStepIndicator={false}
          >
            <div className="w-full">
              <div className="text-center mb-8 flex flex-col">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, type: "tween", ease: EASE_OUT_QUART }}
                  className="mb-6 flex justify-center"
                >
                  <ShingruLogo />
                </motion.div>

                <motion.h1
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05, duration: 0.5, type: "tween", ease: EASE_OUT_QUART }}
                  className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4"
                >
                  Connect Your Wallet
                </motion.h1>

                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, type: "tween", ease: EASE_OUT_QUART }}
                  className="text-gray-500 text-base md:text-lg leading-tight max-w-sm mx-auto text-balance"
                >
                  Connect your Aptos wallet to {hasEncryptedMetaKeys() ? "unlock your account" : "complete setup"}.
                </motion.p>
              </div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5, type: "tween", ease: EASE_OUT_QUART }}
              >
                <MainButton
                  onClick={handleConnectWallet}
                  className="rounded-2xl py-4 w-full"
                >
                  Connect Aptos Wallet
                </MainButton>
              </motion.div>
            </div>
          </OnboardingLayout>
          <WalletConnectModal
            isOpen={isWalletModalOpen}
            onClose={() => setIsWalletModalOpen(false)}
          />
        </div>
      );

    case AuthState.NEEDS_META_KEYS:
    case AuthState.NEEDS_UNLOCK:
      const isUnlocking = authState === AuthState.NEEDS_UNLOCK;
      return (
        <div className="w-full h-dvh overflow-y-auto bg-white">
          <OnboardingLayout
            currentStep={isUnlocking ? undefined : 3}
            totalSteps={isUnlocking ? undefined : 3}
            onBack={disconnect}
            showStepIndicator={!isUnlocking}
          >
            <PinStep
              onComplete={handlePinComplete}
              onNext={handlePinComplete}
            />
          </OnboardingLayout>
        </div>
      );

    case AuthState.FULLY_AUTHENTICATED:
      return (
        <div className="w-full h-dvh overflow-y-auto bg-white">
          <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="loading loading-dots w-12 text-gray-600"></div>
              <div className="text-center text-gray-400 font-medium">
                Redirecting to app...
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
// Helper component for the welcome screen (when not signed in)
function WelcomeScreen({
  onConnect,
  onLogout,
}: {
  onConnect: () => void;
  onLogout: () => void;
}) {
  const isMounted = useIsMounted();
  const { isSignedIn, wallets } = useAuth();
  const [aptosAccount, setAptosAccount] = useState<string | null>(null);
  const [isCheckingWallet, setIsCheckingWallet] = useState(true);

  // Get Aptos wallet
  const getAptosWallet = () => {
    if (typeof window === "undefined") return null;
    return (window as any).aptos;
  };

  // Check wallet connection status
  useEffect(() => {
    const checkWallet = async () => {
      setIsCheckingWallet(true);
      const wallet = getAptosWallet();
      if (wallet) {
        try {
          const account = await wallet.account();
          const address = account?.address || null;
          setAptosAccount(address);
          console.log("Wallet check:", address ? `Connected: ${address}` : "Not connected");
        } catch {
          setAptosAccount(null);
          console.log("Wallet check: Not connected (error)");
        }
      } else {
        setAptosAccount(null);
        console.log("Wallet check: No wallet extension found");
      }
      setIsCheckingWallet(false);
    };

    checkWallet();
    const interval = setInterval(checkWallet, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Mobile Layout */}
      <div className="block md:hidden h-full">
        <div className="flex flex-col items-center w-full h-full">
          <div className="flex items-center gap-2 mt-[2rem]">
            <AnimateComponent delay={200}>
              <div className="text-4xl font-bold text-gray-900">shingru</div>
            </AnimateComponent>
            <AnimateComponent delay={250}>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-md border border-black/5 inline-flex items-center gap-1">
                Aptos
              </span>
            </AnimateComponent>
          </div>

          <div className="w-full flex-1 flex flex-col items-center justify-center pt-20">
            <LoginGhosts />
          </div>

          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
            className="w-full bg-white rounded-t-[40px] px-6 pt-10 pb-8"
          >
            <div className="flex flex-col items-center gap-8 w-full max-w-sm mx-auto">
              <div className="flex flex-col gap-5">
                <motion.h1
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.6, bounce: 0.2, delay: 0.05 }}
                  className="text-4xl md:text-5xl font-extrabold text-center text-black"
                >
                  Get Paid<br />Stay Private
                </motion.h1>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.6, bounce: 0.2, delay: 0.1 }}
                  className="text-center text-sm md:text-base text-pretty opacity-60 max-w-[20rem] mx-auto text-black"
                >
                  Payment toolkit that keeps your real wallet private using Stealth Addresses.
                </motion.p>
              </div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", duration: 0.6, bounce: 0.2, delay: 0.15 }}
                className="w-full space-y-3"
              >
                {isSignedIn ? (
                  <MainButton onClick={onLogout} className="w-full h-16">Logout</MainButton>
                ) : (
                  <>
                    <PhotonLoginButton />
                    <div className="relative flex items-center justify-center my-4">
                      <div className="border-t border-gray-200 w-full"></div>
                      <span className="absolute bg-white px-3 text-sm text-gray-400">or</span>
                    </div>
                    {aptosAccount && (
                      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 text-center">
                        ✓ Wallet Connected: {aptosAccount.slice(0, 6)}...{aptosAccount.slice(-4)}
                      </div>
                    )}
                    {!isCheckingWallet && !aptosAccount && (
                      <MainButton onClick={onConnect} className="w-full h-16 bg-green-600 hover:bg-green-400 text-white">
                        Connect Wallet
                      </MainButton>
                    )}
                    {isCheckingWallet && (
                      <div className="w-full h-16 flex items-center justify-center text-gray-500 text-sm rounded-xl border border-gray-200">
                        Checking wallet...
                      </div>
                    )}
                  </>
                )}
              </motion.div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", duration: 0.6, bounce: 0.2, delay: 0.18 }}
                className="w-full"
              >
                <InfoBadge
                  title={
                    <span className="inline-flex items-center gap-2">
                      Live on Aptos Testnet
                    </span>
                  }
                  variant="neutral"
                  className="w-full"
                >
                  <div className="text-sm text-center text-gray-600">
                    Don&apos;t forget to set your wallet to testnet.
                  </div>
                </InfoBadge>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block h-full">
        <div className="flex flex-col items-center justify-center w-full min-h-screen bg-white overflow-hidden">
          <div className="flex-1 flex items-center justify-center w-full">
            <div className="flex flex-col items-center justify-center max-w-md mx-auto px-8">
              <motion.div
                initial={!isMounted ? { opacity: 0, y: 10 } : {}}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, type: "tween", ease: EASE_OUT_QUART }}
                className="mb-4 relative"
              >
                <ShingruLogo />
                <motion.span
                  initial={!isMounted ? { opacity: 0, scale: 0.8 } : {}}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, type: "spring", bounce: 0.3, delay: 0.15 }}
                  className="absolute -top-3 -right-3 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-md border border-black/5 shadow-sm inline-flex items-center gap-1"
                >
                  Aptos
                </motion.span>
              </motion.div>
              <motion.h1
                initial={!isMounted ? { y: 10, opacity: 0 } : {}}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05, duration: 0.5, type: "tween", ease: EASE_OUT_QUART }}
                className="text-2xl font-bold text-center text-gray-900 mb-2 font-sans"
              >
                Welcome to Vault
              </motion.h1>
              <motion.p
                initial={!isMounted ? { y: 10, opacity: 0 } : {}}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, type: "tween", ease: EASE_OUT_QUART }}
                className="text-center text-gray-500 mb-6 max-w-sm"
              >
                Get paid while staying private with our secure payment toolkit using Stealth Addresses.
              </motion.p>

              <motion.div
                initial={!isMounted ? { y: 10, opacity: 0 } : {}}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5, type: "tween", ease: EASE_OUT_QUART }}
                className="w-full space-y-3"
              >
                {isSignedIn ? (
                  <MainButton onClick={onLogout} className="h-14 rounded-2xl w-full">Logout</MainButton>
                ) : (
                  <>
                    <PhotonLoginButton />
                    <div className="relative flex items-center justify-center my-4">
                      <div className="border-t border-gray-200 w-full"></div>
                      <span className="absolute bg-white px-3 text-sm text-gray-400">or</span>
                    </div>
                    {aptosAccount && (
                      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 text-center">
                        ✓ Wallet Connected: {aptosAccount.slice(0, 6)}...{aptosAccount.slice(-4)}
                      </div>
                    )}
                    {!isCheckingWallet && !aptosAccount && (
                      <MainButton onClick={onConnect} className="h-14 rounded-2xl w-full bg-green-600 hover:bg-green-400 text-white">
                        Connect Wallet
                      </MainButton>
                    )}
                    {isCheckingWallet && (
                      <div className="h-14 flex items-center justify-center text-gray-500 text-sm rounded-2xl border border-gray-200">
                        Checking wallet...
                      </div>
                    )}
                  </>
                )}
              </motion.div>
              <motion.div
                initial={!isMounted ? { y: 10, opacity: 0 } : {}}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: "tween", ease: EASE_OUT_QUART }}
                className="w-full mt-8"
              >
                <InfoBadge
                  title={
                    <span className="inline-flex items-center gap-0.5">
                      Live on&nbsp;
                      <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full px-1.5 py-0.5 text-white">
                        Aptos
                      </span>
                      &nbsp;Testnet
                    </span>
                  }
                  variant="neutral"
                  className="w-full"
                >
                  <div className="text-sm text-center text-gray-600">
                    Don&apos;t forget to set your wallet to testnet.
                  </div>
                </InfoBadge>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper component for onboarding/auth flow layout
function OnboardingLayout({
  children,
  onBack,
  currentStep,
  totalSteps,
  showStepIndicator = true,
}: {
  children: React.ReactNode;
  onBack: () => void;
  currentStep?: number;
  totalSteps?: number;
  showStepIndicator?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-white overflow-hidden px-5">
      <button
        onClick={onBack}
        className="fixed top-6 left-6 z-10 cursor-pointer flex items-center justify-center text-gray-600 hover:text-black transition-colors"
        aria-label="Go back"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      {showStepIndicator && currentStep && totalSteps && (
        <div className="fixed top-6 right-6 z-10">
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        </div>
      )}
      <div className="flex-1 flex items-center justify-center w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

const DELAY = 0.24;

const LoginGhosts = () => {
  const cloudVariants = {
    hidden: (direction: string) => {
      const directions = {
        tl: { x: -20, y: -20, opacity: 0, scale: 0.8, rotate: -20 },
        tr: { x: 20, y: -20, opacity: 0, scale: 0.8, rotate: 20 },
        bl: { x: -20, y: 20, opacity: 0, scale: 0.8, rotate: 20 },
        br: { x: 20, y: 20, opacity: 0, scale: 0.8, rotate: -20 },
      };
      return directions[direction as keyof typeof directions];
    },
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.2,
        duration: 0.35, // 20% faster
      },
    },
  };

  // Animation variant for center ghost
  const centerGhostVariants = {
    hidden: {
      scale: 0,
      opacity: 0,
      rotate: -45,
      y: 50,
    },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: -6,
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 0.5, // 20% faster
      },
    },
  };

  // Container animation for staggering
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12, // 20% faster (was 0.15)
        delayChildren: DELAY + 0.04, // 20% faster (was 0.05)
      },
    },
  };

  return (
    <motion.div
      className="max-w-[26rem] h-full w-full relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Top Left Cloud */}
      <motion.div
        variants={cloudVariants}
        custom="tl"
        className="absolute top-[0rem] left-[0rem] w-[34%]"
      >
        <motion.div
          animate={{
            y: [0, -8, 0],
            x: [0, 3, 0],
            rotate: [0, 2, 0],
          }}
          transition={{
            duration: 4.8, // 20% faster
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.2, // 20% faster
          }}
        >
          <Image
            src="/assets/cute/login-cloud-tl.svg"
            alt=""
            width={100}
            height={100}
            className="w-full h-auto"
          />
        </motion.div>
      </motion.div>

      {/* Top Right Cloud */}
      <motion.div
        variants={cloudVariants}
        custom="tr"
        className="absolute top-[0rem] right-[1rem] w-[30%]"
      >
        <motion.div
          animate={{
            y: [0, -6, 0],
            x: [0, -4, 0],
            rotate: [0, -1.5, 0],
          }}
          transition={{
            duration: 5.6, // 20% faster
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.6, // 20% faster
          }}
        >
          <Image
            src="/assets/cute/login-cloud-tr.svg"
            alt=""
            width={100}
            height={100}
            className="w-full h-auto"
          />
        </motion.div>
      </motion.div>

      {/* Bottom Left Cloud */}
      <motion.div
        variants={cloudVariants}
        custom="bl"
        className="absolute bottom-[0rem] left-[0.5rem] w-[30%]"
      >
        <motion.div
          animate={{
            y: [0, 7, 0],
            x: [0, 2, 0],
            rotate: [0, 1, 0],
          }}
          transition={{
            duration: 6.4, // 20% faster
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2.0, // 20% faster
          }}
        >
          <Image
            src="/assets/cute/login-cloud-bl.svg"
            alt=""
            width={100}
            height={100}
            className="w-full h-auto"
          />
        </motion.div>
      </motion.div>

      {/* Bottom Right Cloud */}
      <motion.div
        variants={cloudVariants}
        custom="br"
        className="absolute bottom-[0rem] right-[1rem] w-[35%]"
      >
        <motion.div
          animate={{
            y: [0, -5, 0],
            x: [0, -3, 0],
            rotate: [0, -2, 0],
          }}
          transition={{
            duration: 4.4, // 20% faster
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2.4, // 20% faster
          }}
        >
          <Image
            src="/assets/cute/login-cloud-br.svg"
            alt=""
            width={100}
            height={100}
            className="w-full h-auto"
          />
        </motion.div>
      </motion.div>

      {/* Center Ghost with Phone */}
      <motion.div
        variants={centerGhostVariants}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%]"
      >
        <motion.div
          animate={{
            rotate: [-6, -4, -8, -6],
            y: [0, -5, 0],
            x: [0, 2, 0],
          }}
          transition={{
            duration: 3.2, // 20% faster
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: 0.8, // 20% faster
          }}
        >
          <Image
            src="/assets/cute/login-ghost-with-phone.png"
            width={200}
            height={200}
            alt=""
            className="w-full h-auto"
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
