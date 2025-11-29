"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import AssetCard from "./AssetCard";
import PortfolioCard from "./PortfolioCard";
import CuteModal from "@/components/common/CuteModal";
import CuteButton from "@/components/common/CuteButton";
import { useAuth } from "@/providers/AuthProvider";
import { useUser } from "@/providers/UserProvider";
import { useRouter } from "next/navigation";
import { Asset, Holding } from "@/lib/mongodb/rwa-types";
import {
  BuildingOfficeIcon,
  WalletIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { formatUiNumber } from "@/utils/formatting";

export default function RWAIndex() {
  const { me } = useAuth();
  const { createLink } = useUser();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [portfolio, setPortfolio] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"assets" | "portfolio">("assets");

  // Fetch assets
  const fetchAssets = async () => {
    try {
      const response = await fetch("/api/rwa/assets");
      const data = await response.json();
      if (data.success) {
        setAssets(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch portfolio
  const fetchPortfolio = async () => {
    if (!me?.id) return;

    try {
      const response = await fetch(`/api/rwa/portfolio?userId=${me.id}`);
      const data = await response.json();
      if (data.success) {
        setPortfolio(data.data);
      }
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    }
  };

  // Fetch portfolio with asset details
  const fetchPortfolioWithAssets = async () => {
    if (!me?.id) return;

    try {
      const portfolioResponse = await fetch(
        `/api/rwa/portfolio?userId=${me.id}`
      );
      const portfolioData = await portfolioResponse.json();

      if (portfolioData.success) {
        const holdings = portfolioData.data;
        // Fetch asset details for each holding
        const assetsResponse = await fetch("/api/rwa/assets");
        const assetsData = await assetsResponse.json();

        if (assetsData.success) {
          const assetsMap = new Map(
            assetsData.data.map((asset: Asset) => [asset.assetId, asset])
          );
          const holdingsWithAssets = holdings.map((holding: Holding) => ({
            ...holding,
            asset: assetsMap.get(holding.assetId),
          }));
          setPortfolio(holdingsWithAssets as any);
        }
      }
    } catch (error) {
      console.error("Error fetching portfolio with assets:", error);
    }
  };

  useEffect(() => {
    fetchAssets();
    if (me?.id) {
      fetchPortfolioWithAssets();
    }
  }, [me?.id]);

  const handleBuyClick = (asset: Asset) => {
    if (!me?.username) {
      alert("Please log in to purchase assets");
      return;
    }
    setSelectedAsset(asset);
    setQuantity(1);
    setIsBuyModalOpen(true);
  };

  const handlePurchase = async () => {
    if (!selectedAsset || !me?.id || !me?.username) return;

    setIsProcessing(true);
    try {
      // Create a payment link for this RWA purchase
      // The link tag will be the assetId, which allows the payment processor to identify RWA purchases
      const paymentLink = `/${me.username}/${selectedAsset.assetId}`;
      
      // Store purchase intent in sessionStorage for the payment page
      sessionStorage.setItem('rwa-purchase-intent', JSON.stringify({
        assetId: selectedAsset.assetId,
        quantity,
        totalCost,
        pricePerShare: selectedAsset.pricePerShare,
      }));
      
      // Navigate to payment page
      // The payment page will handle creating the link if it doesn't exist
      router.push(paymentLink);
    } catch (error) {
      console.error('Error preparing purchase:', error);
      alert('Failed to prepare purchase. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalCost = selectedAsset
    ? selectedAsset.pricePerShare * quantity
    : 0;

  return (
    <>
      <div className="w-full max-w-6xl mx-auto relative md:py-3 pt-5 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
              <BuildingOfficeIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Real World Assets
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Invest in fractional property shares with privacy-first payments
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("assets")}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all relative ${
              activeTab === "assets"
                ? "text-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <SparklesIcon className="w-5 h-5" />
            <span>Browse Assets</span>
            {activeTab === "assets" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("portfolio");
              fetchPortfolioWithAssets();
            }}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all relative ${
              activeTab === "portfolio"
                ? "text-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <WalletIcon className="w-5 h-5" />
            <span>My Portfolio</span>
            {activeTab === "portfolio" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "assets" ? (
            <motion.div
              key="assets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="loading loading-spinner size-8" />
                </div>
              ) : assets.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Assets Available
                  </h3>
                  <p className="text-sm text-gray-500">
                    Check back later for new investment opportunities
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {assets.map((asset) => (
                    <AssetCard
                      key={asset.assetId}
                      asset={asset}
                      onBuyClick={handleBuyClick}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="portfolio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PortfolioCard holdings={portfolio as any} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Buy Modal */}
      <CuteModal
        isOpen={isBuyModalOpen}
        onClose={() => {
          setIsBuyModalOpen(false);
          setSelectedAsset(null);
        }}
        title="Purchase Shares"
        size="md"
      >
        {selectedAsset && (
          <div className="space-y-6">
            {/* Asset Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-1">
                {selectedAsset.name}
              </h3>
              <p className="text-sm text-gray-500">{selectedAsset.location}</p>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Shares
              </label>
              <div className="flex items-center gap-3">
                <CuteButton
                  variant="bordered"
                  size="md"
                  isDisabled={quantity <= 1}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </CuteButton>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {quantity}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedAsset.availableShares} available
                  </div>
                </div>
                <CuteButton
                  variant="bordered"
                  size="md"
                  isDisabled={quantity >= selectedAsset.availableShares}
                  onPress={() =>
                    setQuantity(
                      Math.min(selectedAsset.availableShares, quantity + 1)
                    )
                  }
                >
                  +
                </CuteButton>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Price per Share</span>
                <span className="font-medium text-gray-900">
                  {formatUiNumber(selectedAsset.pricePerShare, "", {
                    maxDecimals: 2,
                  })}{" "}
                  APT
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quantity</span>
                <span className="font-medium text-gray-900">{quantity}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span className="text-gray-900">Total Cost</span>
                <span className="text-primary-600">
                  {formatUiNumber(totalCost, "", { maxDecimals: 2 })} APT
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                💡 You'll be redirected to a secure payment page. Your
                purchase will be processed using stealth addresses for privacy.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <CuteButton
                variant="ghost"
                color="gray"
                size="lg"
                fullWidth
                onPress={() => setIsBuyModalOpen(false)}
              >
                Cancel
              </CuteButton>
              <CuteButton
                color="primary"
                variant="solid"
                size="lg"
                fullWidth
                isDisabled={quantity > selectedAsset.availableShares}
                onPress={handlePurchase}
              >
                <span className="flex items-center gap-2">
                  <span>Continue to Payment</span>
                  <span>→</span>
                </span>
              </CuteButton>
            </div>
          </div>
        )}
      </CuteModal>
    </>
  );
}

