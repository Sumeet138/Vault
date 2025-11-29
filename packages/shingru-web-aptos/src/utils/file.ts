/**
 * File utilities for handling file operations and URL generation
 */

/**
 * Get the backend URL from environment variables
 */
export function getBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  if (!backendUrl) {
    console.warn("NEXT_PUBLIC_BACKEND_URL is not defined");
  }

  return backendUrl;
}

/**
 * Generate a file URL for displaying files from the backend
 * @param fileId - The ID of the file
 * @returns The complete URL to access the file
 */
export function getFileUrl(fileId: string): string {
  const backendUrl = getBackendUrl();
  return `${backendUrl}/files/file/${fileId}`;
}

/**
 * Check if a file is an image based on its content type
 * @param contentType - The MIME type of the file
 * @returns True if the file is an image
 */
export function isImageFile(contentType: string): boolean {
  return contentType.startsWith("image/");
}

/**
 * Format file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get file extension from filename
 * @param filename - The filename
 * @returns The file extension (without dot)
 */
export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}
