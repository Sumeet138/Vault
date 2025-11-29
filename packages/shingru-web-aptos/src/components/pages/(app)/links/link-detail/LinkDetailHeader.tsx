import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import EmojiPicture from "@/components/common/EmojiPicture";
import { COLOR_PICKS } from "@/config/styling";
import QRModal from "../../app/QRModal";
import MainButton from "@/components/common/MainButton";
import { cnm } from "@/utils/style";
import {
  ArchiveBoxIcon,
  CheckIcon,
  LinkIcon,
  QrCodeIcon,
  Square2StackIcon,
} from "@heroicons/react/24/outline";
import { getTransitionConfig } from "@/config/animation";
import { formatUiNumber } from "@/utils/formatting";

// Extended link type for the header component
interface ExtendedLink {
  id: string;
  userId: string;
  emoji: string;
  backgroundColor: string;
  tag: string;
  label: string;
  description: string | null;
  specialTheme: string;
  template: string;
  type: string;
  amountType: string;
  goalAmount: string | null;
  collectInfo: boolean;
  collectFields: Record<string, unknown> | null;
  supportedChains: string[];
  viewCount: number;
  status: "ACTIVE" | "ARCHIVED";
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  chainConfigs: any[];
  files?: {
    thumbnail?: {
      id: string;
      type: string;
      category: string | null;
      filename: string;
      size: number;
      contentType: string;
    };
    deliverables?: {
      id: string;
      type: string;
      category: string | null;
      filename: string;
      size: number;
      contentType: string;
    }[];
  };
  user: {
    id: string;
    username: string;
  };
  activities: any[];
  linkPreview: string;
  stats: {
    viewCount: number;
    totalPayments: number;
  };
}

interface LinkDetailHeaderProps {
  link: ExtendedLink;
}

const LinkDetailHeader: React.FC<LinkDetailHeaderProps> = ({ link }) => {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const selectedColor =
    COLOR_PICKS.find((c) => c.id === link.backgroundColor) || COLOR_PICKS[0];

  console.log(link);
  // Generate link preview path - fallback to constructing from username and tag
  const linkPreviewPath = (link.linkPreview && link.linkPreview.trim() !== "") 
    ? link.linkPreview
    : (link.user?.username 
        ? `/${link.user.username}${link.tag ? `/${link.tag}` : ""}`
        : "");
  
  // Generate the link URL
  const linkUrl = linkPreviewPath && linkPreviewPath.trim() !== "" 
    ? `${window.location.origin}${linkPreviewPath}` 
    : "";

  // Copy to clipboard function
  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!linkUrl || copied) {
      console.warn("Copy link: Cannot copy - linkUrl:", linkUrl, "copied:", copied);
      return;
    }

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
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
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
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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

  // Open QR modal
  const handleQRClick = () => {
    setQrModalOpen(true);
  };

  // Close QR modal
  const handleCloseQRModal = () => {
    setQrModalOpen(false);
  };

  const revenue = useMemo(
    () =>
      link.activities.reduce(
        (total: number, activity: any) => total + (activity.usdValue || 0),
        0
      ),
    [link.activities]
  );

  const stats = [
    {
      label: "Views",
      value: formatUiNumber(link.viewCount ?? 0, "", {
        maxDecimals: 0,
        humanize: true,
        humanizeThreshold: 10_000,
      }),
    },
    {
      label: "Payments",
      value: formatUiNumber(link.activities.length ?? 0, "", {
        maxDecimals: 0,
        humanize: true,
        humanizeThreshold: 10_000,
      }),
    },
    {
      label: "Revenue",
      value: `$${formatUiNumber(revenue, "", {
        maxDecimals: 2,
        humanize: true,
        humanizeThreshold: 10_000,
      })}`,
      accent: true,
    },
  ];

  return (
    <div className="w-full">
      <div
        className=""
        // style={{
        //   border: `2px solid ${selectedColor.value}`,
        // }}
      >
        {/* Header Section */}
        <div className="flex flex-col items-center gap-6">
          {/* Emoji Avatar */}
          <div className="flex-shrink-0 drop-shadow-xl">
            <EmojiPicture
              emoji={link.emoji}
              size="jumbo"
              color={link.backgroundColor}
            />
          </div>
          {/* Summary Pill */}
          <div className="w-full">
            <div className="rounded-3xl border border-black/5 bg-white shadow-supa-smooth p-5 sm:p-6">
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {stats.map((stat, idx) => (
                    <div
                      key={stat.label}
                      className={cnm(
                        "rounded-2xl bg-gray-50 px-5 py-4 text-center",
                        stat.accent && "bg-primary-50",
                        idx === 2 && "col-span-2 sm:col-span-1"
                      )}
                    >
                      <p
                        className={cnm(
                          "text-2xl font-semibold tracking-tight",
                          stat.accent ? "text-primary-700" : "text-gray-900"
                        )}
                      >
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs font-medium uppercase text-gray-400">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div
                    className="flex flex-col gap-3 rounded-2xl bg-gray-50  px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    style={{
                      border: `2px solid ${selectedColor.value}`,
                    }}
                  >
                    <div className="flex items-center gap-2 text-center sm:text-left">
                      <LinkIcon className="size-4" />
                      <p className="text-base font-semibold text-gray-900">
                        {window.location.host}{linkPreviewPath}
                      </p>
                    </div>

                    <div className="flex gap-2 flex-row sm:items-center w-full md:w-auto">
                      <MainButton
                        onClick={handleCopyLink}
                        disabled={copied || !linkUrl}
                        classNameContainer="w-full sm:w-auto flex-1"
                        className={cnm(
                          "min-h-9 text-xs font-semibold tracking-tight transition-colors px-4 w-full py-3",
                          copied
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                          {copied ? (
                            <CheckIcon className="w-4 h-4" />
                          ) : (
                            <Square2StackIcon className="w-4 h-4" />
                          )}
                        </div>
                      </MainButton>
                      <MainButton
                        onClick={handleQRClick}
                        classNameContainer="flex-1 sm:w-auto"
                        className="min-h-9 px-4 text-xs font-semibold tracking-tight bg-gray-950 text-white hover:bg-gray-800 w-full py-3"
                      >
                        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                          <QrCodeIcon className="w-4 h-4" />
                        </div>
                      </MainButton>
                    </div>
                  </div>

                  {link.status === "ARCHIVED" && (
                    <div className="flex justify-center">
                      <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/90 px-4 py-1.5 text-sm font-medium text-amber-700 shadow-xs">
                        <ArchiveBoxIcon className="w-4 h-4" />
                        <span>Archived link — not visible to public</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      <QRModal
        isOpen={qrModalOpen}
        onClose={handleCloseQRModal}
        url={linkUrl}
        label={link?.label || ""}
        color={link?.backgroundColor || "blue"}
      />
    </div>
  );
};

export default LinkDetailHeader;
