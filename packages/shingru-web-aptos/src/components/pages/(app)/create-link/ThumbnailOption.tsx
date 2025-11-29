import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Image as ImageIcon, Check } from "lucide-react";
import ThumbnailInput from "@/components/common/ThumbnailInput";
import { EASE_OUT_QUART, EASE_OUT_QUINT } from "@/config/animation";

interface ThumbnailOptionProps {
  useThumbnail: boolean;
  onUseThumbnailChange: (value: boolean) => void;
  thumbnail: File | { url: string; name: string; size: number } | null;
  onThumbnailChange: (file: File | null) => void;
}

const ThumbnailOption = React.memo(function ThumbnailOption({
  useThumbnail,
  onUseThumbnailChange,
  thumbnail,
  onThumbnailChange,
}: ThumbnailOptionProps) {
  return (
    <div className="space-y-4 pt-4">
      <div className="rounded-2xl transition-colors">
        {/* Header - Always visible and clickable */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => onUseThumbnailChange(!useThumbnail)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Thumbnail Image</h3>
              <p className="text-sm text-gray-500">
                Add an image to make your link more appealing
              </p>
            </div>
          </div>
          <div
            className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center ${
              useThumbnail
                ? "border-blue-500 bg-blue-500"
                : "border-gray-300 bg-transparent"
            }`}
          >
            {useThumbnail && <Check className="w-4 h-4 text-white" />}
          </div>
        </div>

        {/* Expanded Content - Inside same container */}
        <AnimatePresence>
          {useThumbnail && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: EASE_OUT_QUART,
              }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-black/5">
                <ThumbnailInput
                  value={thumbnail}
                  onChange={onThumbnailChange}
                  placeholder="Upload Thumbnail"
                  maxSize={5}
                  aspectRatio="1:1"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default ThumbnailOption;
