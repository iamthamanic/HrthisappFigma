/**
 * MIGRATION EXAMPLE: Performance Review Endpoint mit neuem Auth-System
 * =====================================================================
 * 
 * Dies ist ein Beispiel, wie man einen Endpoint von der alten Auth
 * zur neuen authorize()-Funktion migriert.
 * 
 * VORHER (alt):
 * -------------
 * async function requireAuth(c: any): Promise<any> {
 *   const { user, error } = await getUserFromRequest(c);
 *   if (error || !user) {
 *     return c.json({ error: 'Unauthorized' }, 401);
 *   }
 *   return user;
 * }
 * 
 * async function hasPermission(userId: string, permission: string): Promise<boolean> {
 *   const { data: userPerms } = await supabase
 *     .from('user_permissions')
 *     .select('granted')
 *     .eq('user_id', userId)
 *     .eq('permission', permission)
 *     .single();
 *   return userPerms?.granted ?? false;
 * }
 * 
 * app.get('/templates', async (c) => {
 *   const user = await requireAuth(c);
 *   if (user.status) return user;
 *   
 *   const canManage = await hasPermission(user.id, 'manage_performance_reviews');
 *   if (!canManage) {
 *     return c.json({ error: 'Forbidden' }, 403);
 *   }
 *   
 *   // Business logic...
 * });
 * 
 * 
 * NACHHER (neu):
 * --------------
 */

import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { authorize } from '../_shared/auth.ts';
import { PermissionKey } from '../_shared/permissions.ts';
import { errorResponse, successResponse } from '../_shared/errors.ts';

const app = new Hono();

// CORS + Logger
app.use('*', cors());
app.use('*', logger(console.log));

// Supabase Client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ========================================
// EXAMPLE 1: Simple GET Endpoint
// ========================================
// Jeder authentifizierte User kann seine eigenen Reviews sehen

app.get('/make-server-f659121d/performance-reviews/my-reviews', async (c) => {
  try {
    // Neue authorize() Funktion - lädt User + Permissions
    const auth = await authorize(c.req.header('Authorization'), supabase);

    // Jetzt haben wir:
    // - auth.user.id
    // - auth.user.email
    // - auth.user.role
    // - auth.hasPermission(key)
    // - auth.requirePermission(key)
    // - auth.isAdmin
    // - auth.isTeamLead

    // Business logic
    const { data, error } = await supabase
      .from('performance_reviews')
      .select('*')
      .eq('employee_id', auth.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return successResponse({ reviews: data });

  } catch (error) {
    return errorResponse(error, 'GET /my-reviews');
  }
});

// ========================================
// EXAMPLE 2: Endpoint mit Permission Check
// ========================================
// Nur Admins/HR können alle Templates sehen

app.get('/make-server-f659121d/performance-reviews/templates', async (c) => {
  try {
    const auth = await authorize(c.req.header('Authorization'), supabase);

    // Option 1: Permission Check mit if
    if (!auth.hasPermission(PermissionKey.CREATE_COURSES)) {
      // Du kannst auch eigene Permission-Keys definieren, z.B.:
      // 'manage_performance_reviews' - muss dann in /config/permissions.ts
      // und in der DB-Tabelle 'permissions' existieren
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Option 2: requirePermission() - wirft ForbiddenError automatisch
    // auth.requirePermission('manage_performance_reviews');

    // Business logic
    const { data, error } = await supabase
      .from('performance_review_templates')
      .select('*')
      .order('title');

    if (error) throw error;

    return successResponse({ templates: data });

  } catch (error) {
    return errorResponse(error, 'GET /templates');
  }
});

// ========================================
// EXAMPLE 3: Endpoint mit komplexer Logik
// ========================================
// User kann seine eigenen Reviews bearbeiten,
// Manager kann Reviews seines Teams bearbeiten,
// Admins können alles bearbeiten

app.patch('/make-server-f659121d/performance-reviews/:id', async (c) => {
  try {
    const auth = await authorize(c.req.header('Authorization'), supabase);
    const reviewId = c.req.param('id');
    const body = await c.req.json();

    // 1. Review laden
    const { data: review, error: reviewError } = await supabase
      .from('performance_reviews')
      .select('*, employee:users!employee_id(id, first_name, last_name, team_id)')
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // 2. Permission Check - komplexe Logik
    const canEdit = 
      // User kann eigene Reviews bearbeiten
      review.employee_id === auth.user.id ||
      // Manager kann Team-Reviews bearbeiten (wenn Permission vorhanden)
      (auth.hasPermission(PermissionKey.APPROVE_LEAVE_REQUESTS) && 
       review.manager_id === auth.user.id) ||
      // Admins können alles
      auth.isAdmin;

    if (!canEdit) {
      return c.json({ 
        error: 'You do not have permission to edit this review' 
      }, 403);
    }

    // 3. Business logic - Update
    const { data, error } = await supabase
      .from('performance_reviews')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;

    return successResponse({ review: data });

  } catch (error) {
    return errorResponse(error, 'PATCH /performance-reviews/:id');
  }
});

// ========================================
// EXAMPLE 4: Admin-Only Endpoint
// ========================================
// Nur Admins können Templates löschen

app.delete('/make-server-f659121d/performance-reviews/templates/:id', async (c) => {
  try {
    const auth = await authorize(c.req.header('Authorization'), supabase);
    const templateId = c.req.param('id');

    // Einfacher Admin-Check
    if (!auth.isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    // Alternative: Spezifische Permission
    // auth.requirePermission('delete_performance_review_templates');

    // Business logic
    const { error } = await supabase
      .from('performance_review_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;

    return successResponse({ success: true });

  } catch (error) {
    return errorResponse(error, 'DELETE /templates/:id');
  }
});

// ========================================
// EXAMPLE 5: Optional Auth
// ========================================
// Public endpoint, aber unterschiedliches Verhalten für Auth-User

import { authorizeOptional } from '../_shared/auth.ts';

app.get('/make-server-f659121d/performance-reviews/public-stats', async (c) => {
  try {
    // authorizeOptional() gibt null zurück statt Exception
    const auth = await authorizeOptional(c.req.header('Authorization'), supabase);

    let stats;

    if (auth) {
      // Authenticated: Zeige detaillierte Stats
      const { data } = await supabase
        .from('performance_reviews')
        .select('status')
        .eq('employee_id', auth.user.id);

      stats = {
        total: data?.length || 0,
        completed: data?.filter(r => r.status === 'COMPLETED').length || 0,
        pending: data?.filter(r => r.status === 'SENT').length || 0,
      };
    } else {
      // Public: Nur aggregierte Stats
      const { count } = await supabase
        .from('performance_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'COMPLETED');

      stats = {
        total_completed_reviews: count || 0,
      };
    }

    return successResponse({ stats });

  } catch (error) {
    return errorResponse(error, 'GET /public-stats');
  }
});

// ========================================
// START SERVER
// ========================================
Deno.serve(app.fetch);

/**
 * MIGRATION CHECKLIST
 * ===================
 * 
 * Beim Migrieren einer Edge Function:
 * 
 * ✅ 1. Import hinzufügen:
 *      import { authorize, authorizeOptional } from '../_shared/auth.ts';
 *      import { PermissionKey } from '../_shared/permissions.ts';
 *      import { errorResponse, successResponse } from '../_shared/errors.ts';
 * 
 * ✅ 2. requireAuth() ERSETZEN durch:
 *      const auth = await authorize(c.req.header('Authorization'), supabase);
 * 
 * ✅ 3. hasPermission() ERSETZEN durch:
 *      auth.hasPermission(PermissionKey.XYZ)
 *      oder
 *      auth.requirePermission(PermissionKey.XYZ)
 * 
 * ✅ 4. isAdmin() ERSETZEN durch:
 *      auth.isAdmin
 * 
 * ✅ 5. user.id ERSETZEN durch:
 *      auth.user.id
 * 
 * ✅ 6. Error Handling vereinheitlichen:
 *      return errorResponse(error, 'FUNCTION_NAME')
 * 
 * ✅ 7. Success Response vereinheitlichen:
 *      return successResponse({ data })
 * 
 * ✅ 8. Permission-Keys prüfen:
 *      Existiert der Permission-Key in /config/permissions.ts?
 *      Existiert er in der DB-Tabelle 'permissions'?
 *      Falls nicht: Entweder hinzufügen oder generische Keys nutzen
 * 
 * ✅ 9. Testen:
 *      - Ohne Auth → 401 Unauthorized
 *      - Mit falscher Permission → 403 Forbidden
 *      - Mit richtiger Permission → 200 OK
 * 
 * ✅ 10. Alte Helper-Funktionen löschen:
 *       - getUserFromRequest()
 *       - requireAuth()
 *       - hasPermission()
 *       - isAdmin()
 */
