/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💬 BROWO KOORDINATOR - CHAT EDGE FUNCTION v1.0.0 CONSOLE TEST
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ANLEITUNG:
 * 1. Öffne Browo Koordinator im Browser
 * 2. Öffne die Browser Console (F12)
 * 3. Kopiere diesen GESAMTEN Code
 * 4. Füge ihn in die Console ein und drücke Enter
 * 5. Führe aus: await chatQuickTest()
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

console.clear();
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #8b5cf6; font-weight: bold');
console.log('%c💬 CHAT EDGE FUNCTION TEST v1.0.0', 'color: #8b5cf6; font-size: 18px; font-weight: bold');
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #8b5cf6; font-weight: bold');
console.log('');

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 KONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CHAT_TEST_CONFIG = {
    projectId: 'azmtojgikubegzusvhra',
    accessToken: '',
};

// Automatisch aus localStorage holen
try {
    const storageKey = `sb-${CHAT_TEST_CONFIG.projectId}-auth-token`;
    const authData = localStorage.getItem(storageKey);
    if (authData) {
        const parsed = JSON.parse(authData);
        const token = parsed?.access_token || parsed?.currentSession?.access_token;
        if (token) {
            CHAT_TEST_CONFIG.accessToken = token;
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
    return `https://${CHAT_TEST_CONFIG.projectId}.supabase.co/functions/v1/BrowoKoordinator-Chat`;
}

function getHeaders(requireAuth = true) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (requireAuth) {
        if (!CHAT_TEST_CONFIG.accessToken) {
            console.error('❌ ACCESS TOKEN FEHLT! Bitte einloggen.');
            return null;
        }
        headers['Authorization'] = `Bearer ${CHAT_TEST_CONFIG.accessToken}`;
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
window.chatHealth = async function() {
    console.log('\n%c═══ 🏥 HEALTH CHECK ═══', 'color: #28a745; font-size: 16px; font-weight: bold');
    return await makeRequest('/health', {}, false);
};

/**
 * 💬 Conversations abrufen
 */
window.chatGetConversations = async function() {
    console.log('\n%c═══ 💬 CONVERSATIONS ABRUFEN ═══', 'color: #8b5cf6; font-size: 16px; font-weight: bold');
    return await makeRequest('/conversations');
};

/**
 * 📝 Conversation Details
 */
window.chatGetConversation = async function(conversationId) {
    console.log('\n%c═══ 📝 CONVERSATION DETAILS ═══', 'color: #8b5cf6; font-size: 16px; font-weight: bold');
    
    if (!conversationId) {
        console.error('❌ Fehlende Conversation ID');
        return null;
    }

    return await makeRequest(`/conversations/${conversationId}`);
};

/**
 * ➕ Neue Conversation erstellen
 */
window.chatCreateConversation = async function(type, memberIds, name = null) {
    console.log('\n%c═══ ➕ CONVERSATION ERSTELLEN ═══', 'color: #8b5cf6; font-size: 16px; font-weight: bold');
    
    if (!type || !memberIds) {
        console.error('❌ Type und member_ids erforderlich');
        return null;
    }

    return await makeRequest('/conversations', {
        method: 'POST',
        body: JSON.stringify({
            type,
            member_ids: Array.isArray(memberIds) ? memberIds : [memberIds],
            name,
        }),
    });
};

/**
 * 📨 Messages abrufen
 */
window.chatGetMessages = async function(conversationId, limit = 50, before = null) {
    console.log('\n%c═══ 📨 MESSAGES ABRUFEN ═══', 'color: #8b5cf6; font-size: 16px; font-weight: bold');
    
    if (!conversationId) {
        console.error('❌ Fehlende Conversation ID');
        return null;
    }

    let url = `/conversations/${conversationId}/messages?limit=${limit}`;
    if (before) {
        url += `&before=${before}`;
    }

    return await makeRequest(url);
};

/**
 * ✉️ Message senden
 */
window.chatSendMessage = async function(conversationId, content, type = 'TEXT', replyToMessageId = null) {
    console.log('\n%c═══ ✉️ MESSAGE SENDEN ═══', 'color: #8b5cf6; font-size: 16px; font-weight: bold');
    
    if (!conversationId || !content) {
        console.error('❌ Conversation ID und content erforderlich');
        return null;
    }

    return await makeRequest(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
            content,
            type,
            reply_to_message_id: replyToMessageId,
        }),
    });
};

/**
 * ✏️ Message bearbeiten
 */
window.chatEditMessage = async function(messageId, content) {
    console.log('\n%c═══ ✏️ MESSAGE BEARBEITEN ═══', 'color: #8b5cf6; font-size: 16px; font-weight: bold');
    
    if (!messageId || !content) {
        console.error('❌ Message ID und content erforderlich');
        return null;
    }

    return await makeRequest(`/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
    });
};

/**
 * 🗑️ Message löschen
 */
window.chatDeleteMessage = async function(messageId) {
    console.log('\n%c═══ 🗑️ MESSAGE LÖSCHEN ═══', 'color: #8b5cf6; font-size: 16px; font-weight: bold');
    
    if (!messageId) {
        console.error('❌ Fehlende Message ID');
        return null;
    }

    return await makeRequest(`/messages/${messageId}`, {
        method: 'DELETE',
    });
};

/**
 * 😊 Reaction hinzufügen
 */
window.chatAddReaction = async function(messageId, emoji) {
    console.log('\n%c═══ 😊 REACTION HINZUFÜGEN ═══', 'color: #8b5cf6; font-size: 16px; font-weight: bold');
    
    if (!messageId || !emoji) {
        console.error('❌ Message ID und emoji erforderlich');
        return null;
    }

    return await makeRequest(`/messages/${messageId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
    });
};

/**
 * ❌ Reaction entfernen
 */
window.chatRemoveReaction = async function(messageId, emoji) {
    console.log('\n%c═══ ❌ REACTION ENTFERNEN ═══', 'color: #8b5cf6; font-size: 16px; font-weight: bold');
    
    if (!messageId || !emoji) {
        console.error('❌ Message ID und emoji erforderlich');
        return null;
    }

    return await makeRequest(`/messages/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`, {
        method: 'DELETE',
    });
};

/**
 * ✅ Als gelesen markieren
 */
window.chatMarkAsRead = async function(conversationId) {
    console.log('\n%c═══ ✅ ALS GELESEN MARKIEREN ═══', 'color: #8b5cf6; font-size: 16px; font-weight: bold');
    
    if (!conversationId) {
        console.error('❌ Fehlende Conversation ID');
        return null;
    }

    return await makeRequest(`/conversations/${conversationId}/read`, {
        method: 'PUT',
    });
};

/**
 * 🔢 Ungelesen zählen
 */
window.chatGetUnreadCount = async function(conversationId) {
    console.log('\n%c═══ 🔢 UNGELESEN ZÄHLEN ═══', 'color: #8b5cf6; font-size: 16px; font-weight: bold');
    
    if (!conversationId) {
        console.error('❌ Fehlende Conversation ID');
        return null;
    }

    return await makeRequest(`/conversations/${conversationId}/unread`);
};

/**
 * ⌨️ Typing Status setzen
 */
window.chatSetTyping = async function(conversationId, isTyping = true) {
    console.log('\n%c═══ ⌨️ TYPING STATUS ═══', 'color: #8b5cf6; font-size: 16px; font-weight: bold');
    
    if (!conversationId) {
        console.error('❌ Fehlende Conversation ID');
        return null;
    }

    return await makeRequest(`/conversations/${conversationId}/typing`, {
        method: 'POST',
        body: JSON.stringify({ is_typing: isTyping }),
    });
};

/**
 * 🟢 Online Users
 */
window.chatGetOnlineUsers = async function() {
    console.log('\n%c═══ 🟢 ONLINE USERS ═══', 'color: #10b981; font-size: 16px; font-weight: bold');
    return await makeRequest('/users/online');
};

/**
 * 📡 Presence Update
 */
window.chatUpdatePresence = async function(status = 'ONLINE') {
    console.log('\n%c═══ 📡 PRESENCE UPDATE ═══', 'color: #10b981; font-size: 16px; font-weight: bold');
    return await makeRequest('/presence', {
        method: 'POST',
        body: JSON.stringify({ status }),
    });
};

/**
 * 🔍 Messages suchen
 */
window.chatSearchMessages = async function(query, conversationId = null) {
    console.log('\n%c═══ 🔍 MESSAGES SUCHEN ═══', 'color: #8b5cf6; font-size: 16px; font-weight: bold');
    
    if (!query) {
        console.error('❌ Fehlender Suchbegriff');
        return null;
    }

    let url = `/search/messages?q=${encodeURIComponent(query)}`;
    if (conversationId) {
        url += `&conversation_id=${conversationId}`;
    }

    return await makeRequest(url);
};

/**
 * 📖 Knowledge Wiki Pages
 */
window.chatGetKnowledge = async function(category = null) {
    console.log('\n%c═══ 📖 KNOWLEDGE WIKI ═══', 'color: #f59e0b; font-size: 16px; font-weight: bold');
    
    let url = '/knowledge';
    if (category) {
        url += `?category=${encodeURIComponent(category)}`;
    }

    return await makeRequest(url);
};

/**
 * 💡 Feedback abrufen
 */
window.chatGetFeedback = async function(status = null) {
    console.log('\n%c═══ 💡 FEEDBACK ═══', 'color: #f59e0b; font-size: 16px; font-weight: bold');
    
    let url = '/feedback';
    if (status) {
        url += `?status=${status}`;
    }

    return await makeRequest(url);
};

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 QUICK START TESTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ⚡ Schnelltest: Alle Basis-Funktionen testen
 */
window.chatQuickTest = async function() {
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #8b5cf6; font-weight: bold');
    console.log('%c⚡ QUICK TEST - Alle Basis-Funktionen', 'color: #8b5cf6; font-size: 18px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #8b5cf6; font-weight: bold');

    const results = {
        health: null,
        conversations: null,
        onlineUsers: null,
        knowledge: null,
        feedback: null,
    };

    // 1. Health Check
    console.log('\n1️⃣ Health Check...');
    results.health = await chatHealth();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Conversations
    console.log('\n2️⃣ Conversations abrufen...');
    results.conversations = await chatGetConversations();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Online Users
    console.log('\n3️⃣ Online Users...');
    results.onlineUsers = await chatGetOnlineUsers();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 4. Knowledge Wiki
    console.log('\n4️⃣ Knowledge Wiki...');
    results.knowledge = await chatGetKnowledge();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 5. Feedback
    console.log('\n5️⃣ Feedback...');
    results.feedback = await chatGetFeedback();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Summary
    console.log('\n%c═════════════════════════════════════════════════���═════════════', 'color: #8b5cf6; font-weight: bold');
    console.log('%c📊 QUICK TEST SUMMARY', 'color: #8b5cf6; font-size: 16px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #8b5cf6; font-weight: bold');
    
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

window.chatHelp = function() {
    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #8b5cf6; font-weight: bold');
    console.log('%c📖 CHAT EDGE FUNCTION TEST - HILFE', 'color: #8b5cf6; font-size: 18px; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #8b5cf6; font-weight: bold');
    console.log('');
    console.log('%c⚡ SCHNELLTESTS:', 'color: #28a745; font-weight: bold');
    console.log('  chatQuickTest()                           - Führt alle Basis-Tests aus');
    console.log('');
    console.log('%c💬 CONVERSATIONS:', 'color: #8b5cf6; font-weight: bold');
    console.log('  chatGetConversations()                    - Alle Conversations');
    console.log('  chatGetConversation(id)                   - Conversation Details');
    console.log('  chatCreateConversation(type, ids, name)   - Neue Conversation');
    console.log('  chatMarkAsRead(id)                        - Als gelesen markieren');
    console.log('  chatGetUnreadCount(id)                    - Ungelesen zählen');
    console.log('');
    console.log('%c📨 MESSAGES:', 'color: #8b5cf6; font-weight: bold');
    console.log('  chatGetMessages(convId, limit, before)    - Messages abrufen');
    console.log('  chatSendMessage(convId, content)          - Message senden');
    console.log('  chatEditMessage(msgId, content)           - Message bearbeiten');
    console.log('  chatDeleteMessage(msgId)                  - Message löschen');
    console.log('');
    console.log('%c😊 REACTIONS:', 'color: #8b5cf6; font-weight: bold');
    console.log('  chatAddReaction(msgId, emoji)             - Reaction hinzufügen');
    console.log('  chatRemoveReaction(msgId, emoji)          - Reaction entfernen');
    console.log('');
    console.log('%c🔍 SEARCH & OTHER:', 'color: #8b5cf6; font-weight: bold');
    console.log('  chatSearchMessages(query, convId)         - Messages suchen');
    console.log('  chatGetOnlineUsers()                      - Online Users');
    console.log('  chatUpdatePresence(status)                - Presence Update');
    console.log('  chatSetTyping(convId, isTyping)           - Typing Status');
    console.log('  chatGetKnowledge(category)                - Knowledge Wiki');
    console.log('  chatGetFeedback(status)                   - Feedback');
    console.log('');
    console.log('%c💡 BEISPIELE:', 'color: #fbbf24; font-weight: bold');
    console.log('  // DM erstellen');
    console.log('  await chatCreateConversation("DM", ["user-uuid"])');
    console.log('');
    console.log('  // Message senden');
    console.log('  await chatSendMessage("conv-uuid", "Hallo!")');
    console.log('');
    console.log('  // Reaction hinzufügen');
    console.log('  await chatAddReaction("msg-uuid", "👍")');
    console.log('');
    console.log('%c═══════════════════════════════════════════════════════════════', 'color: #8b5cf6; font-weight: bold');
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎬 AUTO-START
// ═══════════════════════════════════════════════════════════════════════════

console.log('');
console.log('%c✅ CHAT TEST SUITE GELADEN!', 'color: #28a745; font-size: 16px; font-weight: bold');
console.log('');
console.log('%c📋 NÄCHSTE SCHRITTE:', 'color: #8b5cf6; font-weight: bold');
console.log('');
console.log('1️⃣ Quick Test ausführen:');
console.log('   %cawait chatQuickTest()', 'color: #8b5cf6; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('2️⃣ Hilfe anzeigen:');
console.log('   %cchatHelp()', 'color: #8b5cf6; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;');
console.log('');
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #8b5cf6; font-weight: bold');
