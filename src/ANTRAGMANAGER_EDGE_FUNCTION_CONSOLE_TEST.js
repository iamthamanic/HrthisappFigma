/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📋 BROWO KOORDINATOR - ANTRAGMANAGER EDGE FUNCTION v1.0.0 CONSOLE TEST
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ANLEITUNG:
 * 1. Öffne Browo Koordinator im Browser
 * 2. Öffne die Browser Console (F12 oder Cmd+Option+I)
 * 3. Kopiere diesen GESAMTEN Code (Cmd+A, Cmd+C)
 * 4. Füge ihn in die Console ein (Cmd+V) und drücke Enter
 * 5. Führe die Test-Funktionen aus (siehe unten)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

console.clear();
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
console.log('%c📋 ANTRAGMANAGER EDGE FUNCTION TEST v1.0.0', 'color: #667eea; font-size: 18px; font-weight: bold');
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
console.log('');

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 KONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const ANTRAG_TEST_CONFIG = {
    projectId: '', // <-- HIER DEINE PROJECT ID EINTRAGEN
    anonKey: '',   // <-- HIER DEINEN ANON KEY EINTRAGEN
    accessToken: '', // <-- (Optional) Access Token für authentifizierte Tests
};

// Automatisch aus localStorage holen, falls verfügbar
try {
    const supabaseUrl = localStorage.getItem('supabase.auth.token');
    if (supabaseUrl) {
        const authData = JSON.parse(supabaseUrl);
        if (authData?.currentSession?.access_token) {
            ANTRAG_TEST_CONFIG.accessToken = authData.currentSession.access_token;
            console.log('✅ Access Token automatisch aus localStorage geladen');
        }
    }
} catch (e) {
    console.log('ℹ️  Kein Access Token im localStorage gefunden');
}

// ═══════════════════════════════════════════════════════════════════════════
// 🛠️ HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getBaseUrl() {
    if (!ANTRAG_TEST_CONFIG.projectId) {
        console.error('❌ PROJECT ID FEHLT! Bitte setze ANTRAG_TEST_CONFIG.projectId');
        return null;
    }
    return `https://${ANTRAG_TEST_CONFIG.projectId}.supabase.co/functions/v1/BrowoKoordinator-Antragmanager`;
}

function getHeaders(requireAuth = true) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (requireAuth) {
        const token = ANTRAG_TEST_CONFIG.accessToken || ANTRAG_TEST_CONFIG.anonKey;
        if (!token) {
            console.error('❌ AUTH TOKEN FEHLT! Bitte setze ANTRAG_TEST_CONFIG.accessToken oder anonKey');
            return null;
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

async function makeRequest(endpoint, options = {}, requireAuth = true) {
    const baseUrl = getBaseUrl();
    if (!baseUrl) return null;

    const headers = getHeaders(requireAuth);
    if (requireAuth && !headers) return null;

    const url = `${baseUrl}${endpoint}`;

    console.log('%c📡 REQUEST:', 'color: #17a2b8; font-weight: bold', url);
    if (options.method && options.method !== 'GET') {
        console.log('   Method:', options.method);
    }
    if (options.body) {
        console.log('   Body:', JSON.parse(options.body));
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers: { ...headers, ...options.headers },
        });

        const data = await response.json();

        if (!response.ok) {
            console.log('%c❌ ERROR:', 'color: #dc3545; font-weight: bold', `Status ${response.status}`);
            console.log('   Response:', data);
            return { error: true, status: response.status, data };
        }

        console.log('%c✅ SUCCESS:', 'color: #28a745; font-weight: bold');
        console.log('   Response:', data);
        return { error: false, status: response.status, data };

    } catch (error) {
        console.log('%c❌ NETWORK ERROR:', 'color: #dc3545; font-weight: bold', error.message);
        return { error: true, message: error.message };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 TEST FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 🏥 Health Check (KEIN Auth erforderlich)
 */
window.antragHealth = async function() {
    console.log('\n%c═══ 🏥 HEALTH CHECK ═══', 'color: #28a745; font-size: 16px; font-weight: bold');
    return await makeRequest('/health', {}, false);
};

/**
 * ➕ Urlaubsantrag einreichen
 * @param {object} requestData - Antragsdaten
 * @param {string} requestData.type - VACATION|SICK|UNPAID_LEAVE|SPECIAL
 * @param {string} requestData.start_date - Start Datum (YYYY-MM-DD)
 * @param {string} requestData.end_date - End Datum (YYYY-MM-DD)
 * @param {string} requestData.comment - Kommentar (optional)
 * @param {boolean} requestData.is_half_day - Halber Tag (optional)
 * @param {string} requestData.federal_state - Bundesland (optional, default: NRW)
 */
window.antragSubmit = async function(requestData) {
    console.log('\n%c═══ ➕ URLAUBSANTRAG EINREICHEN ═══', 'color: #667eea; font-size: 16px; font-weight: bold');
    
    if (!requestData.type || !requestData.start_date || !requestData.end_date) {
        console.error('❌ Fehlende Pflichtfelder: type, start_date, end_date');
        return null;
    }

    return await makeRequest('/submit', {
        method: 'POST',
        body: JSON.stringify(requestData),
    });
};

/**
 * 📋 Meine Anträge abrufen
 * @param {string} status - Optional: Filter nach Status (PENDING|APPROVED|REJECTED)
 * @param {number} year - Optional: Filter nach Jahr (z.B. 2025)
 */
window.antragMyRequests = async function(status = null, year = null) {
    console.log('\n%c═══ 📋 MEINE ANTRÄGE ═══', 'color: #667eea; font-size: 16px; font-weight: bold');
    
    let query = '?';
    if (status) query += `status=${status}&`;
    if (year) query += `year=${year}&`;

    return await makeRequest(`/my-requests${query}`);
};

/**
 * ⏳ Wartende Genehmigungen (Teamlead/HR)
 */
window.antragPending = async function() {
    console.log('\n%c═══ ⏳ WARTENDE GENEHMIGUNGEN ═══', 'color: #ffc107; font-size: 16px; font-weight: bold');
    return await makeRequest('/pending');
};

/**
 * ✅ Antrag genehmigen (Teamlead/HR)
 * @param {string} requestId - Antrags-ID
 * @param {string} comment - Kommentar (optional)
 */
window.antragApprove = async function(requestId, comment = '') {
    console.log('\n%c═══ ✅ ANTRAG GENEHMIGEN ═══', 'color: #28a745; font-size: 16px; font-weight: bold');
    
    if (!requestId) {
        console.error('❌ Fehlende Request ID');
        return null;
    }

    return await makeRequest(`/approve/${requestId}`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
    });
};

/**
 * ❌ Antrag ablehnen (Teamlead/HR)
 * @param {string} requestId - Antrags-ID
 * @param {string} reason - Ablehnungsgrund (erforderlich)
 */
window.antragReject = async function(requestId, reason) {
    console.log('\n%c═══ ❌ ANTRAG ABLEHNEN ═══', 'color: #dc3545; font-size: 16px; font-weight: bold');
    
    if (!requestId || !reason) {
        console.error('❌ Fehlende Pflichtfelder: requestId, reason');
        return null;
    }

    return await makeRequest(`/reject/${requestId}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    });
};

/**
 * 👥 Team-Anträge abrufen (Teamlead/HR)
 * @param {string} status - Optional: Filter nach Status
 * @param {number} year - Optional: Filter nach Jahr
 */
window.antragTeamRequests = async function(status = null, year = null) {
    console.log('\n%c═══ 👥 TEAM-ANTRÄGE ═══', 'color: #667eea; font-size: 16px; font-weight: bold');
    
    let query = '?';
    if (status) query += `status=${status}&`;
    if (year) query += `year=${year}&`;

    return await makeRequest(`/team-requests${query}`);
};

/**
 * 🗑️ Antrag zurückziehen (nur PENDING)
 * @param {string} requestId - Antrags-ID
 */
window.antragWithdraw = async function(requestId) {
    console.log('\n%c═══ 🗑️ ANTRAG ZURÜCKZIEHEN ═══', 'color: #ffc107; font-size: 16px; font-weight: bold');
    
    if (!requestId) {
        console.error('❌ Fehlende Request ID');
        return null;
    }

    if (!confirm('Möchtest du diesen Antrag wirklich zurückziehen?')) {
        console.log('❌ Abgebrochen');
        return null;
    }

    return await makeRequest(`/withdraw/${requestId}`, {
        method: 'DELETE',
    });
};

/**
 * 🚫 Genehmigten Antrag stornieren (Teamlead/HR)
 * @param {string} requestId - Antrags-ID
 * @param {string} reason - Stornierungsgrund (erforderlich)
 */
window.antragCancel = async function(requestId, reason) {
    console.log('\n%c═══ 🚫 ANTRAG STORNIEREN ═══', 'color: #dc3545; font-size: 16px; font-weight: bold');
    
    if (!requestId || !reason) {
        console.error('❌ Fehlende Pflichtfelder: requestId, reason');
        return null;
    }

    if (!confirm('Möchtest du diesen genehmigten Antrag wirklich stornieren?')) {
        console.log('❌ Abgebrochen');
        return null;
    }

    return await makeRequest(`/cancel/${requestId}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    });
};

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 QUICK START TESTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ⚡ Schnelltest: Alle Basis-Funktionen testen
 */
window.antragQuickTest = async function() {
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('%c⚡ QUICK TEST - Alle Basis-Funktionen', 'color: #667eea; font-size: 18px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');

    const results = {
        health: null,
        myRequests: null,
        pending: null,
        teamRequests: null,
    };

    // 1. Health Check
    console.log('\n1️⃣ Health Check...');
    results.health = await antragHealth();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Meine Anträge
    console.log('\n2️⃣ Meine Anträge abrufen...');
    results.myRequests = await antragMyRequests();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Wartende Genehmigungen (kann 403 sein wenn kein Approver)
    console.log('\n3️⃣ Wartende Genehmigungen...');
    results.pending = await antragPending();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 4. Team-Anträge (kann 403 sein wenn kein Approver)
    console.log('\n4️⃣ Team-Anträge...');
    results.teamRequests = await antragTeamRequests();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Summary
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('%c📊 QUICK TEST SUMMARY', 'color: #667eea; font-size: 16px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    
    const passed = Object.values(results).filter(r => r && (!r.error || r.status === 403)).length;
    const total = Object.keys(results).length;
    
    console.log(`✅ Erfolgreich/Erlaubt: ${passed}/${total}`);
    console.log(`❌ Fehler: ${total - passed}/${total}`);
    
    if (passed === total) {
        console.log('%c🎉 ALLE TESTS BESTANDEN!', 'color: #28a745; font-size: 18px; font-weight: bold');
    } else {
        console.log('%c⚠️ EINIGE TESTS FEHLGESCHLAGEN', 'color: #ffc107; font-size: 18px; font-weight: bold');
    }

    return results;
};

/**
 * 🎯 Konfiguration anzeigen
 */
window.antragShowConfig = function() {
    console.log('\n%c═══ 🎯 AKTUELLE KONFIGURATION ═══', 'color: #667eea; font-size: 16px; font-weight: bold');
    console.log('Project ID:', ANTRAG_TEST_CONFIG.projectId || '❌ NICHT GESETZT');
    console.log('ANON Key:', ANTRAG_TEST_CONFIG.anonKey ? '✅ Gesetzt' : '❌ NICHT GESETZT');
    console.log('Access Token:', ANTRAG_TEST_CONFIG.accessToken ? '✅ Gesetzt' : 'ℹ️ Optional');
};

/**
 * ⚙️ Konfiguration setzen
 */
window.antragSetConfig = function(projectId, anonKey, accessToken = '') {
    ANTRAG_TEST_CONFIG.projectId = projectId;
    ANTRAG_TEST_CONFIG.anonKey = anonKey;
    if (accessToken) {
        ANTRAG_TEST_CONFIG.accessToken = accessToken;
    }
    console.log('✅ Konfiguration aktualisiert!');
    antragShowConfig();
};

// ═══════════════════════════════════════════════════════════════════════════
// 📖 HILFE
// ═══════════════════════════════════════════════════════════════════════════

window.antragHelp = function() {
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('%c📖 ANTRAGMANAGER EDGE FUNCTION TEST - HILFE', 'color: #667eea; font-size: 18px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('');
    console.log('%c🔧 KONFIGURATION:', 'color: #17a2b8; font-weight: bold');
    console.log('  antragShowConfig()                       - Zeigt aktuelle Konfiguration');
    console.log('  antragSetConfig(projectId, anonKey, token) - Konfiguration setzen');
    console.log('');
    console.log('%c⚡ SCHNELLTESTS:', 'color: #28a745; font-weight: bold');
    console.log('  antragQuickTest()                        - Führt alle Basis-Tests aus');
    console.log('');
    console.log('%c🧪 TEST-FUNKTIONEN:', 'color: #667eea; font-weight: bold');
    console.log('  antragHealth()                           - Health Check (kein Auth)');
    console.log('  antragSubmit(data)                       - Urlaubsantrag einreichen');
    console.log('  antragMyRequests(status, year)           - Meine Anträge abrufen');
    console.log('  antragPending()                          - Wartende Genehmigungen');
    console.log('  antragApprove(id, comment)               - Antrag genehmigen');
    console.log('  antragReject(id, reason)                 - Antrag ablehnen');
    console.log('  antragTeamRequests(status, year)         - Team-Anträge abrufen');
    console.log('  antragWithdraw(id)                       - Antrag zurückziehen');
    console.log('  antragCancel(id, reason)                 - Genehmigten Antrag stornieren');
    console.log('');
    console.log('%c💡 BEISPIELE:', 'color: #ffc107; font-weight: bold');
    console.log('  // Health Check');
    console.log('  await antragHealth()');
    console.log('');
    console.log('  // Urlaubsantrag einreichen');
    console.log('  await antragSubmit({');
    console.log('    type: "VACATION",');
    console.log('    start_date: "2025-11-01",');
    console.log('    end_date: "2025-11-05",');
    console.log('    comment: "Familienurlaub"');
    console.log('  })');
    console.log('');
    console.log('  // Meine Anträge für 2025');
    console.log('  await antragMyRequests(null, 2025)');
    console.log('');
    console.log('  // Wartende Anträge (als Teamlead)');
    console.log('  await antragPending()');
    console.log('');
    console.log('  // Antrag genehmigen');
    console.log('  await antragApprove("request-id", "Genehmigt - viel Spaß!")');
    console.log('');
    console.log('  // Antrag ablehnen');
    console.log('  await antragReject("request-id", "Leider nicht möglich in diesem Zeitraum")');
    console.log('');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎬 AUTO-START
// ═══════════════════════════════════════════════════════════════════════════

console.log('');
console.log('%c✅ ANTRAGMANAGER TEST SUITE GELADEN!', 'color: #28a745; font-size: 16px; font-weight: bold');
console.log('');
console.log('%c📋 NÄCHSTE SCHRITTE:', 'color: #667eea; font-weight: bold');
console.log('');
console.log('1️⃣ Konfiguration prüfen:');
console.log('   %cantragShowConfig()', 'color: #667eea; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('2️⃣ Konfiguration setzen (falls nötig):');
console.log('   %cantragSetConfig("deine-project-id", "dein-anon-key")', 'color: #667eea; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('3️⃣ Quick Test ausführen:');
console.log('   %cawait antragQuickTest()', 'color: #667eea; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('4️⃣ Hilfe anzeigen:');
console.log('   %cantragHelp()', 'color: #667eea; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');

// Konfiguration anzeigen
antragShowConfig();
