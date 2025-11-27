/**
 * @file BrowoKoordinator-Fahrzeuge Edge Function
 * @version 1.0.0
 * @description Supabase Edge Function für Fahrzeug-Verwaltung mit FTS, Statistiken, Dokumenten und Wartungen
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';

// Initialize Hono app
const app = new Hono();

// CORS Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Logger
app.use('*', logger(console.log));

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ============================================
// HEALTH CHECK
// ============================================

app.get('/make-server-f659121d/health', (c) => {
  return c.json({ 
    success: true, 
    message: 'BrowoKoordinator-Fahrzeuge Edge Function is running',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// VEHICLE ROUTES
// ============================================

// Get all vehicles
app.get('/make-server-f659121d/api/vehicles', async (c) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return c.json({
      success: true,
      vehicles: data || [],
      total: data?.length || 0,
    });
  } catch (error: any) {
    console.error('Get vehicles error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Search vehicles with FTS
app.get('/make-server-f659121d/api/vehicles/search', async (c) => {
  try {
    const query = c.req.query('q');
    
    if (!query || query.trim().length === 0) {
      // Return all vehicles if no query
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return c.json({
        success: true,
        vehicles: data || [],
        total: data?.length || 0,
        query: '',
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Call the search_vehicles function
    const { data, error } = await supabase.rpc('search_vehicles', {
      search_query: query.trim()
    });

    if (error) throw error;

    return c.json({
      success: true,
      vehicles: data || [],
      total: data?.length || 0,
      query: query.trim(),
    });
  } catch (error: any) {
    console.error('Search vehicles error:', error);
    return c.json({ 
      success: false, 
      error: error.message,
      vehicles: [],
      total: 0,
    }, 500);
  }
});

// ============================================
// VEHICLE STATISTICS ROUTES
// ============================================

// Get statistics for a vehicle
app.get('/make-server-f659121d/api/vehicles/:vehicleId/statistics', async (c) => {
  try {
    const vehicleId = c.req.param('vehicleId');
    const month = c.req.query('month'); // Optional filter: YYYY-MM
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let query = supabase
      .from('vehicle_statistics')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('month', { ascending: false });
    
    if (month) {
      query = query.eq('month', month);
    }
    
    const { data, error } = await query;

    if (error) throw error;

    return c.json({
      success: true,
      statistics: data || [],
    });
  } catch (error: any) {
    console.error('Get statistics error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Create or update statistic (Upsert)
app.post('/make-server-f659121d/api/vehicles/:vehicleId/statistics', async (c) => {
  try {
    const vehicleId = c.req.param('vehicleId');
    const body = await c.req.json();
    
    const { month, verbrauchskosten, wartungskosten, sonstige_kosten, custom_fields } = body;
    
    if (!month) {
      return c.json({ 
        success: false, 
        error: 'Month is required' 
      }, 400);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Upsert (insert or update if exists)
    const { data, error } = await supabase
      .from('vehicle_statistics')
      .upsert({
        vehicle_id: vehicleId,
        month,
        verbrauchskosten: verbrauchskosten || 0,
        wartungskosten: wartungskosten || 0,
        sonstige_kosten: sonstige_kosten || 0,
        custom_fields: custom_fields || {},
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'vehicle_id,month'
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({
      success: true,
      statistic: data,
    });
  } catch (error: any) {
    console.error('Create/Update statistic error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Update statistic
app.put('/make-server-f659121d/api/vehicles/:vehicleId/statistics/:statId', async (c) => {
  try {
    const statId = c.req.param('statId');
    const body = await c.req.json();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('vehicle_statistics')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', statId)
      .select()
      .single();

    if (error) throw error;

    return c.json({
      success: true,
      statistic: data,
    });
  } catch (error: any) {
    console.error('Update statistic error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Delete statistic
app.delete('/make-server-f659121d/api/vehicles/:vehicleId/statistics/:statId', async (c) => {
  try {
    const statId = c.req.param('statId');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('vehicle_statistics')
      .delete()
      .eq('id', statId);

    if (error) throw error;

    return c.json({
      success: true,
      message: 'Statistic deleted',
    });
  } catch (error: any) {
    console.error('Delete statistic error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// ============================================
// CUSTOM COLUMNS ROUTES
// ============================================

// Get all custom columns
app.get('/make-server-f659121d/api/statistics/columns', async (c) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('vehicle_statistics_columns')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return c.json({
      success: true,
      columns: data || [],
    });
  } catch (error: any) {
    console.error('Get columns error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Create custom column
app.post('/make-server-f659121d/api/statistics/columns', async (c) => {
  try {
    const body = await c.req.json();
    const { name, type } = body;
    
    if (!name) {
      return c.json({ 
        success: false, 
        error: 'Column name is required' 
      }, 400);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('vehicle_statistics_columns')
      .insert({
        name,
        type: type || 'currency',
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({
      success: true,
      column: data,
    });
  } catch (error: any) {
    console.error('Create column error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Delete custom column
app.delete('/make-server-f659121d/api/statistics/columns/:columnId', async (c) => {
  try {
    const columnId = c.req.param('columnId');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('vehicle_statistics_columns')
      .delete()
      .eq('id', columnId);

    if (error) throw error;

    return c.json({
      success: true,
      message: 'Column deleted',
    });
  } catch (error: any) {
    console.error('Delete column error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// ============================================
// DOCUMENTS ROUTES
// ============================================

// Get documents for a vehicle
app.get('/make-server-f659121d/api/vehicles/:vehicleId/documents', async (c) => {
  try {
    const vehicleId = c.req.param('vehicleId');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('vehicle_documents')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    return c.json({
      success: true,
      documents: data || [],
    });
  } catch (error: any) {
    console.error('Get documents error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Create document
app.post('/make-server-f659121d/api/vehicles/:vehicleId/documents', async (c) => {
  try {
    const vehicleId = c.req.param('vehicleId');
    const body = await c.req.json();
    
    const { name, type, file_path, file_size, uploaded_by } = body;
    
    if (!name || !type || !file_path) {
      return c.json({ 
        success: false, 
        error: 'Name, type, and file_path are required' 
      }, 400);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('vehicle_documents')
      .insert({
        vehicle_id: vehicleId,
        name,
        type,
        file_path,
        file_size: file_size || null,
        uploaded_by: uploaded_by || null,
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({
      success: true,
      document: data,
    });
  } catch (error: any) {
    console.error('Create document error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Delete document
app.delete('/make-server-f659121d/api/vehicles/:vehicleId/documents/:docId', async (c) => {
  try {
    const docId = c.req.param('docId');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('vehicle_documents')
      .delete()
      .eq('id', docId);

    if (error) throw error;

    return c.json({
      success: true,
      message: 'Document deleted',
    });
  } catch (error: any) {
    console.error('Delete document error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// ============================================
// MAINTENANCE ROUTES
// ============================================

// Get maintenances for a vehicle
app.get('/make-server-f659121d/api/vehicles/:vehicleId/maintenances', async (c) => {
  try {
    const vehicleId = c.req.param('vehicleId');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('vehicle_maintenances')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('maintenance_date', { ascending: false });

    if (error) throw error;

    return c.json({
      success: true,
      maintenances: data || [],
    });
  } catch (error: any) {
    console.error('Get maintenances error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Create maintenance
app.post('/make-server-f659121d/api/vehicles/:vehicleId/maintenances', async (c) => {
  try {
    const vehicleId = c.req.param('vehicleId');
    const body = await c.req.json();
    
    const { title, description, maintenance_date, cost, status } = body;
    
    if (!title || !maintenance_date) {
      return c.json({ 
        success: false, 
        error: 'Title and maintenance_date are required' 
      }, 400);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('vehicle_maintenances')
      .insert({
        vehicle_id: vehicleId,
        title,
        description: description || null,
        maintenance_date,
        cost: cost || null,
        status: status || 'planned',
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({
      success: true,
      maintenance: data,
    });
  } catch (error: any) {
    console.error('Create maintenance error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Update maintenance
app.put('/make-server-f659121d/api/vehicles/:vehicleId/maintenances/:maintId', async (c) => {
  try {
    const maintId = c.req.param('maintId');
    const body = await c.req.json();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('vehicle_maintenances')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', maintId)
      .select()
      .single();

    if (error) throw error;

    return c.json({
      success: true,
      maintenance: data,
    });
  } catch (error: any) {
    console.error('Update maintenance error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// Delete maintenance
app.delete('/make-server-f659121d/api/vehicles/:vehicleId/maintenances/:maintId', async (c) => {
  try {
    const maintId = c.req.param('maintId');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('vehicle_maintenances')
      .delete()
      .eq('id', maintId);

    if (error) throw error;

    return c.json({
      success: true,
      message: 'Maintenance deleted',
    });
  } catch (error: any) {
    console.error('Delete maintenance error:', error);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

// ============================================
// 404 Handler
// ============================================

app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  }, 404);
});

// Start server
Deno.serve(app.fetch);
