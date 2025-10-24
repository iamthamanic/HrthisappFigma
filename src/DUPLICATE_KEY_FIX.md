# 🔧 Duplicate Key Error Fix

## Problem

Beim Anlegen neuer Mitarbeiter trat der Fehler auf:
```
Error: duplicate key value violates unique constraint "users_pkey"
```

## Ursache

Das System hat zwei Mechanismen, die beide versuchen, User-Profile zu erstellen:

1. **Trigger `handle_new_user()`** (Migration 003_auto_user_profile_v3.sql)
   - Wird automatisch ausgelöst, wenn ein Auth-User erstellt wird
   - Erstellt User-Profil, Avatar, Notification und Coins

2. **Server-Route `/users/create`** (in `/supabase/functions/server/index.tsx`)
   - Wurde aufgerufen vom Frontend
   - Versuchte ebenfalls, ein User-Profil zu erstellen

**Konflikt:** Beide versuchten, einen User mit der gleichen ID einzufügen → Duplicate Key Error

## ✅ Lösung

Die Server-Route wurde angepasst:

### Vorher (❌ Falsch):
```typescript
// 1. Auth-User erstellen
await supabase.auth.admin.createUser({ ... });

// 2. User-Profil EINFÜGEN (INSERT)
await supabase.from('users').insert({ id: userId, ... });
// ❌ FEHLER: Trigger hat schon ein Profil erstellt!
```

### Nachher (✅ Richtig):
```typescript
// 1. Auth-User erstellen
await supabase.auth.admin.createUser({ ... });
// → Trigger erstellt automatisch: Profil, Avatar, Notification, Coins

// 2. Kurze Pause für Trigger
await new Promise(resolve => setTimeout(resolve, 500));

// 3. User-Profil AKTUALISIEREN (UPDATE) mit Admin-Daten
await supabase.from('users').update({ ...userData }).eq('id', userId);
// ✅ Kein Konflikt mehr!
```

## 🔄 Workflow

```
1. Frontend: Neuer Mitarbeiter erstellen
   ↓
2. Server: auth.admin.createUser()
   ↓
3. [AUTOMATISCH] Trigger: handle_new_user()
   ├─ INSERT users (basic profile)
   ├─ INSERT user_avatars
   ├─ INSERT notifications
   └─ INSERT coin_transactions
   ↓
4. Server: UPDATE users (mit Admin-Daten)
   ├─ Gehalt
   ├─ Position
   ├─ Abteilung
   ├─ Standort
   ├─ Rolle
   └─ etc.
   ↓
5. ✅ User komplett erstellt
```

## 📋 Was macht der Trigger automatisch?

Der Trigger `handle_new_user()` erstellt beim Auth-User-Creation automatisch:

| Tabelle | Was wird erstellt |
|---------|-------------------|
| `users` | Basic Profile (Vorname, Nachname, E-Mail, Employee Number) |
| `user_avatars` | Avatar mit Level 1, 0 XP, Default-Farben |
| `notifications` | Welcome Notification "Willkommen bei HRthis! 🎉" |
| `coin_transactions` | 50 Welcome Coins |

## 🎯 Vorteile der neuen Lösung

✅ Kein Duplicate Key Error mehr  
✅ Trigger bleibt aktiv für normale Registrierungen  
✅ Admin kann zusätzliche Felder setzen (Gehalt, Position, etc.)  
✅ Automatische Welcome-Funktionen bleiben erhalten  
✅ Konsistenter Workflow für alle User-Erstellungen  

## 🧪 Testing

### Test 1: Neuer Mitarbeiter über Admin-Panel
```
1. Gehe zu /admin/team-management
2. Klicke "Neuer Mitarbeiter"
3. Fülle alle Felder aus
4. Klicke "Mitarbeiter erstellen"
5. ✅ Erfolg: User wird erstellt ohne Fehler
```

### Test 2: Normale Registrierung
```
1. Gehe zu /register
2. Registriere dich mit E-Mail + Passwort
3. ✅ Erfolg: Trigger erstellt Profil automatisch
```

### Test 3: Datenbank-Prüfung
```sql
-- Prüfe ob User komplett erstellt wurde
SELECT 
  u.email,
  u.first_name,
  u.salary,
  u.position,
  a.level,
  a.total_xp,
  n.title as welcome_notification,
  ct.amount as welcome_coins
FROM users u
LEFT JOIN user_avatars a ON a.user_id = u.id
LEFT JOIN notifications n ON n.user_id = u.id AND n.type = 'SUCCESS'
LEFT JOIN coin_transactions ct ON ct.user_id = u.id AND ct.reason = 'Willkommensbonus'
WHERE u.email = 'test@example.com';
```

## 📄 Affected Files

- ✅ `/supabase/functions/server/index.tsx` - Server-Route angepasst (INSERT → UPDATE)
- ℹ️ `/supabase/migrations/003_auto_user_profile_v3.sql` - Trigger unverändert
- ✅ `/USER_CREATION_FIX.md` - Dokumentation aktualisiert

## ⚠️ Wichtig für Entwickler

**Wenn du User programmatisch erstellst:**
1. Verwende `supabase.auth.admin.createUser()` für Auth
2. Warte kurz (500ms) für Trigger-Completion
3. Verwende `UPDATE` statt `INSERT` für zusätzliche Felder
4. Trigger erstellt automatisch: Profil, Avatar, Notification, Coins

**Beispiel:**
```typescript
// ✅ RICHTIG
const { data: authData } = await supabase.auth.admin.createUser({ ... });
await new Promise(resolve => setTimeout(resolve, 500));
await supabase.from('users').update({ salary: 5000 }).eq('id', authData.user.id);

// ❌ FALSCH
const { data: authData } = await supabase.auth.admin.createUser({ ... });
await supabase.from('users').insert({ id: authData.user.id, ... }); // Duplicate Key Error!
```

---

**Status:** ✅ Behoben  
**Version:** 1.1.0  
**Datum:** 2025-01-04  
**Related:** USER_CREATION_FIX.md