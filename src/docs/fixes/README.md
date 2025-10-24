# 🔧 Bug Fixes & Troubleshooting

**Alle Bug-Fixes, Quick-Fixes und Troubleshooting-Dokumentation**

---

## 📋 **HAUPT-ÜBERSICHT**

- **[FIXES_OVERVIEW.md](../../FIXES_OVERVIEW.md)** - ⭐ Komplette Übersicht aller Fixes

---

## 🚨 **KRITISCHE FIXES**

### Build & Deployment
- **[BUILD_FIX_SUMMARY.md](../../BUILD_FIX_SUMMARY.md)** - Build-Probleme gelöst
- **[CANVAS_BUILD_FIX.md](../../CANVAS_BUILD_FIX.md)** - Canvas-Build-Fix
- **[EXPORT_ERRORS_FIXED.md](../../EXPORT_ERRORS_FIXED.md)** - Export-Fehler behoben
- **[REACT_HOOKS_ERROR_FIX.md](../../REACT_HOOKS_ERROR_FIX.md)** - React-Hooks-Fehler

### Database & Connection
- **[SUPABASE_CONNECTION_FIX.md](../../SUPABASE_CONNECTION_FIX.md)** - Supabase-Connection-Probleme
- **[FAILED_TO_FETCH_FIX.md](../../FAILED_TO_FETCH_FIX.md)** - Failed-to-fetch Errors
- **[DUPLICATE_KEY_FIX.md](../../DUPLICATE_KEY_FIX.md)** - Duplicate-Key-Probleme
- **[DUPLICATE_KEY_FIX_UPSERT.md](../../DUPLICATE_KEY_FIX_UPSERT.md)** - Upsert-Fix

### User Management
- **[USER_CREATION_FIX.md](../../USER_CREATION_FIX.md)** - User-Creation-Bugs
- **[ADMIN_TEAMLEAD_FIX.md](../../ADMIN_TEAMLEAD_FIX.md)** - Admin/Teamlead-Rollen
- **[FIX_UUID_ERROR_QUICKSTART.md](../../FIX_UUID_ERROR_QUICKSTART.md)** - UUID-Fehler

---

## ⚡ **QUICK FIXES**

### Leave System
- **[QUICK_FIX_LEAVE_SYSTEM.md](../../QUICK_FIX_LEAVE_SYSTEM.md)** - Leave-System Fixes
- **[QUICK_FIX_TEAM_CALENDAR.md](../../QUICK_FIX_TEAM_CALENDAR.md)** - Team-Calendar Fixes

### Time Tracking
- **[BREAK_SETTINGS_QUICK_FIX.md](../../BREAK_SETTINGS_QUICK_FIX.md)** - Break-Settings
- **[CLOCK_IN_UPSERT_FIX.md](../../CLOCK_IN_UPSERT_FIX.md)** - Clock-In-Probleme
- **[FIX_OLD_SESSIONS_AUTO_BREAKS.md](../../FIX_OLD_SESSIONS_AUTO_BREAKS.md)** - Auto-Break-Fix

### General
- **[QUICK_FIX_ERRORS.md](../../QUICK_FIX_ERRORS.md)** - Allgemeine Fixes
- **[SIMPLE_FIX.md](../../SIMPLE_FIX.md)** - Einfache Fixes
- **[QUIZ_ATTEMPTS_COLUMN_FIX.md](../../QUIZ_ATTEMPTS_COLUMN_FIX.md)** - Quiz-Attempts-Fix

---

## 🔍 **PROBLEM-KATEGORIEN**

### 1️⃣ **Build-Fehler**
**Symptome:** Build schlägt fehl, TypeScript-Errors

**Lösungen:**
- [BUILD_FIX_SUMMARY.md](../../BUILD_FIX_SUMMARY.md)
- [CANVAS_BUILD_FIX.md](../../CANVAS_BUILD_FIX.md)
- [REACT_HOOKS_ERROR_FIX.md](../../REACT_HOOKS_ERROR_FIX.md)

---

### 2️⃣ **Supabase-Connection**
**Symptome:** "Failed to fetch", Connection-Timeouts

**Lösungen:**
- [SUPABASE_CONNECTION_FIX.md](../../SUPABASE_CONNECTION_FIX.md)
- [FAILED_TO_FETCH_FIX.md](../../FAILED_TO_FETCH_FIX.md)

---

### 3️⃣ **Database-Constraints**
**Symptome:** Duplicate-Key-Errors, UUID-Errors

**Lösungen:**
- [DUPLICATE_KEY_FIX.md](../../DUPLICATE_KEY_FIX.md)
- [DUPLICATE_KEY_FIX_UPSERT.md](../../DUPLICATE_KEY_FIX_UPSERT.md)
- [FIX_UUID_ERROR_QUICKSTART.md](../../FIX_UUID_ERROR_QUICKSTART.md)

---

### 4️⃣ **User-Management**
**Symptome:** User kann nicht erstellt werden, Rollen-Probleme

**Lösungen:**
- [USER_CREATION_FIX.md](../../USER_CREATION_FIX.md)
- [ADMIN_TEAMLEAD_FIX.md](../../ADMIN_TEAMLEAD_FIX.md)

---

### 5️⃣ **Time-Tracking**
**Symptome:** Break-Settings fehlen, Clock-In-Fehler

**Lösungen:**
- [BREAK_SETTINGS_QUICK_FIX.md](../../BREAK_SETTINGS_QUICK_FIX.md)
- [CLOCK_IN_UPSERT_FIX.md](../../CLOCK_IN_UPSERT_FIX.md)
- [FIX_OLD_SESSIONS_AUTO_BREAKS.md](../../FIX_OLD_SESSIONS_AUTO_BREAKS.md)

---

### 6️⃣ **Leave-System**
**Symptome:** Leave-Requests nicht sichtbar, Approval-Fehler

**Lösungen:**
- [QUICK_FIX_LEAVE_SYSTEM.md](../../QUICK_FIX_LEAVE_SYSTEM.md)
- [QUICK_FIX_TEAM_CALENDAR.md](../../QUICK_FIX_TEAM_CALENDAR.md)

---

## 🛠️ **TROUBLESHOOTING-WORKFLOW**

### Step 1: Identifiziere das Problem
1. Prüfe Browser-Console
2. Prüfe Supabase-Logs
3. Prüfe Network-Tab

### Step 2: Suche in Fixes-Übersicht
→ [FIXES_OVERVIEW.md](../../FIXES_OVERVIEW.md)

### Step 3: Anwendung
1. Lies relevanten Fix-Doc
2. Führe SQL-Fixes aus (falls nötig)
3. Code-Changes anwenden
4. Test

### Step 4: Verify
- [ ] Build erfolgreich
- [ ] Keine Console-Errors
- [ ] Feature funktioniert
- [ ] Tests passed (falls vorhanden)

---

## 📊 **FIX-STATUS**

| Fix | Kategorie | Status | Severity |
|-----|-----------|--------|----------|
| Build-Fixes | Build | ✅ Fixed | 🔴 Critical |
| Connection-Fixes | Database | ✅ Fixed | 🔴 Critical |
| User-Creation | Users | ✅ Fixed | 🟡 High |
| Break-Settings | Time | ✅ Fixed | 🟡 High |
| Leave-System | Leave | ✅ Fixed | 🟡 High |
| Duplicate-Keys | Database | ✅ Fixed | 🟢 Medium |
| Quiz-Attempts | Learning | ✅ Fixed | 🟢 Medium |

---

## 🔗 **VERWANDTE DOCS**

- [../README.md](../README.md) - Dokumentations-Index
- [../migrations/](../migrations/) - SQL-Migrations
- [../guides/](../guides/) - Setup-Guides
- [../testing/](../testing/) - Test-Dokumentation

---

## 💡 **TIPPS**

1. **Immer zuerst prüfen:** [FIXES_OVERVIEW.md](../../FIXES_OVERVIEW.md)
2. **SQL-Fixes:** Siehe [../migrations/](../migrations/)
3. **Bei Unsicherheit:** Start bei [../../START_HERE.md](../../START_HERE.md)
4. **Build-Probleme:** [BUILD_FIX_SUMMARY.md](../../BUILD_FIX_SUMMARY.md)

---

**Zuletzt aktualisiert:** 2025-01-10  
**Alle Fixes:** ✅ Getestet & Verifiziert
