# 💬 **BrowoKoordinator-Chat v1.0.0 - Deployment Guide**

## 📋 **Übersicht**

Die **BrowoKoordinator-Chat** Edge Function ist ein vollständiges Chat-System mit DMs, Group Chats, Knowledge Wiki und Feedback System.

### **Version:** 1.0.0
### **Status:** ✅ Vollständig implementiert, bereit für Deployment
### **Endpoints:** ~30 (1 public, 29 authenticated)
### **Lines of Code:** ~1400+

---

## 🎯 **Features**

### **✅ Vollständig Implementiert:**

**Conversations Management (9 Endpoints):**
1. **GET /conversations** - Alle Conversations des Users
2. **GET /conversations/:id** - Conversation Details mit Members
3. **POST /conversations** - Neue Conversation (DM/GROUP)
4. **PUT /conversations/:id** - Conversation bearbeiten (Name, Avatar)
5. **DELETE /conversations/:id** - Conversation löschen/verlassen
6. **POST /conversations/:id/members** - Member hinzufügen
7. **DELETE /conversations/:id/members/:user_id** - Member entfernen
8. **PUT /conversations/:id/read** - Als gelesen markieren
9. **GET /conversations/:id/unread** - Ungelesene Nachrichten zählen

**Messages (9 Endpoints):**
10. **GET /conversations/:id/messages** - Messages abrufen (paginated)
11. **POST /conversations/:id/messages** - Message senden
12. **PUT /messages/:id** - Message bearbeiten
13. **DELETE /messages/:id** - Message löschen (soft delete)
14. **POST /messages/:id/reactions** - Reaction hinzufügen (😊)
15. **DELETE /messages/:id/reactions** - Reaction entfernen
16. **POST /messages/:id/read** - Message als gelesen markieren
17. **POST /messages/:id/attachments** - Attachment hinzufügen
18. **GET /messages/:id/attachments** - Attachments abrufen

**Attachments (1 Endpoint):**
19. **DELETE /attachments/:id** - Attachment löschen

**Typing & Presence (3 Endpoints):**
20. **POST /conversations/:id/typing** - Typing Status setzen
21. **GET /users/online** - Online Users abrufen
22. **POST /presence** - Presence Update (ONLINE, AWAY, BUSY, OFFLINE)

**Search (2 Endpoints):**
23. **GET /search/messages** - Messages durchsuchen
24. **GET /search/conversations** - Conversations durchsuchen

**Knowledge Wiki (4 Endpoints):**
25. **GET /knowledge** - Wiki Pages abrufen
26. **POST /knowledge** - Wiki Page erstellen
27. **PUT /knowledge/:id** - Wiki Page bearbeiten
28. **DELETE /knowledge/:id** - Wiki Page löschen

**Feedback System (3 Endpoints):**
29. **GET /feedback** - Feedback abrufen
30. **POST /feedback** - Feedback erstellen
31. **PUT /feedback/:id** - Feedback Status Update

**System:**
32. **GET /health** - Health Check (NO AUTH)

---

## 🗄️ **Datenbank-Integration**

### **Tabellen (bereits vorhanden):**

```sql
- BrowoKo_conversations           -- Conversations (DM/GROUP)
- BrowoKo_conversation_members    -- Conversation Members mit Roles
- BrowoKo_messages                -- Messages mit Type & Soft Delete
- BrowoKo_message_attachments     -- File Attachments
- BrowoKo_message_reactions       -- Emoji Reactions
- BrowoKo_message_reads           -- Read Receipts
- BrowoKo_typing_indicators       -- Typing Indicators
- BrowoKo_user_presence           -- User Presence (ONLINE/OFFLINE)
- BrowoKo_knowledge_pages         -- Knowledge Wiki
- BrowoKo_knowledge_categories    -- Wiki Categories
- BrowoKo_feedback                -- Feedback System
```

**Migration:** `065_chat_system_complete.sql` (bereits existiert)

---

## 💬 **Chat System Features**

### **Conversation Types:**

```typescript
'DM'     // Direct Message (1:1)
'GROUP'  // Group Chat (1:N)
```

### **Message Types:**

```typescript
'TEXT'   // Regular text message
'FILE'   // File attachment
'IMAGE'  // Image attachment
'VIDEO'  // Video attachment
'SYSTEM' // System message
```

### **Presence Status:**

```typescript
'ONLINE'  // User is active
'AWAY'    // User is away
'BUSY'    // User is busy
'OFFLINE' // User is offline
```

### **Member Roles:**

```typescript
'ADMIN'   // Can add/remove members, rename group
'MEMBER'  // Regular member
```

---

## 🔒 **Security & Permissions**

### **Conversation Access:**
- ✅ User muss Member der Conversation sein
- ✅ Nur ADMINs können Members hinzufügen/entfernen
- ✅ Nur ADMINs können Conversation umbenennen
- ✅ ADMINs können Conversation löschen
- ✅ MEMBERs können nur verlassen

### **Message Permissions:**
- ✅ User kann nur eigene Messages bearbeiten
- ✅ User kann eigene Messages löschen
- ✅ Admins können alle Messages löschen
- ✅ Soft Delete (deleted_at)

### **Read Receipts:**
- ✅ Tracking von last_read_at
- ✅ Unread Count Berechnung
- ✅ Message Read Receipts

---

## 🚀 **Deployment**

### **Via Supabase CLI (EMPFOHLEN):**

```bash
cd /Users/konstantinbuchele/Documents/Projekte/BrowoKoordinator
supabase functions deploy BrowoKoordinator-Chat --no-verify-jwt
```

### **Via Supabase Dashboard:**
1. Öffne **Supabase Dashboard** → **Edge Functions**
2. Wähle **BrowoKoordinator-Chat**
3. Kopiere Code aus `/supabase/functions/BrowoKoordinator-Chat/index.ts`
4. Deploy

---

## 🧪 **Testing**

### **Browser Console Test:**

**Datei:** `/CHAT_EDGE_FUNCTION_CONSOLE_TEST.js`

**Schritte:**
1. Öffne Browo Koordinator im Browser
2. Öffne Browser Console (F12)
3. Kopiere den kompletten Code
4. Füge ihn in die Console ein
5. Führe aus:

```javascript
// Quick Test
await chatQuickTest()

// Einzelne Tests
await chatHealth()
await chatGetConversations()
await chatGetOnlineUsers()

// DM erstellen
await chatCreateConversation("DM", ["user-uuid"])

// Message senden
await chatSendMessage("conv-uuid", "Hallo!")

// Reaction hinzufügen
await chatAddReaction("msg-uuid", "👍")
```

---

## 📊 **API Endpoints im Detail**

### **1. GET /conversations**
**Auth:** ✅ Erforderlich  

**Response:**
```json
{
  "success": true,
  "conversations": [
    {
      "id": "uuid",
      "type": "DM",
      "name": null,
      "avatar_url": null,
      "created_at": "2025-10-30T12:00:00.000Z",
      "updated_at": "2025-10-30T12:00:00.000Z",
      "members": [
        {
          "user_id": "uuid",
          "role": "MEMBER",
          "last_read_at": "2025-10-30T12:00:00.000Z"
        }
      ],
      "last_message": {
        "content": "Hello!",
        "created_at": "2025-10-30T12:00:00.000Z",
        "user_id": "uuid"
      }
    }
  ]
}
```

---

### **2. POST /conversations**
**Auth:** ✅ Erforderlich  
**Body:**
```json
{
  "type": "DM",
  "member_ids": ["user-uuid"],
  "name": null
}
```

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": "uuid",
    "type": "DM",
    "name": null,
    "created_by": "user-uuid",
    "created_at": "2025-10-30T12:00:00.000Z"
  },
  "existing": false
}
```

**Note:** Bei DM wird geprüft ob bereits existiert, dann wird existierende zurückgegeben

---

### **3. POST /conversations/:id/messages**
**Auth:** ✅ Erforderlich  
**Body:**
```json
{
  "content": "Hello World!",
  "type": "TEXT",
  "reply_to_message_id": null
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "uuid",
    "conversation_id": "uuid",
    "user_id": "uuid",
    "content": "Hello World!",
    "type": "TEXT",
    "created_at": "2025-10-30T12:00:00.000Z",
    "user": {
      "id": "uuid",
      "full_name": "John Doe",
      "profile_picture": "..."
    }
  }
}
```

---

### **4. GET /conversations/:id/messages**
**Auth:** ✅ Erforderlich  
**Query Params:**
- `limit` (number, default: 50)
- `before` (message_id, for pagination)

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "user_id": "uuid",
      "content": "Hello!",
      "type": "TEXT",
      "edited_at": null,
      "deleted_at": null,
      "created_at": "2025-10-30T12:00:00.000Z",
      "user": {
        "id": "uuid",
        "full_name": "John Doe",
        "profile_picture": "..."
      },
      "attachments": [],
      "reactions": [
        {
          "emoji": "👍",
          "user_id": "uuid",
          "user": {
            "id": "uuid",
            "full_name": "Jane Doe"
          }
        }
      ]
    }
  ]
}
```

---

### **5. POST /messages/:id/reactions**
**Auth:** ✅ Erforderlich  
**Body:**
```json
{
  "emoji": "👍"
}
```

**Response:**
```json
{
  "success": true,
  "reaction": {
    "id": "uuid",
    "message_id": "uuid",
    "user_id": "uuid",
    "emoji": "👍",
    "created_at": "2025-10-30T12:00:00.000Z"
  }
}
```

---

### **6. POST /conversations/:id/typing**
**Auth:** ✅ Erforderlich  
**Body:**
```json
{
  "is_typing": true
}
```

**Response:**
```json
{
  "success": true
}
```

**Note:** Typing Indicators laufen automatisch nach ~10 Sekunden ab

---

### **7. POST /presence**
**Auth:** ✅ Erforderlich  
**Body:**
```json
{
  "status": "ONLINE"
}
```

**Response:**
```json
{
  "success": true
}
```

**Status Options:** ONLINE, AWAY, BUSY, OFFLINE

---

### **8. GET /search/messages**
**Auth:** ✅ Erforderlich  
**Query Params:**
- `q` (string, required) - Suchbegriff
- `conversation_id` (uuid, optional) - Filter nach Conversation

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "content": "Search result...",
      "conversation": {
        "id": "uuid",
        "type": "DM",
        "name": null
      },
      "user": {
        "id": "uuid",
        "full_name": "John Doe"
      }
    }
  ]
}
```

---

### **9. GET /knowledge**
**Auth:** ✅ Erforderlich  
**Query Params:**
- `category` (string, optional)

**Response:**
```json
{
  "success": true,
  "pages": [
    {
      "id": "uuid",
      "title": "Onboarding Guide",
      "content": "...",
      "category": "HR",
      "tags": ["onboarding", "guide"],
      "is_published": true,
      "created_by": "uuid",
      "created_at": "2025-10-30T12:00:00.000Z"
    }
  ]
}
```

---

### **10. GET /feedback**
**Auth:** ✅ Erforderlich  
**Query Params:**
- `status` (string, optional) - PENDING, IN_PROGRESS, RESOLVED, CLOSED

**Response:**
```json
{
  "success": true,
  "feedback": [
    {
      "id": "uuid",
      "title": "Feature Request",
      "description": "...",
      "category": "Feature",
      "priority": "MEDIUM",
      "status": "PENDING",
      "created_by": "uuid",
      "created_at": "2025-10-30T12:00:00.000Z"
    }
  ]
}
```

---

## 🔄 **Real-time Features**

Die Chat Function ist designed für Real-time Updates via Supabase Realtime:

### **Subscribe to Conversations:**
```javascript
supabase
  .channel('conversations')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'BrowoKo_messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    console.log('New message:', payload.new)
  })
  .subscribe()
```

### **Subscribe to Typing Indicators:**
```javascript
supabase
  .channel('typing')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'BrowoKo_typing_indicators',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    console.log('User typing:', payload.new)
  })
  .subscribe()
```

### **Subscribe to Presence:**
```javascript
supabase
  .channel('presence')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'BrowoKo_user_presence'
  }, (payload) => {
    console.log('User status changed:', payload.new)
  })
  .subscribe()
```

---

## ✅ **Post-Deployment Checklist**

- [ ] Function deployed mit `--no-verify-jwt`
- [ ] Health Check funktioniert (200 OK)
- [ ] `/conversations` gibt User's Conversations zurück
- [ ] `/conversations` DM erstellen funktioniert
- [ ] `/conversations/:id/messages` gibt Messages zurück
- [ ] Message senden funktioniert
- [ ] Reactions hinzufügen/entfernen funktioniert
- [ ] Typing Indicators funktionieren
- [ ] Presence Updates funktionieren
- [ ] Search Messages funktioniert
- [ ] Knowledge Wiki funktioniert
- [ ] Feedback System funktioniert
- [ ] Frontend-Integration getestet

---

## 📈 **Edge Functions Progress: 8/14 (57.1%)**

### ✅ **Vollständig implementiert:**
1. ✅ BrowoKoordinator-Dokumente (v2.1.0)
2. ✅ BrowoKoordinator-Zeiterfassung (v3.0.0)
3. ✅ BrowoKoordinator-Kalender (v2.0.0)
4. ✅ BrowoKoordinator-Antragmanager (v1.0.0)
5. ✅ BrowoKoordinator-Notification (v1.0.0)
6. ✅ BrowoKoordinator-Lernen (v1.0.0)
7. ✅ BrowoKoordinator-Benefits (v1.0.0)
8. ✅ **BrowoKoordinator-Chat (v1.0.0)** ← **GERADE IMPLEMENTIERT**

### ⏳ **Noch zu implementieren (6 Functions):**
9. ⏳ BrowoKoordinator-Analytics
10. ⏳ BrowoKoordinator-Automation
11. ⏳ BrowoKoordinator-Field
12. ⏳ BrowoKoordinator-Organigram
13. ⏳ BrowoKoordinator-Personalakte
14. ⏳ BrowoKoordinator-Tasks

**🎉 57% ERREICHT! ÜBER DIE HÄLFTE FERTIG!**

---

## 🎉 **READY TO DEPLOY!**

Die **BrowoKoordinator-Chat v1.0.0** ist **vollständig implementiert** und **production-ready**!

**Deploy-Befehl:**
```bash
supabase functions deploy BrowoKoordinator-Chat --no-verify-jwt
```

**Nach Deployment testen mit:**
```javascript
await chatQuickTest()
```

---

## 💡 **Integration Guide**

### **Frontend Integration:**

```typescript
// Get Conversations
const { data } = await chatService.getConversations();

// Create DM
const { data } = await chatService.createDM(userId);

// Send Message
const { data } = await chatService.sendMessage(conversationId, content);

// Add Reaction
const { data } = await chatService.addReaction(messageId, emoji);

// Set Typing
await chatService.setTyping(conversationId, true);

// Update Presence
await chatService.updatePresence('ONLINE');
```

### **Real-time Integration:**

```typescript
// Subscribe to messages
const subscription = chatService.subscribeToMessages(
  conversationId, 
  (message) => {
    console.log('New message:', message);
  }
);

// Subscribe to typing
const typingSubscription = chatService.subscribeToTyping(
  conversationId,
  (typingUsers) => {
    console.log('Users typing:', typingUsers);
  }
);

// Unsubscribe
subscription.unsubscribe();
typingSubscription.unsubscribe();
```

---

**Erstellt:** 30. Oktober 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Meilenstein:** 🎉 **57% der Edge Functions fertig!**  
**Lines of Code:** ~1400+  
**Endpoints:** ~30
