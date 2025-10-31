/**
 * =====================================================
 * BrowoKo Storage Helper
 * =====================================================
 * 
 * Utilities for file uploads to Supabase Storage
 * - Image uploads (JPG, PNG, HEIC)
 * - PDF uploads
 * - HEIC to JPG conversion
 * - File validation
 * - Signed URLs
 */

import { supabase } from './supabase/client';
import imageCompression from 'browser-image-compression';

const ANNOUNCEMENTS_BUCKET = 'make-f659121d-announcements';

export interface UploadOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  convertHeic?: boolean;
}

export interface UploadResult {
  url: string;
  path: string;
  publicUrl?: string;
}

/**
 * Ensure announcements bucket exists
 * NOTE: Bucket is created by backend server on startup
 * This function just checks if it exists
 */
export async function ensureAnnouncementsBucket(): Promise<void> {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((bucket) => bucket.name === ANNOUNCEMENTS_BUCKET);

    if (!bucketExists) {
      console.warn('[Storage] ⚠️ Announcements bucket not found. Backend server will create it on startup.');
      // Don't try to create bucket from frontend - RLS will block it
      // The server will create the bucket on startup
    } else {
      console.log('[Storage] ✅ Announcements bucket exists');
    }
  } catch (error) {
    console.error('[Storage] ⚠️ Error checking bucket:', error);
    // Don't throw - backend will handle bucket creation
  }
}

/**
 * Convert HEIC to JPG
 */
async function convertHeicToJpg(file: File): Promise<File> {
  try {
    console.log('[Storage] Converting HEIC to JPG...');
    
    // Use browser-image-compression to convert
    const options = {
      maxSizeMB: 2,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
      fileType: 'image/jpeg',
    };

    const convertedFile = await imageCompression(file, options);
    
    // Rename to .jpg
    const newFile = new File(
      [convertedFile],
      file.name.replace(/\.heic$/i, '.jpg'),
      { type: 'image/jpeg' }
    );

    console.log('[Storage] ✅ Converted HEIC to JPG:', newFile.name);
    return newFile;
  } catch (error) {
    console.error('[Storage] ❌ HEIC conversion failed:', error);
    throw new Error('HEIC Konvertierung fehlgeschlagen. Bitte verwende JPG oder PNG.');
  }
}

/**
 * Compress image if needed
 */
async function compressImage(file: File, maxSizeMB: number = 2): Promise<File> {
  try {
    // Check if compression is needed
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB <= maxSizeMB) {
      return file;
    }

    console.log('[Storage] Compressing image...');
    
    const options = {
      maxSizeMB,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
    };

    const compressedFile = await imageCompression(file, options);
    console.log('[Storage] ✅ Image compressed:', {
      original: `${fileSizeMB.toFixed(2)} MB`,
      compressed: `${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`,
    });

    return compressedFile;
  } catch (error) {
    console.error('[Storage] ⚠️ Compression failed, using original:', error);
    return file;
  }
}

/**
 * Validate file
 */
function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number
): void {
  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  const isAllowed = allowedTypes.some(
    (type) => type.toLowerCase() === fileExtension || file.type.includes(type)
  );

  if (!isAllowed) {
    throw new Error(
      `Dateityp nicht erlaubt. Erlaubt: ${allowedTypes.join(', ')}`
    );
  }

  // Check file size
  const fileSizeMB = file.size / 1024 / 1024;
  if (fileSizeMB > maxSizeMB) {
    throw new Error(
      `Datei zu groß (${fileSizeMB.toFixed(2)} MB). Maximum: ${maxSizeMB} MB`
    );
  }
}

/**
 * Upload image to announcements bucket
 */
export async function uploadAnnouncementImage(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    maxSizeMB = 10,
    maxWidthOrHeight = 2048,
    convertHeic = true,
  } = options;

  try {
    console.log('[Storage] 📤 Uploading image:', file.name);

    // Bucket is created by backend server on startup
    // No need to check here

    // Validate file type
    const allowedTypes = ['jpg', 'jpeg', 'png', 'heic', 'image/jpeg', 'image/png', 'image/heic'];
    validateFile(file, allowedTypes, maxSizeMB);

    // Convert HEIC if needed
    let uploadFile = file;
    if (convertHeic && file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
      uploadFile = await convertHeicToJpg(file);
    }

    // Compress image if needed
    if (uploadFile.type.startsWith('image/')) {
      uploadFile = await compressImage(uploadFile, maxSizeMB);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = uploadFile.name.split('.').pop();
    const filename = `images/${timestamp}-${randomId}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(ANNOUNCEMENTS_BUCKET)
      .upload(filename, uploadFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[Storage] ❌ Upload error:', error);
      throw error;
    }

    console.log('[Storage] ✅ Upload successful:', data.path);

    // Get signed URL (valid for 1 year)
    const { data: signedUrlData } = await supabase.storage
      .from(ANNOUNCEMENTS_BUCKET)
      .createSignedUrl(data.path, 31536000); // 1 year

    return {
      url: signedUrlData?.signedUrl || '',
      path: data.path,
    };
  } catch (error) {
    console.error('[Storage] ❌ Upload failed:', error);
    throw error;
  }
}

/**
 * Upload PDF to announcements bucket
 */
export async function uploadAnnouncementPdf(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { maxSizeMB = 20 } = options;

  try {
    console.log('[Storage] 📤 Uploading PDF:', file.name);

    // Bucket is created by backend server on startup
    // No need to check here

    // Validate file type
    validateFile(file, ['pdf', 'application/pdf'], maxSizeMB);

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const filename = `pdfs/${timestamp}-${randomId}.pdf`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(ANNOUNCEMENTS_BUCKET)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[Storage] ❌ Upload error:', error);
      throw error;
    }

    console.log('[Storage] ✅ Upload successful:', data.path);

    // Get signed URL (valid for 1 year)
    const { data: signedUrlData } = await supabase.storage
      .from(ANNOUNCEMENTS_BUCKET)
      .createSignedUrl(data.path, 31536000); // 1 year

    return {
      url: signedUrlData?.signedUrl || '',
      path: data.path,
    };
  } catch (error) {
    console.error('[Storage] ❌ Upload failed:', error);
    throw error;
  }
}

/**
 * Delete file from announcements bucket
 */
export async function deleteAnnouncementFile(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(ANNOUNCEMENTS_BUCKET)
      .remove([path]);

    if (error) {
      console.error('[Storage] ⚠️ Delete error:', error);
      throw error;
    }

    console.log('[Storage] ✅ File deleted:', path);
  } catch (error) {
    console.error('[Storage] ❌ Delete failed:', error);
    throw error;
  }
}

/**
 * Get signed URL for file
 */
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from(ANNOUNCEMENTS_BUCKET)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('[Storage] ❌ Get signed URL failed:', error);
    throw error;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if file is image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || 
         file.name.toLowerCase().endsWith('.heic');
}

/**
 * Check if file is PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || 
         file.name.toLowerCase().endsWith('.pdf');
}
