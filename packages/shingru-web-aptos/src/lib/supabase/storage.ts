/**
 * Supabase Storage utilities for file uploads
 * Handles uploading files to Supabase Storage buckets
 */

import { supabase } from './client';

export interface UploadedFile {
  id: string;
  url: string;
  name: string;
  size: number;
  contentType: string;
}

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name (default: 'deliverables')
 * @param folder - Optional folder path within the bucket
 * @returns Uploaded file metadata with public URL
 */
export async function uploadFile(
  file: File,
  bucket: string = 'deliverables',
  folder?: string
): Promise<UploadedFile> {
  try {
    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomStr}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    console.log(`📤 Uploading file to ${bucket}/${filePath}...`);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    console.log(`✅ File uploaded successfully: ${urlData.publicUrl}`);

    return {
      id: data.path,
      url: urlData.publicUrl,
      name: file.name,
      size: file.size,
      contentType: file.type || 'application/octet-stream',
    };
  } catch (error) {
    console.error('Error in uploadFile:', error);
    throw error;
  }
}

/**
 * Upload multiple files to Supabase Storage
 * @param files - Array of files to upload
 * @param bucket - The storage bucket name (default: 'deliverables')
 * @param folder - Optional folder path within the bucket (can include userId)
 * @returns Array of uploaded file metadata
 */
export async function uploadFiles(
  files: File[],
  bucket: string = 'deliverables',
  folder?: string
): Promise<UploadedFile[]> {
  try {
    console.log(`📤 Uploading ${files.length} files to ${bucket}...`);

    // Upload all files in parallel
    const uploadPromises = files.map((file) => uploadFile(file, bucket, folder));
    const uploadedFiles = await Promise.all(uploadPromises);

    console.log(`✅ Successfully uploaded ${uploadedFiles.length} files`);
    return uploadedFiles;
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
}

/**
 * Delete a file from Supabase Storage
 * @param filePath - The path of the file to delete
 * @param bucket - The storage bucket name (default: 'deliverables')
 */
export async function deleteFile(
  filePath: string,
  bucket: string = 'deliverables'
): Promise<void> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error('❌ Error deleting file:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }

    console.log(`✅ File deleted successfully: ${filePath}`);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Check if a storage bucket exists, create if it doesn't
 * Note: This requires admin privileges, so it's best to create buckets manually in Supabase dashboard
 * This function is mainly for checking bucket existence
 */
export async function ensureBucketExists(
  bucket: string = 'deliverables'
): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.from(bucket).list('', {
      limit: 1,
    });

    if (error) {
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        console.warn(`⚠️ Bucket '${bucket}' does not exist. Please create it in Supabase dashboard.`);
        return false;
      }
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error checking bucket existence:', error);
    return false;
  }
}

