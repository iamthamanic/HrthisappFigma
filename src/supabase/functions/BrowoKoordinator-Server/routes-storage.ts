// File: supabase/functions/BrowoKoordinator-Server/routes-storage.ts
import type { Hono } from "npm:hono";
import { supabase } from "./core-supabaseClient.ts";
import { PermissionKey } from "./permissions.ts";
import { ForbiddenError } from "./errors.ts";
import {
  LOGO_BUCKET,
  PROFILE_BUCKET,
  ANNOUNCEMENTS_BUCKET,
  DOCUMENTS_BUCKET,
  ensureBucketExists,
} from "./core-buckets.ts";

export function registerStorageRoutes(app: Hono) {
  // Bucket status endpoint (public for monitoring)
  app.get("/storage/status", async (c) => {
    const auth = c.get("auth"); // Verify auth but allow all users

    const { data: buckets, error } =
      await supabase.storage.listBuckets();

    if (error) {
      return c.json(
        {
          status: "error",
          error: error.message,
          buckets: {
            logo: LOGO_BUCKET,
            profile: PROFILE_BUCKET,
          },
        },
        500,
      );
    }

    const logoBucketExists = buckets?.some(
      (bucket) => bucket.name === LOGO_BUCKET,
    );
    const profileBucketExists = buckets?.some(
      (bucket) => bucket.name === PROFILE_BUCKET,
    );
    const logoBucket = buckets?.find(
      (bucket) => bucket.name === LOGO_BUCKET,
    );
    const profileBucket = buckets?.find(
      (bucket) => bucket.name === PROFILE_BUCKET,
    );

    return c.json({
      status:
        logoBucketExists && profileBucketExists
          ? "ready"
          : "partial",
      buckets: {
        logo: {
          name: LOGO_BUCKET,
          exists: logoBucketExists,
          details: logoBucket || null,
        },
        profile: {
          name: PROFILE_BUCKET,
          exists: profileBucketExists,
          details: profileBucket || null,
        },
      },
      allBuckets: buckets?.map((b) => b.name) || [],
    });
  });

  // Logo Upload endpoint (Admin only)
  app.post("/logo/upload", async (c) => {
    const auth = c.get("auth");

    console.log("📤 Incoming logo upload request");

    // Check permission to edit company settings
    if (!auth.hasPermission(PermissionKey.EDIT_COMPANY_SETTINGS)) {
      throw new ForbiddenError("Missing permission to upload company logo");
    }

    const bucketReady = await ensureBucketExists(LOGO_BUCKET);
    if (!bucketReady) {
      console.error("❌ Bucket is not ready");
      throw new Error("Storage bucket is not available. Please try again.");
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const organizationId = formData.get(
      "organizationId",
    ) as string;

    console.log(
      `📋 Upload details - Org: ${organizationId}, File: ${file?.name}, Size: ${file?.size} bytes`,
    );

    if (!file || !organizationId) {
      throw new Error("File and organizationId are required");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File size must be less than 5MB");
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("logo_url")
      .eq("id", organizationId)
      .single();

    if (org?.logo_url) {
      const oldFileName = org.logo_url.split("/").pop();
      if (oldFileName) {
        await supabase.storage
          .from(LOGO_BUCKET)
          .remove([oldFileName]);
        console.log(`🗑️ Deleted old logo: ${oldFileName}`);
      }
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${organizationId}-${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    console.log(
      `📤 Uploading to bucket: ${LOGO_BUCKET}, fileName: ${fileName}`,
    );

    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("❌ Upload error details:", {
        message: uploadError.message,
        name: uploadError.name,
        bucket: LOGO_BUCKET,
        fileName: fileName,
      });
      throw new Error(`Upload failed: ${uploadError.message}. Bucket: ${LOGO_BUCKET}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(LOGO_BUCKET)
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("organizations")
      .update({ logo_url: publicUrl })
      .eq("id", organizationId);

    if (updateError) {
      console.error("❌ Update error:", updateError);
      throw updateError;
    }

    console.log(`✅ Logo uploaded successfully: ${fileName}`);
    return c.json({ publicUrl });
  });

  // Logo Delete endpoint (Admin only)
  app.delete("/logo/:organizationId", async (c) => {
    const auth = c.get("auth");

    // Check permission to edit company settings
    if (!auth.hasPermission(PermissionKey.EDIT_COMPANY_SETTINGS)) {
      throw new ForbiddenError("Missing permission to delete company logo");
    }

    await ensureBucketExists(LOGO_BUCKET);

    const organizationId = c.req.param("organizationId");

    const { data: org, error: fetchError } = await supabase
      .from("organizations")
      .select("logo_url")
      .eq("id", organizationId)
      .single();

    if (fetchError) throw fetchError;

    if (!org?.logo_url) {
      throw new Error("No logo found");
    }

    const fileName = org.logo_url.split("/").pop();
    if (fileName) {
      const { error: deleteError } = await supabase.storage
        .from(LOGO_BUCKET)
        .remove([fileName]);

      if (deleteError) {
        console.error("❌ Storage delete error:", deleteError);
      } else {
        console.log(`🗑️ Deleted logo: ${fileName}`);
      }
    }

    const { error: updateError } = await supabase
      .from("organizations")
      .update({ logo_url: null })
      .eq("id", organizationId);

    if (updateError) throw updateError;

    console.log(
      `✅ Logo deleted successfully for org: ${organizationId}`,
    );
    return c.json({ success: true });
  });

  // Profile Picture Upload endpoint
  app.post("/profile-picture/upload", async (c) => {
    const auth = c.get("auth");

    console.log("📤 Incoming profile picture upload request");

    // Check permission to upload profile picture
    if (!auth.hasPermission(PermissionKey.UPLOAD_PROFILE_PICTURE)) {
      throw new ForbiddenError("Missing permission to upload profile picture");
    }

    const bucketReady =
      await ensureBucketExists(PROFILE_BUCKET);
    if (!bucketReady) {
      console.error("❌ Profile bucket is not ready");
      throw new Error("Storage bucket is not available. Please try again.");
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    console.log(
      `📋 Upload details - User: ${userId}, File: ${file?.name}, Size: ${file?.size} bytes`,
    );

    if (!file || !userId) {
      throw new Error("File and userId are required");
    }

    // User can only upload their own profile picture (unless admin)
    if (userId !== auth.user.id && !auth.isAdmin) {
      throw new ForbiddenError("Cannot upload profile picture for other users");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File size must be less than 5MB");
    }

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("profile_picture")
      .eq("id", userId)
      .single();

    if (fetchError && fetchError.code === "PGRST204") {
      console.error(
        "❌ DATABASE MIGRATION REQUIRED: profile_picture column missing",
      );
      throw new Error("DATABASE_MIGRATION_REQUIRED: profile_picture column missing. Please run migration 021_ensure_profile_picture_column.sql");
    }

    if (fetchError) {
      console.error("❌ Error fetching user:", fetchError);
      throw fetchError;
    }

    if (user?.profile_picture) {
      const oldFileName = user.profile_picture.split("/").pop();
      if (oldFileName) {
        await supabase.storage
          .from(PROFILE_BUCKET)
          .remove([oldFileName]);
        console.log(
          `🗑️ Deleted old profile picture: ${oldFileName}`,
        );
      }
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    console.log(
      `📤 Uploading to bucket: ${PROFILE_BUCKET}, fileName: ${fileName}`,
    );

    const { error: uploadError } = await supabase.storage
      .from(PROFILE_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("❌ Upload error details:", {
        message: uploadError.message,
        name: uploadError.name,
        bucket: PROFILE_BUCKET,
        fileName: fileName,
      });
      throw new Error(`Upload failed: ${uploadError.message}. Bucket: ${PROFILE_BUCKET}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(PROFILE_BUCKET)
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("users")
      .update({ profile_picture: publicUrl })
      .eq("id", userId);

    if (updateError) {
      console.error("❌ Update error:", updateError);

      if (updateError.code === "PGRST204") {
        console.error(
          "❌ DATABASE MIGRATION REQUIRED: profile_picture column missing",
        );
        throw new Error("DATABASE_MIGRATION_REQUIRED: profile_picture column missing. Please run migration 021_ensure_profile_picture_column.sql");
      }

      throw updateError;
    }

    console.log(
      `✅ Profile picture uploaded successfully: ${fileName}`,
    );
    return c.json({ publicUrl });
  });

  // Profile Picture Delete endpoint
  app.delete("/profile-picture/:userId", async (c) => {
    const auth = c.get("auth");
    const targetUserId = c.req.param("userId");

    // User can only delete their own profile picture (unless admin)
    if (targetUserId !== auth.user.id && !auth.isAdmin) {
      throw new ForbiddenError("Cannot delete profile picture for other users");
    }

    await ensureBucketExists(PROFILE_BUCKET);

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("profile_picture")
      .eq("id", targetUserId)
      .single();

    if (fetchError) throw fetchError;

    if (!user?.profile_picture) {
      throw new Error("No profile picture found");
    }

    const fileName = user.profile_picture.split("/").pop();
    if (fileName) {
      const { error: deleteError } = await supabase.storage
        .from(PROFILE_BUCKET)
        .remove([fileName]);

      if (deleteError) {
        console.error("❌ Storage delete error:", deleteError);
      } else {
        console.log(`🗑️ Deleted profile picture: ${fileName}`);
      }
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ profile_picture: null })
      .eq("id", targetUserId);

    if (updateError) throw updateError;

    console.log(
      `✅ Profile picture deleted successfully for user: ${targetUserId}`,
    );
    return c.json({ success: true });
  });

  // Upload document
  app.post("/documents/upload", async (c) => {
    const auth = c.get("auth");

    // Check permission to upload documents
    if (!auth.hasPermission(PermissionKey.UPLOAD_DOCUMENTS)) {
      throw new ForbiddenError("Missing permission to upload documents");
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string;
    const userId = formData.get("userId") as string | null;

    if (!file) {
      throw new Error("No file provided");
    }

    if (!path) {
      throw new Error("No path provided");
    }

    console.log(`📤 Uploading document: ${path}`);

    await ensureBucketExists(DOCUMENTS_BUCKET);

    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("❌ Upload error:", error);
      throw new Error(error.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(path);

    console.log(`✅ Document uploaded: ${publicUrl}`);

    return c.json({
      success: true,
      path: data.path,
      publicUrl,
    });
  });

  // Delete documents
  app.delete("/documents", async (c) => {
    const auth = c.get("auth");

    // Only admins can delete documents (or extend with ownership check)
    if (!auth.isAdmin) {
      throw new ForbiddenError("Admin access required to delete documents");
    }

    const { bucket, paths } = await c.req.json();

    if (!bucket || !paths || !Array.isArray(paths)) {
      throw new Error("Invalid request: bucket and paths[] required");
    }

    console.log(
      `🗑️ Deleting ${paths.length} files from ${bucket}`,
    );

    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      console.error("❌ Delete error:", error);
      throw new Error(error.message);
    }

    console.log(`✅ Deleted ${paths.length} files`);

    return c.json({
      success: true,
      deletedCount: paths.length,
    });
  });

  // Get signed URL
  app.get("/storage/sign", async (c) => {
    const auth = c.get("auth"); // Verify auth but allow all users

    const bucket = c.req.query("bucket");
    const path = c.req.query("path");
    const expiresIn = Number(c.req.query("expiresIn")) || 3600;

    if (!bucket || !path) {
      throw new Error("bucket and path query params required");
    }

    console.log(`🔑 Creating signed URL for ${bucket}/${path}`);

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error("❌ Signed URL error:", error);
      throw new Error(error.message);
    }

    console.log(`✅ Signed URL created`);

    return c.json({
      success: true,
      signedUrl: data.signedUrl,
      expiresAt: new Date(
        Date.now() + expiresIn * 1000,
      ).toISOString(),
    });
  });
}