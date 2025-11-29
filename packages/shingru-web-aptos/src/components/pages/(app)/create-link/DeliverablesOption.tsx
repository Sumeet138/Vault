import React, { useCallback, useState, useRef } from "react";
import { Upload, X, Link, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cnm } from "@/utils/style";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface DeliverableFile {
  id: string;
  file?: File; // Optional for existing files
  name: string;
  size: number;
  isExisting?: boolean; // Flag to identify existing files from server
  url?: string; // URL for existing files
}

interface DeliverablesOptionProps {
  files: DeliverableFile[];
  onFilesChange: (files: DeliverableFile[]) => void;
  deliveryUrl: string;
  onDeliveryUrlChange: (url: string) => void;
  thankYouMessage: string;
  onThankYouMessageChange: (message: string) => void;
}

export default function DeliverablesOption({
  files,
  onFilesChange,
  deliveryUrl,
  onDeliveryUrlChange,
  thankYouMessage,
  onThankYouMessageChange,
}: DeliverablesOptionProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    (uploadedFiles: FileList | null) => {
      if (!uploadedFiles) return;

      const newFiles: DeliverableFile[] = Array.from(uploadedFiles).map(
        (file) => ({
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
        })
      );

      onFilesChange([...files, ...newFiles]);
    },
    [files, onFilesChange]
  );

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      onFilesChange(files.filter((f) => f.id !== fileId));
    },
    [files, onFilesChange]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  return (
    <div className="space-y-8">
      <input
        type="file"
        multiple
        accept=".pdf,.zip,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt,.psd,.ai,.sketch"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
        ref={fileInputRef}
      />

      {/* File Upload Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Digital Deliverables</h2>
        <p className="text-sm text-gray-500">
          Upload files directly or provide a download link. This will be sent to
          your customers after purchase.
        </p>

        {/* Compact File Upload Area */}
        <div
          className={cnm(
            "relative bg-gray-50 rounded-2xl p-4 transition-all duration-200 cursor-pointer hover:bg-gray-50/80",
            isDragOver ? "border-2 border-blue-400 bg-blue-50" : ""
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center flex-shrink-0">
              <Upload className="text-gray-400" size={20} />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-medium text-gray-700">Upload Files</p>
              <p className="text-xs text-gray-500">
                PDF, ZIP, images, docs (max 10MB each)
              </p>
              <p className="text-xs text-blue-600">
                Click to upload or drag and drop
              </p>
            </div>
          </div>
          {isDragOver && (
            <div className="absolute inset-0 bg-blue-100/50 border-2 border-dashed border-blue-400 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <Upload className="text-blue-500 mx-auto mb-2" size={32} />
                <p className="text-blue-600 font-medium">Drop files here</p>
              </div>
            </div>
          )}
        </div>

        {/* Compact Uploaded Files List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-gray-600">
                  Files ({files.length})
                </h4>
                <button
                  onClick={() => onFilesChange([])}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear all
                </button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md group hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {file.name}
                          {file.isExisting && (
                            <span className="ml-2 text-xs text-green-600">
                              (Existing)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {file.isExisting && file.url && (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-gray-200 rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg
                            className="w-3 h-3 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(file.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* URL Delivery Section */}
      <div className="space-y-2">
        <h2 className="text-md font-bold">Or Provide Download Link</h2>
        <div className="p-1 bg-gray-50 rounded-2xl">
          <Input
            placeholder="https://drive.google.com/..."
            value={deliveryUrl}
            onChange={(e) => onDeliveryUrlChange(e.target.value)}
            className="bg-white rounded-xl border-0 shadow-none pl-2"
          />
        </div>
      </div>

      {/* Thank You Message Section */}
      <div className="space-y-2">
        <h2 className="text-md font-bold">Thank You Message</h2>
        <p className="text-sm text-gray-500">
          This message will be included in the delivery email sent to customers.
        </p>
        <div className="p-1 bg-gray-50 rounded-2xl">
          <Textarea
            placeholder="Thank you for your purchase! Your files are attached to this email. If you have any questions, feel free to reach out..."
            value={thankYouMessage}
            onChange={(e) => onThankYouMessageChange(e.target.value)}
            className="bg-white rounded-xl border-0"
          />
        </div>
      </div>
    </div>
  );
}
