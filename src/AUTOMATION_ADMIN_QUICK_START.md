# ⚡ Automation Admin Panel - Quick Start

**Version:** v4.11.0  
**Feature:** Automationenverwaltung im Admin Panel

---

## 🎯 **WAS IST NEU?**

Ein komplett neuer Tab im Admin Panel zum Verwalten von **n8n Automation API Keys**!

**Features:**
- ✅ API Keys erstellen (einmalige Anzeige!)
- ✅ API Keys umbenennen
- ✅ Statistiken & Monitoring
- ✅ Audit Log pro Key
- ✅ Löschen mit Confirmation

---

## 🚀 **QUICK START (3 SCHRITTE):**

### **SCHRITT 1: Admin Panel öffnen**
```
1. Login als HR oder Superadmin
2. Klick auf Admin Icon (oben rechts, blauer Button mit ⚙️)
3. Scroll nach unten → "Automationenverwaltung" (⚡ Icon)
4. Click!
```

### **SCHRITT 2: API Key erstellen**
```
1. "Neuen API Key erstellen" Button klicken
2. Name eingeben (z.B. "n8n Production")
3. "API Key erstellen" klicken
4. ⚠️ WICHTIG: API Key SOFORT kopieren!
   - Wird nur EINMAL angezeigt!
   - Copy Button verwenden
5. "Fertig" klicken
```

### **SCHRITT 3: In n8n verwenden**
```
1. n8n öffnen
2. HTTP Request Node hinzufügen
3. Authentication → "Header Auth"
4. Name: X-API-Key
5. Value: <dein kopierter API Key>
6. URL: https://azmlolgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/actions/<module>/<action>
7. Fertig!
```

---

## 📦 **WAS DU SIEHST:**

### **Empty State (wenn keine Keys):**
```
╔══════════════════════════════════════╗
║  ⚡ Noch keine API Keys              ║
║                                       ║
║  Erstelle deinen ersten API Key,     ║
║  um Browo Koordinator mit n8n zu     ║
║  verbinden.                           ║
║                                       ║
║  [+ Ersten API Key erstellen]        ║
╚══════════════════════════════════════╝
```

### **API Key Box:**
```
╔══════════════════════════════════════╗
║ 🔑 My n8n Integration     [✏️] [🗑️]  ║
║────────────────────────────────────  ║
║ Erstellt von: Max Mustermann         ║
║ Erstellt: vor 2 Tagen                ║
║                                       ║
║ ┌─────────┐ ┌──────────┐ ┌─────────┐║
║ │   186   │ │   180    │ │    6    │║
║ │  Total  │ │ Erfolg ✓ │ │ Fehler ✗│║
║ └─────────┘ └──────────┘ └─────────┘║
║                                       ║
║ 🕐 Zuletzt verwendet: vor 1 Stunde   ║
║                                       ║
║ Top Aktionen:                         ║
║ • antragmanager.leave-requests (45)  ║
║ • personalakte.users (38)             ║
║ • dokumente.list (22)                 ║
║                                       ║
║ API Key ID: browo_abc123...           ║
╚══════════════════════════════════════╝
```

---

## ✏️ **API KEY UMBENENNEN:**

```
1. Click [✏️ Edit] Button
2. Name wird zu Input Field
3. Neuen Namen eingeben
4. [✓] klicken ODER Enter drücken
5. Name wird gespeichert!

Shortcuts:
• Enter = Speichern
• Escape = Abbrechen
```

---

## 🗑️ **API KEY LÖSCHEN:**

```
1. Click [🗑️ Delete] Button
2. Confirmation Dialog erscheint:
   "Bist du sicher?"
   "Alle Automationen mit diesem Key werden gestoppt!"
3. "Löschen" bestätigen
4. Key wird deaktiviert (nicht wirklich gelöscht)

⚠️ WICHTIG:
- Key ist sofort ungültig
- n8n Workflows mit diesem Key funktionieren nicht mehr!
- Kann NICHT rückgängig gemacht werden!
```

---

## 📊 **STATISTIKEN VERSTEHEN:**

### **Total Aufrufe:**
- Anzahl aller API Calls mit diesem Key

### **Erfolg ✓:**
- Anzahl erfolgreicher Requests (HTTP 2xx)

### **Fehler ✗:**
- Anzahl fehlgeschlagener Requests (HTTP 4xx/5xx)

### **Top Aktionen:**
- Die 5 am häufigsten verwendeten API Endpoints
- Format: `module.action (anzahl)`
- Beispiel: `antragmanager.leave-requests (45)`

### **Zuletzt verwendet:**
- Timestamp des letzten API Calls
- Format: "vor X Stunden/Tagen"

---

## 🔍 **VERFÜGBARE MODULE:**

Die folgenden 13 Module sind über die Automation API verfügbar:

1. **Antragmanager** - Leave Requests & Approvals
2. **Personalakte** - User Management
3. **Dokumente** - Document Management
4. **Kalender** - Calendar & Events
5. **Zeiterfassung** - Time Tracking
6. **Lernen** - Learning Content & Quizzes
7. **Chat** - Messaging & Conversations
8. **Organigram** - Organization Chart
9. **Benefits** - Employee Benefits
10. **Tasks** - Task Management
11. **Field** - Field Operations
12. **Analytics** - Reporting & Analytics
13. **Notification** - Push Notifications

**Total:** 186+ API Routes verfügbar!

---

## 🧪 **TESTEN:**

### **Test 1: API Key erstellen**
```
✓ Dialog öffnet sich
✓ Name kann eingegeben werden
✓ API Key wird nach Erstellung angezeigt
✓ Copy Button funktioniert
✓ "Fertig" schließt Dialog
✓ Neue Box erscheint in der Liste
```

### **Test 2: Stats werden geladen**
```
✓ Stats Grid zeigt 0/0/0 (neue Keys)
✓ Keine Top Aktionen angezeigt
✓ "Noch keine Automationen ausgeführt" Text
```

### **Test 3: API Call mit Key**
```bash
# In Terminal:
curl 'https://azmlolgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/actions' \
  -H 'X-API-Key: browo_YOUR_KEY_HERE'

# Erwartetes Ergebnis:
# {"total":186,"actions":[...],"modules":[...]}
```

### **Test 4: Stats aktualisieren**
```
1. Warte 5 Sekunden
2. Refresh Icon klicken (oben rechts)
3. Stats sollten aktualisiert sein:
   - Total: 1
   - Erfolg: 1
   - Fehler: 0
   - Top Action: "automation.actions"
```

### **Test 5: Umbenennen**
```
✓ Edit Button klicken
✓ Input Field erscheint
✓ Neuen Namen eingeben
✓ Enter drücken
✓ Name wird gespeichert
✓ Box zeigt neuen Namen
```

### **Test 6: Löschen**
```
✓ Delete Button klicken
✓ Confirmation Dialog erscheint
✓ "Löschen" bestätigen
✓ Box verschwindet
✓ API Key funktioniert nicht mehr
```

---

## ❓ **TROUBLESHOOTING:**

### **Problem: "Only HR/Superadmin can generate API keys"**

**Lösung:**
```sql
-- Check deine Role:
SELECT email, role FROM users WHERE email = 'YOUR_EMAIL';

-- Falls nicht HR:
UPDATE users SET role = 'HR' WHERE email = 'YOUR_EMAIL';
```

---

### **Problem: Stats zeigen "0" obwohl API Calls gemacht wurden**

**Lösung:**
1. Refresh Button klicken (⟳ oben rechts)
2. Warte 5-10 Sekunden (Database lag)
3. Hard Refresh: Ctrl+Shift+R
4. Check Audit Log in Database:
   ```sql
   SELECT * FROM automation_audit_log 
   WHERE api_key_id = 'YOUR_KEY_ID'
   ORDER BY created_at DESC;
   ```

---

### **Problem: API Key funktioniert nicht**

**Check:**
1. Key korrekt kopiert? (kein Leerzeichen am Ende!)
2. Header korrekt? `X-API-Key` (case-sensitive!)
3. Key ist aktiv? (nicht gelöscht?)
4. Check in Database:
   ```sql
   SELECT * FROM automation_api_keys 
   WHERE key_hash = 'YOUR_KEY'
   AND is_active = true;
   ```

---

### **Problem: "Failed to fetch" beim Laden**

**Lösung:**
1. Edge Function deployed?
   ```bash
   npx supabase functions list
   # → BrowoKoordinator-Automation sollte listed sein
   ```
2. Migration gelaufen?
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name LIKE 'automation_%';
   -- Sollte 3 Tabellen zeigen
   ```

---

## 📖 **WEITERE RESSOURCEN:**

- **Vollständige Dokumentation:** `/AUTOMATION_ADMIN_PANEL_COMPLETE.md`
- **n8n Integration Guide:** `/N8N_INTEGRATION_COMPLETE_GUIDE.md`
- **Deployment Guide:** `/AUTOMATION_DEPLOYMENT_GUIDE_FIXED.md`
- **Edge Function Code:** `/supabase/functions/BrowoKoordinator-Automation/index.ts`

---

## 🎉 **FERTIG!**

Du kannst jetzt:
✅ API Keys erstellen
✅ n8n verbinden
✅ Automationen monitoren
✅ Keys verwalten

**Viel Erfolg mit deinen Automationen! 🚀**
