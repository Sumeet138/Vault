"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { PhotonWalletInfo } from "@/lib/photon/types";
import { shortenId } from "@/utils/misc";
import { formatUiNumber } from "@/utils/formatting";
import Image from "next/image";
import {
  InformationCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import CuteButton from "@/components/common/CuteButton";

interface PhotonWalletCardProps {
  walletInfo: PhotonWalletInfo | null;
  loading?: boolean;
  onCreateWallet?: () => void;
}

export default function PhotonWalletCard({
  walletInfo,
  loading = false,
  onCreateWallet,
}: PhotonWalletCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // If no wallet exists, show create wallet option
  if (!walletInfo && !loading) {
    return (
      <div className="bg-white rounded-3xl overflow-hidden border border-black/5 shadow-supa-smooth">
        <div className="px-5 py-4">
          <div className="flex flex-row items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold">Photon Wallet</h2>
              <p className="text-xs text-black/50">Not connected</p>
            </div>
          </div>

          {onCreateWallet && (
            <CuteButton
              onPress={onCreateWallet}
              isLoading={loading}
              fullWidth
              color="green"
            >
              Create Photon Wallet
            </CuteButton>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-3xl overflow-hidden border border-black/5 shadow-supa-smooth">
        <div className="px-5 py-4">
          <div className="flex flex-row items-center gap-3 mb-4">
            <div className="skeleton w-12 h-12 rounded-full"></div>
            <div className="flex flex-col gap-2 flex-1">
              <div className="skeleton h-5 w-32"></div>
              <div className="skeleton h-4 w-24"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  // Display wallet information
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-black/5 shadow-supa-smooth">
      <div className="px-4.5 py-4">
        {/* Header */}
        <div className="flex flex-row items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Photon Wallet</h2>
              {process.env.NEXT_PUBLIC_PHOTON_DEMO_MODE === 'true' && (
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-md">
                  Demo
                </span>
              )}
            </div>
            <p className="text-xs text-black/50">
              {shortenId(walletInfo!.address, 6, 4)}
            </p>
          </div>
        </div>

        {/* Balance Section */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-purple-900 mb-2">
            <span>PAT Token Balance</span>
            <div
              className="tooltip tooltip-bottom"
              data-tip="Earn PAT tokens by creating payment links and completing transactions"
            >
              <InformationCircleIcon className="size-4" />
            </div>
          </div>
          <div className="flex flex-row gap-1 items-end">
            <div className="text-3xl font-bold leading-none text-purple-900">
              {formatUiNumber(walletInfo!.balance, "", {
                maxDecimals: 2,
              })}
            </div>
            <div className="opacity-70 font-medium text-lg text-purple-900">
              PAT
            </div>
          </div>
        </div>

        {/* Recent Rewards Section */}
        {walletInfo!.recentRewards && walletInfo!.recentRewards.length > 0 && (
          <div>
            <div className="text-sm opacity-50 font-medium mb-2">
              Recent Rewards
            </div>
            <div className="space-y-2">
              {walletInfo!.recentRewards.map((reward, index) => (
                <RewardItem key={index} reward={reward} />
              ))}
            </div>
          </div>
        )}

        {/* No rewards message */}
        {(!walletInfo!.recentRewards ||
          walletInfo!.recentRewards.length === 0) && (
            <div className="bg-gray-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-gray-500">
                Complete actions to earn PAT tokens
              </p>
            </div>
          )}
      </div>
    </div>
  );
}

interface RewardItemProps {
  reward: PhotonWalletInfo["recentRewards"][0];
}

function RewardItem({ reward }: RewardItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case "LINK_CREATED":
        return "Payment Link Created";
      case "PAYMENT_COMPLETED":
        return "Payment Completed";
      default:
        return eventType;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className="relative py-2 px-3 rounded-xl cursor-default"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover background */}
      <motion.div
        className="absolute inset-0 bg-purple-50 rounded-xl z-0"
        animate={{
          scale: isHovered ? 1 : 0.4,
          opacity: isHovered ? 1 : 0,
        }}
        transition={{
          duration: 0.12,
          ease: "easeInOut",
        }}
      />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium">{getEventLabel(reward.eventType)}</p>
            <p className="text-xs text-black/50">
              {formatTimestamp(reward.timestamp)}
            </p>
          </div>
        </div>
        <div className="text-sm font-semibold text-purple-600">
          +{formatUiNumber(reward.patEarned, "", { maxDecimals: 2 })} PAT
        </div>
      </div>
    </div>
  );
}
