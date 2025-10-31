/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🗓️  BROWO KOORDINATOR - KALENDER EDGE FUNCTION v2.0.0 CONSOLE TEST
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
console.log('%c🗓️  KALENDER EDGE FUNCTION TEST v2.0.0', 'color: #667eea; font-size: 18px; font-weight: bold');
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
console.log('');

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 KONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const KALENDER_TEST_CONFIG = {
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
            KALENDER_TEST_CONFIG.accessToken = authData.currentSession.access_token;
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
    if (!KALENDER_TEST_CONFIG.projectId) {
        console.error('❌ PROJECT ID FEHLT! Bitte setze KALENDER_TEST_CONFIG.projectId');
        return null;
    }
    return `https://${KALENDER_TEST_CONFIG.projectId}.supabase.co/functions/v1/BrowoKoordinator-Kalender`;
}

function getHeaders(requireAuth = true) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (requireAuth) {
        const token = KALENDER_TEST_CONFIG.accessToken || KALENDER_TEST_CONFIG.anonKey;
        if (!token) {
            console.error('❌ AUTH TOKEN FEHLT! Bitte setze KALENDER_TEST_CONFIG.accessToken oder anonKey');
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
window.kalenderHealth = async function() {
    console.log('\n%c═══ 🏥 HEALTH CHECK ═══', 'color: #28a745; font-size: 16px; font-weight: bold');
    return await makeRequest('/health', {}, false);
};

/**
 * 📅 Team Kalender abrufen
 * @param {number} month - Monat (1-12)
 * @param {number} year - Jahr (z.B. 2025)
 * @param {string} teamId - Optional: Team ID
 */
window.kalenderTeamCalendar = async function(month = null, year = null, teamId = null) {
    console.log('\n%c═══ 📅 TEAM KALENDER ═══', 'color: #667eea; font-size: 16px; font-weight: bold');
    
    const now = new Date();
    month = month || (now.getMonth() + 1);
    year = year || now.getFullYear();

    let query = `?month=${month}&year=${year}`;
    if (teamId) query += `&team_id=${teamId}`;

    return await makeRequest(`/team-calendar${query}`);
};

/**
 * 📋 Abwesenheiten abrufen
 * @param {string} startDate - Start Datum (YYYY-MM-DD)
 * @param {string} endDate - End Datum (YYYY-MM-DD)
 * @param {string} teamId - Optional: Team ID
 */
window.kalenderAbsences = async function(startDate = null, endDate = null, teamId = null) {
    console.log('\n%c═══ 📋 ABWESENHEITEN ═══', 'color: #17a2b8; font-size: 16px; font-weight: bold');
    
    let query = '?';
    if (startDate) query += `start_date=${startDate}&`;
    if (endDate) query += `end_date=${endDate}&`;
    if (teamId) query += `team_id=${teamId}&`;

    return await makeRequest(`/absences${query}`);
};

/**
 * 🎉 Deutsche Feiertage berechnen
 * @param {number} year - Jahr (z.B. 2025)
 * @param {string} state - Bundesland (NRW, BY, BW, HE, RP, SL)
 */
window.kalenderHolidays = async function(year = null, state = 'NRW') {
    console.log('\n%c═══ 🎉 DEUTSCHE FEIERTAGE ═══', 'color: #ffc107; font-size: 16px; font-weight: bold');
    
    year = year || new Date().getFullYear();
    
    return await makeRequest(`/holidays?year=${year}&state=${state}`);
};

/**
 * 👷 Schichten abrufen
 * @param {string} startDate - Optional: Start Datum (YYYY-MM-DD)
 * @param {string} endDate - Optional: End Datum (YYYY-MM-DD)
 * @param {string} userId - Optional: User ID
 * @param {string} teamId - Optional: Team ID
 */
window.kalenderGetShifts = async function(startDate = null, endDate = null, userId = null, teamId = null) {
    console.log('\n%c═══ 👷 SCHICHTEN ABRUFEN ═══', 'color: #667eea; font-size: 16px; font-weight: bold');
    
    let query = '?';
    if (startDate) query += `start_date=${startDate}&`;
    if (endDate) query += `end_date=${endDate}&`;
    if (userId) query += `user_id=${userId}&`;
    if (teamId) query += `team_id=${teamId}&`;

    return await makeRequest(`/shifts${query}`);
};

/**
 * ➕ Schicht erstellen
 * @param {object} shiftData - Schicht Daten
 * @param {string} shiftData.user_id - User ID (erforderlich)
 * @param {string} shiftData.date - Datum YYYY-MM-DD (erforderlich)
 * @param {string} shiftData.shift_type - EARLY|LATE|NIGHT|DAY (erforderlich)
 * @param {string} shiftData.start_time - Start Zeit HH:MM (optional)
 * @param {string} shiftData.end_time - End Zeit HH:MM (optional)
 * @param {string} shiftData.team_id - Team ID (optional)
 * @param {string} shiftData.notes - Notizen (optional)
 */
window.kalenderCreateShift = async function(shiftData) {
    console.log('\n%c═══ ➕ SCHICHT ERSTELLEN ═══', 'color: #28a745; font-size: 16px; font-weight: bold');
    
    if (!shiftData.user_id || !shiftData.date || !shiftData.shift_type) {
        console.error('❌ Fehlende Pflichtfelder: user_id, date, shift_type');
        return null;
    }

    return await makeRequest('/shifts', {
        method: 'POST',
        body: JSON.stringify(shiftData),
    });
};

/**
 * ✏️ Schicht aktualisieren
 * @param {string} shiftId - Schicht ID (erforderlich)
 * @param {object} updates - Zu aktualisierende Felder
 */
window.kalenderUpdateShift = async function(shiftId, updates) {
    console.log('\n%c═══ ✏️ SCHICHT AKTUALISIEREN ═══', 'color: #ffc107; font-size: 16px; font-weight: bold');
    
    if (!shiftId) {
        console.error('❌ Fehlende Schicht ID');
        return null;
    }

    return await makeRequest(`/shifts/${shiftId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
};

/**
 * 🗑️ Schicht löschen
 * @param {string} shiftId - Schicht ID (erforderlich)
 */
window.kalenderDeleteShift = async function(shiftId) {
    console.log('\n%c═══ 🗑️ SCHICHT LÖSCHEN ═══', 'color: #dc3545; font-size: 16px; font-weight: bold');
    
    if (!shiftId) {
        console.error('❌ Fehlende Schicht ID');
        return null;
    }

    if (!confirm('Möchtest du diese Schicht wirklich löschen?')) {
        console.log('❌ Abgebrochen');
        return null;
    }

    return await makeRequest(`/shifts/${shiftId}`, {
        method: 'DELETE',
    });
};

/**
 * 📤 Kalender exportieren (iCal)
 * @param {object} exportOptions - Export Optionen
 * @param {string} exportOptions.start_date - Start Datum YYYY-MM-DD (erforderlich)
 * @param {string} exportOptions.end_date - End Datum YYYY-MM-DD (erforderlich)
 * @param {string} exportOptions.state - Bundesland (default: NRW)
 * @param {boolean} exportOptions.include_absences - Abwesenheiten einbeziehen (default: true)
 * @param {boolean} exportOptions.include_shifts - Schichten einbeziehen (default: true)
 * @param {boolean} exportOptions.include_holidays - Feiertage einbeziehen (default: true)
 */
window.kalenderExport = async function(exportOptions) {
    console.log('\n%c═══ 📤 KALENDER EXPORT ═══', 'color: #667eea; font-size: 16px; font-weight: bold');
    
    if (!exportOptions.start_date || !exportOptions.end_date) {
        console.error('❌ Fehlende Pflichtfelder: start_date, end_date');
        return null;
    }

    const body = {
        start_date: exportOptions.start_date,
        end_date: exportOptions.end_date,
        state: exportOptions.state || 'NRW',
        include_absences: exportOptions.include_absences !== false,
        include_shifts: exportOptions.include_shifts !== false,
        include_holidays: exportOptions.include_holidays !== false,
    };

    const result = await makeRequest('/export', {
        method: 'POST',
        body: JSON.stringify(body),
    });

    if (result && !result.error && result.data.ical_data) {
        console.log('%c📥 iCal Datei generiert!', 'color: #28a745; font-weight: bold');
        console.log('   Dateiname:', result.data.download_filename);
        console.log('   Events:', result.data.events_count);
        
        // Auto-Download
        try {
            const blob = new Blob([result.data.ical_data], { type: 'text/calendar' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.data.download_filename || 'kalender.ics';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            console.log('✅ Datei wird heruntergeladen...');
        } catch (e) {
            console.error('❌ Download fehlgeschlagen:', e);
        }
    }

    return result;
};

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 QUICK START TESTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ⚡ Schnelltest: Alle Basis-Funktionen testen
 */
window.kalenderQuickTest = async function() {
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('%c⚡ QUICK TEST - Alle Basis-Funktionen', 'color: #667eea; font-size: 18px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');

    const results = {
        health: null,
        teamCalendar: null,
        holidays: null,
        shifts: null,
    };

    // 1. Health Check
    console.log('\n1️⃣ Health Check...');
    results.health = await kalenderHealth();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Team Kalender
    console.log('\n2️⃣ Team Kalender (aktueller Monat)...');
    results.teamCalendar = await kalenderTeamCalendar();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Feiertage 2025
    console.log('\n3️⃣ Deutsche Feiertage 2025 (NRW)...');
    results.holidays = await kalenderHolidays(2025, 'NRW');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 4. Schichten abrufen
    console.log('\n4️⃣ Schichten abrufen...');
    results.shifts = await kalenderGetShifts();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Summary
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('%c📊 QUICK TEST SUMMARY', 'color: #667eea; font-size: 16px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    
    const passed = Object.values(results).filter(r => r && !r.error).length;
    const total = Object.keys(results).length;
    
    console.log(`✅ Erfolgreich: ${passed}/${total}`);
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
window.kalenderShowConfig = function() {
    console.log('\n%c═══ 🎯 AKTUELLE KONFIGURATION ═══', 'color: #667eea; font-size: 16px; font-weight: bold');
    console.log('Project ID:', KALENDER_TEST_CONFIG.projectId || '❌ NICHT GESETZT');
    console.log('ANON Key:', KALENDER_TEST_CONFIG.anonKey ? '✅ Gesetzt' : '❌ NICHT GESETZT');
    console.log('Access Token:', KALENDER_TEST_CONFIG.accessToken ? '✅ Gesetzt' : 'ℹ️ Optional');
};

/**
 * ⚙️ Konfiguration setzen
 */
window.kalenderSetConfig = function(projectId, anonKey, accessToken = '') {
    KALENDER_TEST_CONFIG.projectId = projectId;
    KALENDER_TEST_CONFIG.anonKey = anonKey;
    if (accessToken) {
        KALENDER_TEST_CONFIG.accessToken = accessToken;
    }
    console.log('✅ Konfiguration aktualisiert!');
    kalenderShowConfig();
};

// ═══════════════════════════════════════════════════════════════════════════
// 📖 HILFE
// ═══════════════════════════════════════════════════════════════════════════

window.kalenderHelp = function() {
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('%c📖 KALENDER EDGE FUNCTION TEST - HILFE', 'color: #667eea; font-size: 18px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('');
    console.log('%c🔧 KONFIGURATION:', 'color: #17a2b8; font-weight: bold');
    console.log('  kalenderShowConfig()                          - Zeigt aktuelle Konfiguration');
    console.log('  kalenderSetConfig(projectId, anonKey, token)  - Konfiguration setzen');
    console.log('');
    console.log('%c⚡ SCHNELLTESTS:', 'color: #28a745; font-weight: bold');
    console.log('  kalenderQuickTest()                           - Führt alle Basis-Tests aus');
    console.log('');
    console.log('%c🧪 TEST-FUNKTIONEN:', 'color: #667eea; font-weight: bold');
    console.log('  kalenderHealth()                              - Health Check (kein Auth)');
    console.log('  kalenderTeamCalendar(month, year, teamId)     - Team Kalender abrufen');
    console.log('  kalenderAbsences(start, end, teamId)          - Abwesenheiten abrufen');
    console.log('  kalenderHolidays(year, state)                 - Deutsche Feiertage berechnen');
    console.log('  kalenderGetShifts(start, end, userId, teamId) - Schichten abrufen');
    console.log('  kalenderCreateShift(shiftData)                - Schicht erstellen');
    console.log('  kalenderUpdateShift(id, updates)              - Schicht aktualisieren');
    console.log('  kalenderDeleteShift(id)                       - Schicht löschen');
    console.log('  kalenderExport(options)                       - Kalender exportieren (iCal)');
    console.log('');
    console.log('%c💡 BEISPIELE:', 'color: #ffc107; font-weight: bold');
    console.log('  // Health Check');
    console.log('  await kalenderHealth()');
    console.log('');
    console.log('  // Team Kalender für Januar 2025');
    console.log('  await kalenderTeamCalendar(1, 2025)');
    console.log('');
    console.log('  // Feiertage für Bayern 2025');
    console.log('  await kalenderHolidays(2025, "BY")');
    console.log('');
    console.log('  // Schicht erstellen');
    console.log('  await kalenderCreateShift({');
    console.log('    user_id: "uuid-hier",');
    console.log('    date: "2025-01-15",');
    console.log('    shift_type: "EARLY",');
    console.log('    start_time: "06:00",');
    console.log('    end_time: "14:00"');
    console.log('  })');
    console.log('');
    console.log('  // Kalender exportieren');
    console.log('  await kalenderExport({');
    console.log('    start_date: "2025-01-01",');
    console.log('    end_date: "2025-01-31",');
    console.log('    state: "NRW"');
    console.log('  })');
    console.log('');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎬 AUTO-START
// ═══════════════════════════════════════════════════════════════════════════

console.log('');
console.log('%c✅ KALENDER TEST SUITE GELADEN!', 'color: #28a745; font-size: 16px; font-weight: bold');
console.log('');
console.log('%c📋 NÄCHSTE SCHRITTE:', 'color: #667eea; font-weight: bold');
console.log('');
console.log('1️⃣ Konfiguration prüfen:');
console.log('   %ckalenderShowConfig()', 'color: #667eea; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('2️⃣ Konfiguration setzen (falls nötig):');
console.log('   %ckalenderSetConfig("deine-project-id", "dein-anon-key")', 'color: #667eea; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('3️⃣ Quick Test ausführen:');
console.log('   %cawait kalenderQuickTest()', 'color: #667eea; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('4️⃣ Hilfe anzeigen:');
console.log('   %ckalenderHelp()', 'color: #667eea; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');

// Konfiguration anzeigen
kalenderShowConfig();
