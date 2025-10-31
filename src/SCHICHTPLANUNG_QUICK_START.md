# 🚀 SCHICHTPLANUNG - QUICK START (Mock-Daten entfernen)

## 🎯 OPTION 1: ALL-IN-ONE (EMPFOHLEN - 30 Sekunden!)

### **Kopiere & führe aus: `/SCHICHTPLANUNG_COMPLETE_SETUP.sql`**
Gehe zu **Supabase SQL Editor** und führe die KOMPLETTE Datei aus.

✅ **Fertig!** Alle 3 Schritte in EINEM SQL-Script:
- ✅ Shifts Table erstellt
- ✅ Schema Extensions hinzugefügt  
- ✅ Test-Daten eingefügt

⚡ **ALLE FEHLER BEHOBEN:**
- ✅ Syntax-Fehler (RAISE NOTICE)
- ✅ Policy-Fehler (DROP IF EXISTS)  
- ✅ Idempotent (mehrfach ausführbar!)

**→ Spring direkt zu "Prüfen ob es funktioniert"**

---

## 📋 OPTION 2: Schritt-für-Schritt (falls du mehr Kontrolle willst)

### **SCHRITT 1: Shifts Table erstellen** (2 Min)
Gehe zu **Supabase SQL Editor** und führe aus:

```sql
-- Kopiere KOMPLETT aus: /CREATE_SHIFTS_TABLE.sql
-- ✅ FIXED: RAISE NOTICE Syntax-Fehler behoben
```

✅ **Ergebnis:** Tabelle `shifts` mit RLS Policies erstellt

---

### **SCHRITT 2: Migration ausführen** (1 Min)
Gehe zu **Supabase SQL Editor** und führe aus:

```sql
-- Kopiere KOMPLETT aus: /v4.12.0_SCHICHTPLANUNG_MIGRATION.sql
```

✅ **Ergebnis:** 
- `users.specialization` hinzugefügt
- `shifts` erweitert (location_id, department_id, specialization)
- Organigram → User Sync Trigger erstellt

---

### **SCHRITT 3: Test-Daten erstellen** (30 Sek)
Gehe zu **Supabase SQL Editor** und führe aus:

```sql
-- Kopiere KOMPLETT aus: /SCHICHTPLANUNG_TEST_DATA.sql
```

✅ **Ergebnis:** 2 Test-Schichten + 5 User mit Spezialisierungen

---

## 🎯 Prüfen ob es funktioniert

### **1. In Supabase:**
```sql
SELECT * FROM shifts LIMIT 5;
SELECT first_name, last_name, specialization FROM users WHERE specialization IS NOT NULL;
```

### **2. In der App:**
1. Öffne: **Field Verwaltung** → **Einsatzplanung** → **Schichtplanung**
2. Du solltest jetzt sehen:
   - ✅ Echte Teams (aus DB)
   - ✅ Echte Mitarbeiter (aus DB)
   - ✅ Echte Schichten (aus DB)
   - ✅ KEINE Mock-Daten mehr!

---

## 📊 Was wurde geändert?

### **Vorher:**
```typescript
// components/BrowoKo_ShiftPlanningTab.tsx
const teams = [
  { id: '1', name: 'Bank 4', members: [/* hardcoded */] }
]; // ❌ MOCK DATA
```

### **Nachher:**
```typescript
// components/BrowoKo_ShiftPlanningTab.tsx
const { teams, shifts, users } = BrowoKo_useShiftPlanning(selectedWeek);
// ✅ ECHTE DATEN aus Supabase
```

---

## 🔧 Neue Features

### **1. Hook erstellt:** `BrowoKo_useShiftPlanning.ts`
```typescript
const {
  locations,      // Alle Standorte
  departments,    // Alle Abteilungen
  teams,          // Teams mit Mitarbeitern
  shifts,         // Schichten (gefiltert nach Woche)
  users,          // Alle Mitarbeiter
  loading,        // Loading State
  error,          // Error State
  refetch,        // Daten neu laden
  createShift,    // Neue Schicht erstellen
  updateShift,    // Schicht bearbeiten
  deleteShift,    // Schicht löschen
} = BrowoKo_useShiftPlanning(selectedWeek);
```

### **2. Automatisches Laden:**
- ✅ Daten werden automatisch geladen wenn Komponente mountet
- ✅ Daten werden neu geladen wenn Woche gewechselt wird
- ✅ Loading State während Laden
- ✅ Error State mit Retry-Button

### **3. Filter funktionieren jetzt:**
- ✅ Standort-Filter (Location)
- ✅ Abteilungs-Filter (Department)
- ✅ Spezialisierungs-Filter (automatisch aus User-Daten)

---

## 🎉 Fertig!

Du hast jetzt ein **100% Backend-integriertes Schichtplanungssystem** ohne Mock-Daten!

**Alle Daten kommen live aus Supabase:**
- Teams → `teams` + `team_members` Tables
- Mitarbeiter → `users` Table
- Schichten → `shifts` Table
- Standorte → `locations` Table
- Abteilungen → `departments` Table

---

## 🚀 Nächste Schritte (Optional)

1. **CreateShiftDialog** - Dialog zum Erstellen von Schichten per UI
2. **Drag & Drop** - Schichten per Drag & Drop verschieben
3. **Conflict Check** - Prüfen ob Mitarbeiter schon eingeplant ist
4. **Bulk Operations** - Mehrere Schichten auf einmal erstellen

**Möchtest du einen dieser Features?** Sag mir Bescheid! 🎯
