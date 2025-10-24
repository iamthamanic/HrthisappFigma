# 🔬 HRTHIS - FINALE TIEFENANALYSE (Field & Recruiting ignoriert)

**Datum**: 16. Oktober 2025  
**Focus**: HR-Kern + Payroll + Schichtplanung  
**Referenz**: Factorial + Personio + BambooHR

---

## 🎯 EXECUTIVE SUMMARY

Nach **ultra-detaillierter Analyse** des Bildes und der Codebase:

### **KRITISCHSTE ERKENNTNIS:**
Wir haben **Zeitmodelle** (Schicht/Gleitzeit/Bereitschaft) in der **Mitarbeiterstammdatei**, aber **KEINE Schichtplanung/Personalplanung**!

Das ist wie ein Auto ohne Räder - das Feature existiert, aber ist **völlig unbrauchbar**!

---

## 📋 TEIL 1: MIND-MAP VOLLSTÄNDIGE ANALYSE

### **Linke Seite - HR Core:**

#### 1. **PERSONALAKTE** ✅ (90%)
- Stammdaten ✅
- Adresse ✅
- Notfallkontakte ✅
- Bankdaten ✅
- Kleidungsgrößen ✅
- Sprachkenntnisse ✅
- Profilbild ✅
- **FEHLT**: Custom Fields (wichtig für Zusatzfelder!)

#### 2. **ZEITERFASSUNG** 🟡 (60%)
**Haben wir:**
- ✅ Clock In/Out
- ✅ Pausenverwaltung
- ✅ Zeitmodelle (SCHICHTMODELL, GLEITZEIT, BEREITSCHAFT)
- ✅ Schichtzeiten erfassen (shift_start_time, shift_end_time)
- ✅ Gleitzeitfenster (flextime_start/end)

**FEHLT KRITISCH:**
- ❌ **Arbeitszeitkonto** (Soll vs. Ist)
- ❌ **Überstunden-Verwaltung**
- ❌ **Zeitkorrektur-Requests**
- ❌ **Monats-Timesheet**
- ❌ **Export (PDF/Excel)**
- ❌ **Team-Zeitübersicht** (Admin)
- ❌ **SCHICHTPLANUNG!!!** ← **KRITISCH!**

**Was bedeutet das?**
```
Aktuell haben wir:
├─ MA hat "Zeitmodell: SCHICHTMODELL"
├─ MA hat "Schichtzeit: 06:00 - 14:00"
└─ ABER: Keine Schichtplan-Verwaltung!

Was fehlt:
├─ Wochenplan erstellen (wer arbeitet wann?)
├─ Schichttausch
├─ Schicht-Vorlagen
├─ Urlaubskonflikt-Check
├─ Besetzung visualisieren
└─ Schicht-Benachrichtigungen
```

#### 3. **URLAUBSVERWALTUNG** ✅ (95%)
- ✅ Anträge stellen
- ✅ 2-Level Approval
- ✅ Urlaubstypen
- ✅ Kalender
- ✅ Team-Kalender
- ✅ Resturlaub
- 🟡 **Urlaubsplanung** (fehlt Multi-Year View)

#### 4. **ABWESENHEITEN** 🟡 (50%)
- ✅ Krankmeldung
- ✅ AU-Upload
- ❌ **Kurzzeitige Abwesenheit** (Arzttermin, privat)
- ❌ **Homeoffice-Tracking**
- ❌ **Dienstreisen**

#### 5. **LOHN & GEHALT (PAYROLL)** ❌ (10%)
**Haben wir:**
- ✅ Grundgehalt erfassen (Zahl)

**FEHLT 90%:**
- ❌ **Gehaltsbestandteile**
  - Grundgehalt ✅
  - Variable Anteile ❌
  - Boni ❌
  - Zulagen (Nacht/Sonntag/Feiertag) ❌
  - Überstundenzuschläge ❌
  - Sachbezüge (Dienstwagen) ❌
  
- ❌ **Abzüge verwalten**
  - Krankenversicherung ❌
  - Rentenversicherung ❌
  - Arbeitslosenversicherung ❌
  - Pflegeversicherung ❌
  - Lohnsteuer ❌
  - Solidaritätszuschlag ❌
  - Kirchensteuer ❌

- ❌ **Lohnlauf**
  - Monats-Lohnlauf ❌
  - Batch-Processing ❌
  - PDF-Lohnabrechnungen ❌
  - E-Mail-Versand ❌

- ❌ **Lohnarten-System**
- ❌ **Lohnhistorie**
- ❌ **Gehaltsanpassungen**

#### 6. **DOKUMENTENVERWALTUNG** ✅ (90%)
- ✅ Upload (Single + Bulk)
- ✅ Kategorien
- ✅ Audit Logs
- ✅ Suche & Filter
- ❌ **Dokumentenbuilder** (Vertragsbuilder)
- ❌ **E-Signatur**
- ❌ **Ablaufdaten-Tracking**

---

## 📋 TEIL 2: FACTORIAL PAYROLL - WAS HAT FACTORIAL GENAU?

### **Factorial Payroll Module (komplett):**

#### **1. Gehaltsstruktur definieren**
```
Lohnarten-System:
├─ Grundgehalt (fix)
├─ Variable Bestandteile
│  ├─ Boni (einmalig/monatlich)
│  ├─ Provisionen (%)
│  └─ Prämien
├─ Zulagen
│  ├─ Nachtzuschlag (+25%)
│  ├─ Sonntagszuschlag (+50%)
│  ├─ Feiertagszuschlag (+125%)
│  └─ Überstundenzuschlag (+25%)
└─ Sachbezüge
   ├─ Dienstwagen (geldwerter Vorteil)
   ├─ Essensmarken
   └─ Firmenticket
```

#### **2. Abzüge berechnen (Deutschland)**
```
Sozialversicherung (automatisch):
├─ Krankenversicherung (14,6% / 2)
├─ Pflegeversicherung (3,05% / 2)
├─ Rentenversicherung (18,6% / 2)
└─ Arbeitslosenversicherung (2,6% / 2)

Steuern (nach Steuerklasse):
├─ Lohnsteuer (nach Tabelle)
├─ Solidaritätszuschlag (5,5% der Lohnsteuer)
└─ Kirchensteuer (8% oder 9%)
```

#### **3. Lohnlauf durchführen**
```
Prozess:
1. Monat/Jahr auswählen
2. Alle MA auswählen (oder filtern)
3. "Lohnlauf starten"
4. System berechnet automatisch:
   ├─ Brutto
   ├─ - Sozialversicherung (AG + AN Anteil)
   ├─ - Steuern
   └─ = Netto
5. PDF-Lohnabrechnungen generieren
6. Per E-Mail versenden
7. In Dokumentensystem speichern
```

#### **4. Lohnabrechnung (PDF-Struktur)**
```
┌────────────────────────────────────┐
│ FIRMA LOGO                         │
│ Lohnabrechnung Monat/Jahr          │
├────────────────────────────────────┤
│ Mitarbeiter: Max Mustermann        │
│ Personalnummer: 12345              │
│ Steuer-ID: 12 345 678 901          │
│ Steuerklasse: I                    │
├────────────────────────────────────┤
│ BEZÜGE                             │
│ Grundgehalt         3.500,00 €     │
│ Überstundenzuschlag   120,00 €     │
│ Nachtzuschlag          80,00 €     │
│ ──────────────────────────────     │
│ Brutto gesamt       3.700,00 €     │
├────────────────────────────────────┤
│ ABZÜGE                             │
│ Krankenversicherung   270,10 €     │
│ Pflegeversicherung     56,43 €     │
│ Rentenversicherung    344,10 €     │
│ Arbeitslosenversicherung 48,10 €   │
│ Lohnsteuer            580,00 €     │
│ Solidaritätszuschlag   31,90 €     │
│ ──────────────────────────────     │
│ Abzüge gesamt       1.330,63 €     │
├────────────────────────────────────┤
│ NETTO AUSZAHLUNG    2.369,37 €     │
└────────────────────────────────────┘
```

#### **5. Factorial Features (komplett):**
- ✅ Lohnarten-Katalog (anpassbar)
- ✅ Steuerklassen-Management
- ✅ SV-Sätze (automatisch aktualisiert)
- ✅ Batch-Lohnlauf
- ✅ PDF-Export (mit Template-Editor!)
- ✅ E-Mail-Versand
- ✅ Lohnhistorie (alle Abrechnungen)
- ✅ Gehaltsanpassungen tracken
- ✅ Jahresübersicht (Brutto/Netto)
- ✅ Steuer-Reports (Jahres-Lohnsteuerbescheinigung)
- ✅ DATEV-Export (für Steuerberater)
- ✅ Belege-Upload (Reisekostenabrechnung)

---

## 📋 TEIL 3: SCHICHTPLANUNG/PERSONALPLANUNG - DAS FEHLENDE KERNSYSTEM

### **Problem-Beschreibung:**

Du hast 3 Gruppen:
1. **Bereitschaftsdienst** (24/7 Rufbereitschaft)
2. **Früh/Spät-Schicht** (z.B. 06:00-14:00 / 14:00-22:00)
3. **Gleitzeit** (Büro, flexibel)

**Aktuell haben wir:**
- ✅ Zeitmodell pro MA definiert
- ✅ Schichtzeiten pro MA definiert
- ❌ **KEINE Schichtplan-Verwaltung**

**Das bedeutet:**
- Admin kann nicht sehen: "Wer arbeitet nächste Woche?"
- Admin kann nicht planen: "Montag Frühschicht: Anna, Max, Lisa"
- MA sehen nicht: "Meine Schichten diese Woche"
- Keine Schichttausch-Funktion
- Keine Konflikt-Erkennung (Urlaub + Schicht?)

### **Was Factorial/Personio für Schichtplanung hat:**

#### **1. Schichtmodelle definieren (Admin)**
```
Schichtmodelle:
├─ Frühschicht
│  ├─ Zeit: 06:00 - 14:00
│  ├─ Pausenregelung: 30 Min. automatisch
│  ├─ Zuschlag: Keine
│  └─ Farbe: Blau
│
├─ Spätschicht
│  ├─ Zeit: 14:00 - 22:00
│  ├─ Pausenregelung: 30 Min. automatisch
│  ├─ Zuschlag: +15%
│  └─ Farbe: Orange
│
└─ Nachtschicht
   ├─ Zeit: 22:00 - 06:00
   ├─ Pausenregelung: 45 Min. automatisch
   ├─ Zuschlag: +25%
   └─ Farbe: Lila
```

#### **2. Schichtplan erstellen (Admin)**
```
Wochen-Schichtplan:
┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│        │  Mo    │  Di    │  Mi    │  Do    │  Fr    │  Sa    │
├────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ FRÜH   │ Anna   │ Anna   │ Max    │ Max    │ Lisa   │ Lisa   │
│ 06-14  │ Max    │ Max    │ Lisa   │ Lisa   │ Anna   │ Anna   │
│        │ Peter  │ Peter  │        │        │        │        │
├────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ SPÄT   │ Lisa   │ Lisa   │ Anna   │ Anna   │ Max    │ Max    │
│ 14-22  │ Tom    │ Tom    │ Peter  │ Peter  │ Tom    │ Tom    │
│        │        │        │ Tom    │ Tom    │        │        │
├────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ NACHT  │ Peter  │ Peter  │ Tom    │ Tom    │ Peter  │ Peter  │
│ 22-06  │        │        │        │        │        │        │
└────────┴────────┴────────┴────────┴────────┴────────┴────────┘
```

#### **3. Features Schichtplanung:**

**Admin-Features:**
- ✅ Drag & Drop Schichtplan
- ✅ Vorlagen (Wochenplan als Template speichern)
- ✅ Kopieren (letzte Woche → nächste Woche)
- ✅ Konflikt-Erkennung:
  - Urlaub ↔ Schicht
  - Überschneidende Schichten
  - Ruhezeit-Verstoß (11h zwischen Schichten)
  - Maximale Wochenarbeitszeit
- ✅ Benachrichtigungen (MA bekommt Schichtplan per Mail/Push)
- ✅ Statistik (Schichtstunden pro MA, Auslastung)
- ✅ Export (PDF Schichtplan)

**Mitarbeiter-Features:**
- ✅ "Meine Schichten" (Kalenderansicht)
- ✅ Schichttausch-Request
  - MA1 → MA2: "Ich tausche meine Frühschicht am Mo mit dir"
  - MA2 akzeptiert
  - Admin genehmigt
- ✅ Schicht-Wünsche (Präferenzen)
- ✅ Verfügbarkeit angeben
- ✅ Push-Benachrichtigungen

#### **4. Automatische Integration:**
```
Schichtplan ↔ Zeiterfassung:
├─ MA clock-in → Check: Ist Schicht eingeplant?
├─ Falls nicht → Warnung
├─ Schichtende → Automatische Berechnung:
│  ├─ Soll: 8h (Schichtplan)
│  ├─ Ist: 8.5h (Clock-out)
│  └─ Überstunden: +0.5h
└─ Falls Nachtschicht → Zuschlag berechnen

Schichtplan ↔ Payroll:
├─ Monatsende → Schichtstunden zählen
├─ Zuschläge berechnen (Nacht/Sonntag/Feiertag)
└─ In Lohnabrechnung einfließen lassen
```

### **Was wir implementieren müssen:**

```
📁 /screens/admin/ShiftPlanningScreen.tsx
│
├─ Tab 1: Schichtmodelle
│  ├─ Schichtmodell erstellen
│  │  ├─ Name (z.B. "Frühschicht")
│  │  ├─ Start/End-Zeit
│  │  ├─ Pausenregelung
│  │  ├─ Zuschlag (%)
│  │  └─ Farbe
│  └─ Liste aller Schichtmodelle
│
├─ Tab 2: Schichtplan
│  ├─ Wochen-/Monatsansicht
│  ├─ Drag & Drop Interface
│  │  ├─ MA auf Schicht ziehen
│  │  ├─ Konflikt-Check (rot markieren)
│  │  └─ Speichern
│  ├─ Vorlagen-System
│  │  ├─ Als Vorlage speichern
│  │  ├─ Vorlage anwenden
│  │  └─ Letzte Woche kopieren
│  └─ Benachrichtigungen senden
│
├─ Tab 3: Schichttausch-Requests
│  ├─ Offene Anfragen
│  ├─ Genehmigen/Ablehnen
│  └─ Historie
│
└─ Tab 4: Statistiken
   ├─ Schichtstunden pro MA
   ├─ Auslastung pro Schicht
   ├─ Zuschläge-Übersicht
   └─ Export

📁 /screens/MyShiftsScreen.tsx (User-Ansicht)
│
├─ Meine Schichten (Kalender)
├─ Schichttausch initiieren
├─ Verfügbarkeit angeben
└─ Schicht-Historie
```

**DB-Schema:**
```sql
-- shift_models table
id, name, start_time, end_time, break_minutes, 
surcharge_percentage, color, created_at

-- shift_assignments table
id, shift_model_id, user_id, date, status,
assigned_by, confirmed_at

-- shift_swap_requests table
id, requester_id, target_user_id, shift_assignment_id,
replacement_shift_id, status, approved_by, created_at

-- shift_templates table
id, name, description, template_data (JSON), created_by
```

---

## 📋 TEIL 4: WAS WIR WIRKLICH HABEN VS. WAS FEHLT

### **Zeiterfassung - Detailvergleich:**

| Feature | Factorial | HRthis | Status |
|---------|-----------|--------|--------|
| Clock In/Out | ✅ | ✅ | OK |
| Pausenverwaltung | ✅ | ✅ | OK |
| Zeitmodelle definieren | ✅ | ✅ | OK |
| **Schichtplan erstellen** | ✅ | ❌ | **FEHLT!** |
| **Schichtplan anzeigen** | ✅ | ❌ | **FEHLT!** |
| **Schichttausch** | ✅ | ❌ | **FEHLT!** |
| **Arbeitszeitkonto** | ✅ | ❌ | **FEHLT!** |
| Überstunden-Saldo | ✅ | 🟡 | Nur Anzeige |
| **Überstunden-Abbau** | ✅ | ❌ | **FEHLT!** |
| **Zeitkorrektur-Request** | ✅ | ❌ | **FEHLT!** |
| **Monats-Timesheet** | ✅ | ❌ | **FEHLT!** |
| **Export PDF/Excel** | ✅ | ❌ | **FEHLT!** |
| **Team-Zeitübersicht** | ✅ | ❌ | **FEHLT!** |
| **Projekt-Zeiterfassung** | ✅ | ❌ | **FEHLT!** |

### **Payroll - Detailvergleich:**

| Feature | Factorial | HRthis | Status |
|---------|-----------|--------|--------|
| Grundgehalt erfassen | ✅ | ✅ | OK |
| **Lohnarten-System** | ✅ | ❌ | **FEHLT!** |
| **Variable Bestandteile** | ✅ | ❌ | **FEHLT!** |
| **Zulagen** | ✅ | ❌ | **FEHLT!** |
| **Sachbezüge** | ✅ | ❌ | **FEHLT!** |
| **SV-Berechnung** | ✅ | ❌ | **FEHLT!** |
| **Steuer-Berechnung** | ✅ | ❌ | **FEHLT!** |
| **Lohnlauf** | ✅ | ❌ | **FEHLT!** |
| **PDF-Lohnabrechnung** | ✅ | ❌ | **FEHLT!** |
| **Lohnhistorie** | ✅ | ❌ | **FEHLT!** |
| **Gehaltsanpassungen** | ✅ | ❌ | **FEHLT!** |
| **DATEV-Export** | ✅ | ❌ | **FEHLT!** |

---

## 🎯 PRIORISIERTE ROADMAP - FINAL

### **PHASE 1: ARBEITSZEITKONTO & ÜBERSTUNDEN (3 Wochen)** 🔴 KRITISCH

**Warum zuerst?** Ohne Arbeitszeitkonto ist Zeiterfassung nutzlos!

#### Woche 1-2: Arbeitszeitkonto
- [ ] DB-Schema
  ```sql
  -- time_accounts table
  user_id, month, year, soll_stunden, ist_stunden,
  saldo, carry_over, updated_at
  
  -- time_sessions (erweitern)
  + calculated_hours (mehrere Sessions/Tag zusammenrechnen!)
  ```
- [ ] Arbeitszeitkonto berechnen
  - Soll: weekly_hours / 5 * Arbeitstage
  - Ist: SUM(alle Sessions pro Tag)
  - Saldo: Ist - Soll (kumulativ)
- [ ] Monats-Timesheet Screen
  - Kalenderansicht
  - Soll/Ist pro Tag
  - Saldo-Entwicklung
  - Fehlzeiten (Urlaub, Krank)
- [ ] Export (PDF/Excel)

#### Woche 2-3: Überstunden
- [ ] Überstunden-Management
  - Überstunden-Saldo (aus Arbeitszeitkonto)
  - Überstunden-Abbau (Freizeitausgleich)
  - Überstunden-Auszahlung (Flag für Payroll)
- [ ] Zeitkorrektur-Requests
  - MA beantragt Korrektur
  - Admin genehmigt
  - Historie

---

### **PHASE 2: SCHICHTPLANUNG (4 Wochen)** 🔴 KRITISCH

**Warum zwingend?** Deine User haben Schichtdienst - ohne Plan ist das System unbrauchbar!

#### Woche 1: Schichtmodelle
- [ ] DB-Schema (shift_models)
- [ ] Schichtmodelle erstellen (Admin)
  - Name, Start/End, Pause, Zuschlag, Farbe
- [ ] Schichtmodelle-Liste

#### Woche 2-3: Schichtplan
- [ ] DB-Schema (shift_assignments)
- [ ] Schichtplan-Screen (Admin)
  - Wochen-/Monatsansicht
  - MA auf Schicht zuweisen
  - Konflikt-Check (Urlaub, Doppelbuchung)
  - Ruhezeit-Check (11h Pause)
- [ ] Benachrichtigungen senden

#### Woche 3-4: Schichttausch & User-Ansicht
- [ ] DB-Schema (shift_swap_requests)
- [ ] MyShiftsScreen (User)
  - Meine Schichten anzeigen
  - Schichttausch initiieren
- [ ] Admin: Schichttausch genehmigen

#### Integration:
- [ ] Zeiterfassung ↔ Schichtplan
  - Clock-in: Check ob Schicht
  - Soll-Zeit aus Schichtplan
- [ ] Payroll ↔ Schichtplan
  - Zuschläge berechnen

---

### **PHASE 3: PAYROLL-MODUL (4-5 Wochen)** 🔴 HOCH

**Complexity: Mittel bis Hoch**

#### Woche 1: Lohnarten-System
- [ ] DB-Schema
  ```sql
  -- salary_components table
  user_id, component_type (GRUNDGEHALT, BONUS, ZULAGE, etc.),
  amount, is_recurring, effective_from, effective_to
  
  -- payroll_settings table
  sv_rates (JSON), tax_tables (JSON), surcharge_rates (JSON)
  ```
- [ ] Lohnarten definieren
  - Grundgehalt
  - Variable Bestandteile
  - Zulagen (Nacht/Sonntag/Feiertag)
  - Sachbezüge

#### Woche 2-3: Berechnungs-Engine
- [ ] Brutto berechnen
  - Grundgehalt
  - + Variable Bestandteile
  - + Zulagen (aus Schichtplan!)
  - + Überstundenzuschläge
- [ ] SV berechnen (vereinfacht)
  - KV, PV, RV, AV (Prozentsätze eingeben)
- [ ] Steuer berechnen (vereinfacht)
  - Nach Steuerklasse (Tabelle)
  - Freibeträge
- [ ] Netto berechnen

#### Woche 3-4: Lohnlauf & PDF
- [ ] Lohnlauf-Screen
  - Monat/Jahr auswählen
  - MA auswählen (alle/gefiltert)
  - Lohnlauf starten
- [ ] PDF-Generator (Edge Function)
  - Template (wie oben)
  - Puppeteer
  - Brutto/Netto/Abzüge
- [ ] Speichern in Dokumentensystem

#### Woche 4-5: Lohnhistorie & Export
- [ ] Lohnhistorie-Screen
  - Alle Abrechnungen pro MA
  - PDF-Download
  - Jahresübersicht
- [ ] DATEV-Export (optional)
  - CSV-Format für Steuerberater

---

### **PHASE 4: DOKUMENTENBUILDER (2-3 Wochen)** 🟡 MITTEL

#### Woche 1: Template-System
- [ ] DB-Schema (document_templates, document_blocks)
- [ ] Template erstellen
  - Bausteine definieren (Textblöcke)
  - Platzhalter ({{vorname}}, {{gehalt}}, etc.)
- [ ] Template-Liste

#### Woche 2-3: Builder-UI
- [ ] Drag & Drop Builder
  - react-beautiful-dnd
  - Bausteine zusammenstellen
  - Vorschau
- [ ] Vertrag generieren
  - Daten aus MA-Stammdaten
  - PDF generieren (Puppeteer)
  - Speichern

#### Standard-Templates:
- [ ] Arbeitsvertrag (unbefristet)
- [ ] Arbeitsvertrag (befristet)
- [ ] Aufhebungsvertrag
- [ ] Änderungsvertrag
- [ ] Praktikumsvertrag

---

### **PHASE 5: ABWESENHEITEN ERWEITERN (1 Woche)** 🟡 NIEDRIG

- [ ] Kurzzeitige Abwesenheit
  - Arzttermin, Behördengang
  - Ohne Urlaub
- [ ] Homeoffice-Tracking
  - Homeoffice-Tage erfassen
  - Kalenderansicht
- [ ] Dienstreisen (Basic)
  - Dienstreise-Antrag
  - Reisekostenabrechnung (später)

---

## 🔥 TOP 3 KRITISCHSTE FEATURES

### 1. **SCHICHTPLANUNG** (4 Wochen)
**Warum:** Deine User arbeiten in Schichten! Ohne Schichtplan ist das System unbrauchbar.
**Complexity:** Hoch
**Impact:** MASSIV

### 2. **ARBEITSZEITKONTO** (3 Wochen)
**Warum:** Gesetzlich erforderlich (Arbeitszeitgesetz). Überstunden müssen dokumentiert werden.
**Complexity:** Mittel
**Impact:** Hoch

### 3. **PAYROLL-MODUL** (4-5 Wochen)
**Warum:** Ohne Lohnabrechnung ist es kein vollständiges HR-System.
**Complexity:** Hoch
**Impact:** Hoch

---

## 📊 ZUSAMMENFASSUNG - WAS FACTORIAL HAT VS. WAS WIR HABEN

### **Bereich-Übersicht:**

| Bereich | Factorial | HRthis | Lücke |
|---------|-----------|--------|-------|
| **Personalakte** | 100% | 90% | 10% (Custom Fields) |
| **Zeiterfassung** | 100% | 40% | **60%** (Schichtplan, Konto) |
| **Urlaubsverwaltung** | 100% | 95% | 5% |
| **Abwesenheiten** | 100% | 50% | 50% |
| **Payroll** | 100% | 10% | **90%** |
| **Dokumente** | 100% | 80% | 20% (Builder) |
| **Schichtplanung** | 100% | 0% | **100%** |

### **Kritische Zahlen:**
- **Vollständig:** 40%
- **Teilweise:** 30%
- **Fehlt:** 30%

---

## 🎬 NÄCHSTE SCHRITTE

### **SOFORT (diese Woche):**
1. ✅ Diese Analyse durchgehen
2. ✅ Prioritäten bestätigen
3. ✅ Entscheidung: Schichtplanung JA/NEIN?
   - Wenn JA → Phase 2 VORZIEHEN
   - Wenn NEIN → Nur Zeitmodelle (wie jetzt)

### **DANN (nächste Woche):**
1. DB-Schemas entwerfen (Arbeitszeitkonto)
2. UI-Mockups erstellen (Schichtplan)
3. Mit Implementierung starten

---

## ❓ FINALE RÜCKFRAGEN

### 1. **SCHICHTPLANUNG - WIE KRITISCH?**
- Arbeiten >50% deiner User in Schichten?
- Oder nur wenige?
- **→ Bestimmt Priorität!**

### 2. **PAYROLL - WIE DETAILLIERT?**
- Einfache Version (nur PDF mit Brutto/Netto)?
- Oder vollautomatisch (SV + Steuer)?
- DATEV-Integration nötig?
- **→ Bestimmt Umfang!**

### 3. **TIMELINE - WIE SCHNELL?**
- Alles auf einmal (12 Wochen)?
- Oder schrittweise (Phase für Phase)?

---

**BEREIT FÜR DEINE ANTWORTEN! 🚀**
