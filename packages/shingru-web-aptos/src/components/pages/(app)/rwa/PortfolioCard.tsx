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
    <div className="space-y-6">
      {/* Portfolio Summary Card */}
      <CuteCard color="primary">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Portfolio Value</h3>
              <p className="text-sm text-gray-500">Total investment in RWA</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {formatUiNumber(totalValue, "", { maxDecimals: 2 })}
              </div>
              <div className="text-sm text-gray-500">APT</div>
            </div>
          </div>
        </div>
      </CuteCard>

      {/* Holdings List */}
      {holdings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {holdings.map((holding) => (
            <CuteCard key={`${holding.userId}-${holding.assetId}`} color="primary">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                        <BuildingOfficeIcon className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {holding.asset?.name || holding.assetId}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {holding.asset?.location || ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shares Owned</span>
                    <span className="font-semibold text-gray-900">
                      {holding.quantity} share{holding.quantity !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Purchase Price</span>
                    <span className="font-semibold text-gray-900">
                      {formatUiNumber(holding.purchasePrice, "", {
                        maxDecimals: 2,
                      })}{" "}
                      APT
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Purchase Date</span>
                    <span className="font-medium text-gray-700">
                      {format(new Date(holding.purchaseDate), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Total Value</span>
                    <span className="text-lg font-bold text-primary-600">
                      {formatUiNumber(
                        holding.quantity * holding.purchasePrice,
                        "",
                        { maxDecimals: 2 }
                      )}{" "}
                      APT
                    </span>
                  </div>
                </div>
              </div>
            </CuteCard>
          ))}
        </div>
      ) : (
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
      )}
    </div>
  );
}

