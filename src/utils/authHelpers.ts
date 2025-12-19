/**
 * @file authHelpers.ts
 * @description Zentrale Auth-Helper-Funktionen für Edge Function Calls
 * @version 1.0.0
 */

import { supabase } from './supabase/client';

/**
 * Holt den aktuellen User Access Token aus der Session
 * @throws Error wenn keine Session existiert oder User nicht eingeloggt ist
 * @returns User Access Token (JWT)
 */
export async function getAuthToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('[AuthHelper] Session error:', error);
    throw new Error('Fehler beim Laden der Session: ' + error.message);
  }
  
  if (!session?.access_token) {
    console.error('[AuthHelper] No session found');
    throw new Error('Nicht angemeldet. Bitte einloggen.');
  }
  
  return session.access_token;
}

/**
 * Erstellt Authorization Header mit User Access Token
 * @returns Headers object mit Authorization
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Prüft ob User eingeloggt ist (ohne Exception zu werfen)
 * @returns true wenn Session existiert, false sonst
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.access_token;
  } catch {
    return false;
  }
}

/**
 * Holt die aktuelle User-ID aus der Session
 * @returns User ID oder null wenn nicht eingeloggt
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}
