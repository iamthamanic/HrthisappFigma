import { supabase } from "./core-supabaseClient.ts";

export const LOGO_BUCKET = "make-f659121d-company-logos";
export const PROFILE_BUCKET = "make-f659121d-profile-pictures";
export const ANNOUNCEMENTS_BUCKET = "make-f659121d-announcements";
export const DOCUMENTS_BUCKET = "make-f659121d-documents";

export async function ensureBucketExists(bucketName: string) {
  try {
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error(`❌ Error listing buckets:`, listError);
      return false;
    }

    const bucketExists = buckets?.some(
      (bucket) => bucket.name === bucketName,
    );

    if (!bucketExists) {
      console.log(`📦 Creating storage bucket: ${bucketName}`);
      const { error } = await supabase.storage.createBucket(
        bucketName,
        {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        },
      );
      if (error) {
        console.error(
          `❌ Error creating bucket ${bucketName}:`,
          error,
        );
        return false;
      } else {
        console.log(
          `✅ Storage bucket ${bucketName} created successfully`,
        );
        return true;
      }
    } else {
      console.log(
        `✅ Storage bucket ${bucketName} already exists`,
      );
      return true;
    }
  } catch (error) {
    console.error(
      `❌ Error ensuring bucket ${bucketName} exists:`,
      error,
    );
    return false;
  }
}

export async function initializeAllBuckets() {
  console.log("🔄 Initializing storage buckets...");
  const logoBucketReady = await ensureBucketExists(LOGO_BUCKET);
  const profileBucketReady =
    await ensureBucketExists(PROFILE_BUCKET);

  // Announcements bucket with larger file size limit for PDFs
  const { data: buckets } =
    await supabase.storage.listBuckets();
  const announcementsBucketExists = buckets?.some(
    (b) => b.name === ANNOUNCEMENTS_BUCKET,
  );

  let announcementsBucketReady = false;
  if (!announcementsBucketExists) {
    console.log(
      `📦 Creating storage bucket: ${ANNOUNCEMENTS_BUCKET}`,
    );
    const { error } = await supabase.storage.createBucket(
      ANNOUNCEMENTS_BUCKET,
      {
        public: false, // Private bucket - use signed URLs
        fileSizeLimit: 20971520, // 20MB for PDFs
      },
    );
    if (error) {
      console.error(
        `❌ Error creating bucket ${ANNOUNCEMENTS_BUCKET}:`,
        error,
      );
    } else {
      console.log(
        `✅ Storage bucket ${ANNOUNCEMENTS_BUCKET} created successfully`,
      );
      announcementsBucketReady = true;
    }
  } else {
    console.log(
      `✅ Storage bucket ${ANNOUNCEMENTS_BUCKET} already exists`,
    );
    announcementsBucketReady = true;
  }

  if (
    logoBucketReady &&
    profileBucketReady &&
    announcementsBucketReady
  ) {
    console.log(
      "✅ All storage buckets initialized successfully",
    );
    return true;
  } else {
    console.error("⚠️ Some buckets failed to initialize");
    return false;
  }
}
