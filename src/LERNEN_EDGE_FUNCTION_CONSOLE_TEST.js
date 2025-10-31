/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🎓 BROWO KOORDINATOR - LERNEN EDGE FUNCTION v1.0.0 CONSOLE TEST
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ANLEITUNG:
 * 1. Öffne Browo Koordinator im Browser
 * 2. Öffne die Browser Console (F12)
 * 3. Kopiere diesen GESAMTEN Code
 * 4. Füge ihn in die Console ein und drücke Enter
 * 5. Führe aus: await lernenQuickTest()
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

console.clear();
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
console.log('%c🎓 LERNEN EDGE FUNCTION TEST v1.0.0', 'color: #667eea; font-size: 18px; font-weight: bold');
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
console.log('');

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 KONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const LERNEN_TEST_CONFIG = {
    projectId: 'azmtojgikubegzusvhra',
    accessToken: '',
};

// Automatisch aus localStorage holen
try {
    const storageKey = `sb-${LERNEN_TEST_CONFIG.projectId}-auth-token`;
    const authData = localStorage.getItem(storageKey);
    if (authData) {
        const parsed = JSON.parse(authData);
        const token = parsed?.access_token || parsed?.currentSession?.access_token;
        if (token) {
            LERNEN_TEST_CONFIG.accessToken = token;
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
    return `https://${LERNEN_TEST_CONFIG.projectId}.supabase.co/functions/v1/BrowoKoordinator-Lernen`;
}

function getHeaders(requireAuth = true) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (requireAuth) {
        if (!LERNEN_TEST_CONFIG.accessToken) {
            console.error('❌ ACCESS TOKEN FEHLT! Bitte einloggen.');
            return null;
        }
        headers['Authorization'] = `Bearer ${LERNEN_TEST_CONFIG.accessToken}`;
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
window.lernenHealth = async function() {
    console.log('\n%c═══ 🏥 HEALTH CHECK ═══', 'color: #28a745; font-size: 16px; font-weight: bold');
    return await makeRequest('/health', {}, false);
};

/**
 * 📹 Videos abrufen
 */
window.lernenGetVideos = async function(options = {}) {
    console.log('\n%c═══ 📹 VIDEOS ABRUFEN ═══', 'color: #667eea; font-size: 16px; font-weight: bold');
    
    const { category = null, search = null } = options;
    
    let query = '';
    if (category) query += `?category=${category}`;
    if (search) query += (query ? '&' : '?') + `search=${search}`;

    return await makeRequest(`/videos${query}`);
};

/**
 * 📝 Quizzes abrufen
 */
window.lernenGetQuizzes = async function(videoId = null) {
    console.log('\n%c═══ 📝 QUIZZES ABRUFEN ═══', 'color: #667eea; font-size: 16px; font-weight: bold');
    
    const query = videoId ? `?video_id=${videoId}` : '';
    
    return await makeRequest(`/quizzes${query}`);
};

/**
 * ✅ Video abschließen
 */
window.lernenCompleteVideo = async function(videoId, watchTimeSeconds = null) {
    console.log('\n%c═══ ✅ VIDEO ABSCHLIESSEN ═══', 'color: #28a745; font-size: 16px; font-weight: bold');
    
    if (!videoId) {
        console.error('❌ Fehlende Video ID');
        return null;
    }

    return await makeRequest('/video/complete', {
        method: 'POST',
        body: JSON.stringify({
            video_id: videoId,
            watch_time_seconds: watchTimeSeconds,
        }),
    });
};

/**
 * 🎯 Quiz einreichen
 */
window.lernenSubmitQuiz = async function(quizId, answers) {
    console.log('\n%c═══ 🎯 QUIZ EINREICHEN ═══', 'color: #667eea; font-size: 16px; font-weight: bold');
    
    if (!quizId || !answers) {
        console.error('❌ Fehlende Quiz ID oder Antworten');
        return null;
    }

    return await makeRequest('/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
            quiz_id: quizId,
            answers,
        }),
    });
};

/**
 * 📊 Learning Progress abrufen
 */
window.lernenGetProgress = async function() {
    console.log('\n%c═══ 📊 LEARNING PROGRESS ═══', 'color: #ffc107; font-size: 16px; font-weight: bold');
    return await makeRequest('/progress');
};

/**
 * 👤 Avatar Stats abrufen
 */
window.lernenGetAvatar = async function() {
    console.log('\n%c═══ 👤 AVATAR STATS ═══', 'color: #667eea; font-size: 16px; font-weight: bold');
    return await makeRequest('/avatar');
};

/**
 * 💡 Empfehlungen abrufen
 */
window.lernenGetRecommendations = async function() {
    console.log('\n%c═══ 💡 EMPFEHLUNGEN ═══', 'color: #667eea; font-size: 16px; font-weight: bold');
    return await makeRequest('/recommendations');
};

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 QUICK START TESTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ⚡ Schnelltest: Alle Basis-Funktionen testen
 */
window.lernenQuickTest = async function() {
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('%c⚡ QUICK TEST - Alle Basis-Funktionen', 'color: #667eea; font-size: 18px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');

    const results = {
        health: null,
        videos: null,
        quizzes: null,
        progress: null,
        avatar: null,
        recommendations: null,
    };

    // 1. Health Check
    console.log('\n1️⃣ Health Check...');
    results.health = await lernenHealth();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Videos
    console.log('\n2️⃣ Videos abrufen...');
    results.videos = await lernenGetVideos();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Quizzes
    console.log('\n3️⃣ Quizzes abrufen...');
    results.quizzes = await lernenGetQuizzes();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 4. Progress
    console.log('\n4️⃣ Learning Progress...');
    results.progress = await lernenGetProgress();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 5. Avatar
    console.log('\n5️⃣ Avatar Stats...');
    results.avatar = await lernenGetAvatar();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 6. Recommendations
    console.log('\n6️⃣ Empfehlungen...');
    results.recommendations = await lernenGetRecommendations();
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

window.lernenHelp = function() {
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('%c📖 LERNEN EDGE FUNCTION TEST - HILFE', 'color: #667eea; font-size: 18px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
    console.log('');
    console.log('%c⚡ SCHNELLTESTS:', 'color: #28a745; font-weight: bold');
    console.log('  lernenQuickTest()                 - Führt alle Basis-Tests aus');
    console.log('');
    console.log('%c🧪 TEST-FUNKTIONEN:', 'color: #667eea; font-weight: bold');
    console.log('  lernenHealth()                    - Health Check (kein Auth)');
    console.log('  lernenGetVideos(options)          - Videos abrufen');
    console.log('  lernenGetQuizzes(videoId)         - Quizzes abrufen');
    console.log('  lernenCompleteVideo(id, time)     - Video abschließen');
    console.log('  lernenSubmitQuiz(id, answers)     - Quiz einreichen');
    console.log('  lernenGetProgress()               - Learning Progress');
    console.log('  lernenGetAvatar()                 - Avatar Stats');
    console.log('  lernenGetRecommendations()        - Empfehlungen');
    console.log('');
    console.log('%c💡 BEISPIELE:', 'color: #ffc107; font-weight: bold');
    console.log('  // Alle Videos');
    console.log('  await lernenGetVideos()');
    console.log('');
    console.log('  // Videos nach Kategorie');
    console.log('  await lernenGetVideos({ category: "MANDATORY" })');
    console.log('');
    console.log('  // Video abschließen');
    console.log('  await lernenCompleteVideo("video-uuid", 300)');
    console.log('');
    console.log('  // Quiz einreichen');
    console.log('  await lernenSubmitQuiz("quiz-uuid", {');
    console.log('    "question1-uuid": "answer1",');
    console.log('    "question2-uuid": "answer2"');
    console.log('  })');
    console.log('');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎬 AUTO-START
// ═══════════════════════════════════════════════════════════════════════════

console.log('');
console.log('%c✅ LERNEN TEST SUITE GELADEN!', 'color: #28a745; font-size: 16px; font-weight: bold');
console.log('');
console.log('%c📋 NÄCHSTE SCHRITTE:', 'color: #667eea; font-weight: bold');
console.log('');
console.log('1️⃣ Quick Test ausführen:');
console.log('   %cawait lernenQuickTest()', 'color: #667eea; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('2️⃣ Hilfe anzeigen:');
console.log('   %clernenHelp()', 'color: #667eea; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold');
