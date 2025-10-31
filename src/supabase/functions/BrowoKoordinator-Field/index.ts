/**
 * BrowoKoordinator - Field Edge Function v1.0.0
 * 
 * Handles field operations: vehicles, equipment, assignments
 * 
 * Routes:
 * - GET  /health - Health check (NO AUTH)
 * - GET  /vehicles - Get all vehicles (AUTH REQUIRED)
 * - POST /vehicles - Create vehicle (HR/ADMIN)
 * - PUT  /vehicles/:id - Update vehicle (HR/ADMIN)
 * - DELETE /vehicles/:id - Delete vehicle (HR/ADMIN)
 * - GET  /equipment - Get all equipment (AUTH REQUIRED)
 * - POST /equipment - Create equipment (HR/ADMIN)
 * - PUT  /equipment/:id - Update equipment (HR/ADMIN)
 * - DELETE /equipment/:id - Delete equipment (HR/ADMIN)
 * - POST /checkout - Checkout item (AUTH REQUIRED)
 * - POST /checkin - Checkin item (AUTH REQUIRED)
 * - GET  /my-assignments - Get user's assignments (AUTH REQUIRED)
 * - GET  /history - Assignment history (AUTH REQUIRED)
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();

// Initialize Supabase client with service role key for admin operations
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

// Enable logger
app.use('*', logger(console.log));

// CORS Configuration (for Figma Make compatibility)
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

// ==================== AUTH MIDDLEWARE ====================

async function verifyAuth(authHeader: string | null): Promise<{ id: string; email?: string; role?: string; organization_id?: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('[Field] Auth error:', error);
      return null;
    }

    // Get organization_id from users table
    const supabaseAdmin = getSupabaseClient();
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('[Field] Error fetching user data:', userError);
    }

    return {
      id: user.id,
      email: user.email,
      role: userData?.role || user.user_metadata?.role,
      organization_id: userData?.organization_id,
    };
  } catch (error) {
    console.error('[Field] Auth verification failed:', error);
    return null;
  }
}

function isHROrAdmin(role?: string): boolean {
  if (!role) return false;
  return ['HR', 'ADMIN', 'SUPERADMIN'].includes(role);
}

// ==================== ROUTES ====================

// Health check (no auth required)
app.get("/BrowoKoordinator-Field/health", (c) => {
  return c.json({
    status: "ok",
    function: "BrowoKoordinator-Field",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Get All Vehicles
app.get("/BrowoKoordinator-Field/vehicles", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Field] Unauthorized vehicles request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!user.organization_id) {
      return c.json({ error: 'No organization found' }, 400);
    }

    console.log('[Field] Get vehicles:', { userId: user.id, orgId: user.organization_id });

    const supabase = getSupabaseClient();

    // Fetch all vehicles for the organization
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false });

    if (vehiclesError) {
      console.error('[Field] Error fetching vehicles:', vehiclesError);
      return c.json({ error: 'Failed to fetch vehicles', details: vehiclesError.message }, 500);
    }

    return c.json({
      success: true,
      vehicles: vehicles || [],
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Field] Get vehicles error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Create Vehicle
app.post("/BrowoKoordinator-Field/vehicles", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Field] Unauthorized create vehicle');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - HR or Admin required' }, 403);
    }

    if (!user.organization_id) {
      return c.json({ error: 'No organization found' }, 400);
    }

    const body = await c.req.json();
    const { 
      kennzeichen,
      modell,
      fahrzeugtyp,
      ladekapazitaet,
      dienst_start,
      letzte_wartung,
      images,
      documents,
      wartungen,
      unfaelle,
      thumbnail,
      status,
      notes,
    } = body;

    if (!kennzeichen || !modell || !fahrzeugtyp) {
      return c.json({ error: 'Missing required fields: kennzeichen, modell, fahrzeugtyp' }, 400);
    }

    console.log('[Field] Create vehicle:', { userId: user.id, kennzeichen, modell });

    const supabase = getSupabaseClient();

    // Insert vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .insert({
        organization_id: user.organization_id,
        kennzeichen,
        modell,
        fahrzeugtyp,
        ladekapazitaet: ladekapazitaet || 0,
        dienst_start: dienst_start || null,
        letzte_wartung: letzte_wartung || null,
        images: images || [],
        documents: documents || [],
        wartungen: wartungen || [],
        unfaelle: unfaelle || [],
        thumbnail: thumbnail || null,
        status: status || 'available',
        notes: notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (vehicleError) {
      console.error('[Field] Error creating vehicle:', vehicleError);
      return c.json({ error: 'Failed to create vehicle', details: vehicleError.message }, 500);
    }

    return c.json({
      success: true,
      vehicle,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Field] Create vehicle error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Update Vehicle
app.put("/BrowoKoordinator-Field/vehicles/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Field] Unauthorized update vehicle');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - HR or Admin required' }, 403);
    }

    const vehicleId = c.req.param('id');
    const body = await c.req.json();

    console.log('[Field] Update vehicle:', { userId: user.id, vehicleId });

    const supabase = getSupabaseClient();

    // Verify vehicle exists and belongs to user's organization
    const { data: existingVehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', vehicleId)
      .eq('organization_id', user.organization_id)
      .single();

    if (checkError || !existingVehicle) {
      return c.json({ error: 'Vehicle not found or access denied' }, 404);
    }

    // Update vehicle fields
    const updateFields: any = {};
    if (body.kennzeichen !== undefined) updateFields.kennzeichen = body.kennzeichen;
    if (body.modell !== undefined) updateFields.modell = body.modell;
    if (body.fahrzeugtyp !== undefined) updateFields.fahrzeugtyp = body.fahrzeugtyp;
    if (body.ladekapazitaet !== undefined) updateFields.ladekapazitaet = body.ladekapazitaet;
    if (body.dienst_start !== undefined) updateFields.dienst_start = body.dienst_start;
    if (body.letzte_wartung !== undefined) updateFields.letzte_wartung = body.letzte_wartung;
    if (body.images !== undefined) updateFields.images = body.images;
    if (body.documents !== undefined) updateFields.documents = body.documents;
    if (body.wartungen !== undefined) updateFields.wartungen = body.wartungen;
    if (body.unfaelle !== undefined) updateFields.unfaelle = body.unfaelle;
    if (body.thumbnail !== undefined) updateFields.thumbnail = body.thumbnail;
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.notes !== undefined) updateFields.notes = body.notes;

    const { data: updatedVehicle, error: updateError } = await supabase
      .from('vehicles')
      .update(updateFields)
      .eq('id', vehicleId)
      .select()
      .single();

    if (updateError) {
      console.error('[Field] Error updating vehicle:', updateError);
      return c.json({ error: 'Failed to update vehicle', details: updateError.message }, 500);
    }

    return c.json({
      success: true,
      vehicle: updatedVehicle,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Field] Update vehicle error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Delete Vehicle
app.delete("/BrowoKoordinator-Field/vehicles/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Field] Unauthorized delete vehicle');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - HR or Admin required' }, 403);
    }

    const vehicleId = c.req.param('id');

    console.log('[Field] Delete vehicle:', { userId: user.id, vehicleId });

    const supabase = getSupabaseClient();

    // Check if vehicle is currently assigned
    const { data: activeAssignments, error: assignmentError } = await supabase
      .from('field_assignments')
      .select('id')
      .eq('item_id', vehicleId)
      .eq('item_type', 'vehicle')
      .is('checked_in_at', null)
      .limit(1);

    if (assignmentError) {
      console.error('[Field] Error checking assignments:', assignmentError);
      return c.json({ error: 'Failed to check assignments', details: assignmentError.message }, 500);
    }

    if (activeAssignments && activeAssignments.length > 0) {
      return c.json({ error: 'Cannot delete vehicle - currently assigned to a user' }, 400);
    }

    // Delete vehicle
    const { error: deleteError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)
      .eq('organization_id', user.organization_id);

    if (deleteError) {
      console.error('[Field] Error deleting vehicle:', deleteError);
      return c.json({ error: 'Failed to delete vehicle', details: deleteError.message }, 500);
    }

    return c.json({
      success: true,
      message: 'Vehicle deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Field] Delete vehicle error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Get All Equipment
app.get("/BrowoKoordinator-Field/equipment", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Field] Unauthorized equipment request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!user.organization_id) {
      return c.json({ error: 'No organization found' }, 400);
    }

    console.log('[Field] Get equipment:', { userId: user.id, orgId: user.organization_id });

    const supabase = getSupabaseClient();

    // Fetch all equipment for the organization
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('*')
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false });

    if (equipmentError) {
      console.error('[Field] Error fetching equipment:', equipmentError);
      return c.json({ error: 'Failed to fetch equipment', details: equipmentError.message }, 500);
    }

    return c.json({
      success: true,
      equipment: equipment || [],
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Field] Get equipment error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Create Equipment
app.post("/BrowoKoordinator-Field/equipment", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Field] Unauthorized create equipment');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - HR or Admin required' }, 403);
    }

    if (!user.organization_id) {
      return c.json({ error: 'No organization found' }, 400);
    }

    const body = await c.req.json();
    const { 
      name,
      category,
      serial_number,
      purchase_date,
      condition,
      status,
      notes,
    } = body;

    if (!name || !category) {
      return c.json({ error: 'Missing required fields: name, category' }, 400);
    }

    console.log('[Field] Create equipment:', { userId: user.id, name, category });

    const supabase = getSupabaseClient();

    // Insert equipment
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .insert({
        organization_id: user.organization_id,
        name,
        category,
        serial_number: serial_number || null,
        purchase_date: purchase_date || null,
        condition: condition || 'good',
        status: status || 'available',
        notes: notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (equipmentError) {
      console.error('[Field] Error creating equipment:', equipmentError);
      return c.json({ error: 'Failed to create equipment', details: equipmentError.message }, 500);
    }

    return c.json({
      success: true,
      equipment,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Field] Create equipment error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Update Equipment
app.put("/BrowoKoordinator-Field/equipment/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Field] Unauthorized update equipment');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - HR or Admin required' }, 403);
    }

    const equipmentId = c.req.param('id');
    const body = await c.req.json();

    console.log('[Field] Update equipment:', { userId: user.id, equipmentId });

    const supabase = getSupabaseClient();

    // Verify equipment exists and belongs to user's organization
    const { data: existingEquipment, error: checkError } = await supabase
      .from('equipment')
      .select('id')
      .eq('id', equipmentId)
      .eq('organization_id', user.organization_id)
      .single();

    if (checkError || !existingEquipment) {
      return c.json({ error: 'Equipment not found or access denied' }, 404);
    }

    // Update equipment fields
    const updateFields: any = {};
    if (body.name !== undefined) updateFields.name = body.name;
    if (body.category !== undefined) updateFields.category = body.category;
    if (body.serial_number !== undefined) updateFields.serial_number = body.serial_number;
    if (body.purchase_date !== undefined) updateFields.purchase_date = body.purchase_date;
    if (body.condition !== undefined) updateFields.condition = body.condition;
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.notes !== undefined) updateFields.notes = body.notes;

    const { data: updatedEquipment, error: updateError } = await supabase
      .from('equipment')
      .update(updateFields)
      .eq('id', equipmentId)
      .select()
      .single();

    if (updateError) {
      console.error('[Field] Error updating equipment:', updateError);
      return c.json({ error: 'Failed to update equipment', details: updateError.message }, 500);
    }

    return c.json({
      success: true,
      equipment: updatedEquipment,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Field] Update equipment error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Delete Equipment
app.delete("/BrowoKoordinator-Field/equipment/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Field] Unauthorized delete equipment');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isHROrAdmin(user.role)) {
      return c.json({ error: 'Insufficient permissions - HR or Admin required' }, 403);
    }

    const equipmentId = c.req.param('id');

    console.log('[Field] Delete equipment:', { userId: user.id, equipmentId });

    const supabase = getSupabaseClient();

    // Check if equipment is currently assigned
    const { data: activeAssignments, error: assignmentError } = await supabase
      .from('field_assignments')
      .select('id')
      .eq('item_id', equipmentId)
      .eq('item_type', 'equipment')
      .is('checked_in_at', null)
      .limit(1);

    if (assignmentError) {
      console.error('[Field] Error checking assignments:', assignmentError);
      return c.json({ error: 'Failed to check assignments', details: assignmentError.message }, 500);
    }

    if (activeAssignments && activeAssignments.length > 0) {
      return c.json({ error: 'Cannot delete equipment - currently assigned to a user' }, 400);
    }

    // Delete equipment
    const { error: deleteError } = await supabase
      .from('equipment')
      .delete()
      .eq('id', equipmentId)
      .eq('organization_id', user.organization_id);

    if (deleteError) {
      console.error('[Field] Error deleting equipment:', deleteError);
      return c.json({ error: 'Failed to delete equipment', details: deleteError.message }, 500);
    }

    return c.json({
      success: true,
      message: 'Equipment deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Field] Delete equipment error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Checkout Item
app.post("/BrowoKoordinator-Field/checkout", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Field] Unauthorized checkout');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!user.organization_id) {
      return c.json({ error: 'No organization found' }, 400);
    }

    const body = await c.req.json();
    const { item_type, item_id, notes, assign_to_user_id } = body;

    if (!item_type || !item_id) {
      return c.json({ error: 'Missing required fields: item_type (vehicle/equipment), item_id' }, 400);
    }

    if (!['vehicle', 'equipment'].includes(item_type)) {
      return c.json({ error: 'Invalid item_type - must be vehicle or equipment' }, 400);
    }

    const assignedTo = assign_to_user_id || user.id;

    console.log('[Field] Checkout item:', { userId: user.id, item_type, item_id, assignedTo });

    const supabase = getSupabaseClient();

    // Verify item exists
    const tableName = item_type === 'vehicle' ? 'vehicles' : 'equipment';
    const { data: item, error: itemError } = await supabase
      .from(tableName)
      .select('id, status')
      .eq('id', item_id)
      .eq('organization_id', user.organization_id)
      .single();

    if (itemError || !item) {
      return c.json({ error: `${item_type} not found` }, 404);
    }

    // Check if already assigned
    const { data: existingAssignment, error: assignmentCheckError } = await supabase
      .from('field_assignments')
      .select('id')
      .eq('item_id', item_id)
      .eq('item_type', item_type)
      .is('checked_in_at', null)
      .limit(1);

    if (assignmentCheckError) {
      console.error('[Field] Error checking assignment:', assignmentCheckError);
      return c.json({ error: 'Failed to check assignment', details: assignmentCheckError.message }, 500);
    }

    if (existingAssignment && existingAssignment.length > 0) {
      return c.json({ error: `${item_type} is already checked out` }, 400);
    }

    // Create assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('field_assignments')
      .insert({
        organization_id: user.organization_id,
        item_type,
        item_id,
        assigned_to: assignedTo,
        checked_out_by: user.id,
        checked_out_at: new Date().toISOString(),
        notes: notes || null,
      })
      .select()
      .single();

    if (assignmentError) {
      console.error('[Field] Error creating assignment:', assignmentError);
      return c.json({ error: 'Failed to create assignment', details: assignmentError.message }, 500);
    }

    // Update item status
    await supabase
      .from(tableName)
      .update({ status: 'assigned' })
      .eq('id', item_id);

    return c.json({
      success: true,
      assignment,
      message: `${item_type} checked out successfully`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Field] Checkout error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Checkin Item
app.post("/BrowoKoordinator-Field/checkin", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Field] Unauthorized checkin');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { item_type, item_id, condition, notes } = body;

    if (!item_type || !item_id) {
      return c.json({ error: 'Missing required fields: item_type (vehicle/equipment), item_id' }, 400);
    }

    console.log('[Field] Checkin item:', { userId: user.id, item_type, item_id, condition });

    const supabase = getSupabaseClient();

    // Find active assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('field_assignments')
      .select('*')
      .eq('item_id', item_id)
      .eq('item_type', item_type)
      .is('checked_in_at', null)
      .single();

    if (assignmentError || !assignment) {
      return c.json({ error: `No active checkout found for this ${item_type}` }, 404);
    }

    // Verify user is the one who checked it out or has HR/Admin permissions
    if (assignment.assigned_to !== user.id && !isHROrAdmin(user.role)) {
      return c.json({ error: 'You can only check in items assigned to you' }, 403);
    }

    // Update assignment
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('field_assignments')
      .update({
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id,
        condition_on_return: condition || null,
        checkin_notes: notes || null,
      })
      .eq('id', assignment.id)
      .select()
      .single();

    if (updateError) {
      console.error('[Field] Error updating assignment:', updateError);
      return c.json({ error: 'Failed to update assignment', details: updateError.message }, 500);
    }

    // Update item status
    const tableName = item_type === 'vehicle' ? 'vehicles' : 'equipment';
    const updateItemFields: any = { status: 'available' };
    if (condition) {
      updateItemFields.condition = condition;
    }

    await supabase
      .from(tableName)
      .update(updateItemFields)
      .eq('id', item_id);

    return c.json({
      success: true,
      assignment: updatedAssignment,
      message: `${item_type} checked in successfully`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Field] Checkin error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Get My Assignments
app.get("/BrowoKoordinator-Field/my-assignments", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Field] Unauthorized my-assignments request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!user.organization_id) {
      return c.json({ error: 'No organization found' }, 400);
    }

    console.log('[Field] Get my assignments:', { userId: user.id });

    const supabase = getSupabaseClient();

    // Fetch active assignments for user
    const { data: assignments, error: assignmentsError } = await supabase
      .from('field_assignments')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('assigned_to', user.id)
      .is('checked_in_at', null)
      .order('checked_out_at', { ascending: false });

    if (assignmentsError) {
      console.error('[Field] Error fetching assignments:', assignmentsError);
      return c.json({ error: 'Failed to fetch assignments', details: assignmentsError.message }, 500);
    }

    // Fetch item details for each assignment
    const enrichedAssignments = [];
    for (const assignment of (assignments || [])) {
      const tableName = assignment.item_type === 'vehicle' ? 'vehicles' : 'equipment';
      const { data: item, error: itemError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', assignment.item_id)
        .single();

      if (!itemError && item) {
        enrichedAssignments.push({
          ...assignment,
          item,
        });
      }
    }

    return c.json({
      success: true,
      assignments: enrichedAssignments,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Field] My assignments error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Get Assignment History
app.get("/BrowoKoordinator-Field/history", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyAuth(authHeader ?? null);
    
    if (!user) {
      console.warn('[Field] Unauthorized history request');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!user.organization_id) {
      return c.json({ error: 'No organization found' }, 400);
    }

    const itemId = c.req.query('itemId');
    const itemType = c.req.query('itemType');

    console.log('[Field] Get history:', { userId: user.id, itemId, itemType });

    const supabase = getSupabaseClient();

    // Build query
    let query = supabase
      .from('field_assignments')
      .select('*')
      .eq('organization_id', user.organization_id);

    // Filter by item if provided
    if (itemId && itemType) {
      query = query.eq('item_id', itemId).eq('item_type', itemType);
    } else if (!isHROrAdmin(user.role)) {
      // Non-admin users can only see their own history
      query = query.eq('assigned_to', user.id);
    }

    // Get completed assignments (checked in)
    query = query.not('checked_in_at', 'is', null);
    query = query.order('checked_in_at', { ascending: false });

    const { data: history, error: historyError } = await query;

    if (historyError) {
      console.error('[Field] Error fetching history:', historyError);
      return c.json({ error: 'Failed to fetch history', details: historyError.message }, 500);
    }

    return c.json({
      success: true,
      history: history || [],
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Field] History error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// ==================== START SERVER ====================

Deno.serve(app.fetch);
