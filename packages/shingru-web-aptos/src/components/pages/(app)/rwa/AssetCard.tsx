"use client";

import React from "react";
import { motion } from "motion/react";
import CuteButton from "@/components/common/CuteButton";
import CuteCard from "@/components/common/CuteCard";
import { formatUiNumber } from "@/utils/formatting";
import { BuildingOfficeIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Asset } from "@/lib/mongodb/rwa-types";

interface AssetCardProps {
  asset: Asset;
  onBuyClick: (asset: Asset) => void;
  isLoading?: boolean;
}

export default function AssetCard({
  asset,
  onBuyClick,
  isLoading = false,
}: AssetCardProps) {
  const availabilityPercent = (asset.availableShares / asset.totalShares) * 100;
  const isLowStock = availabilityPercent < 30;
  const isSoldOut = asset.availableShares === 0;

  return (
    <CuteCard color="primary" classNames={{ container: "h-full" }}>
      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BuildingOfficeIcon className="w-5 h-5 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900">{asset.name}</h3>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <MapPinIcon className="w-4 h-4" />
              <span>{asset.location}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
          {asset.description}
        </p>

        {/* Stats */}
        <div className="space-y-3 mb-4">
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              Price per Share
            </span>
            <span className="text-lg font-bold text-gray-900">
              {formatUiNumber(asset.pricePerShare, "", {
                maxDecimals: 2,
              })}{" "}
              APT
            </span>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Available Shares
              </span>
              <span
                className={`text-sm font-semibold ${
                  isLowStock ? "text-orange-600" : "text-gray-900"
                }`}
              >
                {asset.availableShares} / {asset.totalShares}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  isLowStock ? "bg-orange-500" : "bg-primary-500"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${availabilityPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Buy Button */}
        <CuteButton
          color="primary"
          variant="solid"
          size="lg"
          fullWidth
          radius="lg"
          isDisabled={isSoldOut || isLoading}
          isLoading={isLoading}
          onPress={() => onBuyClick(asset)}
          className="shadow-md hover:shadow-lg transition-shadow"
        >
          {isSoldOut ? (
            <span className="flex items-center gap-2 font-semibold">
              <span>Sold Out</span>
              <span>🔒</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 font-semibold">
              <span>Buy Shares</span>
              <span>💎</span>
            </span>
          )}
        </CuteButton>
      </div>
    </CuteCard>
  );
}

