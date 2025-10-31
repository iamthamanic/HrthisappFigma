# 🚀 DEPLOY: BrowoKoordinator-Dokumente Edge Function

**Status:** ⚠️ READY TO DEPLOY  
**Grund:** Edge Function ist lokal fertig, aber noch nicht deployed!

---

## ⚠️ PROBLEM

Der Code existiert nur **lokal** in:
```
/supabase/functions/BrowoKoordinator-Dokumente/index.ts
```

Die **deployed Version** auf Supabase ist noch die **alte mit TODOs**!

Deshalb der **"Missing authorization header"** Fehler beim Health Check.

---

## 🚀 DEPLOYMENT SCHRITTE

### **SCHRITT 1: Supabase Dashboard öffnen**

1. Gehe zu: https://supabase.com/dashboard/project/azmtojgikubegzusvhra
2. Navigate: **Edge Functions** (linkes Menü)
3. Finde: **BrowoKoordinator-Dokumente**
4. Click: **Edit Function** oder **Deploy New Version**

---

### **SCHRITT 2: Code kopieren**

**Kompletter Code für Copy-Paste:**

```typescript
/**
 * BrowoKoordinator - Dokumente Edge Function
 * ===========================================
 * Complete document management system with audit trails
 * 
 * Routes:
 * - GET    /BrowoKoordinator-Dokumente/health - Health check (NO AUTH)
 * - GET    /BrowoKoordinator-Dokumente/make-server-f659121d/documents - Get all documents (AUTH)
 * - GET    /BrowoKoordinator-Dokumente/make-server-f659121d/documents/:id - Get document by ID (AUTH)
 * - POST   /BrowoKoordinator-Dokumente/make-server-f659121d/documents - Create document (AUTH)
 * - PUT    /BrowoKoordinator-Dokumente/make-server-f659121d/documents/:id - Update document (AUTH)
 * - DELETE /BrowoKoordinator-Dokumente/make-server-f659121d/documents/:id - Delete document (AUTH)
 * - GET    /BrowoKoordinator-Dokumente/make-server-f659121d/categories - Get categories (AUTH)
 * - GET    /BrowoKoordinator-Dokumente/make-server-f659121d/stats - Get stats (AUTH)
 * - GET    /BrowoKoordinator-Dokumente/make-server-f659121d/download/:id - Download document (AUTH)
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();

// ==================== SUPABASE CLIENT ====================

const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

const getAnonClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );
};

// ==================== MIDDLEWARE ====================

app.use('*', logger(console.log));

app.use(
  "/*",
  cors({
    origin: '*',
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "X-Client-Info", "apikey"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400,
  }),
);

// ==================== AUTH HELPERS ====================

async function verifyAuth(authHeader: string | null): Promise<{ id: string; email?: string; role?: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const supabase = getAnonClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('[Dokumente] Auth error:', error);
      return null;
    }

    // Get user role from database
    const { data: userData } = await getSupabaseClient()
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      role: userData?.role,
    };
  } catch (error) {
    console.error('[Dokumente] Auth verification failed:', error);
    return null;
  }
}

function isHROrAdmin(role?: string): boolean {
  if (!role) return false;
  return ['HR', 'ADMIN', 'SUPERADMIN'].includes(role);
}

// ==================== ROUTES ====================

// Health check (no auth required)
app.get("/BrowoKoordinator-Dokumente/health", (c) => {
  return c.json({
    status: "ok",
    function: "BrowoKoordinator-Dokumente",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Get all documents with optional filters
app.get("/BrowoKoordinator-Dokumente/make-server-f659121d/documents", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Dokumente] Unauthorized documents request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get query params
    const category = c.req.query('category');
    const search = c.req.query('search');
    const organization_id = c.req.query('organization_id');
    const uploaded_by = c.req.query('uploaded_by');

    console.log('[Dokumente] Get all documents:', { userId: user.id, category, search, organization_id, uploaded_by });

    const supabase = getSupabaseClient();

    // Build query
    let query = supabase
      .from('documents')
      .select(`
        *,
        uploader:uploaded_by (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order('uploaded_at', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (organization_id) {
      query = query.eq('organization_id', organization_id);
    }
    if (uploaded_by) {
      query = query.eq('uploaded_by', uploaded_by);
    }
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error('[Dokumente] Error fetching documents:', error);
      return c.json({ error: 'Failed to fetch documents', details: error.message }, 500);
    }

    console.log('[Dokumente] Documents fetched:', documents?.length || 0);

    return c.json({
      success: true,
      documents: documents || [],
      count: documents?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Dokumente] Exception in get documents:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get document by ID
app.get("/BrowoKoordinator-Dokumente/make-server-f659121d/documents/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Dokumente] Unauthorized document by ID request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const documentId = c.req.param('id');

    console.log('[Dokumente] Get document by ID:', { userId: user.id, documentId });

    const supabase = getSupabaseClient();

    const { data: document, error } = await supabase
      .from('documents')
      .select(`
        *,
        uploader:uploaded_by (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', documentId)
      .single();

    if (error) {
      console.error('[Dokumente] Error fetching document:', error);
      return c.json({ error: 'Document not found', details: error.message }, 404);
    }

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    console.log('[Dokumente] Document fetched:', document.title);

    return c.json({
      success: true,
      document,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Dokumente] Exception in get document by ID:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create document
app.post("/BrowoKoordinator-Dokumente/make-server-f659121d/documents", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Dokumente] Unauthorized create document request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { title, category, file_url, user_id, mime_type, file_size, organization_id, uploaded_by } = body;

    // Validation
    if (!title || !category || !file_url) {
      return c.json({ 
        error: 'Missing required fields', 
        details: 'title, category, and file_url are required' 
      }, 400);
    }

    console.log('[Dokumente] Create document:', { userId: user.id, title, category });

    const supabase = getSupabaseClient();

    // Build insert object
    const insertData: any = {
      title,
      category,
      file_url,
    };

    // Optional fields
    if (user_id) insertData.user_id = user_id;
    if (mime_type) insertData.mime_type = mime_type;
    if (file_size) insertData.file_size = file_size;
    if (organization_id) insertData.organization_id = organization_id;
    if (uploaded_by) insertData.uploaded_by = uploaded_by;

    const { data: document, error } = await supabase
      .from('documents')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[Dokumente] Error creating document:', error);
      return c.json({ error: 'Failed to create document', details: error.message }, 500);
    }

    if (!document) {
      return c.json({ error: 'Document creation failed' }, 500);
    }

    console.log('[Dokumente] Document created:', document.id);

    return c.json({
      success: true,
      document,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Dokumente] Exception in create document:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update document
app.put("/BrowoKoordinator-Dokumente/make-server-f659121d/documents/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Dokumente] Unauthorized update document request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const documentId = c.req.param('id');
    const body = await c.req.json();
    const { title, description, category } = body;

    console.log('[Dokumente] Update document:', { userId: user.id, documentId, updates: body });

    const supabase = getSupabaseClient();

    // Build update object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;

    const { data: document, error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      console.error('[Dokumente] Error updating document:', error);
      return c.json({ error: 'Failed to update document', details: error.message }, 500);
    }

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    console.log('[Dokumente] Document updated:', document.id);

    return c.json({
      success: true,
      document,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Dokumente] Exception in update document:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete document
app.delete("/BrowoKoordinator-Dokumente/make-server-f659121d/documents/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Dokumente] Unauthorized delete document request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const documentId = c.req.param('id');

    console.log('[Dokumente] Delete document:', { userId: user.id, documentId });

    const supabase = getSupabaseClient();

    // Get document first to get file_url
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Delete from storage if file_url exists
    if (document.file_url) {
      try {
        const urlParts = document.file_url.split('/');
        const bucketName = urlParts[urlParts.length - 2];
        const fileName = urlParts[urlParts.length - 1];

        if (bucketName && fileName) {
          await supabase.storage.from(bucketName).remove([fileName]);
          console.log('[Dokumente] File deleted from storage:', fileName);
        }
      } catch (storageError) {
        console.error('[Dokumente] Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('[Dokumente] Error deleting document:', deleteError);
      return c.json({ error: 'Failed to delete document', details: deleteError.message }, 500);
    }

    console.log('[Dokumente] Document deleted:', documentId);

    return c.json({
      success: true,
      message: 'Document deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Dokumente] Exception in delete document:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get document categories
app.get("/BrowoKoordinator-Dokumente/make-server-f659121d/categories", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Dokumente] Unauthorized categories request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[Dokumente] Get categories:', { userId: user.id });

    const supabase = getSupabaseClient();

    const { data: documents, error } = await supabase
      .from('documents')
      .select('category');

    if (error) {
      console.error('[Dokumente] Error fetching categories:', error);
      return c.json({ error: 'Failed to fetch categories', details: error.message }, 500);
    }

    // Get unique categories
    const categories = [
      ...new Set((documents || []).map((doc) => doc.category).filter(Boolean)),
    ];

    console.log('[Dokumente] Categories fetched:', categories.length);

    return c.json({
      success: true,
      categories,
      count: categories.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Dokumente] Exception in get categories:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get document stats
app.get("/BrowoKoordinator-Dokumente/make-server-f659121d/stats", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Dokumente] Unauthorized stats request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const organization_id = c.req.query('organization_id');

    console.log('[Dokumente] Get stats:', { userId: user.id, organization_id });

    const supabase = getSupabaseClient();

    let query = supabase.from('documents').select('*');

    if (organization_id) {
      query = query.eq('organization_id', organization_id);
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error('[Dokumente] Error fetching stats:', error);
      return c.json({ error: 'Failed to fetch stats', details: error.message }, 500);
    }

    const docs = documents || [];
    const total = docs.length;
    const byCategory: Record<string, number> = {};
    let totalSizeBytes = 0;

    docs.forEach((doc) => {
      // Count by category
      if (doc.category) {
        byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
      }

      // Sum file sizes
      if (doc.file_size) {
        totalSizeBytes += doc.file_size;
      }
    });

    const totalSizeMb = totalSizeBytes / (1024 * 1024);

    const stats = {
      total,
      by_category: byCategory,
      total_size_mb: Math.round(totalSizeMb * 100) / 100,
    };

    console.log('[Dokumente] Stats calculated:', stats);

    return c.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Dokumente] Exception in get stats:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Download document (get signed URL)
app.get("/BrowoKoordinator-Dokumente/make-server-f659121d/download/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Dokumente] Unauthorized download request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const documentId = c.req.param('id');
    const expiresIn = parseInt(c.req.query('expiresIn') || '3600');

    console.log('[Dokumente] Download document:', { userId: user.id, documentId, expiresIn });

    const supabase = getSupabaseClient();

    // Get document
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    if (!document.file_url) {
      return c.json({ error: 'Document has no file URL' }, 400);
    }

    // If already a public URL, return it
    if (document.file_url.startsWith('http')) {
      return c.json({
        success: true,
        url: document.file_url,
        timestamp: new Date().toISOString(),
      });
    }

    // Extract bucket and path from file_url
    const urlParts = document.file_url.split('/');
    const bucketName = urlParts[urlParts.length - 2];
    const fileName = urlParts[urlParts.length - 1];

    if (!bucketName || !fileName) {
      return c.json({ error: 'Invalid file URL' }, 400);
    }

    // Create signed URL
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, expiresIn);

    if (error) {
      console.error('[Dokumente] Error creating signed URL:', error);
      return c.json({ error: 'Failed to create download URL', details: error.message }, 500);
    }

    if (!data?.signedUrl) {
      return c.json({ error: 'Failed to create signed URL' }, 500);
    }

    console.log('[Dokumente] Signed URL created');

    return c.json({
      success: true,
      url: data.signedUrl,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Dokumente] Exception in download document:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== START SERVER ====================

Deno.serve(app.fetch);
```

---

### **SCHRITT 3: Deploy**

1. **Paste** den kompletten Code ins Editor-Feld
2. **Click:** "Deploy" Button
3. **Warte** auf Deployment (sollte ~30 Sekunden dauern)

---

### **SCHRITT 4: Verify Deployment**

**Test Health Check:**

Öffne diese URL im Browser:
```
https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Dokumente/health
```

**Erwartetes Result:**
```json
{
  "status": "ok",
  "function": "BrowoKoordinator-Dokumente",
  "timestamp": "2025-10-28T...",
  "version": "1.0.0"
}
```

---

## ✅ NACH DEPLOYMENT

### **Test im Frontend:**

1. **Hard Refresh** (Cmd/Ctrl + Shift + R)
2. Navigate zu `/documents`
3. **Check Console:**
   ```
   📤 [DocumentService] getAllDocuments
   📥 [DocumentService] getAllDocuments Response: { count: X }
   ```
4. **Check Network Tab:**
   - Requests zu `.../BrowoKoordinator-Dokumente/make-server-f659121d/documents`
   - Status: **200 OK**

---

## 🐛 TROUBLESHOOTING

### **Fehler: "Missing authorization header"**
- ✅ **Nach Deployment sollte dieser Fehler WEG sein!**
- Health Check benötigt **KEINE** Auth
- Andere Routes benötigen JWT Token

### **Fehler: "Function not found"**
- Check: Ist Function Name korrekt? `BrowoKoordinator-Dokumente`
- Check: Deployment erfolgreich?

### **Fehler: "Internal server error"**
- Check: Edge Function Logs in Supabase Dashboard
- Supabase Dashboard → Edge Functions → BrowoKoordinator-Dokumente → Logs

---

## 📊 WAS DANACH PASSIERT

Nach erfolgreichem Deployment:

1. ✅ **Health Check funktioniert** (ohne Auth)
2. ✅ **Document Service ruft Edge Function auf**
3. ✅ **Alle CRUD Operations funktionieren**
4. ✅ **Migration ist KOMPLETT**

---

**Bereit zum Deployen?** 🚀

1. Kopiere den Code oben
2. Öffne Supabase Dashboard
3. Paste & Deploy
4. Test Health Check
5. ✅ **FERTIG!**
