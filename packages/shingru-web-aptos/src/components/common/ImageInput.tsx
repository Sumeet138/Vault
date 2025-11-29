import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";

export interface ImageInputProps {
  value?: File | { url: string; name: string; size: number } | null;
  onChange: (file: File | null) => void;
  placeholder?: string;
  description?: string;
  maxSize?: number; // in MB
  accept?: string;
  className?: string;
  disabled?: boolean;
}

const ImageInput = ({
  value,
  onChange,
  placeholder = "Upload Image",
  description = "Recommended: 1:1 square, JPG/PNG",
  maxSize = 5, // 5MB default
  accept = "image/*",
  className = "",
  disabled = false,
}: ImageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      console.log("Please select an image file");
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      console.log(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    onChange(file);
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle remove image
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Use imagePreview if available, otherwise check if value exists and create preview
  useEffect(() => {
    let objectUrl: string | null = null;
    if (value && !(value instanceof File) && "url" in value) {
      setImagePreview(value.url);
    } else if (value instanceof File) {
      objectUrl = URL.createObjectURL(value);
      setImagePreview(objectUrl);
    } else {
      setImagePreview(null);
    }

    // Cleanup URL when component unmounts or value changes
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [value]);

  const hasImage = !!imagePreview;

  const displayName =
    (value instanceof File && value.name) ||
    (value && !(value instanceof File) && "name" in value && value.name) ||
    "Uploaded image";

  const displaySize =
    (value instanceof File && formatFileSize(value.size)) ||
    (value &&
      !(value instanceof File) &&
      "size" in value &&
      formatFileSize(value.size)) ||
    "Size unknown";

  return (
    <div className={`w-full ${className}`}>
      <input
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        ref={fileInputRef}
        disabled={disabled}
      />

      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative bg-gray-50 rounded-2xl p-4 transition-all duration-200 cursor-pointer
          ${!disabled ? "hover:bg-gray-50/80" : "opacity-50 cursor-not-allowed"}
          ${isDragOver ? "border-2 border-blue-400 bg-blue-50" : ""}
        `}
      >
        <AnimatePresence>
          {hasImage && imagePreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              {/* Remove button */}
              <button
                onClick={handleRemove}
                className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                disabled={disabled}
              >
                <XMarkIcon className="w-6 h-6 stroke-2" />
              </button>

              {/* Image preview */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden flex-shrink-0">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate max-w-[90%]">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {displaySize} • Click to change
                  </p>
                  <p className="text-xs text-primary-700">
                    Click to replace or drag new image
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!hasImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center flex-shrink-0">
              <ArrowUpTrayIcon className="text-gray-400 size-6 stroke-2" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-medium text-gray-700">{placeholder}</p>
              <p className="text-xs text-gray-500">{description}</p>
              <p className="text-xs text-primary-700">
                Click to upload or drag and drop
              </p>
            </div>
          </motion.div>
        )}

        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-100/50 border-2 border-dashed border-blue-400 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <ArrowUpTrayIcon className="text-blue-500 mx-auto mb-2 size-6 stroke-2" />
              <p className="text-blue-600 font-medium">Drop image here</p>
            </div>
          </div>
        )}
      </div>

      {/* File size limit info */}
      <p className="text-xs text-gray-400 mt-2">
        Maximum file size: {maxSize}MB
      </p>
    </div>
  );
};

export default ImageInput;
