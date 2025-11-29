"use client";

import React, { useState } from "react";
import { useUser } from "@/providers/UserProvider";
import { Link } from "@/lib/api/links";
import LinkCard from "./LinkCard";
import { useRouter } from "next/navigation";
import QRModal from "../app/QRModal";
import { AnimatePresence, motion } from "motion/react";
import { EASE_OUT_QUART } from "@/config/animation";
import {
  ArchiveBoxIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useIsMobile } from "@/hooks/use-is-mobile";

export default function Links() {
  const { links, showArchivedLinks, setShowArchivedLinks } = useUser();
  const [selectedLinkForQR, setSelectedLinkForQR] = useState<Link | null>(null);
  const router = useRouter();
  const isMobile = useIsMobile();

  // Get archived links
  const archivedLinks = links.filter((link) => link.status === "ARCHIVED");
  const archivedCount = archivedLinks.length;

  // Handle QR code button - opens modal for specific link
  const handleQRClick = (link: Link) => {
    setSelectedLinkForQR(link);
  };

  // Close QR modal
  const handleCloseQRModal = () => {
    setSelectedLinkForQR(null);
  };

  // Generate QR URL with fallback
  const getQRUrl = (link: Link | null): string => {
    if (!link) return "";
    const linkPreviewPath = (link.linkPreview && link.linkPreview.trim() !== "") 
      ? link.linkPreview
      : (link.user?.username 
          ? `/${link.user.username}${link.tag ? `/${link.tag}` : ""}`
          : "");
    return linkPreviewPath && linkPreviewPath.trim() !== "" 
      ? `${window.location.origin}${linkPreviewPath}` 
      : "";
  };

  // Handle archived links toggle
  const handleArchivedLinksClick = () => {
    setShowArchivedLinks(!showArchivedLinks);
  };

  // Handle create link button
  const handleCreateLink = () => {
    router.push("/app/create-link");
  };

  return (
    <>
      <div className="w-full max-w-lg mx-auto relative md:py-3 pt-5">
        {/* Mobile Header */}

        <div className="pb-[12rem]">
          <div className="grid md:grid-cols-2 gap-3 pt-3">
            <div
              onClick={handleCreateLink}
              className="cursor-pointer w-full bg-white hover:bg-gray-50 rounded-4xl p-1 flex group transition-all duration-200 min-h-[120px] md:min-h-[200px]"
            >
              <div
                className="w-full bg-gray-100 rounded-[28px] flex flex-col items-center justify-center gap-2 md:gap-3 text-gray-500 hover:text-gray-700 transition-all"
                // style={{ border: `3px dashed #E5E7EB` }}
              >
                <PlusIcon className="size-6 md:size-7" />
                <span className="font-semibold text-sm md:text-base text-center px-2">
                  Create New Link
                </span>
              </div>
            </div>
            {links
              .filter((link) => link.status !== "ARCHIVED")
              .map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  onQRClick={handleQRClick}
                  variant={isMobile ? "row" : "card"}
                />
              ))}
          </div>

          {/* Archived Links Button */}
          <div className="mt-8">
            <button
              onClick={handleArchivedLinksClick}
              className="cursor-pointer w-full p-5 sm:p-6 flex items-center justify-between rounded-3xl bg-gray-100 text-left hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <ArchiveBoxIcon className="w-6 h-6" />
                  {archivedCount > 0 && (
                    <div className="absolute -top-2 -right-3 bg-warning text-black border border-black/10 text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                      {archivedCount}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-md font-semibold">
                    {showArchivedLinks
                      ? "Hide Archived Links"
                      : "Show Archived Links"}
                  </span>
                  <span className="text-sm opacity-50">
                    View your archived payment links
                  </span>
                </div>
              </div>
              <div>
                {showArchivedLinks ? (
                  <ChevronDownIcon className="w-6 h-6 opacity-50" />
                ) : (
                  <ChevronRightIcon className="w-6 h-6 opacity-50" />
                )}
              </div>
            </button>
          </div>

          {/* Archived Links Section */}
          <AnimatePresence>
            {showArchivedLinks ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, ease: EASE_OUT_QUART }}
              >
                <div className="mt-4">
                  <div className="">
                    <h2 className="text-lg font-semibold mb-3 text-gray-700">
                      Archived Links
                    </h2>
                    <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                      {archivedLinks.map((link) => (
                        <LinkCard
                          key={link.id}
                          link={link}
                          onQRClick={handleQRClick}
                          variant={isMobile ? "row" : "card"}
                        />
                      ))}
                    </div>
                    {archivedCount === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <ArchiveBoxIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No archived links yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Single QR Modal for all links */}
        <QRModal
          isOpen={!!selectedLinkForQR}
          onClose={handleCloseQRModal}
          url={getQRUrl(selectedLinkForQR)}
          label={selectedLinkForQR?.label || ""}
          color={selectedLinkForQR?.backgroundColor || "blue"}
        />
      </div>
    </>
  );
}
