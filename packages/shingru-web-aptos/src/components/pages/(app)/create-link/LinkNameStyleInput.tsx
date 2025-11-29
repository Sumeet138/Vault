import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import EmojiPicture from "@/components/common/EmojiPicture";
import ThumbnailOption from "./ThumbnailOption";
import { useUser } from "@/providers/UserProvider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import MainButton from "@/components/common/MainButton";
import { FiEdit2 } from "react-icons/fi";
import { getTransitionConfig } from "@/config/animation";
import { getBaseHostname } from "@/utils/url";

interface LinkNameStyleInputProps {
  // Name and URL
  name: string;
  onNameChange: (name: string) => void;
  username?: string;
  generateSlug: (name: string) => string;
  placeholder?: string;

  // Emoji and Color
  selectedEmoji: { id: string; emoji: string } | null;
  selectedColor: { id: string; value: string; light: string } | null;
  onOpenEmojiColorPicker: () => void;

  // Thumbnail
  useThumbnail: boolean;
  onUseThumbnailChange: (value: boolean) => void;
  thumbnail: File | { url: string; name: string; size: number } | null;
  onThumbnailChange: (file: File | null) => void;

  // Optional: Link ID for edit mode (to exclude current link from duplicate check)
  linkId?: string;
}

export default function LinkNameStyleInput({
  name,
  onNameChange,
  username,
  generateSlug,
  placeholder = "Enter link name",
  selectedEmoji,
  selectedColor,
  onOpenEmojiColorPicker,
  useThumbnail,
  onUseThumbnailChange,
  thumbnail,
  onThumbnailChange,
  linkId,
}: LinkNameStyleInputProps) {
  const { links } = useUser();

  const urlPreview = useMemo(
    () => {
      const hostname = getBaseHostname();
      return name
        ? `${hostname}/${username || "username"}/${generateSlug(name)}`
        : `${hostname}/${username || "username"}/your-link-name`;
    },
    [name, username, generateSlug]
  );

  // Check for duplicate slug
  const duplicateValidation = useMemo(() => {
    if (!name.trim()) {
      return { isDuplicate: false, errorMessage: null };
    }

    const currentSlug = generateSlug(name);
    const existingLink = links.find(
      (link) =>
        link.tag === currentSlug &&
        link.id !== linkId &&
        link.status === "ACTIVE"
    );

    if (existingLink) {
      return {
        isDuplicate: true,
        errorMessage: `An active link with this name already exists, please pick another.`,
      };
    }

    return { isDuplicate: false, errorMessage: null };
  }, [name, generateSlug, links, linkId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Emoji/Color Preview */}
        <div className="md:hidden">
          <motion.div initial="rest" whileHover="hover" className="relative">
            <MainButton
              className="size-[3rem] bg-transparent hover:bg-transparent"
              onClick={onOpenEmojiColorPicker}
            >
              <EmojiPicture
                emoji={selectedEmoji?.emoji || "💰"}
                color={selectedColor?.id || "blue"}
                size="lg"
                className="text-[1.6rem]"
              />
            </MainButton>
            <motion.div
              className="absolute pointer-events-none -bottom-2 -right-2 flex size-6 items-center justify-center rounded-full bg-white shadow-supa-smooth shadow-black/10"
              variants={{
                rest: { scale: 1 },
                hover: { scale: 1.15 },
              }}
              transition={getTransitionConfig("SPRING_BOUNCE_ONE")}
            >
              <motion.div
                variants={{
                  rest: { color: "rgb(107, 114, 128)" },
                  hover: { color: "rgb(0, 0, 0)" },
                }}
                transition={{ duration: 0.2 }}
              >
                <FiEdit2 className="h-4 w-4" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
        <div className="hidden md:block">
          <motion.div initial="rest" whileHover="hover" className="relative">
            <MainButton
              className="size-[4rem] bg-transparent hover:bg-transparent"
              onClick={onOpenEmojiColorPicker}
            >
              <EmojiPicture
                emoji={selectedEmoji?.emoji || "💰"}
                color={selectedColor?.id || "blue"}
                size="xl"
                className="text-[2rem]"
              />
            </MainButton>
            <motion.div
              className="absolute pointer-events-none -bottom-2 -right-2 flex size-8 items-center justify-center rounded-full bg-white shadow-supa-smooth shadow-black/10"
              variants={{
                rest: { scale: 1 },
                hover: { scale: 1.15 },
              }}
              transition={getTransitionConfig("SPRING_BOUNCE_ONE")}
            >
              <motion.div
                variants={{
                  rest: { color: "rgb(107, 114, 128)" },
                  hover: { color: "rgb(0, 0, 0)" },
                }}
                transition={{ duration: 0.2 }}
              >
                <FiEdit2 className="h-4 w-4" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Name Input with Error State */}
        <div className="flex-1 space-y-2">
          <Input
            placeholder={placeholder}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className={cn(
              "transition-colors",
              "border-none bg-gray-100 h-12 rounded-xl px-4",
              duplicateValidation.isDuplicate &&
                "border-destructive focus-visible:ring-destructive"
            )}
          />

          {/* Error Message */}
          {duplicateValidation.isDuplicate && (
            <p className="text-sm text-destructive">
              {duplicateValidation.errorMessage}
            </p>
          )}
        </div>
      </div>

      {/* URL Preview integrated below input */}
      <AnimatePresence>
        {name && !duplicateValidation.isDuplicate && (
          <motion.div
            key="url-preview"
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mt-2 rounded-lg flex flex-row items-center text-sm gap-1 overflow-hidden"
          >
            <div className="text-gray-500">URL Preview:</div>
            <div
              className="text-primary-600 font-semibold"
              style={{
                color: selectedColor?.value || "black",
              }}
            >
              https://{urlPreview}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thumbnail Section */}
      <ThumbnailOption
        useThumbnail={useThumbnail}
        onUseThumbnailChange={onUseThumbnailChange}
        thumbnail={thumbnail}
        onThumbnailChange={onThumbnailChange}
      />
    </div>
  );
}
