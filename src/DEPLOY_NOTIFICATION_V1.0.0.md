# 🔔 **BrowoKoordinator-Notification v1.0.0 - Deployment Guide**

## 📋 **Übersicht**

Die **BrowoKoordinator-Notification** Edge Function verwaltet das komplette Benachrichtigungssystem für Browo Koordinator.

### **Version:** 1.0.0
### **Status:** ✅ Vollständig implementiert, bereit für Deployment
### **Endpoints:** 9 (1 public, 8 authenticated)

---

## 🎯 **Features**

### **✅ Vollständig Implementiert:**

1. **GET /health** - Health Check (NO AUTH)
2. **GET /my-notifications** - Benachrichtigungen abrufen (mit Pagination & Filtering)
3. **POST /create** - Benachrichtigung erstellen (System/Admin)
4. **POST /mark-read/:id** - Als gelesen markieren
5. **POST /mark-all-read** - Alle als gelesen markieren (optional nach Typ)
6. **DELETE /delete/:id** - Benachrichtigung löschen
7. **DELETE /delete-all-read** - Alle gelesenen löschen
8. **GET /unread-count** - Anzahl ungelesener Benachrichtigungen (optional nach Typ)
9. **POST /send-bulk** - Bulk-Benachrichtigungen senden (Admin)

---

## 🗄️ **Datenbank-Voraussetzungen**

### **Migration:** `053_notifications_system.sql`

**Stelle sicher, dass folgende Tabelle existiert:**

```sql
-- Prüfe ob notifications Tabelle existiert
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'notifications'
);
```

**Falls nicht:**
```bash
# Im Supabase Dashboard: SQL Editor
# Führe aus: /supabase/migrations/053_notifications_system.sql
```

### **Tabellen-Struktur:**

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'LEAVE_REQUEST_PENDING',
    'LEAVE_REQUEST_APPROVED',
    'LEAVE_REQUEST_REJECTED',
    'DOCUMENT_UPLOADED',
    'BENEFIT_APPROVED',
    'BENEFIT_REJECTED',
    'COINS_AWARDED',
    'ACHIEVEMENT_UNLOCKED',
    'VIDEO_ADDED',
    'ANNOUNCEMENT_CREATED',
    'ORGANIGRAM_UPDATED'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  link TEXT,
  related_id UUID,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_notifications_user_id` (user_id)
- `idx_notifications_user_read` (user_id, read)
- `idx_notifications_user_type` (user_id, type, read)
- `idx_notifications_created_at` (created_at DESC)

**RLS Policies:**
- ✅ Users can view own notifications
- ✅ Users can update own notifications
- ✅ System can create notifications
- ✅ Users can delete own notifications

---

## 🚀 **Deployment**

### **Option 1: Via Supabase CLI (EMPFOHLEN)**

```bash
# 1. Navigiere zum Projektverzeichnis
cd /Users/konstantinbuchele/Documents/Projekte/BrowoKoordinator

# 2. Deploye die Function
supabase functions deploy BrowoKoordinator-Notification --no-verify-jwt

# 3. Bestätigung abwarten
# ✅ Deployed function BrowoKoordinator-Notification
```

### **Option 2: Via Supabase Dashboard**

1. Öffne **Supabase Dashboard** → **Edge Functions**
2. Klicke auf **"New Function"** oder wähle **BrowoKoordinator-Notification**
3. Kopiere den kompletten Code aus:
   ```
   /supabase/functions/BrowoKoordinator-Notification/index.ts
   ```
4. **Cmd+A** → **Cmd+C** → Im Dashboard einfügen
5. Klicke **Deploy**

---

## 🧪 **Testing**

### **1. Browser Console Test**

**Datei:** `/NOTIFICATION_EDGE_FUNCTION_CONSOLE_TEST.js`

**Schritte:**
1. Öffne Browo Koordinator im Browser
2. Öffne Browser Console (F12)
3. Kopiere den kompletten Code aus `NOTIFICATION_EDGE_FUNCTION_CONSOLE_TEST.js`
4. Füge ihn in die Console ein
5. Führe aus:

```javascript
// Quick Test
await notificationQuickTest()

// Einzelne Tests
await notificationHealth()
await notificationMyNotifications()
await notificationUnreadCount()
```

### **2. Manual API Test**

```bash
# Health Check (NO AUTH)
curl https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Notification/health

# My Notifications (AUTH REQUIRED)
curl -X GET \
  'https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Notification/my-notifications?limit=10&unreadOnly=true' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'

# Unread Count
curl -X GET \
  'https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Notification/unread-count' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

---

## 📊 **API Endpoints im Detail**

### **1. GET /health**
**Auth:** ❌ Nicht erforderlich  
**Response:**
```json
{
  "status": "ok",
  "function": "BrowoKoordinator-Notification",
  "timestamp": "2025-10-30T10:00:00.000Z",
  "version": "1.0.0",
  "purpose": "Notification Management & Real-time Updates"
}
```

---

### **2. GET /my-notifications**
**Auth:** ✅ Erforderlich  
**Query Params:**
- `limit` (number, default: 50) - Anzahl Ergebnisse
- `offset` (number, default: 0) - Offset für Pagination
- `unreadOnly` (boolean, default: false) - Nur ungelesene
- `type` (string, optional) - Filter nach Typ

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "COINS_AWARDED",
      "title": "Glückwunsch!",
      "message": "Du hast 50 Coins erhalten",
      "data": {},
      "link": "/benefits",
      "read": false,
      "read_at": null,
      "created_at": "2025-10-30T10:00:00.000Z"
    }
  ],
  "count": 1,
  "total": 10,
  "limit": 50,
  "offset": 0,
  "timestamp": "2025-10-30T10:00:00.000Z"
}
```

---

### **3. POST /create**
**Auth:** ✅ Erforderlich (Admin/System)  
**Body:**
```json
{
  "user_id": "uuid",
  "title": "Glückwunsch!",
  "message": "Du hast 50 Coins erhalten",
  "type": "COINS_AWARDED",
  "link": "/benefits",
  "data": {
    "coins": 50,
    "achievement_id": "uuid"
  },
  "related_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "notification": { ... },
  "message": "Notification created successfully",
  "timestamp": "2025-10-30T10:00:00.000Z"
}
```

---

### **4. POST /mark-read/:id**
**Auth:** ✅ Erforderlich  
**Response:**
```json
{
  "success": true,
  "notification": { ... },
  "message": "Notification marked as read",
  "timestamp": "2025-10-30T10:00:00.000Z"
}
```

---

### **5. POST /mark-all-read**
**Auth:** ✅ Erforderlich  
**Query Params:**
- `type` (string, optional) - Nur bestimmten Typ markieren

**Response:**
```json
{
  "success": true,
  "markedCount": 5,
  "message": "5 notifications marked as read",
  "timestamp": "2025-10-30T10:00:00.000Z"
}
```

---

### **6. DELETE /delete/:id**
**Auth:** ✅ Erforderlich  
**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully",
  "timestamp": "2025-10-30T10:00:00.000Z"
}
```

---

### **7. DELETE /delete-all-read**
**Auth:** ✅ Erforderlich  
**Response:**
```json
{
  "success": true,
  "deletedCount": 10,
  "message": "10 read notifications deleted",
  "timestamp": "2025-10-30T10:00:00.000Z"
}
```

---

### **8. GET /unread-count**
**Auth:** ✅ Erforderlich  
**Query Params:**
- `type` (string, optional) - Nur bestimmten Typ zählen

**Response:**
```json
{
  "success": true,
  "unreadCount": 3,
  "type": "all",
  "timestamp": "2025-10-30T10:00:00.000Z"
}
```

---

### **9. POST /send-bulk**
**Auth:** ✅ Erforderlich (Admin)  
**Body:**
```json
{
  "user_ids": ["uuid1", "uuid2", "uuid3"],
  "title": "Neue Ankündigung",
  "message": "Wichtige Information für alle",
  "type": "ANNOUNCEMENT_CREATED",
  "link": "/announcements",
  "data": {}
}
```

**Response:**
```json
{
  "success": true,
  "sentCount": 3,
  "totalRequested": 3,
  "message": "3 notifications sent successfully",
  "timestamp": "2025-10-30T10:00:00.000Z"
}
```

---

## 📋 **Notification Types**

```typescript
type NotificationType = 
  | 'LEAVE_REQUEST_PENDING'
  | 'LEAVE_REQUEST_APPROVED'
  | 'LEAVE_REQUEST_REJECTED'
  | 'DOCUMENT_UPLOADED'
  | 'BENEFIT_APPROVED'
  | 'BENEFIT_REJECTED'
  | 'COINS_AWARDED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'VIDEO_ADDED'
  | 'ANNOUNCEMENT_CREATED'
  | 'ORGANIGRAM_UPDATED';
```

---

## 🔗 **Integration mit anderen Functions**

### **Antragmanager Integration:**

```typescript
// In BrowoKoordinator-Antragmanager
// Nach Genehmigung eines Urlaubsantrags:

await fetch(
  'https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Notification/create',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: leaveRequest.user_id,
      title: 'Urlaubsantrag genehmigt',
      message: `Dein Urlaubsantrag vom ${leaveRequest.start_date} - ${leaveRequest.end_date} wurde genehmigt`,
      type: 'LEAVE_REQUEST_APPROVED',
      link: '/calendar',
      related_id: leaveRequest.id,
    })
  }
);
```

---

## ✅ **Post-Deployment Checklist**

- [ ] Function deployed mit `--no-verify-jwt`
- [ ] Health Check funktioniert (200 OK)
- [ ] `/my-notifications` gibt Benachrichtigungen zurück
- [ ] `/unread-count` gibt korrekte Anzahl
- [ ] `/mark-read` funktioniert
- [ ] `/mark-all-read` funktioniert
- [ ] `/delete` funktioniert
- [ ] Frontend-Integration getestet
- [ ] Realtime-Updates funktionieren (Supabase Realtime)

---

## 🐛 **Troubleshooting**

### **Problem: 401 Unauthorized**
**Lösung:** 
- Stelle sicher, dass Access Token korrekt ist
- Prüfe ob Token abgelaufen ist
- Neu einloggen

### **Problem: 404 Not Found**
**Lösung:**
- Function korrekt deployed?
- URL korrekt? (BrowoKoordinator-Notification mit Großbuchstaben)
- `--no-verify-jwt` Flag verwendet?

### **Problem: 500 Internal Server Error**
**Lösung:**
- Supabase Function Logs checken
- Migration 053 ausgeführt?
- RLS Policies korrekt?

---

## 📈 **Nächste Schritte**

Nach erfolgreichem Deployment:

1. **Frontend-Integration:**
   - Notification Center Component erstellen
   - Badge mit Unread Count
   - Realtime Updates via Supabase Subscriptions

2. **Andere Functions integrieren:**
   - Antragmanager → LEAVE_REQUEST_APPROVED/REJECTED
   - Dokumente → DOCUMENT_UPLOADED
   - Benefits → BENEFIT_APPROVED/REJECTED
   - Learning → VIDEO_ADDED
   - Announcements → ANNOUNCEMENT_CREATED

3. **Future Enhancements:**
   - Email Notifications
   - Push Notifications (Web Push API)
   - Notification Preferences
   - Notification Grouping

---

## 📊 **Aktueller Stand: 5/14 Edge Functions**

### ✅ **Vollständig implementiert & deployed:**
1. ✅ BrowoKoordinator-Dokumente (v2.1.0)
2. ✅ BrowoKoordinator-Zeiterfassung (v3.0.0)
3. ✅ BrowoKoordinator-Kalender (v2.0.0)
4. ✅ BrowoKoordinator-Antragmanager (v1.0.0)
5. ✅ **BrowoKoordinator-Notification (v1.0.0)** ← **GERADE IMPLEMENTIERT**

### ⏳ **Noch zu implementieren (9 Functions):**
6. ⏳ BrowoKoordinator-Analytics
7. ⏳ BrowoKoordinator-Automation
8. ⏳ BrowoKoordinator-Benefits
9. ⏳ BrowoKoordinator-Chat
10. ⏳ BrowoKoordinator-Field
11. ⏳ BrowoKoordinator-Lernen
12. ⏳ BrowoKoordinator-Organigram
13. ⏳ BrowoKoordinator-Personalakte
14. ⏳ BrowoKoordinator-Tasks

---

## 🎉 **Deployment Ready!**

Die BrowoKoordinator-Notification v1.0.0 ist **vollständig implementiert** und **bereit für Deployment**!

**Deploy-Befehl:**
```bash
supabase functions deploy BrowoKoordinator-Notification --no-verify-jwt
```

**Nach Deployment testen mit:**
```javascript
await notificationQuickTest()
```

---

**Erstellt:** 30. Oktober 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
