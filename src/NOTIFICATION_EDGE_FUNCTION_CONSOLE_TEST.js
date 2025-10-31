/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔔 BROWO KOORDINATOR - NOTIFICATION EDGE FUNCTION v1.0.0 CONSOLE TEST
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
console.log('%c🔔 NOTIFICATION EDGE FUNCTION TEST v1.0.0', 'color: #667eea; font-size: 18px; font-weight: bold');
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
console.log('');

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 KONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const NOTIFICATION_TEST_CONFIG = {
    projectId: 'azmtojgikubegzusvhra',
    accessToken: '',
};

// Automatisch aus localStorage holen
try {
    const storageKey = `sb-${NOTIFICATION_TEST_CONFIG.projectId}-auth-token`;
    const authData = localStorage.getItem(storageKey);
    if (authData) {
        const parsed = JSON.parse(authData);
        const token = parsed?.access_token || parsed?.currentSession?.access_token;
        if (token) {
            NOTIFICATION_TEST_CONFIG.accessToken = token;
            console.log('✅ Access Token automatisch geladen');
        }
    }
} catch (e) {
    console.log('ℹ️  Kein Access Token im localStorage gefunden');
}

// ═══════════════════════════════════════════════════════════════════════════
// 🛠️ HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getBaseUrl() {
    return `https://${NOTIFICATION_TEST_CONFIG.projectId}.supabase.co/functions/v1/BrowoKoordinator-Notification`;
}

function getHeaders(requireAuth = true) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (requireAuth) {
        if (!NOTIFICATION_TEST_CONFIG.accessToken) {
            console.error('❌ ACCESS TOKEN FEHLT! Bitte einloggen.');
            return null;
        }
        headers['Authorization'] = `Bearer ${NOTIFICATION_TEST_CONFIG.accessToken}`;
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
window.notificationHealth = async function() {
    console.log('\n%c═══ 🏥 HEALTH CHECK ═══', 'color: #28a745; font-size: 16px; font-weight: bold');
    return await makeRequest('/health', {}, false);
};

/**
 * 📋 Meine Benachrichtigungen abrufen
 * @param {object} options - Query-Parameter
 * @param {number} options.limit - Anzahl Ergebnisse (default: 50)
 * @param {number} options.offset - Offset für Pagination (default: 0)
 * @param {boolean} options.unreadOnly - Nur ungelesene (default: false)
 * @param {string} options.type - Filter nach Typ (optional)
 */
window.notificationMyNotifications = async function(options = {}) {
    console.log('\n%c═══ 📋 MEINE BENACHRICHTIGUNGEN ═══', 'color: #667eea; font-size: 16px; font-weight: bold');
    
    const { limit = 50, offset = 0, unreadOnly = false, type = null } = options;
    
    let query = `?limit=${limit}&offset=${offset}`;
    if (unreadOnly) query += '&unreadOnly=true';
    if (type) query += `&type=${type}`;

    return await makeRequest(`/my-notifications${query}`);
};

/**
 * ➕ Benachrichtigung erstellen (Admin/System)
 * @param {object} notificationData - Benachrichtigungsdaten
 * @param {string} notificationData.user_id - Empfänger User ID (UUID)
 * @param {string} notificationData.title - Titel
 * @param {string} notificationData.message - Nachricht
 * @param {string} notificationData.type - Typ (z.B. 'COINS_AWARDED')
 * @param {string} notificationData.link - Link (optional)
 * @param {object} notificationData.data - Zusätzliche Daten (optional)
 */
window.notificationCreate = async function(notificationData) {
    console.log('\n%c═══ ➕ BENACHRICHTIGUNG ERSTELLEN ═══', 'color: #667eea; font-size: 16px; font-weight: bold');
    
    if (!notificationData.user_id || !notificationData.title || !notificationData.message || !notificationData.type) {
        console.error('❌ Fehlende Pflichtfelder: user_id, title, message, type');
        return null;
    }

    return await makeRequest('/create', {
        method: 'POST',
        body: JSON.stringify(notificationData),
    });
};

/**
 * ✅ Benachrichtigung als gelesen markieren
 * @param {string} notificationId - Benachrichtigungs-ID (UUID)
 */
window.notificationMarkRead = async function(notificationId) {
    console.log('\n%c═══ ✅ ALS GELESEN MARKIEREN ═══', 'color: #28a745; font-size: 16px; font-weight: bold');
    
    if (!notificationId) {
        console.error('❌ Fehlende Notification ID');
        return null;
    }

    return await makeRequest(`/mark-read/${notificationId}`, {
        method: 'POST',
    });
};

/**
 * ✅ Alle Benachrichtigungen als gelesen markieren
 * @param {string} type - Optional: Nur bestimmten Typ markieren
 */
window.notificationMarkAllRead = async function(type = null) {
    console.log('\n%c═══ ✅ ALLE ALS GELESEN MARKIEREN ═══', 'color: #28a745; font-size: 16px; font-weight: bold');
    
    const query = type ? `?type=${type}` : '';
    
    return await makeRequest(`/mark-all-read${query}`, {
        method: 'POST',
    });
};

/**
 * 🗑️ Benachrichtigung löschen
 * @param {string} notificationId - Benachrichtigungs-ID (UUID)
 */
window.notificationDelete = async function(notificationId) {
    console.log('\n%c═══ 🗑️ BENACHRICHTIGUNG LÖSCHEN ═══', 'color: #dc3545; font-size: 16px; font-weight: bold');
    
    if (!notificationId) {
        console.error('❌ Fehlende Notification ID');
        return null;
    }

    if (!confirm('Möchtest du diese Benachrichtigung wirklich löschen?')) {
        console.log('❌ Abgebrochen');
        return null;
    }

    return await makeRequest(`/delete/${notificationId}`, {
        method: 'DELETE',
    });
};

/**
 * 🗑️ Alle gelesenen Benachrichtigungen löschen
 */
window.notificationDeleteAllRead = async function() {
    console.log('\n%c═══ 🗑️ ALLE GELESENEN LÖSCHEN ═══', 'color: #dc3545; font-size: 16px; font-weight: bold');
    
    if (!confirm('Möchtest du alle gelesenen Benachrichtigungen wirklich löschen?')) {
        console.log('❌ Abgebrochen');
        return null;
    }

    return await makeRequest('/delete-all-read', {
        method: 'DELETE',
    });
};

/**
 * 🔢 Anzahl ungelesener Benachrichtigungen abrufen
 * @param {string} type - Optional: Nur bestimmten Typ zählen
 */
window.notificationUnreadCount = async function(type = null) {
    console.log('\n%c═══ 🔢 UNGELESEN ANZAHL ═══', 'color: #ffc107; font-size: 16px; font-weight: bold');
    
    const query = type ? `?type=${type}` : '';
    
    return await makeRequest(`/unread-count${query}`);
};

/**
 * 📢 Bulk-Benachrichtigungen senden (Admin)
 * @param {object} bulkData - Bulk-Daten
 * @param {array} bulkData.user_ids - Array von User IDs (UUIDs)
 * @param {string} bulkData.title - Titel
 * @param {string} bulkData.message - Nachricht
 * @param {string} bulkData.type - Typ
 * @param {string} bulkData.link - Link (optional)
 * @param {object} bulkData.data - Zusätzliche Daten (optional)
 */
window.notificationSendBulk = async function(bulkData) {
    console.log('\n%c═══ 📢 BULK-BENACHRICHTIGUNGEN SENDEN ═══', 'color: #667eea; font-size: 16px; font-weight: bold');
    
    if (!bulkData.user_ids || !Array.isArray(bulkData.user_ids) || !bulkData.title || !bulkData.message || !bulkData.type) {
        console.error('❌ Fehlende Pflichtfelder: user_ids (array), title, message, type');
        return null;
    }

    return await makeRequest('/send-bulk', {
        method: 'POST',
        body: JSON.stringify(bulkData),
    });
};

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 QUICK START TESTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ⚡ Schnelltest: Alle Basis-Funktionen testen
 */
window.notificationQuickTest = async function() {
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('%c⚡ QUICK TEST - Alle Basis-Funktionen', 'color: #667eea; font-size: 18px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');

    const results = {
        health: null,
        myNotifications: null,
        unreadCount: null,
    };

    // 1. Health Check
    console.log('\n1️⃣ Health Check...');
    results.health = await notificationHealth();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Meine Benachrichtigungen
    console.log('\n2️⃣ Meine Benachrichtigungen abrufen...');
    results.myNotifications = await notificationMyNotifications();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Unread Count
    console.log('\n3️⃣ Ungelesen Anzahl...');
    results.unreadCount = await notificationUnreadCount();
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

// ═══════════════════════════════════════════════════════════════════════════
// 📖 HILFE
// ═══════════════════════════════════════════════════════════════════════════

window.notificationHelp = function() {
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('%c📖 NOTIFICATION EDGE FUNCTION TEST - HILFE', 'color: #667eea; font-size: 18px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('');
    console.log('%c⚡ SCHNELLTESTS:', 'color: #28a745; font-weight: bold');
    console.log('  notificationQuickTest()                                    - Führt alle Basis-Tests aus');
    console.log('');
    console.log('%c🧪 TEST-FUNKTIONEN:', 'color: #667eea; font-weight: bold');
    console.log('  notificationHealth()                                       - Health Check (kein Auth)');
    console.log('  notificationMyNotifications(options)                       - Meine Benachrichtigungen');
    console.log('  notificationCreate(data)                                   - Benachrichtigung erstellen');
    console.log('  notificationMarkRead(id)                                   - Als gelesen markieren');
    console.log('  notificationMarkAllRead(type)                              - Alle als gelesen markieren');
    console.log('  notificationDelete(id)                                     - Benachrichtigung löschen');
    console.log('  notificationDeleteAllRead()                                - Alle gelesenen löschen');
    console.log('  notificationUnreadCount(type)                              - Ungelesen Anzahl');
    console.log('  notificationSendBulk(data)                                 - Bulk-Benachrichtigungen senden');
    console.log('');
    console.log('%c💡 BEISPIELE:', 'color: #ffc107; font-weight: bold');
    console.log('  // Health Check');
    console.log('  await notificationHealth()');
    console.log('');
    console.log('  // Alle Benachrichtigungen');
    console.log('  await notificationMyNotifications()');
    console.log('');
    console.log('  // Nur ungelesene');
    console.log('  await notificationMyNotifications({ unreadOnly: true })');
    console.log('');
    console.log('  // Benachrichtigung erstellen');
    console.log('  await notificationCreate({');
    console.log('    user_id: "user-uuid-hier",');
    console.log('    title: "Glückwunsch!",');
    console.log('    message: "Du hast 50 Coins erhalten",');
    console.log('    type: "COINS_AWARDED",');
    console.log('    link: "/benefits"');
    console.log('  })');
    console.log('');
    console.log('  // Ungelesen Anzahl');
    console.log('  await notificationUnreadCount()');
    console.log('');
    console.log('%c📋 NOTIFICATION TYPES:', 'color: #17a2b8; font-weight: bold');
    console.log('  - LEAVE_REQUEST_PENDING');
    console.log('  - LEAVE_REQUEST_APPROVED');
    console.log('  - LEAVE_REQUEST_REJECTED');
    console.log('  - DOCUMENT_UPLOADED');
    console.log('  - BENEFIT_APPROVED');
    console.log('  - BENEFIT_REJECTED');
    console.log('  - COINS_AWARDED');
    console.log('  - ACHIEVEMENT_UNLOCKED');
    console.log('  - VIDEO_ADDED');
    console.log('  - ANNOUNCEMENT_CREATED');
    console.log('  - ORGANIGRAM_UPDATED');
    console.log('');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎬 AUTO-START
// ═══════════════════════════════════════════════════════════════════════════

console.log('');
console.log('%c✅ NOTIFICATION TEST SUITE GELADEN!', 'color: #28a745; font-size: 16px; font-weight: bold');
console.log('');
console.log('%c📋 NÄCHSTE SCHRITTE:', 'color: #667eea; font-weight: bold');
console.log('');
console.log('1️⃣ Quick Test ausführen:');
console.log('   %cawait notificationQuickTest()', 'color: #667eea; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('2️⃣ Hilfe anzeigen:');
console.log('   %cnotificationHelp()', 'color: #667eea; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
