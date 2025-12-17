// File: supabase/functions/BrowoKoordinator-Server/routes-performanceReviews.ts
import { Hono } from "npm:hono";
import { supabase } from "./core-supabaseClient.ts";
import { errorResponse } from "./errors.ts";
import { PermissionKey, requirePermission } from "./auth.ts";

export function registerPerformanceReviewRoutes(app: Hono) {
  // ========================================
  // ROUTES: TEMPLATES
  // ========================================

  // GET /api/performance-reviews/templates
  app.get("/api/performance-reviews/templates", async (c) => {
    try {
      const auth = c.get("auth");

      const { data, error } = await supabase
        .from("performance_review_templates")
        .select("*")
        .eq("organization_id", auth.organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return c.json({ templates: data || [] });
    } catch (error) {
      return errorResponse(error);
    }
  });

  // GET /api/performance-reviews/templates/:id
  app.get("/api/performance-reviews/templates/:id", async (c) => {
    try {
      const auth = c.get("auth");
      const id = c.req.param("id");

      const { data, error } = await supabase
        .from("performance_review_templates")
        .select("*")
        .eq("id", id)
        .eq("organization_id", auth.organizationId)
        .single();

      if (error) throw error;

      return c.json({ template: data });
    } catch (error) {
      return errorResponse(error);
    }
  });

  // POST /api/performance-reviews/templates
  app.post("/api/performance-reviews/templates", async (c) => {
    try {
      const auth = c.get("auth");
      requirePermission(auth, PermissionKey.MANAGE_WORKFLOWS); // Using workflows permission as closest match

      const body = await c.req.json();

      const { data, error } = await supabase
        .from("performance_review_templates")
        .insert({
          organization_id: auth.organizationId,
          title: body.title,
          description: body.description || null,
          questions: body.questions || [],
          created_by: auth.userId,
        })
        .select()
        .single();

      if (error) throw error;

      return c.json({ template: data }, 201);
    } catch (error) {
      return errorResponse(error);
    }
  });

  // PUT /api/performance-reviews/templates/:id
  app.put("/api/performance-reviews/templates/:id", async (c) => {
    try {
      const auth = c.get("auth");
      requirePermission(auth, PermissionKey.MANAGE_WORKFLOWS);

      const id = c.req.param("id");
      const body = await c.req.json();

      const { data, error } = await supabase
        .from("performance_review_templates")
        .update({
          title: body.title,
          description: body.description,
          questions: body.questions,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organization_id", auth.organizationId)
        .select()
        .single();

      if (error) throw error;

      return c.json({ template: data });
    } catch (error) {
      return errorResponse(error);
    }
  });

  // DELETE /api/performance-reviews/templates/:id
  app.delete("/api/performance-reviews/templates/:id", async (c) => {
    try {
      const auth = c.get("auth");
      requirePermission(auth, PermissionKey.MANAGE_WORKFLOWS);

      const id = c.req.param("id");

      const { error } = await supabase
        .from("performance_review_templates")
        .delete()
        .eq("id", id)
        .eq("organization_id", auth.organizationId);

      if (error) throw error;

      return c.json({ success: true });
    } catch (error) {
      return errorResponse(error);
    }
  });

  // ========================================
  // ROUTES: PERFORMANCE REVIEWS
  // ========================================

  // POST /api/performance-reviews/send
  app.post("/api/performance-reviews/send", async (c) => {
    try {
      const auth = c.get("auth");
      requirePermission(auth, PermissionKey.MANAGE_EMPLOYEES);

      const body = await c.req.json();

      // Load template
      const { data: template, error: templateError } = await supabase
        .from("performance_review_templates")
        .select("questions")
        .eq("id", body.template_id)
        .single();

      if (templateError) throw templateError;

      // Create review with snapshot
      const { data, error } = await supabase
        .from("performance_reviews")
        .insert({
          organization_id: auth.organizationId,
          employee_id: body.employee_id,
          manager_id: body.manager_id || auth.userId,
          template_snapshot: template.questions,
          status: "SENT",
          due_date: body.due_date || null,
          conversation_date: body.conversation_date || null,
          created_by: auth.userId,
        })
        .select()
        .single();

      if (error) throw error;

      return c.json({ review: data }, 201);
    } catch (error) {
      return errorResponse(error);
    }
  });

  // GET /api/performance-reviews/my-reviews
  app.get("/api/performance-reviews/my-reviews", async (c) => {
    try {
      const auth = c.get("auth");

      const { data, error } = await supabase
        .from("performance_reviews")
        .select(
          `
          *,
          employee:users!employee_id(id, email, first_name, last_name),
          manager:users!manager_id(id, email, first_name, last_name)
        `
        )
        .eq("employee_id", auth.userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return c.json({ reviews: data || [] });
    } catch (error) {
      return errorResponse(error);
    }
  });

  // GET /api/performance-reviews/team-reviews
  app.get("/api/performance-reviews/team-reviews", async (c) => {
    try {
      const auth = c.get("auth");
      requirePermission(auth, PermissionKey.VIEW_EMPLOYEE_DATA);

      const employeeId = c.req.query("employee_id");

      let query = supabase
        .from("performance_reviews")
        .select(
          `
          *,
          employee:users!employee_id(id, email, first_name, last_name),
          manager:users!manager_id(id, email, first_name, last_name)
        `
        )
        .eq("organization_id", auth.organizationId);

      if (employeeId) {
        query = query.eq("employee_id", employeeId);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return c.json({ reviews: data || [] });
    } catch (error) {
      return errorResponse(error);
    }
  });

  // GET /api/performance-reviews/:id
  app.get("/api/performance-reviews/:id", async (c) => {
    try {
      const auth = c.get("auth");
      const id = c.req.param("id");

      // Load review
      const { data: review, error: reviewError } = await supabase
        .from("performance_reviews")
        .select(
          `
          *,
          employee:users!employee_id(id, email, first_name, last_name),
          manager:users!manager_id(id, email, first_name, last_name)
        `
        )
        .eq("id", id)
        .single();

      if (reviewError) throw reviewError;

      // Check permissions - only employee, manager, or org members can view
      if (
        review.employee_id !== auth.userId &&
        review.manager_id !== auth.userId &&
        review.organization_id !== auth.organizationId
      ) {
        return c.json({ error: "Not authorized" }, 403);
      }

      // Load answers
      const { data: answers, error: answersError } = await supabase
        .from("performance_review_answers")
        .select("*")
        .eq("review_id", id);

      if (answersError) throw answersError;

      // Load signatures
      const { data: signatures, error: signaturesError } = await supabase
        .from("performance_review_signatures")
        .select("*")
        .eq("review_id", id);

      if (signaturesError) throw signaturesError;

      return c.json({
        review,
        answers: answers || [],
        signatures: signatures || [],
      });
    } catch (error) {
      return errorResponse(error);
    }
  });

  // PUT /api/performance-reviews/:id/answer
  app.put("/api/performance-reviews/:id/answer", async (c) => {
    try {
      const auth = c.get("auth");
      const id = c.req.param("id");
      const body = await c.req.json();

      // Verify review belongs to user
      const { data: review, error: reviewError } = await supabase
        .from("performance_reviews")
        .select("employee_id, status")
        .eq("id", id)
        .single();

      if (reviewError) throw reviewError;

      if (review.employee_id !== auth.userId) {
        return c.json({ error: "Not authorized" }, 403);
      }

      if (review.status === "COMPLETED") {
        return c.json({ error: "Review is already completed" }, 400);
      }

      // Upsert answer
      const { data, error } = await supabase
        .from("performance_review_answers")
        .upsert(
          {
            review_id: id,
            question_id: body.question_id,
            employee_answer: body.answer,
            employee_answered_at: new Date().toISOString(),
          },
          { onConflict: "review_id,question_id" }
        )
        .select()
        .single();

      if (error) throw error;

      // Update review status to IN_PROGRESS if it was SENT
      if (review.status === "SENT") {
        await supabase
          .from("performance_reviews")
          .update({ status: "IN_PROGRESS" })
          .eq("id", id);
      }

      return c.json({ answer: data });
    } catch (error) {
      return errorResponse(error);
    }
  });

  // PUT /api/performance-reviews/:id/manager-comment
  app.put("/api/performance-reviews/:id/manager-comment", async (c) => {
    try {
      const auth = c.get("auth");
      const id = c.req.param("id");
      const body = await c.req.json();

      // Verify review belongs to manager or user has permission
      const { data: review, error: reviewError } = await supabase
        .from("performance_reviews")
        .select("manager_id")
        .eq("id", id)
        .single();

      if (reviewError) throw reviewError;

      const canEdit =
        review.manager_id === auth.userId ||
        auth.hasPermission(PermissionKey.MANAGE_EMPLOYEES);

      if (!canEdit) {
        return c.json({ error: "Not authorized" }, 403);
      }

      // Update answer with manager comment
      const { data, error } = await supabase
        .from("performance_review_answers")
        .update({
          manager_comment: body.comment,
          manager_answered_at: new Date().toISOString(),
        })
        .eq("review_id", id)
        .eq("question_id", body.question_id)
        .select()
        .single();

      if (error) throw error;

      return c.json({ answer: data });
    } catch (error) {
      return errorResponse(error);
    }
  });

  // PUT /api/performance-reviews/:id/submit
  app.put("/api/performance-reviews/:id/submit", async (c) => {
    try {
      const auth = c.get("auth");
      const id = c.req.param("id");

      // Verify review belongs to user
      const { data: review, error: reviewError } = await supabase
        .from("performance_reviews")
        .select("employee_id")
        .eq("id", id)
        .single();

      if (reviewError) throw reviewError;

      if (review.employee_id !== auth.userId) {
        return c.json({ error: "Not authorized" }, 403);
      }

      // Update status
      const { data, error } = await supabase
        .from("performance_reviews")
        .update({ status: "SUBMITTED", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return c.json({ review: data });
    } catch (error) {
      return errorResponse(error);
    }
  });

  // PUT /api/performance-reviews/:id/complete
  app.put("/api/performance-reviews/:id/complete", async (c) => {
    try {
      const auth = c.get("auth");
      requirePermission(auth, PermissionKey.MANAGE_EMPLOYEES);

      const id = c.req.param("id");

      // Update status
      const { data, error } = await supabase
        .from("performance_reviews")
        .update({ status: "COMPLETED", updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("organization_id", auth.organizationId)
        .select()
        .single();

      if (error) throw error;

      return c.json({ review: data });
    } catch (error) {
      return errorResponse(error);
    }
  });

  // POST /api/performance-reviews/:id/signature
  app.post("/api/performance-reviews/:id/signature", async (c) => {
    try {
      const auth = c.get("auth");
      const id = c.req.param("id");
      const body = await c.req.json();

      // Verify review access
      const { data: review, error: reviewError } = await supabase
        .from("performance_reviews")
        .select("employee_id, manager_id")
        .eq("id", id)
        .single();

      if (reviewError) throw reviewError;

      // Determine role
      let role: "employee" | "manager";
      if (review.employee_id === auth.userId) {
        role = "employee";
      } else if (review.manager_id === auth.userId) {
        role = "manager";
      } else {
        return c.json({ error: "Not authorized" }, 403);
      }

      // Upsert signature
      const { data, error } = await supabase
        .from("performance_review_signatures")
        .upsert(
          {
            review_id: id,
            user_id: auth.userId,
            role: role,
            signature_data: body.signature_data,
            signed_at: new Date().toISOString(),
          },
          { onConflict: "review_id,role" }
        )
        .select()
        .single();

      if (error) throw error;

      return c.json({ signature: data });
    } catch (error) {
      return errorResponse(error);
    }
  });

  // POST /api/performance-reviews/:id/add-note
  app.post("/api/performance-reviews/:id/add-note", async (c) => {
    try {
      const auth = c.get("auth");
      const id = c.req.param("id");
      const body = await c.req.json();

      // Verify review belongs to user
      const { data: review, error: reviewError } = await supabase
        .from("performance_reviews")
        .select("employee_id, employee_notes")
        .eq("id", id)
        .single();

      if (reviewError) throw reviewError;

      if (review.employee_id !== auth.userId) {
        return c.json({ error: "Not authorized" }, 403);
      }

      // Add note
      const notes = review.employee_notes || [];
      notes.push({
        note: body.note,
        created_at: new Date().toISOString(),
      });

      const { data, error } = await supabase
        .from("performance_reviews")
        .update({ employee_notes: notes, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return c.json({ review: data });
    } catch (error) {
      return errorResponse(error);
    }
  });
}
