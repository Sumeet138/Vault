"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import ActivityList from "./ActivityList";
import BalanceCard from "./BalanceCard";
import PersonalLinkCard from "./PersonalLinkCard";
import CuteModal from "@/components/common/CuteModal";
import MainButton from "@/components/common/MainButton";
import { backend } from "@/lib/api";
import { useSound, Sound } from "@/providers/SoundProvider";
import { useAuth } from "@/providers/AuthProvider";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";
import {
  getPendingNfcTag,
  clearPendingNfcTag,
} from "@/utils/nfc-storage";

export default function AppHome() {
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimTagId, setClaimTagId] = useState<string | null>(null);
  const [isClaimingTag, setIsClaimingTag] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const { playSound } = useSound();
  const { me, fetchMe } = useAuth();
  const router = useRouter();

  // Check for pending NFC tag claim from localStorage
  useEffect(() => {
    const pendingTag = getPendingNfcTag();
    if (pendingTag) {
      setClaimTagId(pendingTag.tagId);
      setShowClaimModal(true);
    }
  }, []);

  const handleClaimTag = async () => {
    if (!claimTagId) return;

    setIsClaimingTag(true);
    setClaimError(null);

    try {
      const response = await backend.nfcTag.claimTag(claimTagId);

      if (response.data?.success) {
        console.log("Tag claimed successfully:", response.data);

        // Play success sound
        playSound(Sound.SUCCESS_POP);

        // Show success animation
        setClaimSuccess(true);

        // Clear pending tag from localStorage
        clearPendingNfcTag();

        // Refresh user profile to get updated NFC tag info
        await fetchMe();
      } else {
        // Handle API error response
        const errorMessage = response.error || "Failed to claim tag";
        setClaimError(errorMessage);
        console.error("Failed to claim tag:", errorMessage);
      }
    } catch (error) {
      console.error("Error claiming tag:", error);
      setClaimError("An unexpected error occurred. Please try again.");
    } finally {
      setIsClaimingTag(false);
    }
  };

  const handleCloseModal = () => {
    // Clear pending tag from localStorage when modal is closed without claiming
    clearPendingNfcTag();

    setClaimTagId(null);
    setShowClaimModal(false);
    setClaimSuccess(false);
    setClaimError(null);
  };

  const handleSuccessClose = () => {
    setClaimTagId(null);
    setShowClaimModal(false);
    setClaimSuccess(false);
    setClaimError(null);
  };

  // Check if user already has a claimed tag
  const hasExistingTag = me?.nfcTag?.status === "CLAIMED";

  return (
    <>
      <div className="w-full max-w-lg mx-auto relative md:py-3 pt-5">
        <div>
          <div>
            <BalanceCard />
          </div>
          {/* Personal Link Card */}
          <div className="mt-4">
            <PersonalLinkCard />
          </div>
          <div className="mt-8 md:mb-[10rem] md:pb-[0rem] pb-[10rem]">
            <ActivityList limit={10} isShowSeeAll={true} />
          </div>
        </div>
        {/* <AuthInfoBox /> */}
        {/* Add your app home content here */}
      </div>

      <CuteModal
        isOpen={showClaimModal}
        onClose={handleCloseModal}
        title={claimSuccess ? "Tag Claimed! 🎉" : "Claim Your NFC Tag"}
        size="md"
        hideCloseButton={claimSuccess}
      >
        <AnimatePresence mode="wait">
          {!claimSuccess ? (
            <motion.div
              key="claim-form"
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-6"
            >
              {/* Logo Section */}
              <div className="flex justify-center">
                <div className="text-3xl font-bold text-gray-900">shingru</div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Link this NFC tag to your VAULT account and share your personal
                  payment link with just a tap! ✨
                </p>

                {claimTagId && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Tag ID</span>
                      <span className="font-mono text-xs font-medium text-gray-800">
                        {claimTagId}
                      </span>
                    </div>
                  </div>
                )}

                {/* Warning for existing tag */}
                {hasExistingTag && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-start gap-3 text-left">
                      <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-orange-900 mb-1">
                          Replace existing tag
                        </p>
                        <p className="text-xs text-orange-700 leading-relaxed">
                          You already have a tag linked to your account.
                          Claiming this new tag will replace your current one
                          and unlink the previous tag.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {claimError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3 text-left">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900 mb-1">
                          Claim failed
                        </p>
                        <p className="text-xs text-red-700 leading-relaxed">
                          {claimError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <MainButton
                onClick={handleClaimTag}
                className="w-full h-12"
                color={hasExistingTag ? "orange" : "primary"}
                isLoading={isClaimingTag}
                disabled={isClaimingTag}
              >
                {isClaimingTag ? (
                  <span className="flex items-center justify-center gap-2">
                    <span>{hasExistingTag ? "Replacing" : "Claiming"}</span>
                    <span>⏳</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>
                      {hasExistingTag ? "Replace & Claim" : "Claim This Tag"}
                    </span>
                    <span>{hasExistingTag ? "🔄" : "🚀"}</span>
                  </span>
                )}
              </MainButton>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 25,
                duration: 0.5,
              }}
              className="text-center space-y-6"
            >
              {/* Success Icon */}
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.2,
                    type: "spring",
                    stiffness: 500,
                    damping: 15,
                  }}
                  className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center"
                >
                  <CheckCircleIcon className="w-12 h-12 text-primary-600" />
                </motion.div>
              </div>

              {/* Success Message */}
              <div className="space-y-4">
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl font-bold text-gray-900"
                >
                  Tag Successfully Claimed! 🎉
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-600 leading-relaxed"
                >
                  Your NFC tag is now linked to your VAULT account. You can now
                  share your payment link with just a tap! 🎊
                </motion.p>
              </div>

              {/* Close Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <MainButton
                  onClick={handleSuccessClose}
                  className="w-full h-12"
                  color="primary"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>Awesome!</span>
                    <span>✨</span>
                  </span>
                </MainButton>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </CuteModal>
    </>
  );
}
