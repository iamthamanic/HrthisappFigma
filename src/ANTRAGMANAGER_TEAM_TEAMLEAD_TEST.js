/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎯 TEAM-TEAMLEAD AUTH FIX - SPEZIFISCHER TEST
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Dieser Test überprüft speziell den AUTH-BUG-FIX:
 * - Team-Teamleads (role=TEAMLEAD mit priority_tag=BACKUP/BACKUP_BACKUP) 
 *   werden jetzt korrekt als Approver erkannt
 * 
 * ANLEITUNG:
 * 1. Öffne Browo Koordinator im Browser
 * 2. Logge dich als TEAM-TEAMLEAD ein (z.B. Anna in Büro 2 als BACKUP)
 * 3. Öffne die Console (F12)
 * 4. Kopiere diesen Code und füge ihn ein
 * 5. Führe aus: await teamleadAuthTest()
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

console.clear();
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
console.log('%c🎯 TEAM-TEAMLEAD AUTH FIX TEST', 'color: #667eea; font-size: 18px; font-weight: bold');
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
console.log('');

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 KONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const TEAMLEAD_TEST_CONFIG = {
    projectId: 'azmtojgikubegzusvhra',
    accessToken: '',
};

// Automatisch aus localStorage holen
try {
    const supabaseUrl = localStorage.getItem('supabase.auth.token');
    if (supabaseUrl) {
        const authData = JSON.parse(supabaseUrl);
        if (authData?.currentSession?.access_token) {
            TEAMLEAD_TEST_CONFIG.accessToken = authData.currentSession.access_token;
            console.log('✅ Access Token automatisch geladen');
        }
    }
} catch (e) {
    console.error('❌ Kein Access Token gefunden - bitte einloggen!');
}

// ═══════════════════════════════════════════════════════════════════════════
// 🛠️ HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getBaseUrl() {
    return `https://${TEAMLEAD_TEST_CONFIG.projectId}.supabase.co/functions/v1/BrowoKoordinator-Antragmanager`;
}

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEAMLEAD_TEST_CONFIG.accessToken}`,
    };
}

async function makeRequest(endpoint, options = {}) {
    const url = `${getBaseUrl()}${endpoint}`;
    
    console.log(`\n📡 REQUEST: ${url}`);
    if (options.method && options.method !== 'GET') {
        console.log(`   Method: ${options.method}`);
    }
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: getHeaders(),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.log(`❌ ERROR: Status ${response.status}`);
            console.log('   Response:', data);
            return { error: true, status: response.status, data };
        }
        
        console.log('✅ SUCCESS');
        console.log('   Response:', data);
        return { error: false, status: response.status, data };
        
    } catch (error) {
        console.log('❌ NETWORK ERROR:', error.message);
        return { error: true, message: error.message };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 TEAM-TEAMLEAD SPEZIFISCHE TESTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 🧪 Haupttest: Prüft ob Team-Teamlead als Approver erkannt wird
 */
window.teamleadAuthTest = async function() {
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('%c🎯 TEAM-TEAMLEAD AUTH TEST', 'color: #667eea; font-size: 18px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('');
    console.log('Dieser Test prüft den Bug-Fix:');
    console.log('✅ Team-Teamleads (BACKUP/BACKUP_BACKUP) werden als Approver erkannt');
    console.log('✅ /pending zeigt alle PENDING Requests der Team-Mitglieder');
    console.log('✅ /team-requests zeigt alle Requests der Team-Mitglieder');
    console.log('');
    
    const results = {
        userInfo: null,
        pending: null,
        teamRequests: null,
    };
    
    // 1. User Info aus Supabase holen
    console.log('\n%c1️⃣ PRÜFE USER INFO (aus Datenbank)...', 'color: #17a2b8; font-weight: bold');
    try {
        // Supabase Client aus Window holen (wenn verfügbar)
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            console.log('👤 Eingeloggter User:', user.email);
            
            // User-Rolle aus users table
            const { data: userData } = await window.supabase
                .from('users')
                .select('id, email, first_name, last_name, role')
                .eq('id', user.id)
                .single();
            
            console.log('📋 User Data:', userData);
            
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
            
            console.log('👥 Team-Mitgliedschaften:', teamMemberships);
            
            // Prüfen ob Teamlead
            const isTeamLead = teamMemberships?.some(tm => 
                tm.role === 'TEAMLEAD' && 
                ['PRIMARY', 'BACKUP', 'BACKUP_BACKUP'].includes(tm.priority_tag)
            );
            
            const teamLeadInfo = teamMemberships?.filter(tm => tm.role === 'TEAMLEAD');
            
            if (isTeamLead) {
                console.log('%c✅ USER IST TEAM-TEAMLEAD!', 'color: #28a745; font-weight: bold; font-size: 14px;');
                console.log('   Teams:', teamLeadInfo.map(t => `${t.teams.name} (${t.priority_tag})`).join(', '));
            } else {
                console.log('%c⚠️ USER IST KEIN TEAM-TEAMLEAD', 'color: #ffc107; font-weight: bold; font-size: 14px;');
                console.log('   Dieser Test sollte mit einem Team-Teamlead durchgeführt werden!');
            }
            
            results.userInfo = {
                user: userData,
                teamMemberships,
                isTeamLead,
                teamLeadInfo,
            };
        } else {
            console.log('⚠️ Supabase Client nicht verfügbar - überspringe User Info Check');
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der User Info:', error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. PENDING Requests abrufen (KRITISCHER TEST!)
    console.log('\n%c2️⃣ TESTE /pending ENDPOINT (KRITISCH!)...', 'color: #ffc107; font-weight: bold');
    console.log('   Erwartung: 200 OK wenn Team-Teamlead');
    console.log('   Bug (vorher): 403 Forbidden weil nur users.role geprüft wurde');
    console.log('   Fix (jetzt): 200 OK weil team_members.role auch geprüft wird');
    console.log('');
    
    results.pending = await makeRequest('/pending');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (results.pending && !results.pending.error) {
        console.log('%c✅ /pending FUNKTIONIERT!', 'color: #28a745; font-weight: bold; font-size: 14px;');
        console.log(`   Anzahl pending Requests: ${results.pending.data.count}`);
        if (results.pending.data.pending && results.pending.data.pending.length > 0) {
            console.log('   Requests:');
            results.pending.data.pending.forEach(req => {
                console.log(`   - ${req.user?.first_name} ${req.user?.last_name}: ${req.type} (${req.start_date} - ${req.end_date})`);
            });
        }
    } else if (results.pending && results.pending.status === 403) {
        console.log('%c❌ /pending FEHLER - 403 Forbidden!', 'color: #dc3545; font-weight: bold; font-size: 14px;');
        console.log('   DER BUG IST NOCH DA! Team-Teamlead wird nicht erkannt!');
    }
    
    // 3. TEAM REQUESTS abrufen
    console.log('\n%c3️⃣ TESTE /team-requests ENDPOINT...', 'color: #667eea; font-weight: bold');
    console.log('   Erwartung: 200 OK wenn Team-Teamlead');
    console.log('');
    
    results.teamRequests = await makeRequest('/team-requests');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (results.teamRequests && !results.teamRequests.error) {
        console.log('%c✅ /team-requests FUNKTIONIERT!', 'color: #28a745; font-weight: bold; font-size: 14px;');
        console.log(`   Anzahl Team-Requests: ${results.teamRequests.data.count}`);
        if (results.teamRequests.data.requests && results.teamRequests.data.requests.length > 0) {
            console.log('   Requests:');
            results.teamRequests.data.requests.forEach(req => {
                console.log(`   - ${req.user?.first_name} ${req.user?.last_name}: ${req.type} ${req.status} (${req.start_date} - ${req.end_date})`);
            });
        }
    } else if (results.teamRequests && results.teamRequests.status === 403) {
        console.log('%c❌ /team-requests FEHLER - 403 Forbidden!', 'color: #dc3545; font-weight: bold; font-size: 14px;');
        console.log('   DER BUG IST NOCH DA! Team-Teamlead wird nicht erkannt!');
    }
    
    // FINAL SUMMARY
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('%c📊 TEST SUMMARY', 'color: #667eea; font-size: 16px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('');
    
    const pendingSuccess = results.pending && !results.pending.error;
    const teamRequestsSuccess = results.teamRequests && !results.teamRequests.error;
    const allSuccess = pendingSuccess && teamRequestsSuccess;
    
    if (results.userInfo?.isTeamLead) {
        console.log('👤 User ist Team-Teamlead:', results.userInfo.teamLeadInfo.map(t => `${t.teams.name} (${t.priority_tag})`).join(', '));
    }
    console.log('');
    console.log(`${pendingSuccess ? '✅' : '❌'} /pending:        ${pendingSuccess ? 'SUCCESS' : 'FAILED'} (${results.pending?.status || 'N/A'})`);
    console.log(`${teamRequestsSuccess ? '✅' : '❌'} /team-requests: ${teamRequestsSuccess ? 'SUCCESS' : 'FAILED'} (${results.teamRequests?.status || 'N/A'})`);
    console.log('');
    
    if (allSuccess) {
        console.log('%c🎉 AUTH-FIX ERFOLGREICH!', 'color: #28a745; font-size: 18px; font-weight: bold');
        console.log('%cTeam-Teamleads werden jetzt korrekt als Approver erkannt!', 'color: #28a745; font-weight: bold');
    } else {
        console.log('%c❌ AUTH-FIX FEHLGESCHLAGEN!', 'color: #dc3545; font-size: 18px; font-weight: bold');
        console.log('%cBitte prüfe:');
        console.log('  1. Wurde die Function neu deployed?');
        console.log('  2. Ist der User wirklich ein Team-Teamlead (BACKUP/BACKUP_BACKUP)?');
        console.log('  3. Sind die RLS-Policies korrekt?');
    }
    
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    
    return results;
};

/**
 * 🧪 Approval Workflow Test
 */
window.teamleadApprovalTest = async function() {
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('%c🧪 TEAM-TEAMLEAD APPROVAL WORKFLOW TEST', 'color: #667eea; font-size: 18px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('');
    console.log('Dieser Test führt einen kompletten Approval-Workflow durch:');
    console.log('1. Pending Requests abrufen');
    console.log('2. Ersten Request genehmigen');
    console.log('3. Verifizieren dass Request approved ist');
    console.log('');
    
    // 1. Pending abrufen
    console.log('%c1️⃣ PENDING REQUESTS ABRUFEN...', 'color: #17a2b8; font-weight: bold');
    const pending = await makeRequest('/pending');
    
    if (!pending || pending.error || !pending.data.pending || pending.data.pending.length === 0) {
        console.log('%c⚠️ KEINE PENDING REQUESTS GEFUNDEN', 'color: #ffc107; font-weight: bold');
        console.log('   Bitte erstelle erst einen Urlaubsantrag von einem Team-Mitglied.');
        return null;
    }
    
    const firstRequest = pending.data.pending[0];
    console.log(`✅ Gefunden: ${firstRequest.user?.first_name} ${firstRequest.user?.last_name} - ${firstRequest.type}`);
    console.log(`   Zeitraum: ${firstRequest.start_date} - ${firstRequest.end_date}`);
    console.log(`   Tage: ${firstRequest.days}`);
    console.log('');
    
    // 2. Genehmigen
    const confirm = window.confirm(`Möchtest du den Antrag von ${firstRequest.user?.first_name} ${firstRequest.user?.last_name} genehmigen?`);
    
    if (!confirm) {
        console.log('%c❌ ABGEBROCHEN', 'color: #dc3545; font-weight: bold');
        return null;
    }
    
    console.log('%c2️⃣ ANTRAG GENEHMIGEN...', 'color: #28a745; font-weight: bold');
    const approved = await makeRequest(`/approve/${firstRequest.id}`, {
        method: 'POST',
        body: JSON.stringify({ comment: 'Automatisch genehmigt via Team-Teamlead Auth Test' }),
    });
    
    if (!approved || approved.error) {
        console.log('%c❌ GENEHMIGUNG FEHLGESCHLAGEN!', 'color: #dc3545; font-weight: bold');
        return null;
    }
    
    console.log('%c✅ ERFOLGREICH GENEHMIGT!', 'color: #28a745; font-weight: bold');
    console.log('');
    
    // 3. Verifizieren
    console.log('%c3️⃣ VERIFIZIEREN...', 'color: #17a2b8; font-weight: bold');
    const teamRequests = await makeRequest('/team-requests?status=APPROVED');
    
    const wasApproved = teamRequests?.data?.requests?.some(r => r.id === firstRequest.id);
    
    if (wasApproved) {
        console.log('%c🎉 APPROVAL WORKFLOW ERFOLGREICH!', 'color: #28a745; font-size: 18px; font-weight: bold');
    } else {
        console.log('%c⚠️ VERIFIZIERUNG FEHLGESCHLAGEN', 'color: #ffc107; font-weight: bold');
    }
    
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    
    return {
        request: firstRequest,
        approved: approved?.data,
        verified: wasApproved,
    };
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎬 AUTO-START
// ═══════════════════════════════════════════════════════════════════════════

console.log('');
console.log('%c✅ TEAM-TEAMLEAD AUTH TEST SUITE GELADEN!', 'color: #28a745; font-size: 16px; font-weight: bold');
console.log('');
console.log('%c📋 VERFÜGBARE TESTS:', 'color: #667eea; font-weight: bold');
console.log('');
console.log('1️⃣ Auth Fix Test (empfohlen):');
console.log('   %cawait teamleadAuthTest()', 'color: #667eea; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('2️⃣ Approval Workflow Test:');
console.log('   %cawait teamleadApprovalTest()', 'color: #667eea; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('%c⚠️ WICHTIG:', 'color: #ffc107; font-weight: bold');
console.log('   Logge dich als TEAM-TEAMLEAD ein (z.B. Anna in Büro 2 als BACKUP)');
console.log('');
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
