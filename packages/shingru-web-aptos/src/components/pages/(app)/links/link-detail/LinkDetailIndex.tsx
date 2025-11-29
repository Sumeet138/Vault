"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/AuthProvider";
import { useUser } from "@/providers/UserProvider";
import { Link, linksService } from "@/lib/api/links";
// import { cn } from "@/lib/utils";
import LinkDetailHeader from "./LinkDetailHeader";
import LinkDetailContent from "../LinkDetailContent";
import LinkActivities from "./LinkActivities";
import CuteModal from "@/components/common/CuteModal";
import MenuItem from "@/components/common/MenuItem";
import MainButton from "@/components/common/MainButton";
import TypeBadge from "../../username-pay/TypeBadge";
import { useAppHeaderStore } from "@/store/app-header-store";
import {
  ArchiveBoxIcon,
  ChevronLeftIcon,
  PencilIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { capitalizeFirstLetter } from "@/utils/formatting";
import UpdateProfileModal from "../../update-profile/UpdateProfileModal";

// Type adapter for TypeBadge component
interface FileData {
  id: string;
  type: string;
  category: string | null;
  filename: string;
  size: number;
  contentType: string;
}

// Extended link type for the page component
interface ExtendedLink extends Omit<Link, "files"> {
  files?: {
    thumbnail?: FileData;
    deliverables?: FileData[];
  };
}

// Convert backend Link to ExtendedLink format for TypeBadge
const convertToExtendedLink = (link: Link): ExtendedLink => {
  return {
    ...link,
    files: link.files
      ? {
          thumbnail: link.files.thumbnail
            ? ({ id: link.files.thumbnail } as FileData)
            : undefined,
          deliverables: link.files.deliverables || [],
        }
      : undefined,
  };
};

export default function LinkDetailIndex({ linkId }: { linkId: string }) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { setOverride } = useAppHeaderStore();
  const {
    archiveLink,
    unarchiveLink,
    deleteLink: deleteLinkFromProvider,
    links,
    personalLink,
  } = useUser();
  const [link, setLink] = useState<Link | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [unarchiveModalOpen, setUnarchiveModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [unarchiveError, setUnarchiveError] = useState<string | null>(null);
  const [isUnarchiveBlocked, setIsUnarchiveBlocked] = useState(false);
  const [isUpdateProfileModalOpen, setIsUpdateProfileModalOpen] =
    useState(false);

  const existingLink = useMemo(
    () => links.find((linkItem) => linkItem.id === linkId) || null,
    [links, linkId]
  );

  const resolvedLink = link ?? existingLink;

  const isPersonal = useMemo(
    () => resolvedLink?.id === personalLink.id,
    [resolvedLink, personalLink]
  );

  const refetchLink = useCallback(async () => {
    if (!accessToken || !linkId) return;
    try {
      const response = await linksService.getLink(accessToken, linkId);

      if (response.data) {
        const linkData = response.data;
        setLink(linkData);
      } else {
        setError(response.error || "Failed to load link details");
      }
    } catch {
      // Error fetching link
      setError("Failed to load link details");
    }
  }, [accessToken, linkId]);

  useEffect(() => {
    if (!linkId || typeof linkId !== "string" || !accessToken) {
      setLoading(false);
      return;
    }

    const fetchLink = async () => {
      try {
        setLoading(true);
        const response = await linksService.getLink(accessToken, linkId);

        if (response.data) {
          const linkData = response.data;
          setLink(linkData);
        } else {
          setError(response.error || "Failed to load link details");
        }
      } catch {
        // Error fetching link
        setError("Failed to load link details");
      } finally {
        setLoading(false);
      }
    };

    fetchLink();
  }, [linkId, accessToken]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetchLink();
    }, 5000); // Refetch every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [refetchLink]);

  const headerTitle = capitalizeFirstLetter(resolvedLink?.label ?? "");

  useLayoutEffect(() => {
    setOverride({
      title: headerTitle,
      showBackButton: true,
      onBack: () => router.back(),
      rightButton: resolvedLink
        ? isPersonal
          ? {
              icon: <PencilIcon className="w-6 h-6" />,
              onPress: () => setIsUpdateProfileModalOpen(true),
              ariaLabel: "Edit Profile",
            }
          : {
              icon: <PencilSquareIcon className="w-6 h-6" />,
              onPress: () => setMenuModalOpen(true),
              ariaLabel: "More link actions",
            }
        : null,
    });
  }, [headerTitle, resolvedLink, router, setOverride, isPersonal]);

  useLayoutEffect(() => {
    return () => {
      setOverride(null);
    };
  }, [setOverride]);

  // Handle delete button click
  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!link) return;

    setIsDeleting(true);
    try {
      await deleteLinkFromProvider(link.id);
      // Always navigate back to links page after delete attempt
      router.push("/app/links");
    } catch {
      // TODO: Show error toast/message
      // Still navigate back even on error
      router.push("/app/links");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  // Handle delete modal close
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
  };

  // Handle archive button click
  const handleArchiveClick = () => {
    setArchiveModalOpen(true);
  };

  // Handle archive confirmation
  const handleArchiveConfirm = async () => {
    if (!link) return;

    setIsArchiving(true);
    try {
      const archivedLink = await archiveLink(link.id);
      if (archivedLink) {
        // Navigate back to links list
        router.push("/app/links");
      } else {
        // TODO: Show error toast/message
      }
    } catch {
      // TODO: Show error toast/message
    } finally {
      setIsArchiving(false);
      setArchiveModalOpen(false);
    }
  };

  // Handle archive modal close
  const handleCloseArchiveModal = () => {
    setArchiveModalOpen(false);
  };

  // Handle unarchive button click
  const handleUnarchiveClick = () => {
    if (!link) return;

    // Check if there's already an active link with the same tag
    const conflictingLink = links.find(
      (linkItem) =>
        linkItem.id !== link.id && // Not the same link
        linkItem.tag === link.tag && // Same tag
        linkItem.status === "ACTIVE" // Active status
    );

    if (conflictingLink) {
      setUnarchiveError(
        `Cannot unarchive this link. Another active link with the tag **${link.tag}** already exists. Please archive or delete the conflicting link first.`
      );
      setIsUnarchiveBlocked(true);
    } else {
      setUnarchiveError(null);
      setIsUnarchiveBlocked(false);
    }

    setUnarchiveModalOpen(true);
  };

  // Handle unarchive confirmation
  const handleUnarchiveConfirm = async () => {
    if (!link || isUnarchiveBlocked) return;

    setIsUnarchiving(true);
    setUnarchiveError(null);

    try {
      const unarchivedLink = await unarchiveLink(link.id);
      if (unarchivedLink) {
        // Navigate back to links list
        router.push("/app/links");
      } else {
        setUnarchiveError(
          "An error occurred while unarchiving the link. Please try again."
        );
      }
    } catch (error) {
      console.error("Error unarchiving link:", error);
      setUnarchiveError(
        "An error occurred while unarchiving the link. Please try again."
      );
    } finally {
      setIsUnarchiving(false);
    }
  };

  // Handle unarchive modal close
  const handleCloseUnarchiveModal = () => {
    setUnarchiveModalOpen(false);
    setUnarchiveError(null);
    setIsUnarchiveBlocked(false);
  };

  if (loading) {
    return (
      <div className="w-full max-w-lg mx-auto relative py-3 ">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="loading loading-spinner loading-lg" />
        </div>
      </div>
    );
  }

  if (error || !resolvedLink) {
    return (
      <div className="w-full max-w-lg mx-auto relative py-3 ">
        <div className="pb-[12rem]">
          <div className="bg-white rounded-2xl overflow-hidden border border-black/10 shadow-supa-smooth transition-shadow p-5 sm:p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {error || "Link not found"}
              </h2>
              <p className="text-gray-600">
                The link you&apos;re looking for doesn&apos;t exist or you
                don&apos;t have permission to view it.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const extendedLink = convertToExtendedLink(resolvedLink);
  // const linkPath = `${resolvedLink.user.username}/${resolvedLink.tag || "personal"}`;

  return (
    <>
      <div className="w-full max-w-xl mx-auto md:py-6 pt-5">
        {/* Local Page Header */}
        <div className="relative flex md:hidden items-center justify-center mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute left-0 cursor-pointer flex items-center justify-center text-gray-600 hover:text-black transition-colors"
            aria-label="Go back"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 truncate px-12">
            {headerTitle}
          </h1>
          <button
            type="button"
            onClick={() => {
              if (isPersonal) {
                setIsUpdateProfileModalOpen(true);
              } else {
                setMenuModalOpen(true);
              }
            }}
            className="absolute right-0 cursor-pointer size-9 rounded-xl p-0 text-gray-500 flex items-center justify-center group"
            aria-label={isPersonal ? "Edit Profile" : "More link actions"}
          >
            <div className="absolute w-full h-full bg-gray-100 rounded-xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 group-hover:scale-100 scale-0 transition duration-150 ease-out opacity-0 group-hover:opacity-100" />
            <div className="relative z-10">
              {isPersonal ? (
                <PencilIcon className="w-6 h-6" />
              ) : (
                <PencilSquareIcon className="w-6 h-6" />
              )}
            </div>
          </button>
        </div>

        <div className="space-y-8">
          <LinkDetailHeader link={extendedLink} />

          <section className="rounded-3xl border border-black/5 bg-white shadow-supa-smooth">
            <div className="space-y-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="">
                  <TypeBadge variant="default" linkData={extendedLink as any} />
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <LinkDetailContent link={extendedLink} />
              </div>
            </div>
          </section>

          <section className="pb-[10rem]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                Recent Activities
              </h3>
            </div>
            <LinkActivities
              activities={resolvedLink.activities || []}
              dateGrouping={true}
              isShowSeeAll={false}
            />
          </section>
        </div>
      </div>

      {/* Menu Modal */}
      <CuteModal
        isOpen={menuModalOpen}
        onClose={() => setMenuModalOpen(false)}
        title="Link Actions"
        size="lg"
        withHandle={true}
      >
        <div className="space-y-2">
          <MenuItem
            icon={<PencilSquareIcon />}
            size="md"
            className="text-gray-500 hover:bg-gray-50 bg-transparent flex px-4"
            onClick={() => {
              setMenuModalOpen(false);
              router.push(`/app/links/${link?.id}/edit`);
            }}
          >
            Edit Link
          </MenuItem>
          {link?.status === "ARCHIVED" ? (
            <MenuItem
              icon={<ArchiveBoxIcon />}
              size="md"
              className="text-blue-600 hover:bg-blue-50 px-4 bg-transparent"
              onClick={() => {
                setMenuModalOpen(false);
                // Trigger unarchive modal
                handleUnarchiveClick();
              }}
            >
              Unarchive Link
            </MenuItem>
          ) : (
            <MenuItem
              icon={<ArchiveBoxIcon />}
              size="md"
              className="text-amber-600 hover:bg-amber-50 px-4 bg-transparent"
              onClick={() => {
                setMenuModalOpen(false);
                // Trigger archive modal
                handleArchiveClick();
              }}
            >
              Archive Link
            </MenuItem>
          )}

          {/* Divider */}

          <MenuItem
            icon={<TrashIcon />}
            size="md"
            className="text-red-600 hover:bg-red-100 px-4 bg-red-50"
            onClick={() => {
              setMenuModalOpen(false);
              // Trigger delete modal - we'll handle this by passing a callback
              handleDeleteClick();
            }}
          >
            Delete Link
          </MenuItem>
        </div>
      </CuteModal>

      {/* Unarchive Confirmation Modal */}
      <CuteModal
        isOpen={unarchiveModalOpen}
        onClose={handleCloseUnarchiveModal}
        title="Unarchive Link"
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArchiveBoxIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Unarchive this link?
            </h3>
            <p className="text-gray-600 text-sm">
              This will reactivate the link and make it visible to your
              customers again. All your data and logs will remain intact.
            </p>
          </div>

          {unarchiveError && (
            <div className="bg-warning-50 rounded-lg p-4 mb-4">
              <p className="text-warning-600 text-sm text-center">
                {unarchiveError.split("**").map((part, index) =>
                  index % 2 === 1 ? (
                    <span key={index} className="font-semibold">
                      {part}
                    </span>
                  ) : (
                    part
                  )
                )}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <MainButton onClick={handleCloseUnarchiveModal} className="flex-1">
              Cancel
            </MainButton>
            <MainButton
              onClick={handleUnarchiveConfirm}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              isLoading={isUnarchiving}
              disabled={isUnarchiving || isUnarchiveBlocked}
            >
              {isUnarchiving ? "Unarchiving..." : "Unarchive Link"}
            </MainButton>
          </div>
        </div>
      </CuteModal>

      {/* Delete Confirmation Modal */}
      <CuteModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Delete Link"
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Delete this link?
            </h3>
            <p className="text-gray-600 text-sm">
              This action cannot be undone. This will permanently delete the
              link
              <span className="font-medium"> &ldquo;{link?.label}&rdquo; </span>
              and all its associated data.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <MainButton
              onClick={handleCloseDeleteModal}
              className="flex-1 bg-gray-50 hover:bg-gray-100 w-full"
              classNameContainer="flex-1"
            >
              Cancel
            </MainButton>
            <MainButton
              onClick={handleDeleteConfirm}
              classNameContainer="flex-1"
              isLoader={true}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white w-full"
              isLoading={isDeleting}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Link"}
            </MainButton>
          </div>
        </div>
      </CuteModal>

      {/* Archive Confirmation Modal */}
      <CuteModal
        isOpen={archiveModalOpen}
        onClose={handleCloseArchiveModal}
        title="Archive Link"
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArchiveBoxIcon className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Archive this link?
            </h3>
            <p className="text-gray-600 text-sm text-balance">
              This will make the link inactive but keep all your data and logs.
              You can reactivate it anytime.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <MainButton
              classNameContainer="flex-1"
              onClick={handleCloseArchiveModal}
              className="flex-1 w-full bg-gray-50 hover:bg-gray-100"
            >
              Cancel
            </MainButton>
            <MainButton
              onClick={handleArchiveConfirm}
              classNameContainer="flex-1"
              className="flex-1 w-full bg-amber-600 hover:bg-amber-700 text-white"
              isLoading={isArchiving}
              disabled={isArchiving}
            >
              {isArchiving ? "Archiving..." : "Archive Link"}
            </MainButton>
          </div>
        </div>
      </CuteModal>

      <UpdateProfileModal
        isOpen={isUpdateProfileModalOpen}
        onClose={() => setIsUpdateProfileModalOpen(false)}
        onUpdateSuccess={refetchLink}
      />
    </>
  );
}
