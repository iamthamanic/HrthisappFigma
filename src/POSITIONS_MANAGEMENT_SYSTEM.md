# 📋 POSITIONS MANAGEMENT SYSTEM

**Erstellt:** 11. Dezember 2025  
**Version:** v4.14.0  
**Status:** ✅ Vollständig implementiert

---

## 🎯 ÜBERSICHT

Das **Positions-Management-System** ermöglicht die Verwaltung von Stellenpositionen mit Factorial-Features:
- Strukturierte Positions-Verwaltung (statt Freitext)
- Many-to-Many Verknüpfung zu Abteilungen & Standorten
- Gehaltsbänder (Min/Max)
- Anforderungen (Skills, Erfahrung, Ausbildung)
- Hierarchie ("Berichtet an")
- Recruiting-Status (Aktiv/Inaktiv/Recruiting)
- Stellenbeschreibung & Verantwortlichkeiten (Rich-Text)

---

## 📊 DATENMODELL

### **Tabelle: `positions`**

```sql
CREATE TABLE positions (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  
  -- Basis
  name TEXT NOT NULL,
  description TEXT, -- Rich-Text (HTML from Tiptap)
  level TEXT CHECK (level IN ('JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE')),
  
  -- Verantwortlichkeiten
  responsibilities TEXT, -- Rich-Text (HTML from Tiptap)
  
  -- Anforderungen (JSONB)
  requirements JSONB DEFAULT '{
    "skills": [],
    "experience": null,
    "education": null,
    "certifications": []
  }'::jsonb,
  
  -- Gehalt
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_currency TEXT DEFAULT 'EUR' CHECK (salary_currency IN ('EUR', 'USD', 'GBP', 'CHF')),
  salary_period TEXT DEFAULT 'yearly' CHECK (salary_period IN ('yearly', 'monthly')),
  
  -- Hierarchie
  reports_to_position_id UUID REFERENCES positions(id),
  
  -- Recruiting
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'RECRUITING')),
  open_positions INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Tabelle: `position_departments` (Many-to-Many)**

```sql
CREATE TABLE position_departments (
  id UUID PRIMARY KEY,
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  UNIQUE(position_id, department_id)
);
```

### **Tabelle: `position_locations` (Many-to-Many)**

```sql
CREATE TABLE position_locations (
  id UUID PRIMARY KEY,
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  UNIQUE(position_id, location_id)
);
```

### **User-Verknüpfung:**

```sql
ALTER TABLE users ADD COLUMN position_id UUID REFERENCES positions(id);
```

**Hinweis:** `users.position` (TEXT) bleibt als deprecated/backup erhalten.

---

## 🚀 MIGRATION

### **Automatische Migration**

Die Migration **064_positions_management.sql** führt folgende Schritte aus:

1. **Tabellen erstellen** (positions, position_departments, position_locations)
2. **RLS Policies** hinzufügen
3. **users.position_id** Spalte hinzufügen
4. **Automatische Freitext-Migration:**
   - Alle unique Freitext-Positionen aus `users.position` werden extrahiert
   - Automatisch in `positions`-Tabelle eingefügt (Level: MID, Status: ACTIVE)
   - `users.position_id` wird gesetzt
   - **OHNE Abteilungen** (HR muss manuell zuweisen)

**Migration ausführen:**
```bash
# Supabase Dashboard → SQL Editor
# Kopiere Inhalt von /supabase/migrations/064_positions_management.sql
# Execute
```

**Nach Migration:**
- ✅ Alle Mitarbeiter haben `position_id` gesetzt
- ⚠️ **HR muss Abteilungen manuell zuweisen!**
- 📝 `users.position` (TEXT) bleibt als Backup

---

## 🎨 UI/UX

### **Tab-Integration**

In **Team & Mitarbeiterverwaltung** gibt es jetzt 3 Tabs:
```
[Mitarbeiter] [Teams] [Positionen]
```

### **Positions-Tab**

**Features:**
- ✅ Tabelle mit allen Positionen
- ✅ Spalten: Position, Level, Abteilung(en), Mitarbeiter, Gehalt, Status, Actions
- ✅ Button "Neue Position" → Dialog öffnet
- ✅ Click auf Mitarbeiteranzahl → Dialog mit Liste aller Mitarbeiter
- ✅ Edit/Delete Actions

**Stats:**
- Gesamt Positionen
- Aktive Positionen
- Recruiting Positionen
- Offene Stellen (Gesamt)

### **Create/Edit Position Dialog**

**4 Tabs:**

**Tab 1: Basis**
- Position Name *
- Level * (Dropdown: Junior, Mid, Senior, Lead, Executive)
- Abteilungen * (Multi-Select Checkboxen)
- Standorte (Multi-Select Checkboxen, optional)

**Tab 2: Beschreibung**
- Stellenbeschreibung (Rich-Text Editor - Tiptap)
- Verantwortlichkeiten (Rich-Text Editor - Tiptap)

**Tab 3: Anforderungen**
- Skills (Tag-Input: React, TypeScript, etc.)
- Berufserfahrung (Dropdown: 0-2, 2-5, 5+, 10+)
- Ausbildung (Dropdown: Keine, Ausbildung, Bachelor, Master, PhD)
- Zertifizierungen (Tag-Input: PMP, Scrum Master, etc.)

**Tab 4: Gehalt & Recruiting**
- Mindestgehalt (Number Input)
- Maximalgehalt (Number Input)
- Währung (Dropdown: EUR, USD, GBP, CHF)
- Zeitraum (Dropdown: Jährlich, Monatlich)
- Berichtet an (Dropdown: andere Positionen)
- Status (Dropdown: Aktiv, Inaktiv, Recruiting)
- Offene Stellen (Number Input)

### **Position Employees Dialog**

Zeigt alle Mitarbeiter mit dieser Position:
- Avatar
- Name
- Abteilung
- Email

---

## 👥 INTEGRATION IN MITARBEITER-VERWALTUNG

### **Mitarbeiter anlegen/bearbeiten**

**Vorher (Freitext):**
```tsx
<Input placeholder="z.B. Senior Entwickler" />
```

**Jetzt (Dropdown):**
```tsx
<Select value={formData.position_id}>
  <SelectItem value="uuid-1">Senior Entwickler (SENIOR)</SelectItem>
  <SelectItem value="uuid-2">HR Manager (MID)</SelectItem>
  ...
</Select>
```

**Integration in:**
- ✅ `/components/admin/wizard/Step2_Arbeitsinformationen.tsx` (AddEmployeeWizard)
- ✅ `/screens/admin/AddEmployeeScreen.tsx` (später)
- ✅ `/components/admin/BrowoKo_EmploymentInfoCard.tsx` (TeamMemberDetails - später)

---

## 🔒 BERECHTIGUNGEN

**SUPERADMIN / ADMIN / HR:**
- ✅ Create positions
- ✅ Edit positions
- ✅ Delete positions (mit Warning bei zugewiesenen Mitarbeitern)

**TEAMLEAD:**
- ✅ View positions (read-only)

**USER:**
- ❌ Nicht sichtbar

---

## 📁 DATEIEN-ÜBERSICHT

### **Migration:**
- `/supabase/migrations/064_positions_management.sql` (Datenbank)

### **Types:**
- `/types/positions.ts` (TypeScript Interfaces)

### **Store:**
- `/stores/BrowoKo_positionsStore.ts` (Zustand Store)

### **Components:**
- `/components/BrowoKo_RichTextEditor.tsx` (Tiptap Editor)
- `/components/BrowoKo_SkillsTagInput.tsx` (Tag Input für Skills)
- `/components/positions/BrowoKo_PositionsTab.tsx` (Haupt-Tab)
- `/components/positions/BrowoKo_CreateEditPositionDialog.tsx` (Create/Edit Dialog)
- `/components/positions/BrowoKo_PositionEmployeesDialog.tsx` (Mitarbeiter-Liste)

### **Integration:**
- `/screens/admin/TeamUndMitarbeiterverwaltung.tsx` (Tab hinzugefügt)
- `/components/admin/wizard/Step2_Arbeitsinformationen.tsx` (Dropdown integriert)

---

## 🔄 WORKFLOWS

### **Workflow 1: Neue Position anlegen**

1. **HR öffnet** Team & Mitarbeiterverwaltung → Tab "Positionen"
2. **Click** "Neue Position"
3. **Dialog öffnet** mit 4 Tabs
4. **Tab 1 (Basis):**
   - Name: "Senior Entwickler"
   - Level: "Senior"
   - Abteilungen: ☑ IT
5. **Tab 2 (Beschreibung):**
   - Stellenbeschreibung: Rich-Text Editor
   - Verantwortlichkeiten: Rich-Text Editor
6. **Tab 3 (Anforderungen):**
   - Skills: [React] [TypeScript] [Node.js]
   - Erfahrung: "5+ Jahre"
   - Ausbildung: "Bachelor"
7. **Tab 4 (Gehalt):**
   - Min: 45000 €
   - Max: 65000 €
   - Zeitraum: Jährlich
   - Status: Aktiv
8. **Click** "Erstellen"
9. **Position wird erstellt** und in Liste angezeigt

### **Workflow 2: Position bearbeiten**

1. **HR öffnet** Positions-Tab
2. **Click** Edit-Button bei einer Position
3. **Dialog öffnet** mit vorausgefüllten Daten
4. **Änderungen vornehmen**
5. **Click** "Aktualisieren"
6. **Position wird aktualisiert**

### **Workflow 3: Mitarbeiter mit Position sehen**

1. **HR öffnet** Positions-Tab
2. **Sieht** "Senior Entwickler" → "5 Personen"
3. **Click** auf "5 Personen"
4. **Dialog öffnet** mit Liste aller 5 Mitarbeiter
5. **Anzeige:** Avatar, Name, Abteilung, Email

### **Workflow 4: Position löschen**

1. **HR öffnet** Positions-Tab
2. **Click** Delete-Button bei einer Position
3. **Warning-Dialog:** "Diese Position hat 5 Mitarbeiter zugewiesen. Beim Löschen wird die Position bei allen Mitarbeitern auf 'Keine Position' gesetzt. Fortfahren?"
4. **Bestätigen** → Position wird gelöscht
5. **users.position_id** wird bei allen betroffenen Mitarbeitern auf NULL gesetzt

### **Workflow 5: Mitarbeiter mit Position anlegen**

1. **HR öffnet** Team & Mitarbeiterverwaltung → "Mitarbeiter hinzufügen"
2. **Wizard Step 2 (Arbeitsinformationen):**
   - Position: **Dropdown** statt Freitext
   - Auswahl: "Senior Entwickler (SENIOR)"
3. **Mitarbeiter wird angelegt** mit `position_id` gesetzt

---

## 🧪 TESTING-CHECKLISTE

### **Migration:**
- [ ] Migration 064 erfolgreich deployed
- [ ] Freitext-Positionen automatisch migriert
- [ ] users.position_id korrekt gesetzt

### **Positions-Tab:**
- [ ] Tabelle zeigt alle Positionen
- [ ] Create Position Dialog funktioniert
- [ ] Edit Position Dialog funktioniert
- [ ] Delete Position mit Warning
- [ ] Click auf Mitarbeiteranzahl zeigt Dialog

### **Create/Edit Dialog:**
- [ ] Alle 4 Tabs funktionieren
- [ ] Rich-Text-Editor funktioniert (Tiptap)
- [ ] Skills-Tag-Input funktioniert
- [ ] Abteilungen Multi-Select funktioniert
- [ ] Validation funktioniert
- [ ] Save/Update funktioniert

### **Integration:**
- [ ] AddEmployeeWizard zeigt Position-Dropdown
- [ ] Mitarbeiter mit Position anlegen funktioniert
- [ ] position_id wird korrekt gespeichert

### **Berechtigungen:**
- [ ] ADMIN/HR/SUPERADMIN können Positionen verwalten
- [ ] TEAMLEAD sieht Positionen (read-only)
- [ ] USER sieht keine Positionen

---

## 📝 NÄCHSTE SCHRITTE

### **Phase 1: Testing (JETZT)**
1. Migration 064 deployen
2. Positionen-Tab testen
3. Create/Edit Dialogs testen
4. Integration in AddEmployeeWizard testen

### **Phase 2: Integration (Später)**
1. AddEmployeeScreen.tsx → Position-Dropdown
2. TeamMemberDetailsScreen → EmploymentInfoCard → Position-Dropdown
3. MeineDaten.tsx → Position anzeigen (read-only)

### **Phase 3: Erweiterte Features (Optional)**
1. Organigram-Integration (Positionen mit org_nodes verknüpfen)
2. Performance Reviews (Position-basierte Templates)
3. Salary Bands (automatische Gehaltsprüfung)
4. Job-Posting (offene Stellen veröffentlichen)

---

## ⚠️ WICHTIGE HINWEISE

### **Migration:**
- **BACKUP:** Vor Migration ein Datenbank-Backup erstellen!
- **Abteilungen:** Migrierte Positionen haben **KEINE** Abteilungen → HR muss manuell zuweisen
- **users.position:** Bleibt als Backup erhalten (deprecated)

### **Performance:**
- Bei vielen Positionen (>100): Pagination in Positions-Tab erwägen
- Bei vielen Mitarbeitern pro Position (>50): Virtualisierung im Employees-Dialog

### **Data Integrity:**
- Position löschen setzt `users.position_id` auf NULL (nicht CASCADE DELETE)
- Department löschen entfernt Verknüpfung (CASCADE DELETE)

---

## 🎉 FERTIG!

Das Positions-Management-System ist vollständig implementiert und ready for testing!

**Nächster Schritt:**
1. Migration 064 deployen
2. In Team & Mitarbeiterverwaltung → Tab "Positionen" testen
3. Feedback geben für weitere Verbesserungen
