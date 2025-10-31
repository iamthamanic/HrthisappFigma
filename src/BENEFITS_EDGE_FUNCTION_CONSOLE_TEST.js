/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎁 BROWO KOORDINATOR - BENEFITS EDGE FUNCTION v1.0.0 CONSOLE TEST
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ANLEITUNG:
 * 1. Öffne Browo Koordinator im Browser
 * 2. Öffne die Browser Console (F12)
 * 3. Kopiere diesen GESAMTEN Code
 * 4. Füge ihn in die Console ein und drücke Enter
 * 5. Führe aus: await benefitsQuickTest()
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

console.clear();
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #10b981; font-weight: bold');
console.log('%c🎁 BENEFITS EDGE FUNCTION TEST v1.0.0', 'color: #10b981; font-size: 18px; font-weight: bold');
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #10b981; font-weight: bold');
console.log('');

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 KONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const BENEFITS_TEST_CONFIG = {
    projectId: 'azmtojgikubegzusvhra',
    accessToken: '',
};

// Automatisch aus localStorage holen
try {
    const storageKey = `sb-${BENEFITS_TEST_CONFIG.projectId}-auth-token`;
    const authData = localStorage.getItem(storageKey);
    if (authData) {
        const parsed = JSON.parse(authData);
        const token = parsed?.access_token || parsed?.currentSession?.access_token;
        if (token) {
            BENEFITS_TEST_CONFIG.accessToken = token;
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
    return `https://${BENEFITS_TEST_CONFIG.projectId}.supabase.co/functions/v1/BrowoKoordinator-Benefits`;
}

function getHeaders(requireAuth = true) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (requireAuth) {
        if (!BENEFITS_TEST_CONFIG.accessToken) {
            console.error('❌ ACCESS TOKEN FEHLT! Bitte einloggen.');
            return null;
        }
        headers['Authorization'] = `Bearer ${BENEFITS_TEST_CONFIG.accessToken}`;
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
window.benefitsHealth = async function() {
    console.log('\n%c═══ 🏥 HEALTH CHECK ═══', 'color: #28a745; font-size: 16px; font-weight: bold');
    return await makeRequest('/health', {}, false);
};

/**
 * 🔍 Benefits durchsuchen
 */
window.benefitsBrowse = async function(category = null) {
    console.log('\n%c═══ 🔍 BENEFITS DURCHSUCHEN ═══', 'color: #10b981; font-size: 16px; font-weight: bold');
    
    const query = category ? `?category=${category}` : '';
    return await makeRequest(`/browse${query}`);
};

/**
 * 🛍️ Shop Items abrufen
 */
window.benefitsShopItems = async function() {
    console.log('\n%c═══ 🛍️ SHOP ITEMS ═══', 'color: #10b981; font-size: 16px; font-weight: bold');
    return await makeRequest('/shop/items');
};

/**
 * 📝 Benefit anfordern
 */
window.benefitsRequest = async function(benefitId, notes = null) {
    console.log('\n%c═══ 📝 BENEFIT ANFORDERN ═══', 'color: #10b981; font-size: 16px; font-weight: bold');
    
    if (!benefitId) {
        console.error('❌ Fehlende Benefit ID');
        return null;
    }

    return await makeRequest('/request', {
        method: 'POST',
        body: JSON.stringify({
            benefit_id: benefitId,
            notes,
        }),
    });
};

/**
 * 🎁 Meine Benefits
 */
window.benefitsMyBenefits = async function() {
    console.log('\n%c═══ 🎁 MEINE BENEFITS ═══', 'color: #10b981; font-size: 16px; font-weight: bold');
    return await makeRequest('/my-benefits');
};

/**
 * 📋 Meine Anfragen
 */
window.benefitsMyRequests = async function() {
    console.log('\n%c═══ 📋 MEINE ANFRAGEN ═══', 'color: #10b981; font-size: 16px; font-weight: bold');
    return await makeRequest('/my-requests');
};

/**
 * 💰 Coin Balance
 */
window.benefitsCoinBalance = async function() {
    console.log('\n%c═══ 💰 COIN BALANCE ═══', 'color: #fbbf24; font-size: 16px; font-weight: bold');
    return await makeRequest('/coins/balance');
};

/**
 * 📊 Coin Transaktionen
 */
window.benefitsCoinTransactions = async function(limit = 50, offset = 0) {
    console.log('\n%c═══ 📊 COIN TRANSAKTIONEN ═══', 'color: #fbbf24; font-size: 16px; font-weight: bold');
    return await makeRequest(`/coins/transactions?limit=${limit}&offset=${offset}`);
};

/**
 * 🛒 Mit Coins kaufen
 */
window.benefitsShopPurchase = async function(benefitId) {
    console.log('\n%c═══ 🛒 MIT COINS KAUFEN ═══', 'color: #10b981; font-size: 16px; font-weight: bold');
    
    if (!benefitId) {
        console.error('❌ Fehlende Benefit ID');
        return null;
    }

    return await makeRequest('/shop/purchase', {
        method: 'POST',
        body: JSON.stringify({
            benefit_id: benefitId,
        }),
    });
};

/**
 * ⏳ Pending Requests (Admin)
 */
window.benefitsPending = async function() {
    console.log('\n%c═══ ⏳ PENDING REQUESTS (ADMIN) ═══', 'color: #f59e0b; font-size: 16px; font-weight: bold');
    return await makeRequest('/pending');
};

/**
 * ✅ Request genehmigen (Admin)
 */
window.benefitsApprove = async function(requestId, adminNotes = null) {
    console.log('\n%c═══ ✅ REQUEST GENEHMIGEN (ADMIN) ═══', 'color: #28a745; font-size: 16px; font-weight: bold');
    
    if (!requestId) {
        console.error('❌ Fehlende Request ID');
        return null;
    }

    return await makeRequest(`/approve/${requestId}`, {
        method: 'POST',
        body: JSON.stringify({
            admin_notes: adminNotes,
        }),
    });
};

/**
 * ❌ Request ablehnen (Admin)
 */
window.benefitsReject = async function(requestId, rejectionReason) {
    console.log('\n%c═══ ❌ REQUEST ABLEHNEN (ADMIN) ═══', 'color: #dc3545; font-size: 16px; font-weight: bold');
    
    if (!requestId || !rejectionReason) {
        console.error('❌ Fehlende Request ID oder Ablehnungsgrund');
        return null;
    }

    return await makeRequest(`/reject/${requestId}`, {
        method: 'POST',
        body: JSON.stringify({
            rejection_reason: rejectionReason,
        }),
    });
};

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 QUICK START TESTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ⚡ Schnelltest: Alle Basis-Funktionen testen
 */
window.benefitsQuickTest = async function() {
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #10b981; font-weight: bold');
    console.log('%c⚡ QUICK TEST - Alle Basis-Funktionen', 'color: #10b981; font-size: 18px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #10b981; font-weight: bold');

    const results = {
        health: null,
        browse: null,
        shopItems: null,
        myBenefits: null,
        myRequests: null,
        coinBalance: null,
    };

    // 1. Health Check
    console.log('\n1️⃣ Health Check...');
    results.health = await benefitsHealth();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Browse
    console.log('\n2️⃣ Benefits durchsuchen...');
    results.browse = await benefitsBrowse();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Shop Items
    console.log('\n3️⃣ Shop Items...');
    results.shopItems = await benefitsShopItems();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 4. My Benefits
    console.log('\n4️⃣ Meine Benefits...');
    results.myBenefits = await benefitsMyBenefits();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 5. My Requests
    console.log('\n5️⃣ Meine Anfragen...');
    results.myRequests = await benefitsMyRequests();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 6. Coin Balance
    console.log('\n6️⃣ Coin Balance...');
    results.coinBalance = await benefitsCoinBalance();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Summary
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #10b981; font-weight: bold');
    console.log('%c📊 QUICK TEST SUMMARY', 'color: #10b981; font-size: 16px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #10b981; font-weight: bold');
    
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

window.benefitsHelp = function() {
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #10b981; font-weight: bold');
    console.log('%c📖 BENEFITS EDGE FUNCTION TEST - HILFE', 'color: #10b981; font-size: 18px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #10b981; font-weight: bold');
    console.log('');
    console.log('%c⚡ SCHNELLTESTS:', 'color: #28a745; font-weight: bold');
    console.log('  benefitsQuickTest()              - Führt alle Basis-Tests aus');
    console.log('');
    console.log('%c🧪 USER FUNKTIONEN:', 'color: #10b981; font-weight: bold');
    console.log('  benefitsHealth()                 - Health Check (kein Auth)');
    console.log('  benefitsBrowse(category)         - Benefits durchsuchen');
    console.log('  benefitsShopItems()              - Shop Items abrufen');
    console.log('  benefitsRequest(id, notes)       - Benefit anfordern');
    console.log('  benefitsMyBenefits()             - Meine Benefits');
    console.log('  benefitsMyRequests()             - Meine Anfragen');
    console.log('  benefitsShopPurchase(id)         - Mit Coins kaufen');
    console.log('');
    console.log('%c💰 COIN FUNKTIONEN:', 'color: #fbbf24; font-weight: bold');
    console.log('  benefitsCoinBalance()            - Coin Balance');
    console.log('  benefitsCoinTransactions()       - Coin Transaktionen');
    console.log('');
    console.log('%c👨‍💼 ADMIN FUNKTIONEN:', 'color: #f59e0b; font-weight: bold');
    console.log('  benefitsPending()                - Pending Requests');
    console.log('  benefitsApprove(id, notes)       - Request genehmigen');
    console.log('  benefitsReject(id, reason)       - Request ablehnen');
    console.log('');
    console.log('%c💡 BEISPIELE:', 'color: #fbbf24; font-weight: bold');
    console.log('  // Alle Benefits durchsuchen');
    console.log('  await benefitsBrowse()');
    console.log('');
    console.log('  // Benefits nach Kategorie');
    console.log('  await benefitsBrowse("Health")');
    console.log('');
    console.log('  // Benefit anfordern');
    console.log('  await benefitsRequest("benefit-uuid", "Bitte genehmigen")');
    console.log('');
    console.log('  // Mit Coins kaufen');
    console.log('  await benefitsShopPurchase("benefit-uuid")');
    console.log('');
    console.log('  // Request genehmigen (Admin)');
    console.log('  await benefitsApprove("request-uuid", "Genehmigt")');
    console.log('');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #10b981; font-weight: bold');
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎬 AUTO-START
// ═══════════════════════════════════════════════════════════════════════════

console.log('');
console.log('%c✅ BENEFITS TEST SUITE GELADEN!', 'color: #28a745; font-size: 16px; font-weight: bold');
console.log('');
console.log('%c📋 NÄCHSTE SCHRITTE:', 'color: #10b981; font-weight: bold');
console.log('');
console.log('1️⃣ Quick Test ausführen:');
console.log('   %cawait benefitsQuickTest()', 'color: #10b981; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('2️⃣ Hilfe anzeigen:');
console.log('   %cbenefitsHelp()', 'color: #10b981; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #10b981; font-weight: bold');
