/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔧 TOKEN FIX - Antragmanager Test mit korrektem Access Token
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Dieser Code lädt den Access Token KORREKT aus dem localStorage
 * 
 * ANLEITUNG:
 * 1. Öffne Browo Koordinator im Browser
 * 2. Stelle sicher, dass du eingeloggt bist
 * 3. Öffne die Console (F12)
 * 4. Kopiere diesen Code und füge ihn ein
 * 5. Führe aus: await antragTestWithToken()
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

console.clear();
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
console.log('%c🔧 TOKEN FIX - Antragmanager Test', 'color: #667eea; font-size: 18px; font-weight: bold');
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
console.log('');

// ═══════════════════════════════════════════════════════════════════════════
// 🔍 TOKEN FINDER - Findet den Access Token im localStorage
// ═══════════════════════════════════════════════════════════════════════════

function findAccessToken() {
    console.log('%c🔍 SUCHE ACCESS TOKEN...', 'color: #17a2b8; font-weight: bold');
    console.log('');
    
    // Alle möglichen localStorage Keys durchsuchen
    const possibleKeys = [
        'supabase.auth.token',
        'sb-azmtojgikubegzusvhra-auth-token',
        'sb-auth-token',
    ];
    
    // Durch alle localStorage Keys iterieren
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('auth')) {
            console.log(`   Gefunden: ${key}`);
        }
    }
    
    console.log('');
    console.log('%cVERSUCHE TOKEN ZU LADEN...', 'color: #17a2b8; font-weight: bold');
    
    // Versuche 1: Standard Supabase Key
    for (const key of possibleKeys) {
        try {
            const data = localStorage.getItem(key);
            if (data) {
                console.log(`   ✅ Gefunden in: ${key}`);
                const parsed = JSON.parse(data);
                
                // Verschiedene Strukturen prüfen
                const token = 
                    parsed?.currentSession?.access_token || 
                    parsed?.access_token ||
                    parsed?.session?.access_token;
                
                if (token) {
                    console.log('%c   ✅ ACCESS TOKEN GEFUNDEN!', 'color: #28a745; font-weight: bold');
                    console.log(`   Token Länge: ${token.length} Zeichen`);
                    console.log(`   Token Start: ${token.substring(0, 20)}...`);
                    return token;
                }
            }
        } catch (e) {
            // Ignoriere Parse-Fehler
        }
    }
    
    // Versuche 2: Direkt alle Keys durchsuchen
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth'))) {
            try {
                const data = localStorage.getItem(key);
                const parsed = JSON.parse(data);
                
                const token = 
                    parsed?.currentSession?.access_token || 
                    parsed?.access_token ||
                    parsed?.session?.access_token;
                
                if (token) {
                    console.log(`   ✅ TOKEN GEFUNDEN in: ${key}`);
                    return token;
                }
            } catch (e) {
                // Ignoriere
            }
        }
    }
    
    console.log('%c   ❌ KEIN TOKEN GEFUNDEN!', 'color: #dc3545; font-weight: bold');
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 ANTRAGMANAGER TEST MIT TOKEN
// ═══════════════════════════════════════════════════════════════════════════

window.antragTestWithToken = async function() {
    console.log('');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('%c🧪 ANTRAGMANAGER TEST MIT TOKEN', 'color: #667eea; font-size: 18px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('');
    
    // 1. Token finden
    const accessToken = findAccessToken();
    
    if (!accessToken) {
        console.log('');
        console.log('%c❌ FEHLER: Kein Access Token gefunden!', 'color: #dc3545; font-size: 16px; font-weight: bold');
        console.log('');
        console.log('%c📋 LÖSUNGEN:', 'color: #ffc107; font-weight: bold');
        console.log('   1. Stelle sicher, dass du eingeloggt bist');
        console.log('   2. Lade die Seite neu (Ctrl+R oder Cmd+R)');
        console.log('   3. Logge dich aus und wieder ein');
        console.log('');
        return null;
    }
    
    console.log('');
    
    // 2. User Info aus Supabase holen
    console.log('%c1️⃣ USER INFO LADEN...', 'color: #17a2b8; font-weight: bold');
    
    if (window.supabase) {
        try {
            const { data: { user }, error } = await window.supabase.auth.getUser();
            
            if (error || !user) {
                console.log('%c   ❌ User nicht eingeloggt!', 'color: #dc3545; font-weight: bold');
                console.log('   Fehler:', error);
                return null;
            }
            
            console.log('%c   ✅ User geladen:', 'color: #28a745; font-weight: bold', user.email);
            
            // User-Rolle prüfen
            const { data: userData } = await window.supabase
                .from('users')
                .select('id, email, first_name, last_name, role')
                .eq('id', user.id)
                .single();
            
            console.log('   User Role:', userData?.role || 'KEINE ROLLE');
            
            // Team-Mitgliedschaften prüfen
            const { data: teamMemberships } = await window.supabase
                .from('team_members')
                .select(`
                    role, 
                    priority_tag,
                    teams (
                        id,
                        name
                    )
                `)
                .eq('user_id', user.id);
            
            const teamLeads = teamMemberships?.filter(tm => tm.role === 'TEAMLEAD') || [];
            
            if (teamLeads.length > 0) {
                console.log('%c   ✅ User ist TEAM-TEAMLEAD!', 'color: #28a745; font-weight: bold');
                teamLeads.forEach(tl => {
                    console.log(`      - ${tl.teams.name} (${tl.priority_tag})`);
                });
            } else {
                console.log('%c   ⚠️ User ist KEIN Team-Teamlead', 'color: #ffc107; font-weight: bold');
            }
            
        } catch (error) {
            console.error('   ❌ Fehler beim Laden der User Info:', error);
        }
    }
    
    console.log('');
    
    // 3. /pending Test
    console.log('%c2️⃣ TESTE /pending ENDPOINT...', 'color: #ffc107; font-weight: bold');
    
    try {
        const response = await fetch('https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Antragmanager/pending', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        
        console.log(`   Response Status: ${response.status} ${response.statusText}`);
        
        const data = await response.json();
        
        if (!response.ok) {
            console.log('%c   ❌ FEHLER!', 'color: #dc3545; font-weight: bold');
            console.log('   Response:', data);
            
            if (response.status === 401) {
                console.log('');
                console.log('%c   💡 401 = UNAUTHORIZED', 'color: #ffc107; font-weight: bold');
                console.log('      Mögliche Ursachen:');
                console.log('      1. Token ist abgelaufen');
                console.log('      2. Token ist ungültig');
                console.log('      3. Edge Function erwartet anderen Token-Format');
            } else if (response.status === 403) {
                console.log('');
                console.log('%c   💡 403 = FORBIDDEN', 'color: #ffc107; font-weight: bold');
                console.log('      User hat keine Berechtigung (kein Team-Teamlead)');
            }
        } else {
            console.log('%c   ✅ SUCCESS!', 'color: #28a745; font-weight: bold');
            console.log('   Pending Requests:', data.count);
            if (data.pending && data.pending.length > 0) {
                console.log('   Requests:');
                data.pending.forEach(req => {
                    console.log(`      - ${req.user?.first_name} ${req.user?.last_name}: ${req.type}`);
                });
            }
        }
        
    } catch (error) {
        console.log('%c   ❌ NETWORK ERROR!', 'color: #dc3545; font-weight: bold');
        console.log('   Error:', error.message);
    }
    
    console.log('');
    
    // 4. /team-requests Test
    console.log('%c3️⃣ TESTE /team-requests ENDPOINT...', 'color: #667eea; font-weight: bold');
    
    try {
        const response = await fetch('https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Antragmanager/team-requests', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        
        console.log(`   Response Status: ${response.status} ${response.statusText}`);
        
        const data = await response.json();
        
        if (!response.ok) {
            console.log('%c   ❌ FEHLER!', 'color: #dc3545; font-weight: bold');
            console.log('   Response:', data);
        } else {
            console.log('%c   ✅ SUCCESS!', 'color: #28a745; font-weight: bold');
            console.log('   Team Requests:', data.count);
        }
        
    } catch (error) {
        console.log('%c   ❌ NETWORK ERROR!', 'color: #dc3545; font-weight: bold');
        console.log('   Error:', error.message);
    }
    
    console.log('');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
};

// ═══════════════════════════════════════════════════════════════════════════
// 📖 HILFE
// ═══════════════════════════════════════════════════════════════════════════

console.log('');
console.log('%c✅ TOKEN FIX TEST GELADEN!', 'color: #28a745; font-size: 16px; font-weight: bold');
console.log('');
console.log('%c📋 JETZT AUSFÜHREN:', 'color: #667eea; font-weight: bold');
console.log('   %cawait antragTestWithToken()', 'color: #667eea; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
