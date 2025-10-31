# ✅ SCHICHTPLANUNG - Setup Checklist

## 🎯 In 3 Minuten zu echten Daten!

### **[ ] SCHRITT 1: SQL ausführen (30 Sekunden)**
```
1. Öffne Supabase SQL Editor
2. Kopiere KOMPLETT: /SCHICHTPLANUNG_COMPLETE_SETUP.sql
3. Klicke "Run"
4. Warte auf "✅ SCHICHTPLANUNG SETUP COMPLETE!"

✅ ALLE 3 SQL-FEHLER BEHOBEN:
  1. Syntax-Fehler (RAISE NOTICE in DO $$ Blöcken)
  2. Policy-Fehler (DROP POLICY IF EXISTS vor CREATE)
  3. Window Function Fehler (CTE mit ROW_NUMBER())
  → Script ist IDEMPOTENT (kann mehrfach ausgeführt werden!)
```

### **[ ] SCHRITT 2: Verifizierung (30 Sekunden)**
```sql
-- In Supabase SQL Editor:
SELECT * FROM shifts LIMIT 5;
SELECT first_name, last_name, specialization FROM users WHERE specialization IS NOT NULL;
```

**Erwartete Ausgabe:**
- ✅ 2 Schichten sichtbar
- ✅ 5 User mit Spezialisierungen

### **[ ] SCHRITT 3: In der App testen (1 Minute)**
```
1. Öffne: Field Verwaltung
2. Klicke: Einsatzplanung
3. Klicke: Schichtplanung Tab
4. Prüfe: Echte Daten sichtbar?
```

**Erwartete UI:**
- ✅ Mini-Kalender (links)
- ✅ Team Accordion (links)
- ✅ Mitarbeiter-Liste (links)
- ✅ Wochen-Timeline (rechts)
- ✅ 2 Schichtblöcke in Timeline
- ✅ KEINE "Mock" Daten

---

## ❌ Falls etwas nicht funktioniert:

### **Problem: SQL-Fehler**
```
→ Kopiere /SCHICHTPLANUNG_COMPLETE_SETUP.sql KOMPLETT
→ Nicht nur Teile davon
→ Kann MEHRFACH ausgeführt werden (idempotent!)
→ Falls "policy already exists": Script ist jetzt gefixt!
```

### **Problem: Keine Schichten sichtbar**
```sql
-- Prüfe ob Tabelle leer ist:
SELECT COUNT(*) FROM shifts;

-- Falls 0, dann:
-- Führe aus: /SCHICHTPLANUNG_TEST_DATA.sql
```

### **Problem: Keine Teams/User**
```sql
-- Prüfe:
SELECT COUNT(*) FROM teams;
SELECT COUNT(*) FROM users WHERE role = 'EMPLOYEE';

-- Falls leer → Erst User/Teams erstellen
```

### **Problem: "Failed to fetch"**
```
→ Öffne Browser Console (F12)
→ Check Network Tab
→ Suche nach Fehlern
→ Prüfe ob Supabase Projekt online
```

---

## 🎉 Fertig!

**Wenn alle 3 Schritte ✅ sind:**
- Mock-Daten sind ENTFERNT
- Echte Daten werden geladen
- System ist Production-Ready! 🚀

**Nächste Features (optional):**
- [ ] CreateShiftDialog (UI zum Schichten erstellen)
- [ ] Drag & Drop (Schichten verschieben)
- [ ] Conflict Check (Überschneidungen prüfen)
- [ ] Bulk Operations (Mehrere Schichten gleichzeitig)

---

## 📚 Hilfe?

**Anleitungen:**
- `/SCHICHTPLANUNG_README.md` - Übersicht
- `/SCHICHTPLANUNG_QUICK_START.md` - Schnellstart
- `/SCHICHTPLANUNG_BACKEND_SETUP.md` - Detailliert

**SQL-Dateien:**
- `/SCHICHTPLANUNG_COMPLETE_SETUP.sql` - **ALL-IN-ONE** ⭐
- `/CREATE_SHIFTS_TABLE.sql` - Nur Tabelle
- `/v4.12.0_SCHICHTPLANUNG_MIGRATION.sql` - Nur Extensions
- `/SCHICHTPLANUNG_TEST_DATA.sql` - Nur Test-Daten
