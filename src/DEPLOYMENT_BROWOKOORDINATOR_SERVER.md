# BrowoKoordinator-Server - Deployment Anleitung

## ✅ Migration abgeschlossen!

Die Edge Function `BrowoKoordinator-Server` ist vollständig migriert und bereit zum Deployment über das **Supabase Dashboard**.

---

## 📦 Dateien die deployed werden müssen

### **Neue Dateien (3 Shared Modules):**
1. ✅ `auth.ts` - Authentication & Authorization
2. ✅ `permissions.ts` - Permission Keys
3. ✅ `errors.ts` - Error Classes & Handler

### **Geänderte Dateien (8 Files):**
4. ✅ `index.ts` - Zentrale Auth Middleware
5. ✅ `routes-permissions.ts` - Permission Routes
6. ✅ `routes-users.ts` - User Routes
7. ✅ `routes-workflows.ts` - Workflow Routes
8. ✅ `routes-itEquipment.ts` - IT Equipment Routes
9. ✅ `routes-storage.ts` - Storage Routes
10. ✅ `routes-tests.ts` - Test Submission Routes
11. ✅ `routes-entities.ts` - Entity Routes (keine Änderung, nur Auth-Check)

### **Unveränderte Dateien (4 Core Files):**
- `core-buckets.ts` ✓ Keine Änderungen
- `core-kv.ts` ✓ Keine Änderungen
- `core-supabaseClient.ts` ✓ Keine Änderungen
- `core-workflows.ts` ✓ Keine Änderungen

---

## 🚀 Deployment Schritte

### **Schritt 1: Supabase Dashboard öffnen**
1. Gehe zu: https://supabase.com/dashboard
2. Wähle dein Projekt
3. Klicke auf **Edge Functions** im linken Menü
4. Suche **BrowoKoordinator-Server** in der Liste

---

### **Schritt 2: Neue Dateien hochladen**

Im Supabase Dashboard für `BrowoKoordinator-Server`:

#### **1. auth.ts erstellen**
```
Klicke auf "New File" oder "+" Button
Dateiname: auth.ts
Inhalt: Kopiere aus /supabase/functions/BrowoKoordinator-Server/auth.ts
```

#### **2. permissions.ts erstellen**
```
Klicke auf "New File" oder "+" Button
Dateiname: permissions.ts
Inhalt: Kopiere aus /supabase/functions/BrowoKoordinator-Server/permissions.ts
```

#### **3. errors.ts erstellen**
```
Klicke auf "New File" oder "+" Button
Dateiname: errors.ts
Inhalt: Kopiere aus /supabase/functions/BrowoKoordinator-Server/errors.ts
```

---

### **Schritt 3: Geänderte Dateien aktualisieren**

#### **4. index.ts aktualisieren**
```
Öffne index.ts im Dashboard
Lösche den alten Inhalt
Kopiere neuen Inhalt aus /supabase/functions/BrowoKoordinator-Server/index.ts
Save & Deploy
```

#### **5-11. Alle Route-Files aktualisieren**

Für jede dieser Dateien:
- `routes-permissions.ts`
- `routes-users.ts`
- `routes-workflows.ts`
- `routes-itEquipment.ts`
- `routes-storage.ts`
- `routes-tests.ts`
- `routes-entities.ts`

**Wiederhole:**
```
1. Öffne die Datei im Supabase Dashboard
2. Lösche den alten Inhalt
3. Kopiere neuen Inhalt aus lokalem File
4. Save (NOCH NICHT deployen)
```

---

### **Schritt 4: Deployment**

**WICHTIG:** Erst wenn **ALLE** Dateien aktualisiert sind:

```
1. Klicke auf "Deploy" Button
2. Warte auf erfolgreichen Deploy (grüner Haken)
3. Prüfe Logs auf Fehler
```

---

## ✅ Testing

### **Test 1: Health Check (Public Route)**
```bash
curl https://[PROJECT-ID].supabase.co/functions/v1/BrowoKoordinator-Server/health
```

**Erwartete Antwort:**
```json
{"status":"ok"}
```

---

### **Test 2: Auth-geschützte Route (ohne Token)**
```bash
curl https://[PROJECT-ID].supabase.co/functions/v1/BrowoKoordinator-Server/api/departments
```

**Erwartete Antwort:**
```json
{
  "error": "Missing or invalid Authorization header",
  "statusCode": 401
}
```

---

### **Test 3: Auth-geschützte Route (mit Token)**
```bash
curl -H "Authorization: Bearer [DEIN_TOKEN]" \
     https://[PROJECT-ID].supabase.co/functions/v1/BrowoKoordinator-Server/api/me/permissions
```

**Erwartete Antwort:**
```json
{
  "permissions": ["view_dashboard", "edit_own_profile", ...]
}
```

---

## 🔧 Wichtige Änderungen

### **1. Zentrale Auth Middleware**
- Alle Routes (außer `/` und `/health`) benötigen Auth
- Auth-Context wird in `c.set("auth", auth)` gespeichert
- Routes greifen darauf zu via `c.get("auth")`

### **2. Permission-Checks**
Statt:
```typescript
if (!auth.isAdmin) {
  return c.json({ error: "forbidden" }, 403);
}
```

Jetzt:
```typescript
if (!auth.isAdmin) {
  throw new ForbiddenError("Admin access required");
}
```

### **3. Error-Handling**
Zentrale Error-Behandlung via `errorResponse()`:
- `UnauthorizedError` → 401
- `ForbiddenError` → 403
- `NotFoundError` → 404
- `BadRequestError` → 400
- Standard `Error` → 500

---

## 🎯 Permission-Keys die verwendet werden

### **User Routes:**
- `ADD_EMPLOYEES` - User erstellen
- `VIEW_ALL_TIME_ACCOUNTS` - Alle Zeitkonten sehen

### **Workflow Routes:**
- `MANAGE_WORKFLOWS` - Workflows verwalten

### **Storage Routes:**
- `EDIT_COMPANY_SETTINGS` - Logo hochladen
- `UPLOAD_PROFILE_PICTURE` - Profilbild hochladen
- `UPLOAD_DOCUMENTS` - Dokumente hochladen

### **Test Routes:**
- `VIEW_COURSES` - Test-Submissions sehen
- `TAKE_QUIZZES` - Tests absolvieren
- `EDIT_COURSES` - Tests reviewen

### **Admin-Only (kein Permission-Check):**
- IT Equipment (alle Operationen)
- Dokumente löschen
- User Permissions verwalten

---

## 🐛 Troubleshooting

### **Error: "Cannot find module './auth.ts'"**
**Problem:** Die neuen Shared-Files wurden nicht erstellt
**Lösung:** Stelle sicher, dass `auth.ts`, `permissions.ts` und `errors.ts` im Dashboard existieren

### **Error: "User profile not found"**
**Problem:** User existiert in Auth aber nicht in `users` Tabelle
**Lösung:** Prüfe ob der DB-Trigger für User-Erstellung funktioniert

### **Error: "Missing permission: xyz"**
**Problem:** User hat die benötigte Permission nicht
**Lösung:**
1. Prüfe Permissions: `GET /api/me/permissions`
2. Füge Permission hinzu über Admin-UI

### **Function startet nicht nach Deploy**
**Problem:** Syntax-Error oder fehlende Imports
**Lösung:**
1. Prüfe Logs im Supabase Dashboard
2. Stelle sicher, dass ALLE Files deployed sind
3. Prüfe auf Tippfehler in Imports

---

## 📊 Zeitaufwand

| Task | Dauer |
|------|-------|
| 3 neue Files erstellen | ~5 Min |
| 8 Files aktualisieren | ~15 Min |
| Deploy & Testen | ~5 Min |
| **TOTAL** | **~25 Min** |

---

## ✅ Deployment Checklist

- [ ] `auth.ts` erstellt
- [ ] `permissions.ts` erstellt
- [ ] `errors.ts` erstellt
- [ ] `index.ts` aktualisiert
- [ ] `routes-permissions.ts` aktualisiert
- [ ] `routes-users.ts` aktualisiert
- [ ] `routes-workflows.ts` aktualisiert
- [ ] `routes-itEquipment.ts` aktualisiert
- [ ] `routes-storage.ts` aktualisiert
- [ ] `routes-tests.ts` aktualisiert
- [ ] `routes-entities.ts` aktualisiert
- [ ] Deploy erfolgreich
- [ ] Health Check funktioniert
- [ ] Auth-Check funktioniert
- [ ] Permission-Check funktioniert

---

## 🎉 Fertig!

Nach erfolgreichem Deployment ist `BrowoKoordinator-Server` vollständig auf das neue Permission-System migriert!

**Nächste Schritte:**
- [ ] Andere Edge Functions migrieren (Mitarbeitergespräche, Lernen, Zeiterfassung)
- [ ] Frontend auf neues Permission-System umstellen
- [ ] Tests schreiben

---

## 📝 Notizen

- Migration 079 ist bereits deployed ✅
- Alle Permission-Keys sind in der DB vorhanden ✅
- View `effective_user_permissions` existiert ✅
- Lokale Shared-Files (nicht global `_shared`) ✅

**Status:** Ready to Deploy! 🚀
