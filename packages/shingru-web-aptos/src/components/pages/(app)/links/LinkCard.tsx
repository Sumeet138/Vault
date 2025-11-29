import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { Link } from "@/lib/api/links";
import CuteCard from "@/components/common/CuteCard";
import EmojiPicture from "@/components/common/EmojiPicture";
import TemplatePill from "@/components/common/TemplatePill";
import LabelBadge from "@/components/common/LabelBadge";
import StatusBadge from "@/components/common/StatusBadge";
import {
  CheckCircleIcon,
  LinkIcon,
  QrCodeIcon,
  Square2StackIcon,
  TagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { COLOR_PICKS } from "@/config/styling";
import { useUser } from "@/providers/UserProvider";
import LabelManager from "./LabelManager";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const { updateLink } = useUser();
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);

  // Generate link preview path - fallback to constructing from username and tag
  const linkPreviewPath = (link.linkPreview && link.linkPreview.trim() !== "") 
    ? link.linkPreview
    : (link.user?.username 
        ? `/${link.user.username}${link.tag ? `/${link.tag}` : ""}`
        : "");
  
  // Debug logging
  if (!linkPreviewPath) {
    console.warn("⚠️ LinkCard: No linkPreviewPath available", {
      linkPreview: link.linkPreview,
      username: link.user?.username,
      tag: link.tag,
      linkId: link.id
    });
  }

  // Copy link to clipboard
  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isCopied || !linkPreviewPath) {
      console.warn("Copy link: Cannot copy - isCopied:", isCopied, "linkPreviewPath:", linkPreviewPath);
      return;
    }

    const linkUrl = `${window.location.origin}${linkPreviewPath}`;
    console.log("📋 Copying link:", linkUrl);

    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
    
    if (!isSecureContext) {
      console.warn("⚠️ Not in secure context, clipboard API may not work");
    }

    try {
      // Try modern clipboard API first (requires secure context and user gesture)
      if (navigator.clipboard && navigator.clipboard.writeText && isSecureContext) {
    try {
      await navigator.clipboard.writeText(linkUrl);
          console.log("✅ Successfully copied to clipboard");
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
          return;
        } catch (clipboardError: any) {
          // Check for permission denied error
          if (clipboardError.name === 'NotAllowedError' || clipboardError.message?.includes('permission')) {
            console.warn("⚠️ Clipboard permission denied, trying fallback");
          } else {
            throw clipboardError; // Re-throw to trigger fallback
          }
        }
      }
      
      // Fallback method (works in all contexts)
      console.log("🔄 Using fallback copy method");
      const textArea = document.createElement("textarea");
      textArea.value = linkUrl;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      textArea.style.opacity = "0";
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      
      // Select and copy
      textArea.select();
      textArea.setSelectionRange(0, 99999); // For mobile devices
      
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log("✅ Successfully copied using fallback method");
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      } else {
        console.error("❌ Fallback copy method failed - execCommand returned false");
        alert(`Failed to copy link. Please copy manually:\n${linkUrl}`);
      }
    } catch (error: any) {
      console.error("❌ Copy failed:", error);
      // Show user-friendly error
      alert(`Failed to copy link. Please copy manually:\n${linkUrl}`);
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

  // Handle labels update
  const handleLabelsChange = async (newLabels: string[]) => {
    try {
      await updateLink(link.id, { labels: newLabels } as any);
    } catch (error) {
      console.error("Failed to update labels:", error);
    }
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
                {/* Labels */}
                {link.labels && link.labels.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    {link.labels.slice(0, 2).map((label) => (
                      <LabelBadge key={label} label={label} variant="compact" />
                    ))}
                    {link.labels.length > 2 && (
                      <span className="text-xs text-gray-400">
                        +{link.labels.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Status and template */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Status Badge */}
              {link.paymentStatus && (
                <StatusBadge status={link.paymentStatus} size="sm" />
              )}
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
                onClick={(e) => handleCopyLink(e)}
                disabled={isCopied || !linkPreviewPath}
                type="button"
                className="w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

              <Popover open={isLabelManagerOpen} onOpenChange={setIsLabelManagerOpen}>
                <PopoverTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLabelManagerOpen(true);
                    }}
                    className="w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors"
                    type="button"
                  >
                    <TagIcon className="size-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 bg-white rounded-2xl shadow-lg p-4 border-gray-200"
                  align="end"
                  sideOffset={4}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Manage Labels</h3>
                      <button
                        onClick={() => setIsLabelManagerOpen(false)}
                        className="text-gray-400 hover:text-gray-600"
                        type="button"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <LabelManager
                      labels={link.labels || []}
                      onLabelsChange={handleLabelsChange}
                    />
                  </div>
                </PopoverContent>
              </Popover>

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
        {/* Floating status badge and template pill */}
        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
          {link.paymentStatus && (
            <StatusBadge status={link.paymentStatus} size="sm" animated />
          )}
          <TemplatePill template={link.template} color={link.backgroundColor} />
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
              <div className="text-xs md:text-sm text-black/50 line-clamp-2 leading-relaxed mb-2">
                {link.description}
              </div>
              {/* Labels */}
              {link.labels && link.labels.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {link.labels.slice(0, 3).map((label) => (
                    <LabelBadge key={label} label={label} variant="compact" />
                  ))}
                  {link.labels.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{link.labels.length - 3}
                    </span>
                  )}
                </div>
              )}
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
              <Popover open={isLabelManagerOpen} onOpenChange={setIsLabelManagerOpen}>
                <PopoverTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLabelManagerOpen(true);
                    }}
                    className="cursor-pointer w-8 h-8 md:w-7 md:h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors touch-manipulation"
                    type="button"
                  >
                    <TagIcon className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-50 stroke-2" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 bg-white rounded-2xl shadow-lg p-4 border-gray-200"
                  align="end"
                  sideOffset={4}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Manage Labels</h3>
                      <button
                        onClick={() => setIsLabelManagerOpen(false)}
                        className="text-gray-400 hover:text-gray-600"
                        type="button"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <LabelManager
                      labels={link.labels || []}
                      onLabelsChange={handleLabelsChange}
                    />
                  </div>
                </PopoverContent>
              </Popover>

              <button
                onClick={(e) => handleCopyLink(e)}
                disabled={isCopied || !linkPreviewPath}
                type="button"
                className="cursor-pointer w-8 h-8 md:w-7 md:h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors relative touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
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
