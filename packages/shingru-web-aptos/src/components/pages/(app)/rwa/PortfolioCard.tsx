"use client";

import React from "react";
import CuteCard from "@/components/common/CuteCard";
import { formatUiNumber } from "@/utils/formatting";
import { BuildingOfficeIcon, TrendingUpIcon } from "@heroicons/react/24/outline";
import { Holding, Asset } from "@/lib/mongodb/rwa-types";
import { format } from "date-fns";

interface PortfolioCardProps {
  holdings: (Holding & { asset?: Asset })[];
  isLoading?: boolean;
}

export default function PortfolioCard({
  holdings,
  isLoading = false,
}: PortfolioCardProps) {
  const totalValue = holdings.reduce((sum, holding) => {
    return sum + holding.quantity * holding.purchasePrice;
  }, 0);

  if (isLoading) {
    return (
      <CuteCard color="primary">
        <div className="p-6">
          <div className="flex justify-center items-center py-8">
            <div className="loading loading-spinner size-6" />
          </div>
        </div>
      </CuteCard>
    );
  }

  if (holdings.length === 0) {
    return (
      <CuteCard color="primary">
        <div className="p-6">
          <div className="text-center py-8">
            <BuildingOfficeIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No RWA Holdings</p>
            <p className="text-sm text-gray-400">
              Start investing in real-world assets to see your portfolio here
            </p>
          </div>
        </div>
      </CuteCard>
    );
  }

  return (
    <CuteCard color="primary">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Your Portfolio</h3>
            <p className="text-sm text-gray-500">Real World Assets</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formatUiNumber(totalValue, "", { maxDecimals: 2 })} APT
            </div>
            <div className="text-xs text-gray-500">Total Value</div>
          </div>
        </div>

        {/* Holdings List */}
        <div className="space-y-3">
          {holdings.map((holding) => (
            <div
              key={`${holding.userId}-${holding.assetId}`}
              className="bg-gray-50 rounded-xl p-4 border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-900">
                      {holding.asset?.name || holding.assetId}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 ml-6">
                    {holding.quantity} share{holding.quantity !== 1 ? "s" : ""} @{" "}
                    {formatUiNumber(holding.purchasePrice, "", {
                      maxDecimals: 2,
                    })}{" "}
                    APT
                  </div>
                  <div className="text-xs text-gray-400 ml-6 mt-1">
                    Purchased {format(new Date(holding.purchaseDate), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatUiNumber(
                      holding.quantity * holding.purchasePrice,
                      "",
                      { maxDecimals: 2 }
                    )}{" "}
                    APT
                  </div>
                  <div className="text-xs text-gray-500">Value</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CuteCard>
  );
}

