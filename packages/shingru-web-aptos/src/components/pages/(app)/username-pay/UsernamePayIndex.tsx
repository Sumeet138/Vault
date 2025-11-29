"use client";

import { COLOR_PICKS } from "@/config/styling";
import { SPRING_BOUNCE_ONE } from "@/config/animation";
import ColorCard from "@/components/common/ColorCard";
import Image from "next/image";
import ConnectedBadge from "./ConnectedBadge";
import WalletConnectionOptions from "./WalletConnectionOptions";
import PaymentInterface from "./PaymentInterface";
import PaymentSuccess from "./PaymentSuccess";
import EmojiPicture from "@/components/common/EmojiPicture";
import { usePay } from "@/providers/PayProvider";
import PayProvider from "@/providers/PayProvider";
import { getFileUrl } from "@/utils/file";
import { FlickeringGrid } from "@/components/magicui/FlickeringGrid";
import TypeBadge from "./TypeBadge";
import DeliverablesList from "./DeliverablesList";
import MainButton from "@/components/common/MainButton";
import Link from "next/link";
import FullscreenLoader from "@/components/common/FullscreenLoader";
import { motion } from "motion/react";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { AddressResponse } from "@/lib/api/address";

interface PayPageProps {
  username: string;
  tag: string;
  initialData: AddressResponse | null;
}

const GLOBAL_DELAY = 400;

// Main PayPage content component
function PayPageContent() {
  const {
    addressData,
    isInitializing,
    error,
    paymentSuccess,
    wallet,
    currentColor,
    amount,
    setAmount,
    setPaymentSuccess,
  } = usePay();

  // Generate metadata based on fetched data
  if (isInitializing) {
    return <FullscreenLoader text="Preparing Payment Link" />;
  }

  // Only show error page if there's a critical error (not just missing wallet)
  // If addressData exists but wallet is missing, show the payment page with a warning
  if (error && !addressData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 bg-background py-8 ">
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="text-2xl font-bold text-gray-900">vault</div>
        </div>

        {/* Error Icon */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={{
            initial: { opacity: 0, y: 20 },
            animate: {
              opacity: 1,
              y: [0, -15, 0],
              rotate: [0, -2, 0, 2, 0],
              transition: {
                y: {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                rotate: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                opacity: {
                  duration: 0.4,
                },
              },
            },
          }}
        >
          <Image
            src="/assets/cute/cloud-sad.svg"
            width={100}
            height={100}
            className="object-contain w-36"
            alt="Error Cloud"
          />
        </motion.div>

        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Payment Link Not Found
          </h2>
          {/* <p className="text-foreground/70 text-base max-w-sm leading-relaxed">
              {error}
            </p> */}
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <Link href="/app">
            <MainButton className="px-8 rounded-2xl bg-green-600 hover:bg-green-400 text-white">
              Pay
            </MainButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop FloatingLoginCTA - Fixed position */}
      <div className="hidden lg:block">
        <FloatingLoginCTA />
      </div>
      <div className="min-h-screen bg-white">
        {/* Mobile Layout */}
        <div className="lg:hidden min-h-screen flex flex-col px-4 py-4 pb-16 bg-white">
          <div className="flex-1 flex flex-col max-w-lg w-full mx-auto">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-4 flex justify-center"
            >
              <div className="text-2xl font-bold text-gray-900">vault</div>
            </motion.div>

            {/* Link Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="space-y-3 mb-4"
            >
              {/* Send funds to */}
              <div className="bg-white rounded-xl p-3 border border-gray-200">
                <div className="flex flex-row items-center justify-center gap-2">
                  <div className="font-medium text-gray-600 text-xs">Send funds to</div>
                  <div className="bg-gray-900 text-white font-bold text-xs px-2.5 py-1 rounded-full">
                    @{addressData?.userData.username}
                  </div>
                </div>
              </div>

              {/* Link info */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header with emoji and title */}
                <div className="p-3 pb-2">
                  <div className="flex flex-row items-center gap-2">
                    <EmojiPicture
                      emoji={addressData?.linkData?.emoji || "🔗"}
                      color={currentColor}
                      size="md"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-base text-gray-900">
                        {addressData?.linkData?.label || "Personal"}
                      </div>
                      {addressData?.linkData?.description && (
                        <div className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                          {addressData.linkData.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Thumbnail Display */}
                {addressData?.linkData?.files?.thumbnail && (
                  <div className="px-3 pb-3">
                    <div className="relative w-full min-h-36 max-h-60 rounded-lg overflow-hidden bg-gray-50">
                      <Image
                        src={getFileUrl(
                          addressData.linkData.files.thumbnail.id
                        )}
                        alt={addressData?.linkData?.label || "Thumbnail"}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    </div>
                  </div>
                )}

                {/* Payment Amount Type - with separator */}
                {addressData?.linkData && (
                  <div className="border-t border-gray-200">
                    <TypeBadge linkData={addressData.linkData} />
                  </div>
                )}
              </div>

              {/* Deliverables Section - Mobile */}
              <DeliverablesList
                deliverables={
                  addressData?.linkData?.files?.deliverables || []
                }
              />
            </motion.div>

            {/* Payment Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="space-y-4 my-8"
            >
              {!paymentSuccess && (
                <div className="text-center space-y-1 pb-3 border-b border-gray-200">
                  <h2 className="text-xl font-extrabold text-gray-900">
                    Complete Payment
                  </h2>
                  <p className="text-gray-500 text-xs px-4">
                    {wallet.connected
                      ? "Enter amount and send payment"
                      : "Connect your wallet to send payment"}
                  </p>
                </div>
              )}

              <ConnectedBadge />

              {/* Payment Flow */}
              {paymentSuccess ? (
                <PaymentSuccess />
              ) : (
                <div className="space-y-4">
                  <WalletConnectionOptions />
                  <PaymentInterface />
                </div>
              )}
            </motion.div>

            {/* Mobile FloatingLoginCTA - Static position below payment flow */}
            <div className="mt-4 w-full">
              <FloatingLoginCTA />
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex lg:h-screen lg:overflow-hidden">
          {/* Left Side - Link Information */}
          <motion.div
            initial={{
              scaleX: 0,
              opacity: 0,
            }}
            animate={{
              scaleX: 1,
              opacity: 1,
            }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1], // Custom ease for smooth expansion
              opacity: { duration: 0.4 },
            }}
            className="flex-1 origin-left overflow-hidden"
          >
            <div
              className="flex-1 flex flex-col items-center justify-center p-8 relative h-full"
              style={{
                backgroundColor: `${COLOR_PICKS.find((c) => c.id === currentColor)?.value ||
                  COLOR_PICKS[1].value
                  }10`,
              }}
            >
              <FlickeringGrid
                className="absolute inset-0 z-0 size-full h-full"
                squareSize={2}
                gridGap={12}
                color={`${COLOR_PICKS.find((c) => c.id === currentColor)?.value ||
                  COLOR_PICKS[1].value
                  }`}
                maxOpacity={0.5}
                flickerChance={0.1}
              />
              <div className="max-w-lg w-full z-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: (GLOBAL_DELAY + 100) / 1000,
                    ...SPRING_BOUNCE_ONE,
                    duration: 0.5,
                  }}
                  className="mb-6"
                >
                  <div className="text-4xl font-bold text-gray-900">vault</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: (GLOBAL_DELAY + 200) / 1000,
                    ...SPRING_BOUNCE_ONE,
                    duration: 0.5,
                  }}
                >
                  <div className="bg-white p-1 shadow-2xl border border-black/5 shadow-black/5 rounded-[1.6rem]">
                    {/* Send funds to */}
                    <div className="flex flex-col rounded-[1.6rem] p-1 bg-black/5 mb-4">
                      <div className="bg-white rounded-[1.4rem] p-3">
                        <div className="flex flex-row items-center justify-between gap-2">
                          <div className="font-bold">Send funds to</div>
                          {/* Username pill */}
                          <div className="bg-black/5 font-semibold text-sm px-2 py-1 rounded-full">
                            @{addressData?.userData.username}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Link info - matching mobile structure with colored styling */}
                    <div
                      className="rounded-[1.4rem]"
                      style={{
                        border: `2px solid ${COLOR_PICKS.find((c) => c.id === currentColor)
                          ?.value || COLOR_PICKS[1].value
                          }`,
                        backgroundColor: `${COLOR_PICKS.find((c) => c.id === currentColor)
                          ?.value || COLOR_PICKS[1].value
                          }10`,
                      }}
                    >
                      <div className="px-5 py-4">
                        {/* Thumbnail Display */}
                        {addressData?.linkData?.files?.thumbnail && (
                          <div className="bg-white rounded-[1.4rem] mb-4 mt-2">
                            <div className="relative w-full min-h-[12rem] max-h-[20rem] rounded-[1.4rem] overflow-hidden bg-gray-100 flex items-center justify-center">
                              <Image
                                src={getFileUrl(
                                  addressData.linkData.files.thumbnail.id
                                )}
                                alt={
                                  addressData?.linkData?.label || "Thumbnail"
                                }
                                fill
                                className="object-contain rounded-[1.4rem] "
                                sizes="(max-width: 1024px) 50vw, 400px"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex flex-row items-center gap-3">
                          <EmojiPicture
                            emoji={addressData?.linkData?.emoji || "🔗"}
                            color={currentColor}
                            size="lg"
                          />
                          <div className="font-bold text-lg">
                            {addressData?.linkData?.label || "Personal"}
                          </div>
                        </div>
                        {addressData?.linkData?.description && (
                          <div className="mt-3 text-sm text-gray-400">
                            {addressData.linkData.description}
                          </div>
                        )}
                      </div>

                      {/* Payment Amount Type */}
                      {addressData?.linkData && (
                        <div className="rounded-[1.4rem] bg-white">
                          <TypeBadge linkData={addressData.linkData} />
                        </div>
                      )}
                    </div>

                    {/* Deliverables Section - Desktop */}
                    <DeliverablesList
                      deliverables={
                        addressData?.linkData?.files?.deliverables || []
                      }
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Payment Interface */}
          <div className="flex-1 flex h-full min-h-0 flex-col items-center justify-center bg-white overflow-y-auto px-8">
            <div className="w-full max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: (GLOBAL_DELAY + 300) / 1000,
                  ...SPRING_BOUNCE_ONE,
                  duration: 0.5,
                }}
                className="space-y-10"
              >
                {/* Header */}
                {!paymentSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: (GLOBAL_DELAY + 350) / 1000,
                      duration: 0.4,
                    }}
                    className="text-center space-y-3"
                  >
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                      Complete Payment
                    </h1>
                    <p className="text-gray-500 text-base leading-tight max-w-md mx-auto">
                      {wallet.connected
                        ? "Enter the amount and send your payment securely"
                        : "Connect your APTOS wallet to send payment"}
                    </p>
                  </motion.div>
                )}

                {/* Connection Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: (GLOBAL_DELAY + 400) / 1000,
                    duration: 0.4,
                  }}
                >
                  <ConnectedBadge />
                </motion.div>

                {/* Payment Flow */}
                {paymentSuccess ? (
                  <PaymentSuccess />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: (GLOBAL_DELAY + 450) / 1000,
                      duration: 0.4,
                    }}
                    className="space-y-6"
                  >
                    <WalletConnectionOptions />
                    <PaymentInterface />
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function FloatingLoginCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="lg:fixed lg:top-6 lg:left-4 z-50"
    >
      <Link
        href="/login"
        className="group block"
        aria-label="Create your VAULT"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative rounded-2xl bg-white p-1 shadow-supa-smooth border border-black/5"
        >
          <div className="relative flex items-center gap-3 rounded-xl bg-white px-4 py-3 transition-all duration-200">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-gray-900" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-bold text-gray-900 tracking-tight">
                Create Your VAULT
              </span>
              <span className="text-xs font-medium text-gray-700">
                It&apos;s free and fast!
              </span>
            </div>
            <ArrowUpRight
              className="h-5 w-5 text-gray-400 flex-shrink-0"
              strokeWidth={2}
            />
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Main PayPage wrapper with provider
export default function UsernamePayIndex({
  username,
  tag,
  initialData,
}: PayPageProps) {
  return (
    <PayProvider username={username} tag={tag} initialData={initialData || undefined}>
      <PayPageContent />
    </PayProvider>
  );
}
