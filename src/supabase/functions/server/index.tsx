import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";
import { testSubmissionsApp } from "./testSubmissions.ts";
// TODO: Re-enable when timeAccountCalculation.ts is implemented
// import { calculateTimeAccount, calculateTimeAccountsForAllUsers } from "./timeAccountCalculation.ts";

const app = new Hono();

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Storage bucket names
const LOGO_BUCKET = 'make-f659121d-company-logos';
const PROFILE_BUCKET = 'make-f659121d-profile-pictures';
const ANNOUNCEMENTS_BUCKET = 'make-f659121d-announcements';

// Ensure storage buckets exist on server startup
async function ensureBucketExists(bucketName: string) {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`❌ Error listing buckets:`, listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`📦 Creating storage bucket: ${bucketName}`);
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      if (error) {
        console.error(`❌ Error creating bucket ${bucketName}:`, error);
        return false;
      } else {
        console.log(`✅ Storage bucket ${bucketName} created successfully`);
        return true;
      }
    } else {
      console.log(`✅ Storage bucket ${bucketName} already exists`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error ensuring bucket ${bucketName} exists:`, error);
    return false;
  }
}

// Initialize all buckets
async function initializeAllBuckets() {
  console.log('🔄 Initializing storage buckets...');
  const logoBucketReady = await ensureBucketExists(LOGO_BUCKET);
  const profileBucketReady = await ensureBucketExists(PROFILE_BUCKET);
  
  // Announcements bucket with larger file size limit for PDFs
  const { data: buckets } = await supabase.storage.listBuckets();
  const announcementsBucketExists = buckets?.some(b => b.name === ANNOUNCEMENTS_BUCKET);
  
  let announcementsBucketReady = false;
  if (!announcementsBucketExists) {
    console.log(`📦 Creating storage bucket: ${ANNOUNCEMENTS_BUCKET}`);
    const { error } = await supabase.storage.createBucket(ANNOUNCEMENTS_BUCKET, {
      public: false, // Private bucket - use signed URLs
      fileSizeLimit: 20971520, // 20MB for PDFs
    });
    if (error) {
      console.error(`❌ Error creating bucket ${ANNOUNCEMENTS_BUCKET}:`, error);
    } else {
      console.log(`✅ Storage bucket ${ANNOUNCEMENTS_BUCKET} created successfully`);
      announcementsBucketReady = true;
    }
  } else {
    console.log(`✅ Storage bucket ${ANNOUNCEMENTS_BUCKET} already exists`);
    announcementsBucketReady = true;
  }
  
  if (logoBucketReady && profileBucketReady && announcementsBucketReady) {
    console.log('✅ All storage buckets initialized successfully');
    return true;
  } else {
    console.error('⚠️ Some buckets failed to initialize');
    return false;
  }
}

// Enable logger
app.use('*', logger(console.log));

// ✅ PHASE 4 - Priority 1: OPEN CORS Configuration (for Figma Make compatibility)
// IMPORTANT: Figma Make uses non-standard origins, so we allow ALL origins
app.use(
  "/*",
  cors({
    origin: '*', // Allow ALL origins (needed for Figma Make)
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "X-Client-Info", "apikey"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400, // 24 hours
  }),
);

// Health check endpoint
app.get("/make-server-f659121d/health", (c) => {
  return c.json({ status: "ok" });
});

// Bucket status endpoint
app.get("/make-server-f659121d/storage/status", async (c) => {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      return c.json({ 
        status: "error", 
        error: error.message,
        buckets: {
          logo: LOGO_BUCKET,
          profile: PROFILE_BUCKET
        }
      }, 500);
    }
    
    const logoBucketExists = buckets?.some(bucket => bucket.name === LOGO_BUCKET);
    const profileBucketExists = buckets?.some(bucket => bucket.name === PROFILE_BUCKET);
    const logoBucket = buckets?.find(bucket => bucket.name === LOGO_BUCKET);
    const profileBucket = buckets?.find(bucket => bucket.name === PROFILE_BUCKET);
    
    return c.json({
      status: (logoBucketExists && profileBucketExists) ? "ready" : "partial",
      buckets: {
        logo: {
          name: LOGO_BUCKET,
          exists: logoBucketExists,
          details: logoBucket || null
        },
        profile: {
          name: PROFILE_BUCKET,
          exists: profileBucketExists,
          details: profileBucket || null
        }
      },
      allBuckets: buckets?.map(b => b.name) || []
    });
  } catch (error: any) {
    return c.json({ 
      status: "error", 
      error: error.message,
      buckets: {
        logo: LOGO_BUCKET,
        profile: PROFILE_BUCKET
      }
    }, 500);
  }
});

// Logo Upload endpoint
app.post("/make-server-f659121d/logo/upload", async (c) => {
  try {
    console.log('📤 Incoming logo upload request');
    
    // Ensure bucket exists before upload
    const bucketReady = await ensureBucketExists(LOGO_BUCKET);
    if (!bucketReady) {
      console.error('❌ Bucket is not ready');
      return c.json({ error: 'Storage bucket is not available. Please try again.' }, 503);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organizationId') as string;

    console.log(`📋 Upload details - Org: ${organizationId}, File: ${file?.name}, Size: ${file?.size} bytes`);

    if (!file || !organizationId) {
      return c.json({ error: 'File and organizationId are required' }, 400);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'Only image files are allowed' }, 400);
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'File size must be less than 5MB' }, 400);
    }

    // Get current organization to check for existing logo
    const { data: org } = await supabase
      .from('organizations')
      .select('logo_url')
      .eq('id', organizationId)
      .single();

    // Delete old logo if exists
    if (org?.logo_url) {
      const oldFileName = org.logo_url.split('/').pop();
      if (oldFileName) {
        await supabase.storage.from(LOGO_BUCKET).remove([oldFileName]);
        console.log(`🗑️ Deleted old logo: ${oldFileName}`);
      }
    }

    // Upload new logo
    const fileExt = file.name.split('.').pop();
    const fileName = `${organizationId}-${Date.now()}.${fileExt}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    console.log(`📤 Uploading to bucket: ${LOGO_BUCKET}, fileName: ${fileName}`);
    
    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Upload error details:', {
        message: uploadError.message,
        name: uploadError.name,
        bucket: LOGO_BUCKET,
        fileName: fileName
      });
      return c.json({ 
        error: `Upload failed: ${uploadError.message}. Bucket: ${LOGO_BUCKET}` 
      }, 500);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(LOGO_BUCKET)
      .getPublicUrl(fileName);

    // Update organization with new logo URL
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ logo_url: publicUrl })
      .eq('id', organizationId);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      throw updateError;
    }

    console.log(`✅ Logo uploaded successfully: ${fileName}`);
    return c.json({ publicUrl });

  } catch (error: any) {
    console.error('❌ Logo upload error:', error);
    return c.json({ error: error.message || 'Failed to upload logo' }, 500);
  }
});

// Logo Delete endpoint
app.delete("/make-server-f659121d/logo/:organizationId", async (c) => {
  try {
    // Ensure bucket exists before delete
    await ensureBucketExists(LOGO_BUCKET);
    
    const organizationId = c.req.param('organizationId');

    // Get organization to find logo URL
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('logo_url')
      .eq('id', organizationId)
      .single();

    if (fetchError) throw fetchError;

    if (!org?.logo_url) {
      return c.json({ error: 'No logo found' }, 404);
    }

    // Delete from storage
    const fileName = org.logo_url.split('/').pop();
    if (fileName) {
      const { error: deleteError } = await supabase.storage
        .from(LOGO_BUCKET)
        .remove([fileName]);

      if (deleteError) {
        console.error('❌ Storage delete error:', deleteError);
      } else {
        console.log(`🗑️ Deleted logo: ${fileName}`);
      }
    }

    // Update organization
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ logo_url: null })
      .eq('id', organizationId);

    if (updateError) throw updateError;

    console.log(`✅ Logo deleted successfully for org: ${organizationId}`);
    return c.json({ success: true });

  } catch (error: any) {
    console.error('❌ Logo delete error:', error);
    return c.json({ error: error.message || 'Failed to delete logo' }, 500);
  }
});

// Profile Picture Upload endpoint
app.post("/make-server-f659121d/profile-picture/upload", async (c) => {
  try {
    console.log('📤 Incoming profile picture upload request');
    
    // Ensure bucket exists before upload
    const bucketReady = await ensureBucketExists(PROFILE_BUCKET);
    if (!bucketReady) {
      console.error('❌ Profile bucket is not ready');
      return c.json({ error: 'Storage bucket is not available. Please try again.' }, 503);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    console.log(`📋 Upload details - User: ${userId}, File: ${file?.name}, Size: ${file?.size} bytes`);

    if (!file || !userId) {
      return c.json({ error: 'File and userId are required' }, 400);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'Only image files are allowed' }, 400);
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'File size must be less than 5MB' }, 400);
    }

    // Get current user to check for existing profile picture
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('profile_picture')
      .eq('id', userId)
      .single();

    // Check for missing column error
    if (fetchError && fetchError.code === 'PGRST204') {
      console.error('❌ DATABASE MIGRATION REQUIRED: profile_picture column missing');
      return c.json({ 
        error: 'DATABASE_MIGRATION_REQUIRED',
        message: 'Die Datenbank muss aktualisiert werden. Bitte führe die Migration 021_ensure_profile_picture_column.sql in Supabase aus.',
        instructions: 'Gehe zu Supabase Dashboard → SQL Editor und führe die Migration aus. Details: QUICK_FIX_GUIDE.md',
        migrationNeeded: true
      }, 500);
    }
    
    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError);
      throw fetchError;
    }

    // Delete old profile picture if exists
    if (user?.profile_picture) {
      const oldFileName = user.profile_picture.split('/').pop();
      if (oldFileName) {
        await supabase.storage.from(PROFILE_BUCKET).remove([oldFileName]);
        console.log(`🗑️ Deleted old profile picture: ${oldFileName}`);
      }
    }

    // Upload new profile picture
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    console.log(`📤 Uploading to bucket: ${PROFILE_BUCKET}, fileName: ${fileName}`);
    
    const { error: uploadError } = await supabase.storage
      .from(PROFILE_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Upload error details:', {
        message: uploadError.message,
        name: uploadError.name,
        bucket: PROFILE_BUCKET,
        fileName: fileName
      });
      return c.json({ 
        error: `Upload failed: ${uploadError.message}. Bucket: ${PROFILE_BUCKET}` 
      }, 500);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(PROFILE_BUCKET)
      .getPublicUrl(fileName);

    // Update user with new profile picture URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_picture: publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      
      // Check for missing column error
      if (updateError.code === 'PGRST204') {
        console.error('❌ DATABASE MIGRATION REQUIRED: profile_picture column missing');
        return c.json({ 
          error: 'DATABASE_MIGRATION_REQUIRED',
          message: 'Die Datenbank muss aktualisiert werden. Bitte führe die Migration 021_ensure_profile_picture_column.sql in Supabase aus.',
          instructions: 'Gehe zu Supabase Dashboard → SQL Editor und führe die Migration aus. Details: QUICK_FIX_GUIDE.md',
          migrationNeeded: true
        }, 500);
      }
      
      throw updateError;
    }

    console.log(`✅ Profile picture uploaded successfully: ${fileName}`);
    return c.json({ publicUrl });

  } catch (error: any) {
    console.error('❌ Profile picture upload error:', error);
    return c.json({ error: error.message || 'Failed to upload profile picture' }, 500);
  }
});

// ============================================
// USER CREATION ENDPOINT (REMOVED - DUPLICATE)
// ============================================
// Removed duplicate endpoint - see line 606 for the active user creation endpoint

// Profile Picture Delete endpoint
app.delete("/make-server-f659121d/profile-picture/:userId", async (c) => {
  try {
    // Ensure bucket exists before delete
    await ensureBucketExists(PROFILE_BUCKET);
    
    const userId = c.req.param('userId');

    // Get user to find profile picture URL
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('profile_picture')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    if (!user?.profile_picture) {
      return c.json({ error: 'No profile picture found' }, 404);
    }

    // Delete from storage
    const fileName = user.profile_picture.split('/').pop();
    if (fileName) {
      const { error: deleteError } = await supabase.storage
        .from(PROFILE_BUCKET)
        .remove([fileName]);

      if (deleteError) {
        console.error('❌ Storage delete error:', deleteError);
      } else {
        console.log(`🗑️ Deleted profile picture: ${fileName}`);
      }
    }

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_picture: null })
      .eq('id', userId);

    if (updateError) throw updateError;

    console.log(`✅ Profile picture deleted successfully for user: ${userId}`);
    return c.json({ success: true });

  } catch (error: any) {
    console.error('❌ Profile picture delete error:', error);
    return c.json({ error: error.message || 'Failed to delete profile picture' }, 500);
  }
});

// ============================================
// TIME ACCOUNT SYSTEM (Phase 1 - Woche 1)
// TODO: Re-enable when timeAccountCalculation.ts is implemented
// ============================================

/*
// Calculate time account for a specific user and month
app.post("/make-server-f659121d/time-account/calculate", async (c) => {
  try {
    console.log('⏰ Time Account calculation request...');
    
    const body = await c.req.json();
    const { userId, month, year } = body;

    if (!userId || !month || !year) {
      return c.json({ 
        error: 'userId, month, and year are required' 
      }, 400);
    }

    // Validate month (1-12)
    if (month < 1 || month > 12) {
      return c.json({ 
        error: 'Month must be between 1 and 12' 
      }, 400);
    }

    // Validate year
    if (year < 2020 || year > 2100) {
      return c.json({ 
        error: 'Year must be between 2020 and 2100' 
      }, 400);
    }

    const result = await calculateTimeAccount({ userId, month, year });

    if (!result) {
      return c.json({ 
        error: 'Failed to calculate time account' 
      }, 500);
    }

    return c.json({ 
      success: true, 
      timeAccount: result 
    });

  } catch (error: any) {
    console.error('❌ Time account calculation error:', error);
    return c.json({ 
      error: error.message || 'Failed to calculate time account',
      details: error.details || error.hint || 'No additional details'
    }, 500);
  }
});

// Calculate time accounts for all users (Batch processing)
app.post("/make-server-f659121d/time-account/calculate-all", async (c) => {
  try {
    console.log('⏰ Batch time account calculation request...');
    
    const body = await c.req.json();
    const { month, year } = body;

    if (!month || !year) {
      return c.json({ 
        error: 'month and year are required' 
      }, 400);
    }

    await calculateTimeAccountsForAllUsers(month, year);

    return c.json({ 
      success: true,
      message: `Time accounts calculated for all users for ${month}/${year}` 
    });

  } catch (error: any) {
    console.error('❌ Batch time account calculation error:', error);
    return c.json({ 
      error: error.message || 'Failed to calculate time accounts',
      details: error.details || error.hint || 'No additional details'
    }, 500);
  }
});
*/

// Get time account for a user
app.get("/make-server-f659121d/time-account/:userId/:month/:year", async (c) => {
  try {
    const userId = c.req.param('userId');
    const month = parseInt(c.req.param('month'));
    const year = parseInt(c.req.param('year'));

    const { data, error } = await supabase
      .from('time_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .single();

    if (error) {
      return c.json({ error: error.message }, 404);
    }

    return c.json({ timeAccount: data });

  } catch (error: any) {
    console.error('❌ Get time account error:', error);
    return c.json({ 
      error: error.message || 'Failed to get time account'
    }, 500);
  }
});

// ============================================
// USER MANAGEMENT
// ============================================

// Create User endpoint (Admin only)
app.post("/make-server-f659121d/users/create", async (c) => {
  try {
    console.log('👤 Creating new user...');
    
    // Get request body
    const body = await c.req.json();
    const { email, password, userData } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Create auth user with admin API
    // Note: This will trigger the handle_new_user() function which auto-creates:
    // - User profile in users table
    // - Avatar in user_avatars table
    // - Welcome notification
    // - Welcome coins
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: userData?.first_name || '',
        last_name: userData?.last_name || '',
      }
    });

    if (authError) {
      console.error('❌ Auth creation error:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user - no user returned');
    }

    const userId = authData.user.id;
    console.log(`✅ Auth user created: ${userId}`);

    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update the user profile with additional data
    // (The trigger already created it with basic info)
    const { data: profileData, error: updateError } = await supabase
      .from('users')
      .update({
        // Update with all provided userData fields
        ...userData,
        email: email, // Ensure email matches
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Profile update error:', updateError);
      throw updateError;
    }

    console.log(`✅ User profile updated: ${userId}`);

    return c.json({ 
      success: true, 
      user: profileData,
      message: 'User created successfully'
    });

  } catch (error: any) {
    console.error('❌ User creation error:', error);
    return c.json({ 
      error: error.message || 'Failed to create user',
      details: error.details || error.hint || 'No additional details'
    }, 500);
  }
});

/**
 * =================================
 * STORAGE PROXY ENDPOINTS (Phase 1)
 * =================================
 * All Storage operations go through BFF
 */

const DOCUMENTS_BUCKET = 'make-f659121d-documents';

// Upload document
app.post('/make-server-f659121d/documents/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;
    const userId = formData.get('userId') as string | null;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    if (!path) {
      return c.json({ error: 'No path provided' }, 400);
    }

    console.log(`📤 Uploading document: ${path}`);

    // Ensure documents bucket exists
    await ensureBucketExists(DOCUMENTS_BUCKET);

    // Upload file
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return c.json({ error: error.message }, 500);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(path);

    console.log(`✅ Document uploaded: ${publicUrl}`);

    return c.json({ 
      success: true,
      path: data.path,
      publicUrl,
    });
  } catch (error: any) {
    console.error('❌ Document upload error:', error);
    return c.json({ error: error.message || 'Upload failed' }, 500);
  }
});

// Delete documents
app.delete('/make-server-f659121d/documents', async (c) => {
  try {
    const { bucket, paths } = await c.req.json();

    if (!bucket || !paths || !Array.isArray(paths)) {
      return c.json({ error: 'Invalid request: bucket and paths[] required' }, 400);
    }

    console.log(`🗑️ Deleting ${paths.length} files from ${bucket}`);

    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      console.error('❌ Delete error:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log(`✅ Deleted ${paths.length} files`);

    return c.json({ success: true, deletedCount: paths.length });
  } catch (error: any) {
    console.error('❌ Document delete error:', error);
    return c.json({ error: error.message || 'Delete failed' }, 500);
  }
});

// Get signed URL
app.get('/make-server-f659121d/storage/sign', async (c) => {
  try {
    const bucket = c.req.query('bucket');
    const path = c.req.query('path');
    const expiresIn = Number(c.req.query('expiresIn')) || 3600; // Default 1 hour

    if (!bucket || !path) {
      return c.json({ error: 'bucket and path query params required' }, 400);
    }

    console.log(`🔑 Creating signed URL for ${bucket}/${path}`);

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('❌ Signed URL error:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log(`✅ Signed URL created`);

    return c.json({ 
      success: true,
      signedUrl: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Signed URL error:', error);
    return c.json({ error: error.message || 'Failed to create signed URL' }, 500);
  }
});

// ============================================
// TEST SUBMISSIONS & REVIEW API
// ============================================
app.route('/make-server-f659121d/tests', testSubmissionsApp);

// Initialize server after ensuring buckets exist
(async () => {
  console.log('🚀 Starting server...');
  await initializeAllBuckets();
  await ensureBucketExists(DOCUMENTS_BUCKET); // Ensure documents bucket exists
  console.log('✅ Server initialization complete');
  Deno.serve(app.fetch);
})();