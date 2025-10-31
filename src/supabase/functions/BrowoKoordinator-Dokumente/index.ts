/**
BrowoKoordinator - Dokumente Edge Function
===========================================
Complete document management system with audit trails

Routes (all prefixed with /BrowoKoordinator-Dokumente by Supabase):
- GET    /health           - Health check (NO AUTH - PUBLIC for monitoring)
- GET    /health-auth      - Authenticated health check (AUTH - with user info)
- GET    /documents        - Get all documents (AUTH)
- GET    /documents/:id    - Get document by ID (AUTH)
- POST   /documents        - Create document (AUTH)
- PUT    /documents/:id    - Update document (AUTH)
- DELETE /documents/:id    - Delete document (AUTH)
- GET    /categories       - Get categories (AUTH)
- GET    /stats            - Get stats (AUTH)
- GET    /download/:id     - Download document (AUTH)

@version 2.1.0 - Public health endpoint for monitoring tools
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

// ==================== CORS HEADERS ====================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "GET, POST, PUT, DELETE, OPTIONS",
};

// ==================== SUPABASE CLIENT ====================

const getSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
};

const getAnonClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );
};

// ==================== AUTH HELPERS ====================

async function verifyAuth(
  authHeader: string | null,
): Promise<{
  id: string;
  email?: string;
  role?: string;
} | null> {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const supabase = getAnonClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("[Dokumente] Auth error:", error);
      return null;
    }

    // Get user role from database
    const { data: userData } = await getSupabaseClient()
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      role: userData?.role,
    };
  } catch (error) {
    console.error(
      "[Dokumente] Auth verification failed:",
      error,
    );
    return null;
  }
}

// ==================== MAIN HANDLER ====================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const method = req.method;

    // ==================== ROBUST PATH PARSING ====================
    // Supabase strips "/functions/v1/" before the function sees the URL
    // So we receive: /BrowoKoordinator-Dokumente/health
    // OR: /BrowoKoordinator-Dokumente/make-server-f659121d/health

    console.log("[Dokumente] Raw URL:", url.pathname);

    // Remove the function name prefix
    let pathAfterFunctionName = url.pathname;
    if (
      pathAfterFunctionName.startsWith(
        "/BrowoKoordinator-Dokumente/",
      )
    ) {
      pathAfterFunctionName = pathAfterFunctionName.slice(
        "/BrowoKoordinator-Dokumente/".length,
      );
    } else if (
      pathAfterFunctionName.startsWith(
        "/BrowoKoordinator-Dokumente",
      )
    ) {
      pathAfterFunctionName = pathAfterFunctionName.slice(
        "/BrowoKoordinator-Dokumente".length,
      );
    }

    console.log(
      "[Dokumente] After function name:",
      pathAfterFunctionName,
    );

    const segments = pathAfterFunctionName
      .split("/")
      .filter(Boolean);
    console.log("[Dokumente] Segments:", segments);

    // Remove Figma Make's "make-server-*" prefix if present
    if (segments[0]?.startsWith("make-server-")) {
      console.log(
        "[Dokumente] Removing make-server prefix:",
        segments[0],
      );
      segments.shift();
    }

    const path = segments.join("/");

    console.log(`[Dokumente] ${method} /${path}`);

    // ==================== PUBLIC HEALTH CHECK (NO AUTH) ====================
    // Health endpoint MUST be public for monitoring tools
    if (path === "health" && method === "GET") {
      return new Response(
        JSON.stringify({
          status: "ok",
          function: "BrowoKoordinator-Dokumente",
          timestamp: new Date().toISOString(),
          version: "2.1.0",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        },
      );
    }

    // ==================== AUTH REQUIRED FOR ALL OTHER ROUTES ====================
    const authHeader = req.headers.get("Authorization");
    const user = await verifyAuth(authHeader);

    if (!user) {
      console.warn(
        "[Dokumente] Unauthorized request to:",
        path,
      );
      return new Response(
        JSON.stringify({
          error: "Unauthorized - valid JWT required",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 401,
        },
      );
    }

    // ==================== AUTHENTICATED ROUTES ====================
    // Optional: Authenticated health check with user info
    if (path === "health-auth" && method === "GET") {
      return new Response(
        JSON.stringify({
          status: "ok",
          function: "BrowoKoordinator-Dokumente",
          timestamp: new Date().toISOString(),
          version: "2.1.0",
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        },
      );
    }

    const supabase = getSupabaseClient();

    // ==================== GET ALL DOCUMENTS ====================
    if (path === "documents" && method === "GET") {
      const category = url.searchParams.get("category");
      const search = url.searchParams.get("search");
      const organization_id = url.searchParams.get(
        "organization_id",
      );
      const uploaded_by = url.searchParams.get("uploaded_by");

      console.log("[Dokumente] Get all documents:", {
        userId: user.id,
        category,
        search,
        organization_id,
        uploaded_by,
      });

      let query = supabase
        .from("documents")
        .select(
          `
          *,
          uploader:uploaded_by (
            id,
            first_name,
            last_name,
            email
          )
        `,
        )
        .order("uploaded_at", { ascending: false });

      if (category) query = query.eq("category", category);
      if (organization_id)
        query = query.eq("organization_id", organization_id);
      if (uploaded_by)
        query = query.eq("uploaded_by", uploaded_by);
      if (search)
        query = query.or(
          `title.ilike.%${search}%,description.ilike.%${search}%`,
        );

      const { data: documents, error } = await query;

      if (error) {
        console.error(
          "[Dokumente] Error fetching documents:",
          error,
        );
        return new Response(
          JSON.stringify({
            error: "Failed to fetch documents",
            details: error.message,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
            status: 500,
          },
        );
      }

      console.log(
        "[Dokumente] Documents fetched:",
        documents?.length || 0,
      );

      return new Response(
        JSON.stringify({
          success: true,
          documents: documents || [],
          count: documents?.length || 0,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        },
      );
    }

    // ==================== GET DOCUMENT BY ID ====================
    if (
      path.startsWith("documents/") &&
      method === "GET" &&
      !path.includes("download")
    ) {
      const documentId = path.replace("documents/", "");

      console.log("[Dokumente] Get document by ID:", {
        userId: user.id,
        documentId,
      });

      const { data: document, error } = await supabase
        .from("documents")
        .select(
          `
          *,
          uploader:uploaded_by (
            id,
            first_name,
            last_name,
            email
          )
        `,
        )
        .eq("id", documentId)
        .single();

      if (error || !document) {
        console.error(
          "[Dokumente] Error fetching document:",
          error,
        );
        return new Response(
          JSON.stringify({
            error: "Document not found",
            details: error?.message,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
            status: 404,
          },
        );
      }

      console.log(
        "[Dokumente] Document fetched:",
        document.title,
      );

      return new Response(
        JSON.stringify({
          success: true,
          document,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        },
      );
    }

    // ==================== CREATE DOCUMENT ====================
    if (path === "documents" && method === "POST") {
      const body = await req.json();
      const {
        title,
        category,
        file_url,
        user_id,
        mime_type,
        file_size,
        organization_id,
        uploaded_by,
      } = body;

      if (!title || !category || !file_url) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields",
            details:
              "title, category, and file_url are required",
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
            status: 400,
          },
        );
      }

      console.log("[Dokumente] Create document:", {
        userId: user.id,
        title,
        category,
      });

      const insertData: any = { title, category, file_url };
      if (user_id) insertData.user_id = user_id;
      if (mime_type) insertData.mime_type = mime_type;
      if (file_size) insertData.file_size = file_size;
      if (organization_id)
        insertData.organization_id = organization_id;
      if (uploaded_by) insertData.uploaded_by = uploaded_by;

      const { data: document, error } = await supabase
        .from("documents")
        .insert(insertData)
        .select()
        .single();

      if (error || !document) {
        console.error(
          "[Dokumente] Error creating document:",
          error,
        );
        return new Response(
          JSON.stringify({
            error: "Failed to create document",
            details: error?.message,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
            status: 500,
          },
        );
      }

      console.log("[Dokumente] Document created:", document.id);

      return new Response(
        JSON.stringify({
          success: true,
          document,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        },
      );
    }

    // ==================== UPDATE DOCUMENT ====================
    if (path.startsWith("documents/") && method === "PUT") {
      const documentId = path.replace("documents/", "");
      const body = await req.json();
      const { title, description, category } = body;

      console.log("[Dokumente] Update document:", {
        userId: user.id,
        documentId,
        updates: body,
      });

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined)
        updateData.description = description;
      if (category !== undefined)
        updateData.category = category;

      const { data: document, error } = await supabase
        .from("documents")
        .update(updateData)
        .eq("id", documentId)
        .select()
        .single();

      if (error || !document) {
        console.error(
          "[Dokumente] Error updating document:",
          error,
        );
        return new Response(
          JSON.stringify({
            error: "Failed to update document",
            details: error?.message,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
            status: 500,
          },
        );
      }

      console.log("[Dokumente] Document updated:", document.id);

      return new Response(
        JSON.stringify({
          success: true,
          document,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        },
      );
    }

    // ==================== DELETE DOCUMENT ====================
    if (path.startsWith("documents/") && method === "DELETE") {
      const documentId = path.replace("documents/", "");

      console.log("[Dokumente] Delete document:", {
        userId: user.id,
        documentId,
      });

      const { data: document, error: fetchError } =
        await supabase
          .from("documents")
          .select("*")
          .eq("id", documentId)
          .single();

      if (fetchError || !document) {
        return new Response(
          JSON.stringify({ error: "Document not found" }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
            status: 404,
          },
        );
      }

      // Delete from storage if file_url exists
      if (document.file_url) {
        try {
          const urlParts = document.file_url.split("/");
          const bucketName = urlParts[urlParts.length - 2];
          const fileName = urlParts[urlParts.length - 1];

          if (bucketName && fileName) {
            await supabase.storage
              .from(bucketName)
              .remove([fileName]);
            console.log(
              "[Dokumente] File deleted from storage:",
              fileName,
            );
          }
        } catch (storageError) {
          console.error(
            "[Dokumente] Error deleting file from storage:",
            storageError,
          );
        }
      }

      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (deleteError) {
        console.error(
          "[Dokumente] Error deleting document:",
          deleteError,
        );
        return new Response(
          JSON.stringify({
            error: "Failed to delete document",
            details: deleteError.message,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
            status: 500,
          },
        );
      }

      console.log("[Dokumente] Document deleted:", documentId);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Document deleted successfully",
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        },
      );
    }

    // ==================== GET CATEGORIES ====================
    if (path === "categories" && method === "GET") {
      console.log("[Dokumente] Get categories:", {
        userId: user.id,
      });

      const { data: documents, error } = await supabase
        .from("documents")
        .select("category");

      if (error) {
        console.error(
          "[Dokumente] Error fetching categories:",
          error,
        );
        return new Response(
          JSON.stringify({
            error: "Failed to fetch categories",
            details: error.message,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
            status: 500,
          },
        );
      }

      const categories = [
        ...new Set(
          (documents || [])
            .map((doc) => doc.category)
            .filter(Boolean),
        ),
      ];

      console.log(
        "[Dokumente] Categories fetched:",
        categories.length,
      );

      return new Response(
        JSON.stringify({
          success: true,
          categories,
          count: categories.length,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        },
      );
    }

    // ==================== GET STATS ====================
    if (path === "stats" && method === "GET") {
      const organization_id = url.searchParams.get(
        "organization_id",
      );

      console.log("[Dokumente] Get stats:", {
        userId: user.id,
        organization_id,
      });

      let query = supabase.from("documents").select("*");
      if (organization_id)
        query = query.eq("organization_id", organization_id);

      const { data: documents, error } = await query;

      if (error) {
        console.error(
          "[Dokumente] Error fetching stats:",
          error,
        );
        return new Response(
          JSON.stringify({
            error: "Failed to fetch stats",
            details: error.message,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
            status: 500,
          },
        );
      }

      const docs = documents || [];
      const total = docs.length;
      const byCategory: Record<string, number> = {};
      let totalSizeBytes = 0;

      docs.forEach((doc) => {
        if (doc.category) {
          byCategory[doc.category] =
            (byCategory[doc.category] || 0) + 1;
        }
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

      console.log("[Dokumente] Stats calculated:", stats);

      return new Response(
        JSON.stringify({
          success: true,
          stats,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        },
      );
    }

    // ==================== DOWNLOAD DOCUMENT ====================
    if (path.startsWith("download/") && method === "GET") {
      const documentId = path.replace("download/", "");
      const expiresIn = parseInt(
        url.searchParams.get("expiresIn") || "3600",
      );

      console.log("[Dokumente] Download document:", {
        userId: user.id,
        documentId,
        expiresIn,
      });

      const { data: document, error: fetchError } =
        await supabase
          .from("documents")
          .select("*")
          .eq("id", documentId)
          .single();

      if (fetchError || !document) {
        return new Response(
          JSON.stringify({ error: "Document not found" }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
            status: 404,
          },
        );
      }

      if (!document.file_url) {
        return new Response(
          JSON.stringify({ error: "Document has no file URL" }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
            status: 400,
          },
        );
      }

      // If already a public URL, return it
      if (document.file_url.startsWith("http")) {
        return new Response(
          JSON.stringify({
            success: true,
            url: document.file_url,
            timestamp: new Date().toISOString(),
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
            status: 200,
          },
        );
      }

      // Extract bucket and path from file_url
      const urlParts = document.file_url.split("/");
      const bucketName = urlParts[urlParts.length - 2];
      const fileName = urlParts[urlParts.length - 1];

      if (!bucketName || !fileName) {
        return new Response(
          JSON.stringify({ error: "Invalid file URL" }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
            status: 400,
          },
        );
      }

      // Create signed URL
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(fileName, expiresIn);

      if (error || !data?.signedUrl) {
        console.error(
          "[Dokumente] Error creating signed URL:",
          error,
        );
        return new Response(
          JSON.stringify({
            error: "Failed to create download URL",
            details: error?.message,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
            status: 500,
          },
        );
      }

      console.log("[Dokumente] Signed URL created");

      return new Response(
        JSON.stringify({
          success: true,
          url: data.signedUrl,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        },
      );
    }

    // ==================== 404 NOT FOUND ====================
    return new Response(
      JSON.stringify({
        error: "Route not found",
        path,
        method,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 404,
      },
    );
  } catch (error) {
    console.error("[Dokumente] Exception:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      },
    );
  }
});