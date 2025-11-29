"use client";

import React, { useState } from "react";
import { useUser } from "@/providers/UserProvider";
import { useAuth } from "@/providers/AuthProvider";
import { motion, AnimatePresence } from "motion/react";
import EmojiPicture from "@/components/common/EmojiPicture";
import QRModal from "./QRModal";
import UpdateProfileModal from "../update-profile/UpdateProfileModal";
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  QrCodeIcon,
  Square2StackIcon,
} from "@heroicons/react/24/outline";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function PersonalLinkCard() {
  const { personalLink } = useUser();
  const { me } = useAuth();

  // Modal states
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isUpdateProfileModalOpen, setIsUpdateProfileModalOpen] =
    useState(false);

  // Animation states
  const [isCopied, setIsCopied] = useState(false);

  // Generate the personal link URL using linkPreview, with fallback to username
  const linkPreviewPath = (personalLink?.linkPreview && personalLink.linkPreview.trim() !== "")
    ? personalLink.linkPreview
    : (me?.username ? `/${me.username}` : "");
  const personalLinkUrl = linkPreviewPath && linkPreviewPath.trim() !== ""
    ? `${window.location.origin}${linkPreviewPath}`
    : "";

  // Copy link to clipboard
  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!personalLinkUrl || isCopied) {
      console.warn("Copy link: Cannot copy - personalLinkUrl:", personalLinkUrl, "isCopied:", isCopied);
      return;
    }

    console.log("📋 Copying personal link:", personalLinkUrl);

    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
    
    if (!isSecureContext) {
      console.warn("⚠️ Not in secure context, clipboard API may not work");
    }

    try {
      // Try modern clipboard API first (requires secure context and user gesture)
      if (navigator.clipboard && navigator.clipboard.writeText && isSecureContext) {
        try {
          await navigator.clipboard.writeText(personalLinkUrl);
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
      textArea.value = personalLinkUrl;
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
        alert(`Failed to copy link. Please copy manually:\n${personalLinkUrl}`);
      }
    } catch (error: any) {
      console.error("❌ Copy failed:", error);
      // Show user-friendly error
      alert(`Failed to copy link. Please copy manually:\n${personalLinkUrl}`);
    }
  };

  // Handle opening external link
  const handleOpenLink = () => {
    if (personalLinkUrl) {
      window.open(personalLinkUrl, "_blank");
    }
  };

  // Handle opening update profile modal
  const handleEditProfile = () => {
    setIsUpdateProfileModalOpen(true);
  };

  if (!personalLink || !me?.username) {
    return (
      <div className="bg-white rounded-[1.6rem] overflow-hidden border border-black/10 shadow-supa-smooth transition-shadow p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-3">🔗</div>
          <p className="text-gray-500 text-sm">
            Complete your profile to see your personal link
          </p>
          <button
            className="mt-4 bg-gray-950 text-white hover:bg-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            onClick={handleEditProfile}
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.6rem]">
      <div className="bg-white rounded-[1.6rem] overflow-hidden border border-black/5 shadow-supa-smooth transition-shadow">
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-row items-center justify-between">
            {/* Header with profile info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Your Personal Link
                  </h3>
                  <p className="text-sm text-gray-500">Share to get paid</p>
                </div>
              </div>
            </div>

            {/* Username Badge */}
            {/* <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
              <span className="font-medium text-sm">@{me?.username}</span>
              <div className="h-3 w-[1px] bg-black/10" />
              <button
                className="cursor-pointer min-w-6 w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors"
                onClick={handleEditProfile}
              >
                <PencilIcon className="size-3.5 opacity-50 stroke-2" />
              </button>
            </div> */}

            {/* More button with shadcn popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="cursor-pointer size-10 rounded-full flex items-center justify-center relative group">
                  <div
                    className={cn(
                      "absolute w-full h-full bg-gray-100 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0",
                      "group-hover:scale-100 scale-0 transition duration-150 ease-out opacity-0 group-hover:opacity-100"
                    )}
                  />
                  <EllipsisHorizontalIcon className="relative z-10 size-6 stroke-2 transition-opacity opacity-50 group-hover:opacity-100" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-48 bg-gray-950 rounded-2xl shadow-lg p-1 border-gray-800"
                align="end"
                sideOffset={4}
              >
                <button
                  onClick={handleEditProfile}
                  className="cursor-pointer flex items-center gap-3 text-white hover:bg-white/10 rounded-[0.8rem] px-3 py-2.5 text-sm w-full text-left font-medium transition-colors"
                >
                  <PencilIcon className="size-5 text-gray-400" />
                  Edit Profile
                </button>
              </PopoverContent>
            </Popover>
          </div>

          {/* Link Display Badge */}
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-full">
            <div className="flex items-center gap-2">
              <EmojiPicture
                emoji={personalLink?.emoji || "🔗"}
                color={personalLink?.backgroundColor || "blue"}
                size="md"
                className="bg-gray-50"
              />
              <span className="font-semibold text-sm md:text-base">
                {window.location.host}/{me.username}
              </span>
            </div>

            <div className="flex flex-row items-center gap-2">
              <button
                className="cursor-pointer size-7 md:size-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors relative disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={(e) => handleCopyLink(e)}
                disabled={isCopied || !personalLinkUrl}
                type="button"
              >
                <AnimatePresence>
                  {isCopied ? (
                    <motion.div
                      key={"copied"}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute"
                    >
                      <CheckCircleIcon className="w-4 h-4 text-primary-600 stroke-2" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={"copy"}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute"
                    >
                      <Square2StackIcon className="w-4 h-4 opacity-50 stroke-2" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              <button
                className="cursor-pointer size-7 md:size-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                onClick={() => setIsQRModalOpen(true)}
              >
                <QrCodeIcon className="w-4 h-4 opacity-50 stroke-2" />
              </button>

              <button
                className="cursor-pointer size-7 md:size-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                onClick={handleOpenLink}
              >
                <ArrowTopRightOnSquareIcon className="w-4 h-4 opacity-50 stroke-2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        url={personalLinkUrl}
        label="Your Payment Link"
        color={personalLink?.backgroundColor || "primary"}
      />

      {/* Update Profile Modal */}
      <UpdateProfileModal
        isOpen={isUpdateProfileModalOpen}
        onClose={() => setIsUpdateProfileModalOpen(false)}
      />
    </div>
  );
}

export default PersonalLinkCard;
