/**
 * @file diagnostics.ts
 * @description Supabase Connection Diagnostics Tool
 */

import { supabase } from './client';

export async function runSupabaseDiagnostics() {
  const results: any = {
    timestamp: new Date().toISOString(),
    checks: [],
    overallStatus: 'unknown'
  };

  console.log('🔍 Running Supabase Diagnostics...');

  // =====================================================
  // CHECK 1: Client Initialization
  // =====================================================
  try {
    if (!supabase) {
      results.checks.push({
        name: 'Client Initialization',
        status: 'FAIL',
        error: 'Supabase client is undefined'
      });
    } else {
      results.checks.push({
        name: 'Client Initialization',
        status: 'PASS',
        details: {
          hasAuth: !!supabase.auth,
          hasFrom: typeof supabase.from === 'function'
        }
      });
    }
  } catch (error: any) {
    results.checks.push({
      name: 'Client Initialization',
      status: 'FAIL',
      error: error.message
    });
  }

  // =====================================================
  // CHECK 2: Network Connectivity
  // =====================================================
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      results.checks.push({
        name: 'Network Connectivity',
        status: 'FAIL',
        error: error.message,
        code: error.code,
        details: error.details
      });
    } else {
      results.checks.push({
        name: 'Network Connectivity',
        status: 'PASS'
      });
    }
  } catch (error: any) {
    results.checks.push({
      name: 'Network Connectivity',
      status: 'FAIL',
      error: error.message
    });
  }

  // =====================================================
  // CHECK 3: Authentication
  // =====================================================
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      results.checks.push({
        name: 'Authentication',
        status: 'FAIL',
        error: error.message
      });
    } else {
      results.checks.push({
        name: 'Authentication',
        status: data?.session ? 'PASS' : 'WARN',
        details: {
          hasSession: !!data?.session,
          userId: data?.session?.user?.id
        }
      });
    }
  } catch (error: any) {
    results.checks.push({
      name: 'Authentication',
      status: 'FAIL',
      error: error.message
    });
  }

  // =====================================================
  // CHECK 4: Work Periods Table Access
  // =====================================================
  try {
    const { error } = await supabase
      .from('work_periods')
      .select('id')
      .limit(1);
    
    if (error) {
      results.checks.push({
        name: 'Work Periods Table',
        status: 'FAIL',
        error: error.message,
        code: error.code,
        hint: error.hint
      });
    } else {
      results.checks.push({
        name: 'Work Periods Table',
        status: 'PASS'
      });
    }
  } catch (error: any) {
    results.checks.push({
      name: 'Work Periods Table',
      status: 'FAIL',
      error: error.message
    });
  }

  // =====================================================
  // CHECK 5: Work Sessions Table Access
  // =====================================================
  try {
    const { error } = await supabase
      .from('work_sessions')
      .select('id')
      .limit(1);
    
    if (error) {
      results.checks.push({
        name: 'Work Sessions Table',
        status: 'FAIL',
        error: error.message,
        code: error.code,
        hint: error.hint
      });
    } else {
      results.checks.push({
        name: 'Work Sessions Table',
        status: 'PASS'
      });
    }
  } catch (error: any) {
    results.checks.push({
      name: 'Work Sessions Table',
      status: 'FAIL',
      error: error.message
    });
  }

  // =====================================================
  // OVERALL STATUS
  // =====================================================
  const failCount = results.checks.filter((c: any) => c.status === 'FAIL').length;
  const warnCount = results.checks.filter((c: any) => c.status === 'WARN').length;

  if (failCount > 0) {
    results.overallStatus = 'FAIL';
  } else if (warnCount > 0) {
    results.overallStatus = 'WARN';
  } else {
    results.overallStatus = 'PASS';
  }

  // =====================================================
  // LOG RESULTS
  // =====================================================
  console.log('📊 Diagnostics Results:', results);

  if (results.overallStatus === 'FAIL') {
    console.error('🔴 DIAGNOSTICS FAILED - Critical issues detected!');
    console.error('Failed checks:', results.checks.filter((c: any) => c.status === 'FAIL'));
  } else if (results.overallStatus === 'WARN') {
    console.warn('🟡 DIAGNOSTICS WARNING - Some issues detected');
    console.warn('Warning checks:', results.checks.filter((c: any) => c.status === 'WARN'));
  } else {
    console.log('✅ ALL DIAGNOSTICS PASSED');
  }

  return results;
}

// Auto-run on page load (dev only)
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  // Wait for auth to initialize
  setTimeout(() => {
    runSupabaseDiagnostics();
  }, 1000);
}
