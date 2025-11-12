/**
 * @file BrowoKo_profilePictureHelper.ts
 * @version 1.0.0
 * @description Helper utilities for processing profile picture URLs
 */

import { supabase } from './supabase/client';

const PROFILE_PICTURES_BUCKET = 'make-f659121d-profile-pictures';

/**
 * Process profile picture URL to ensure it's a valid, accessible URL
 * 
 * Handles three types of URLs:
 * 1. Full URLs (http:// or https://) - returned as-is
 * 2. Base64 strings (data:) - returned as-is
 * 3. Storage paths - converted to public URLs via Supabase Storage
 * 
 * @param profilePictureUrl - The raw profile picture URL/path from database
 * @returns Processed URL ready for use in <img> src attribute, or undefined
 */
export function getProfilePictureUrl(profilePictureUrl?: string | null): string | undefined {
  if (!profilePictureUrl) return undefined;

  // If it's already a full URL (starts with http:// or https://), use it as-is
  if (profilePictureUrl.startsWith('http://') || profilePictureUrl.startsWith('https://')) {
    return profilePictureUrl;
  }

  // If it's a Base64 string (starts with data:), use it as-is
  if (profilePictureUrl.startsWith('data:')) {
    return profilePictureUrl;
  }

  // Otherwise, it's a storage path - convert to public URL
  try {
    const { data } = supabase.storage
      .from(PROFILE_PICTURES_BUCKET)
      .getPublicUrl(profilePictureUrl);
    
    console.log('[ProfilePicture] Converted storage path to public URL:', {
      path: profilePictureUrl,
      publicUrl: data.publicUrl
    });
    
    return data.publicUrl;
  } catch (error) {
    console.warn('[ProfilePicture] Failed to get public URL:', error);
    return undefined;
  }
}

/**
 * Get user initials for fallback avatar
 * 
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Initials (e.g., "JD" for John Doe)
 */
export function getUserInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.[0] || '';
  const last = lastName?.[0] || '';
  return (first + last).toUpperCase() || 'U';
}
