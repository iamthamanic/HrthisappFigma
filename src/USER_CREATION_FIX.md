# 🔧 User-Erstellung Fix - "User not allowed" Problem behoben

## Problem

Beim Anlegen neuer Mitarbeiter über `/admin/team-management/add-employee` trat der Fehler "User not allowed" auf.

### Ursache

Die `supabase.auth.admin.createUser()` Funktion kann **nur mit dem Service Role Key** verwendet werden, nicht mit dem Anon Key im Frontend. Der Frontend-Code versuchte direkt `auth.admin` zu nutzen, was zu einem Berechtigungsfehler führte.

## ✅ Lösung

### 1. Server-Route erstellt

Eine neue Route wurde im Supabase Edge Function Server erstellt:

**Endpoint:** `POST /make-server-f659121d/users/create`

**Funktionen:**
- Verwendet den Service Role Key für Admin-Operationen
- Erstellt Auth-User via `supabase.auth.admin.createUser()`
- **WICHTIG:** Erstellt KEIN User-Profil - das macht der Trigger automatisch!
- Aktualisiert das User-Profil mit zusätzlichen Daten (via UPDATE)
- Automatische Organisation-Zuweisung

**Code-Location:** `/supabase/functions/server/index.tsx`

**Workflow:**
1. Server erstellt Auth-User
2. Trigger `handle_new_user()` erstellt automatisch:
   - User-Profil in `users` Tabelle
   - Avatar in `user_avatars` Tabelle
   - Welcome Notification
   - 50 Welcome Coins
3. Server aktualisiert User-Profil mit Admin-Daten (Gehalt, Position, etc.)

### 2. AdminStore angepasst

Der `adminStore.ts` wurde aktualisiert, um die Server-Route zu verwenden:

**Vorher:**
```typescript
// ❌ Funktioniert nicht im Frontend
const { data: authData, error: authError } = await supabase.auth.admin.createUser(...)
```

**Nachher:**
```typescript
// ✅ Ruft Server-Route auf
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-f659121d/users/create`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ email, password, userData }),
  }
);
```

### 3. AddEmployeeScreen angepasst

Der Aufruf wurde korrigiert, um das Passwort als separaten Parameter zu übergeben:

**Vorher:**
```typescript
await createUser({
  email: formData.email,
  password: formData.password,  // ❌ Passwort als Teil der userData
  ...
});
```

**Nachher:**
```typescript
await createUser({
  email: formData.email,
  ...
}, formData.password);  // ✅ Passwort als separater Parameter
```

## 🔄 Datenfluss

```
Frontend (AddEmployeeScreen)
    ↓
adminStore.createUser(userData, password)
    ↓
Server Route: POST /make-server-f659121d/users/create
    ↓
supabase.auth.admin.createUser() (Service Role Key)
    ↓
    ↓ [Trigger: on_auth_user_created]
    ↓
    ├─> users Tabelle: INSERT basic profile (auto)
    ├─> user_avatars Tabelle: INSERT avatar (auto)
    ├─> notifications Tabelle: INSERT welcome (auto)
    └─> coin_transactions Tabelle: INSERT 50 coins (auto)
    ↓
Server: UPDATE users with admin data (salary, position, etc.)
    ↓
✅ User erfolgreich erstellt
```

## 🎯 Weiterer Fix: Gehalt-Feld

**Problem:** Gehalt konnte nur in 50er-Schritten eingegeben werden

**Ursache:** `<Input step="50" />` in AddEmployeeScreen.tsx

**Lösung:** Step auf `0.01` geändert für präzise Eingabe

```typescript
// Vorher:
<Input type="number" step="50" />  // ❌ Nur 50, 100, 150, etc.

// Nachher:
<Input type="number" step="0.01" />  // ✅ Beliebige Beträge möglich
```

## 🚀 Deployment

Die Änderungen sind produktionsbereit und erfordern keine weiteren Migrations oder Konfigurationen.

### Was funktioniert jetzt:

✅ User-Erstellung über Admin-Panel  
✅ Automatische Organization-Zuweisung  
✅ Avatar-Erstellung  
✅ Präzise Gehaltseingabe (Cents möglich)  
✅ Alle Rollen (EMPLOYEE, ADMIN, SUPERADMIN)  

### Sicherheit

- ✅ Service Role Key bleibt im Backend
- ✅ Frontend nutzt nur Anon Key
- ✅ Auth-Checks auf Server-Seite
- ✅ RLS auf users Tabelle (optional)

## 📝 Test-Anleitung

1. Gehe zu `/admin/team-management`
2. Klicke "Neuer Mitarbeiter"
3. Fülle das Formular aus:
   - E-Mail: test@example.com
   - Passwort: mindestens 6 Zeichen
   - Name, Position, etc.
   - Gehalt: z.B. 3750.50 € (mit Cents möglich!)
4. Klicke "Mitarbeiter erstellen"
5. ✅ Erfolg: "Mitarbeiter erfolgreich erstellt! ✅"
6. Automatische Weiterleitung zur Team-Übersicht

## 🐛 Fehlerbehandlung

### Mögliche Fehler und Lösungen:

**"Keine Standard-Organisation gefunden"**
- Lösung: Gehe zu `/admin/company-settings` und erstelle eine Organisation

**"Failed to create user"**
- Prüfe Server-Logs in Supabase Functions
- Stelle sicher, dass alle erforderlichen Tabellen existieren

**"Email already registered"**
- User mit dieser E-Mail existiert bereits
- Verwende eine andere E-Mail-Adresse

**"duplicate key value violates unique constraint 'users_pkey'"** ✅ BEHOBEN
- Problem: Server versuchte, User-Profil zu erstellen, obwohl Trigger es bereits erstellt hatte
- Lösung: Server nutzt jetzt UPDATE statt INSERT für das User-Profil

## 📊 Affected Files

- ✅ `/supabase/functions/server/index.tsx` - Server-Route hinzugefügt
- ✅ `/stores/adminStore.ts` - createUser() angepasst
- ✅ `/screens/admin/AddEmployeeScreen.tsx` - Gehalt-Step & API-Aufruf gefixt

---

**Status:** ✅ Vollständig behoben und getestet  
**Version:** 1.0.0  
**Datum:** 2025-01-04
