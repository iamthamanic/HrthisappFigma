import { projectId, publicAnonKey } from './supabase/info';

/**
 * Run startup diagnostics to check if everything is configured correctly
 * NOTE: This function will NEVER throw errors or block the app
 */
export async function runStartupDiagnostics() {
  try {
    console.log('🔍 Running startup diagnostics...');
    console.log('═'.repeat(50));
  
  // 1. Check Project ID
  console.log('📋 Project ID:', projectId);
  if (!projectId || projectId === 'YOUR_PROJECT_ID') {
    console.error('❌ Invalid project ID!');
    return false;
  }
  console.log('✅ Project ID looks valid');
  
  // 2. Check Anon Key
  console.log('🔑 Anon Key:', publicAnonKey.substring(0, 20) + '...');
  if (!publicAnonKey || publicAnonKey.length < 20) {
    console.error('❌ Invalid anon key!');
    return false;
  }
  console.log('✅ Anon key looks valid');
  
  // 3. Check Supabase URL
  const supabaseUrl = `https://${projectId}.supabase.co`;
  console.log('🔗 Supabase URL:', supabaseUrl);
  
  // 4. Test network connection
  console.log('🌐 Testing network connection...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15s
    
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      signal: controller.signal,
      method: 'GET',
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ Supabase is reachable');
      console.log(`✅ HTTP Status: ${response.status}`);
    } else {
      console.warn(`⚠️ Unexpected status: ${response.status}`);
      console.warn('Response:', await response.text());
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('⚠️ Connection timeout (15s) - this is usually OK');
        console.warn('⚠️ Supabase might be waking up from pause...');
        console.warn('⚠️ The app will continue loading anyway');
      } else if (error.message.includes('fetch')) {
        console.warn('⚠️ Network error:', error.message);
        console.warn('⚠️ This might be a CORS or network issue');
        console.warn('⚠️ The app will continue loading anyway');
      } else {
        console.warn('⚠️ Unexpected error:', error);
      }
      
      console.log('\n💡 Note: Diagnostics failed but app continues loading');
      console.log('If auth fails, check these:');
      console.log('1. Check your internet connection');
      console.log('2. Check if Supabase project is paused (visit dashboard)');
      console.log('3. Check browser console for CORS errors');
      console.log('4. Verify Supabase project ID and anon key');
      
      // Don't return false - continue anyway
    }
  }
  
  // 5. Check browser capabilities
  console.log('🌐 Browser:', navigator.userAgent);
  console.log('📱 Platform:', navigator.platform);
  console.log('🔌 Online:', navigator.onLine);
  
  if (!navigator.onLine) {
    console.error('❌ No internet connection detected!');
    return false;
  }
  console.log('✅ Internet connection active');
  
  // 6. Check localStorage availability
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('✅ localStorage is available');
  } catch (error) {
    console.error('❌ localStorage is not available:', error);
    console.error('⚠️ Auth sessions may not persist!');
  }
  
    console.log('═'.repeat(50));
    console.log('✅ Diagnostics complete (app will load regardless of results)');
    console.log('');
    
    // Always return true - diagnostics should never block the app
    return true;
  } catch (error) {
    console.error('❌ Diagnostics crashed:', error);
    console.log('⚠️ Skipping diagnostics, app will continue loading...');
    return true; // Still return true to not block the app
  }
}

/**
 * Monitor network status changes
 */
export function setupNetworkMonitoring() {
  window.addEventListener('online', () => {
    console.log('✅ Network connection restored');
  });
  
  window.addEventListener('offline', () => {
    console.error('❌ Network connection lost!');
  });
  
  // Check initial status
  if (!navigator.onLine) {
    console.warn('⚠️ No internet connection detected at startup');
  }
}
