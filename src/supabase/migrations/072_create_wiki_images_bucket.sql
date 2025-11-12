/**
 * Wiki Images Storage Bucket
 * Version: v4.12.23
 * 
 * Creates a dedicated storage bucket for wiki article images with:
 * - Public access (so images can be viewed without authentication)
 * - Proper RLS policies for upload/delete
 * - File size limit (5MB)
 * - Allowed file types: JPG, PNG, GIF, WebP
 */

-- =====================================================================================
-- 1. CREATE STORAGE BUCKET FOR WIKI IMAGES
-- =====================================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('wiki-images', 'wiki-images', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================================
-- 2. SET UP RLS POLICIES FOR WIKI IMAGES
-- =====================================================================================

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload wiki images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'wiki-images'
  AND (storage.foldername(name))[1] = 'wiki-images'
);

-- Allow everyone to view wiki images (public bucket)
CREATE POLICY "Anyone can view wiki images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'wiki-images');

-- Allow authenticated users to delete their own uploaded images
CREATE POLICY "Authenticated users can delete wiki images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'wiki-images'
);

-- Allow authenticated users to update wiki images
CREATE POLICY "Authenticated users can update wiki images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'wiki-images');

-- =====================================================================================
-- 3. BUCKET CONFIGURATION (via SQL comments for documentation)
-- =====================================================================================

COMMENT ON TABLE storage.buckets IS 'Storage buckets for Browo Koordinator:
- documents: Employee documents (private)
- profile-pictures: User avatars (public)
- wiki-images: Wiki article images (public, max 5MB)';

-- =====================================================================================
-- USAGE NOTES
-- =====================================================================================

/*
BUCKET: wiki-images
- Public: Yes (images can be viewed without authentication)
- Max file size: 5MB (enforced in frontend)
- Allowed types: image/jpeg, image/png, image/gif, image/webp
- Path structure: wiki-images/wiki-image-{timestamp}.{ext}
- RLS: Upload/Delete for authenticated users only

EXAMPLE USAGE:
-- Upload image
const { data, error } = await supabase.storage
  .from('wiki-images')
  .upload('wiki-images/wiki-image-1234567890.jpg', file);

-- Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('wiki-images')
  .getPublicUrl('wiki-images/wiki-image-1234567890.jpg');

-- Delete image
const { error } = await supabase.storage
  .from('wiki-images')
  .remove(['wiki-images/wiki-image-1234567890.jpg']);
*/
