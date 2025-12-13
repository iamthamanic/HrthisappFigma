# 🚀 POSITIONS MANAGEMENT - QUICK START GUIDE

**Version:** v4.14.0  
**Zielgruppe:** HR/Admin  
**Dauer:** 15 Minuten

---

## 📋 SCHRITT 1: MIGRATION DEPLOYEN (5 Min)

### **1.1 Supabase Dashboard öffnen**

1. Gehe zu [https://supabase.com](https://supabase.com)
2. Öffne dein Projekt
3. Linkes Menü → **SQL Editor**

### **1.2 Migration ausführen**

1. Öffne die Datei: `/supabase/migrations/064_positions_management.sql`
2. **Kopiere den gesamten Inhalt**
3. Füge ihn im SQL Editor ein
4. Click **"Run"**

**Erwartete Ausgabe:**
```
✅ Tables created: positions, position_departments, position_locations
✅ RLS Policies created
✅ users.position_id column added
✅ Migrating X unique positions...
✅ Linked Y users to positions
✅ Migration complete!
```

### **1.3 Verifizierung**

Führe im SQL Editor aus:
```sql
-- Check positions table
SELECT COUNT(*) as position_count FROM positions;

-- Check migrated users
SELECT COUNT(*) as users_with_position FROM users WHERE position_id IS NOT NULL;

-- Check position departments (should be 0 after migration)
SELECT COUNT(*) FROM position_departments;
```

**Erwartung:**
- `position_count` > 0 (deine unique Freitext-Positionen)
- `users_with_position` > 0 (alle User mit Position)
- `position_departments` = 0 (keine Abteilungen zugewiesen)

---

## 📱 SCHRITT 2: POSITIONS-TAB ÖFFNEN (2 Min)

### **2.1 App öffnen**

1. Öffne deine Browo Koordinator App
2. Login als **ADMIN** oder **HR**
3. Navigiere zu: **Admin → Team & Mitarbeiterverwaltung**

### **2.2 Positions-Tab**

1. Du siehst jetzt 3 Tabs: **[Mitarbeiter] [Teams] [Positionen]**
2. Click auf **"Positionen"**

**Was du siehst:**
- Tabelle mit allen migrierten Positionen
- Spalten: Position, Level, Abteilung(en), Mitarbeiter, Gehalt, Status
- Button "Neue Position" oben rechts
- Stats unten: Gesamt, Aktiv, Recruiting, Offene Stellen

---

## ✏️ SCHRITT 3: ERSTE POSITION BEARBEITEN (5 Min)

### **3.1 Migrierte Position bearbeiten**

1. In der Positions-Tabelle siehst du migrierte Positionen (z.B. "Senior Entwickler")
2. Click auf **Edit-Button** (Bleistift-Icon)
3. **Dialog öffnet** mit 4 Tabs

### **3.2 Tab 1: Basis**

- ✅ Name ist bereits gesetzt (z.B. "Senior Entwickler")
- ✅ Level ändern: "MID" → "SENIOR"
- ⚠️ **Abteilungen zuweisen:** Klicke Checkboxen an (z.B. ☑ IT)
- Optional: Standorte zuweisen

### **3.3 Tab 2: Beschreibung**

- Stellenbeschreibung schreiben (Rich-Text-Editor):
  ```
  Der Senior Entwickler ist verantwortlich für...
  
  - Entwicklung von Frontend-Komponenten
  - Code-Reviews
  - Mentoring von Junior-Entwicklern
  ```
- Verantwortlichkeiten schreiben:
  ```
  - Technische Architektur-Entscheidungen
  - Sprint-Planning & Estimation
  - Code-Qualität sicherstellen
  ```

### **3.4 Tab 3: Anforderungen**

- **Skills hinzufügen:**
  - Tippe "React" → Enter
  - Tippe "TypeScript" → Enter
  - Tippe "Node.js" → Enter
- **Berufserfahrung:** "5+ Jahre"
- **Ausbildung:** "Bachelor"
- **Zertifizierungen:** Optional (z.B. "AWS Certified")

### **3.5 Tab 4: Gehalt & Recruiting**

- **Mindestgehalt:** 45000
- **Maximalgehalt:** 65000
- **Währung:** EUR
- **Zeitraum:** Jährlich
- **Berichtet an:** (Optional) z.B. "Team Lead Entwicklung"
- **Status:** Aktiv
- **Offene Stellen:** 0 (oder 2 wenn du rekrutierst)

### **3.6 Speichern**

Click **"Aktualisieren"** → Position wird gespeichert

---

## 🆕 SCHRITT 4: NEUE POSITION ANLEGEN (3 Min)

### **4.1 Create Dialog öffnen**

1. Click auf **"Neue Position"** oben rechts
2. Dialog öffnet mit leeren Feldern

### **4.2 Beispiel: "HR Manager" anlegen**

**Tab 1: Basis**
- Name: "HR Manager"
- Level: "MID"
- Abteilungen: ☑ HR

**Tab 2: Beschreibung**
- Stellenbeschreibung: "Der HR Manager ist verantwortlich für Recruiting, Onboarding und Mitarbeiterbetreuung."
- Verantwortlichkeiten: "- Recruiting-Prozesse, - Onboarding neuer Mitarbeiter, - Performance Reviews"

**Tab 3: Anforderungen**
- Skills: "HR Management", "Recruiting", "Arbeitsrecht"
- Berufserfahrung: "2-5 Jahre"
- Ausbildung: "Bachelor"

**Tab 4: Gehalt & Recruiting**
- Min: 35000
- Max: 50000
- Währung: EUR
- Zeitraum: Jährlich
- Status: Recruiting
- Offene Stellen: 1

### **4.3 Speichern**

Click **"Erstellen"** → Position wird angelegt

---

## 👥 SCHRITT 5: MITARBEITER MIT POSITION SEHEN (1 Min)

### **5.1 Positions-Tabelle**

In der Tabelle siehst du jetzt:
```
| Position           | Level  | Abteilungen | Mitarbeiter | Gehalt      | Status    |
|--------------------|--------|-------------|-------------|-------------|-----------|
| Senior Entwickler  | Senior | IT          | 5 Personen  | 45k-65k €   | Aktiv     |
| HR Manager         | Mid    | HR          | 0 Personen  | 35k-50k €   | Recruiting|
```

### **5.2 Mitarbeiter-Liste ansehen**

1. Click auf **"5 Personen"** bei "Senior Entwickler"
2. Dialog öffnet mit Liste aller Mitarbeiter:
   - Avatar
   - Name
   - Abteilung
   - Email

---

## 🎯 NÄCHSTE SCHRITTE

### **1. Alle migrierten Positionen bearbeiten**
- Level anpassen (MID → JUNIOR/SENIOR/etc.)
- Abteilungen zuweisen
- Gehaltsbänder ergänzen
- Anforderungen ergänzen

### **2. Standard-Positionen anlegen**

Erstelle Standard-Positionen für dein Unternehmen:

**Entwicklung:**
- Junior Entwickler (JUNIOR, IT)
- Entwickler (MID, IT)
- Senior Entwickler (SENIOR, IT)
- Team Lead Entwicklung (LEAD, IT)

**HR:**
- HR Manager (MID, HR)
- HR Lead (LEAD, HR)

**Marketing:**
- Marketing Manager (MID, Marketing)
- Marketing Lead (LEAD, Marketing)

**Verwaltung:**
- Office Manager (MID, Verwaltung)
- Geschäftsführer (EXECUTIVE, -alle-)

### **3. Neue Mitarbeiter mit Position anlegen**

1. Gehe zu: **Team & Mitarbeiterverwaltung → Mitarbeiter hinzufügen**
2. Im Wizard **Step 2 (Arbeitsinformationen):**
   - **Position:** Dropdown statt Freitext!
   - Wähle z.B. "Senior Entwickler (SENIOR)"
3. Fertig → position_id wird automatisch gesetzt

---

## 💡 TIPPS & TRICKS

### **Tipp 1: Position-Hierarchie aufbauen**

Erstelle eine klare Hierarchie:
```
Geschäftsführer (EXECUTIVE)
  ↓ berichtet an: -
Team Lead Entwicklung (LEAD)
  ↓ berichtet an: Geschäftsführer
Senior Entwickler (SENIOR)
  ↓ berichtet an: Team Lead Entwicklung
Entwickler (MID)
  ↓ berichtet an: Team Lead Entwicklung
Junior Entwickler (JUNIOR)
  ↓ berichtet an: Team Lead Entwicklung
```

Im Dialog: **"Berichtet an"** Dropdown nutzen!

### **Tipp 2: Recruiting-Workflow**

Wenn du rekrutierst:
1. Position auf **Status: "Recruiting"** setzen
2. **Offene Stellen:** Anzahl eintragen (z.B. 2)
3. Stellenbeschreibung & Anforderungen ausführlich ausfüllen
4. Später: Direkt als Basis für Job-Posting nutzen

### **Tipp 3: Gehaltsbänder nutzen**

Nutze Gehaltsbänder für:
- **Transparenz:** Mitarbeiter sehen mögliches Gehalt
- **Recruiting:** Candidates sehen Gehaltsspanne
- **Fairness:** Gleiche Position = gleiche Gehaltsspanne
- **Planung:** Budget für Position kalkulieren

### **Tipp 4: Many-to-Many Abteilungen**

Positionen wie **"QM Manager"** können mehreren Abteilungen zugewiesen werden:
- ☑ IT
- ☑ Marketing
- ☑ Produktion

→ QM ist für alle 3 Abteilungen zuständig

---

## ⚠️ WICHTIGE HINWEISE

### **Nach Migration:**
- ⚠️ **Alle migrierten Positionen haben KEINE Abteilungen!**
- ⚠️ **Du musst Abteilungen manuell zuweisen!**
- ✅ `users.position` (TEXT) bleibt als Backup erhalten

### **Beim Löschen:**
- ⚠️ Wenn du eine Position mit Mitarbeitern löschst, wird `position_id` bei allen auf NULL gesetzt
- ⚠️ Warning-Dialog zeigt Anzahl betroffener Mitarbeiter

### **Berechtigungen:**
- ✅ ADMIN/HR/SUPERADMIN: Voller Zugriff
- 👁️ TEAMLEAD: Read-Only
- ❌ USER: Nicht sichtbar

---

## 🎉 FERTIG!

Du hast jetzt:
- ✅ Migration deployed
- ✅ Positions-Tab genutzt
- ✅ Erste Position bearbeitet
- ✅ Neue Position angelegt
- ✅ Mitarbeiter mit Position verknüpft

**Next Steps:**
1. Alle migrierten Positionen vervollständigen
2. Standard-Positionen anlegen
3. Bei neuem Mitarbeiter: Position-Dropdown nutzen

**Bei Fragen:**
- Siehe `/POSITIONS_MANAGEMENT_SYSTEM.md` für Details
- Siehe `/CHANGELOG_v4.14.0_POSITIONS.md` für Changelog

---

🚀 **VIEL ERFOLG!**
