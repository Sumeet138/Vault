import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { Link } from "@/lib/api/links";
import CuteCard from "@/components/common/CuteCard";
import EmojiPicture from "@/components/common/EmojiPicture";
import TemplatePill from "@/components/common/TemplatePill";
import {
  CheckCircleIcon,
  EyeIcon,
  LinkIcon,
  QrCodeIcon,
  Square2StackIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { COLOR_PICKS } from "@/config/styling";
import { formatUiNumber } from "@/utils/formatting";

interface LinkCardProps {
  link: Link;
  onQRClick: (linkData: Link) => void;
  variant?: "card" | "row";
}

export default function LinkCard({
  link,
  onQRClick,
  variant = "card",
}: LinkCardProps) {
  const router = useRouter();
  const [isCopied, setIsCopied] = useState(false);

  // Generate link preview path - fallback to constructing from username and tag
  const linkPreviewPath = link.linkPreview || 
    (link.user?.username 
      ? `/${link.user.username}${link.tag ? `/${link.tag}` : ""}`
      : "");

  // Copy link to clipboard
  const handleCopyLink = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    
    if (isCopied || !linkPreviewPath) {
      console.warn("Copy link: Cannot copy - isCopied:", isCopied, "linkPreviewPath:", linkPreviewPath);
      return;
    }

    const linkUrl = `${window.location.origin}${linkPreviewPath}`;
    console.log("Copying link:", linkUrl);

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(linkUrl);
        console.log("✅ Successfully copied to clipboard");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } else {
        // Fallback for older browsers
        throw new Error("Clipboard API not available");
      }
    } catch (error) {
      console.error("❌ Clipboard API failed, trying fallback:", error);
      // Fallback for older browsers or when clipboard API fails
      try {
        const textArea = document.createElement("textarea");
        textArea.value = linkUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        
        if (successful) {
          console.log("✅ Successfully copied using fallback method");
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        } else {
          console.error("❌ Fallback copy method failed");
        }
      } catch (fallbackError) {
        console.error("❌ Both copy methods failed:", fallbackError);
      }
    }
  };

  // Handle QR code button
  const handleQRClick = () => {
    onQRClick(link);
  };

  // Handle card click to navigate to link details
  const handleCardClick = () => {
    router.push(`/app/links/${link.id}`);
  };

  if (variant === "row") {
    return (
      <div
        className="bg-white rounded-3xl overflow-hidden shadow-supa-smooth"
        style={{
          border: `3px solid ${
            COLOR_PICKS.find((c) => c.id === link.backgroundColor)?.value
          }`,
        }}
      >
        <div className="p-4 cursor-pointer" onClick={handleCardClick}>
          <div className="flex items-center gap-4">
            {/* Left side - Emoji and content */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <EmojiPicture
                emoji={link.emoji}
                size="md"
                color={link.backgroundColor}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-md mb-1 truncate capitalize">
                  {link.label}
                </div>
                <div className="text-xs text-black/50 line-clamp-1 overflow-hidden text-ellipsis">
                  {link.description}
                </div>
              </div>
            </div>

            {/* Right side - Stats and template stacked vertically */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Stats */}
              <div className="hidden sm:flex flex-row items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <EyeIcon className="w-4 h-4 text-black/40" />
                  <span className="text-sm text-black/60 font-semibold">
                    {formatUiNumber(link.stats?.viewCount ?? 0, "", {
                      maxDecimals: 0,
                      humanize: true,
                      humanizeThreshold: 1000,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <WalletIcon className="w-4 h-4 text-black/40" />
                  <span className="text-sm text-black/60 font-semibold">
                    {formatUiNumber(link.stats?.totalPayments ?? 0, "", {
                      maxDecimals: 0,
                      humanize: true,
                    })}
                  </span>
                </div>
              </div>
              {/* Template pill */}
              <TemplatePill template={link.template} />
            </div>
          </div>

          {/* Link preview at bottom with integrated buttons */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl mt-4 bg-gray-50">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <LinkIcon className="size-4 opacity-40 flex-shrink-0" />
              <span className="text-xs font-semibold truncate">
                {window.location.host}{linkPreviewPath}
              </span>
            </div>

            <div
              className="flex flex-row items-center gap-1 ml-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCopyLink}
                disabled={isCopied}
                type="button"
                className="w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isCopied ? "copied" : "copy"}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      rotate: isCopied ? [0, 10, -5, 0] : 0,
                    }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{
                      duration: 0.15,
                      ease: [0.23, 1.2, 0.32, 1],
                    }}
                  >
                    {isCopied ? (
                      <div className="text-green-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-3 h-3"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    ) : (
                      <Square2StackIcon className="size-4 opacity-50" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </button>

              <button
                onClick={handleQRClick}
                className="w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors"
              >
                <QrCodeIcon className="size-4 opacity-50" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CuteCard color={link.backgroundColor}>
      <div className="relative">
        {/* Floating template pill */}
        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-0.5">
          <TemplatePill template={link.template} color={link.backgroundColor} />
          {/* Stats */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="tooltip">
              <div className="tooltip-content text-[10px]">Views</div>
              <div className="flex items-center gap-1">
                <EyeIcon className="w-3 h-3 md:w-4 md:h-4 text-gray-400 stroke-2" />
                <div className="text-xs md:text-sm text-gray-400 font-semibold">
                  {formatUiNumber(link.stats?.viewCount ?? 0, "", {
                    maxDecimals: 0,
                    humanize: true,
                    humanizeThreshold: 1000,
                  })}
                </div>
              </div>
            </div>
            <div className="tooltip">
              <div className="tooltip-content text-[10px]">Payments</div>
              <div className="flex items-center gap-1">
                <WalletIcon className="w-3 h-3 md:w-4 md:h-4 text-gray-400 stroke-2" />
                <div className="text-xs md:text-sm text-gray-400 font-semibold">
                  {formatUiNumber(link.stats?.totalPayments ?? 0, "", {
                    maxDecimals: 0,
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="p-3 md:p-4 rounded-2xl cursor-pointer flex flex-col h-full min-h-[180px] md:min-h-[200px]"
          onClick={handleCardClick}
        >
          {/* Header with emoji */}
          <div className="flex items-start justify-start mb-3">
            <EmojiPicture
              emoji={link.emoji}
              color={link.backgroundColor}
              className="w-8 h-8 md:w-12 md:h-12 flex-shrink-0"
            />
          </div>

          {/* Content section */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="font-semibold capitalize text-sm md:text-base lg:text-lg line-clamp-2 leading-tight mb-1">
                {link.label}
              </div>
              <div className="text-xs md:text-sm text-black/50 line-clamp-2 leading-relaxed">
                {link.description}
              </div>
            </div>
          </div>

          {/* Link Preview with Copy and QR buttons - always at bottom */}
          <div
            className="flex items-center justify-between pl-3 md:pl-3 pr-1 md:pr-2 py-2 rounded-xl bg-gray-50 mt-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <LinkIcon className="w-3 h-3 md:w-4 md:h-4 opacity-40 flex-shrink-0" />
              <span className="text-[10px] md:text-xs font-semibold truncate">
                {window.location.host}{linkPreviewPath}
              </span>
            </div>

            <div className="hidden md:flex flex-row items-center gap-0.5 md:gap-1 ml-2">
              <button
                onClick={handleCopyLink}
                disabled={isCopied}
                type="button"
                className="cursor-pointer w-8 h-8 md:w-7 md:h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors relative touch-manipulation"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isCopied ? "copied" : "copy"}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    {isCopied ? (
                      <CheckCircleIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-600 stroke-2" />
                    ) : (
                      <Square2StackIcon className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-50 stroke-2" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </button>

              <button
                onClick={handleQRClick}
                className="cursor-pointer w-8 h-8 md:w-7 md:h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors touch-manipulation"
              >
                <QrCodeIcon className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-50 stroke-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </CuteCard>
  );
}
