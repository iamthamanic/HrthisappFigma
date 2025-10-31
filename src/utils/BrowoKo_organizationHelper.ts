/**
 * @file BrowoKo_organizationHelper.ts
 * @domain BrowoKo - Organization Management
 * @description Helper functions for single-tenant organization management
 * @created Phase 3E - Utils Migration
 */

import { supabase } from './supabase/client';

/**
 * Gets the default organization ID for the current database.
 * Each Supabase database has exactly ONE default organization.
 * All users are automatically assigned to this organization.
 */
export async function getDefaultOrganizationId(): Promise<string | null> {
  try {
    // Try to get organization with is_default = true
    const { data: defaultOrgData, error: defaultOrgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('is_default', true)
      .maybeSingle();

    // If is_default column doesn't exist (error 42703), just get the first org
    if (defaultOrgError && defaultOrgError.code === '42703') {
      console.log('is_default column not found, loading first organization...');
      const { data: firstOrgData, error: firstOrgError } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (firstOrgError) {
        console.error('Error fetching first organization:', firstOrgError);
        return null;
      }

      return firstOrgData?.id || null;
    }

    if (defaultOrgError) {
      console.error('Error fetching default organization:', defaultOrgError);
      return null;
    }

    return defaultOrgData?.id || null;
  } catch (error) {
    console.error('Error in getDefaultOrganizationId:', error);
    return null;
  }
}

/**
 * Gets the full default organization object.
 */
export async function getDefaultOrganization() {
  try {
    // Try to get organization with is_default = true
    const { data: defaultOrgData, error: defaultOrgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('is_default', true)
      .maybeSingle();

    // If is_default column doesn't exist (error 42703), just get the first org
    if (defaultOrgError && defaultOrgError.code === '42703') {
      console.log('is_default column not found, loading first organization...');
      const { data: firstOrgData, error: firstOrgError } = await supabase
        .from('organizations')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (firstOrgError) {
        console.error('Error fetching first organization:', firstOrgError);
        return null;
      }

      return firstOrgData || null;
    }

    if (defaultOrgError) {
      console.error('Error fetching default organization:', defaultOrgError);
      return null;
    }

    return defaultOrgData;
  } catch (error) {
    console.error('Error in getDefaultOrganization:', error);
    return null;
  }
}

/**
 * Creates the default organization if it doesn't exist.
 * This should be called during initial setup.
 */
export async function ensureDefaultOrganizationExists(): Promise<string | null> {
  try {
    // Check if default org exists
    const existing = await getDefaultOrganizationId();
    if (existing) {
      return existing;
    }

    // Check if is_default column exists
    const checkQuery = await supabase
      .from('organizations')
      .select('*')
      .limit(0);

    const hasIsDefault = !checkQuery.error || checkQuery.error.code !== '42703';

    const insertData: any = {
      name: 'Meine Firma',
      slug: 'meine-firma',
      domain: null,
      subscription_tier: 'ENTERPRISE',
      max_users: 999999,
      is_active: true,
    };

    // Only add is_default if the column exists
    if (hasIsDefault) {
      insertData.is_default = true;
    }

    // Create default org
    const { data, error } = await supabase
      .from('organizations')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating default organization:', error);
      return null;
    }

    console.log('✅ Default organization created:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error in ensureDefaultOrganizationExists:', error);
    return null;
  }
}
