# 📢 Migration 047: Dashboard Announcements

## ❌ FEHLER: "Failed to fetch announcements"

Wenn du diesen Error siehst:
```
❌ Error fetching announcements: TypeError: Failed to fetch
```

**Bedeutet:** Die Tabelle `dashboard_announcements` existiert noch nicht in deiner Supabase-Datenbank!

---

## ✅ LÖSUNG: Migration ausführen

### **Schritt 1: Öffne Supabase Dashboard**

1. Gehe zu: https://supabase.com/dashboard
2. Wähle dein Projekt
3. Klicke auf **SQL Editor** (linke Sidebar)

### **Schritt 2: Kopiere die Migration**

Öffne die Datei:
```
/supabase/migrations/047_dashboard_announcements.sql
```

Kopiere den **gesamten Inhalt** (alle 189 Zeilen).

### **Schritt 3: Führe die Migration aus**

1. Im SQL Editor: Klicke **"New Query"**
2. **Paste** den kopierten SQL-Code
3. Klicke **"Run"** (oder Strg+Enter)
4. Warte bis "Success" erscheint ✅

### **Schritt 4: Verifiziere**

Führe diese Query aus:
```sql
SELECT COUNT(*) FROM dashboard_announcements;
```

**Erwartetes Ergebnis:**
```
count
-----
  0
```

✅ Wenn du `0` siehst → Migration erfolgreich!
❌ Wenn Error → Migration fehlgeschlagen, siehe unten

---

## 🔍 WAS WIRD ERSTELLT?

### **Tabelle: `dashboard_announcements`**

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | UUID | Primary Key |
| `organization_id` | UUID | Firma |
| `title` | TEXT | Titel der Mitteilung |
| `content` | JSONB | Rich Content (HTML, Bilder, Videos, PDFs) |
| `is_live` | BOOLEAN | Ist diese Mitteilung live? |
| `pushed_live_at` | TIMESTAMPTZ | Wann wurde sie live geschaltet? |
| `removed_from_live_at` | TIMESTAMPTZ | Wann wurde sie entfernt? |
| `created_at` | TIMESTAMPTZ | Erstellt am |
| `updated_at` | TIMESTAMPTZ | Aktualisiert am |
| `created_by` | UUID | Erstellt von (User) |
| `updated_by` | UUID | Aktualisiert von (User) |
| `live_history` | JSONB | Audit Trail |

### **Features:**

✅ **Nur EINE live Mitteilung** pro Organisation
✅ **Rich Content Editor** (Bold, Italic, Überschriften, Listen, Bilder, PDFs, Videos, Benefits)
✅ **Push to Live** System
✅ **Audit Trail** (wer hat wann was gemacht)
✅ **RLS Policies** (nur HR/ADMIN/SUPERADMIN können erstellen/bearbeiten)

---

## 🚨 TROUBLESHOOTING

### **Error: "relation 'dashboard_announcements' does not exist"**

**Problem:** Tabelle existiert nicht.
**Lösung:** Führe Migration 047 aus (siehe oben).

### **Error: "permission denied for table dashboard_announcements"**

**Problem:** RLS Policies blockieren Zugriff.
**Lösung:** Prüfe, ob du als HR/ADMIN/SUPERADMIN eingeloggt bist.

Query zum Checken:
```sql
SELECT id, email, role FROM users WHERE id = auth.uid();
```

### **Error: "Failed to fetch"**

**Mögliche Ursachen:**
1. ❌ **Supabase Projekt pausiert** → Gehe zu Supabase Dashboard → "Resume project"
2. ❌ **Falsche API Keys** → Checke `.env` oder Supabase Settings
3. ❌ **Network Error** → Checke Internet-Verbindung
4. ❌ **CORS Problem** → Checke Supabase API Settings

---

## 📊 NACH DER MIGRATION

### **Testen:**

1. **Hard Refresh** der App (Strg+Shift+R)
2. Gehe zu **Admin → Dashboard-Mitteilungen**
3. Erstelle eine neue Mitteilung
4. Klicke "Push to Live"
5. Gehe zu **Dashboard** → Mitteilung sollte erscheinen!

### **Erwartetes Ergebnis:**

✅ Keine Errors mehr
✅ "Dashboard-Mitteilungen" Screen lädt
✅ Du kannst neue Mitteilungen erstellen
✅ Upload-Button funktioniert
✅ Dashboard zeigt Live-Mitteilung

---

## 🎯 SCHNELLSTART

Falls du **noch NIE eine Migration** ausgeführt hast:

### **Alle Migrationen ausführen:**

1. Öffne `/supabase/migrations/999_COMPLETE_SETUP_V4.sql`
2. Kopiere den **gesamten Inhalt**
3. Führe in Supabase SQL Editor aus
4. ✅ Alles sollte jetzt funktionieren!

**ACHTUNG:** Das überschreibt ALLE Daten! Nur im Dev-Modus nutzen!

---

## 💡 NÄCHSTE SCHRITTE

Nach erfolgreicher Migration:

1. ✅ **Erste Mitteilung erstellen:**
   - Admin → Dashboard-Mitteilungen
   - "Neue Mitteilung erstellen"
   - Titel: "Willkommen bei HRthis!"
   - Content: "Hallo Team, ..."
   - Klicke "Speichern" → "Push to Live"

2. ✅ **Bild hochladen:**
   - Klicke Upload-Button (📤)
   - Tab: Bild
   - Wähle JPG/PNG/HEIC
   - Preview erscheint
   - Klicke "Einfügen"

3. ✅ **PDF hochladen:**
   - Klicke Upload-Button (📤)
   - Tab: PDF
   - Wähle PDF-Datei
   - Klicke "Einfügen"
   - ✅ PDF wird als Download-Link angezeigt!

---

## 📚 WEITERE INFOS

- **WYSIWYG Editor:** `/WYSIWYG_RICH_TEXT_EDITOR.md`
- **Dashboard System:** `/DASHBOARD_ANNOUNCEMENTS_SYSTEM.md`
- **Upload System:** Siehe App Version 3.5.4

---

**Bei Problemen:** Kopiere mir **ALLE Console Logs** + **SQL Editor Errors**!
