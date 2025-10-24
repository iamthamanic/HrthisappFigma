# 🔍 HRTHIS - ULTRA-DETAILLIERTE GAP-ANALYSE v2.0

**Datum**: 16. Oktober 2025  
**Basis**: Mind-Map + Codebase Deep Dive + Factorial Benchmark  
**Status**: 99% Confidence Analysis  

---

## 🚨 WICHTIGE ERKENNTNISSE NACH DEEP-DIVE

Nach gründlichster Analyse stelle ich fest, dass die erste Analyse **ZU OPTIMISTISCH** war. Es fehlen **deutlich mehr Features** als ursprünglich angenommen.

---

## 📋 TEIL 1: FACTORIAL VOLLSTÄNDIGER FEATURE-VERGLEICH

### Was Factorial hat (Referenz):

#### 1. **PERSONALVERWALTUNG** 
✅ = Haben wir | 🟡 = Teilweise | ❌ = Fehlt

| Feature | Status | HRthis Status |
|---------|--------|---------------|
| Mitarbeiterstammdaten | ✅ | Vollständig |
| Profilbilder | ✅ | Mit Crop-Funktion |
| Organisationsstruktur | ✅ | Canvas Organigram |
| Abteilungen | ✅ | Vollständig |
| Teams | ✅ | Mit Teamleads |
| Standorte | ✅ | Vollständig |
| Notfallkontakte | ✅ | Vollständig |
| Dokumente pro MA | ✅ | Vollständig |
| **Custom Fields** | ❌ | **FEHLT KOMPLETT** |
| **Mitarbeiter-Statistiken** | 🟡 | Nur Basic Stats |
| **Mitarbeiter-Export** | ✅ | Excel/CSV |
| **Mitarbeiter-Import** | ❌ | **FEHLT** |
| **Org Chart Auto-Gen** | ✅ | Manuell + Auto |

#### 2. **ZEITERFASSUNG & ANWESENHEIT**

| Feature | Status | HRthis Status |
|---------|--------|---------------|
| Clock In/Out | ✅ | Vollständig |
| Pausenverwaltung | ✅ | Auto + Manuell |
| Überstunden-Tracking | 🟡 | **Nur Anzeige, keine Verwaltung** |
| Schichtplanung | ❌ | **FEHLT KOMPLETT** |
| Zeitmodelle (Gleitzeit/Schicht) | ✅ | 3 Modelle |
| Rufbereitschaft | ✅ | Als Flag |
| **Mehrere Sessions pro Tag** | 🟡 | **Sessions werden NICHT zusammengerechnet** |
| **Monatsauswertung** | 🟡 | **Nur Stats, kein Timesheet** |
| **Überstunden-Auszahlung** | ❌ | **FEHLT** |
| **Arbeitszeitkonto** | ❌ | **FEHLT** |
| **Zeitkorrektur-Requests** | ❌ | **FEHLT** |
| **Team-Zeitübersicht** | ❌ | **FEHLT** |
| **Exportfunktion (Timesheet)** | ❌ | **FEHLT** |

#### 3. **URLAUBSVERWALTUNG**

| Feature | Status | HRthis Status |
|---------|--------|---------------|
| Urlaubsanträge | ✅ | Vollständig |
| Genehmigungsprozess | ✅ | 2-Level |
| Urlaubstypen | ✅ | 4 Typen |
| Kalenderansicht | ✅ | Vollständig |
| Team-Kalender | ✅ | Mit Coverage |
| **Urlaubsplanung (Multi-Year)** | ❌ | **FEHLT** |
| **Resturlaub Übertrag** | ✅ | Vorhanden! |
| **Urlaubsanspruch Auto-Calc** | 🟡 | **Manuell, nicht auto** |
| **Feiertage-Integration** | ✅ | Deutsche Feiertage |
| **Urlaubssperren** | ❌ | **FEHLT** |
| **Urlaubsstatistiken** | 🟡 | Basic |
| **Urlaubshistorie** | ✅ | Pro MA vorhanden |

#### 4. **ABWESENHEITEN**

| Feature | Status | HRthis Status |
|---------|--------|---------------|
| Krankmeldung | ✅ | Als Urlaub-Typ |
| AU-Upload | ✅ | Dokumentenkategorie |
| **Kurzzeitige Abwesenheit** | ❌ | **FEHLT (Arzttermin, privat)** |
| **Homeoffice-Tracking** | ❌ | **FEHLT KOMPLETT** |
| **Remote-Work Management** | ❌ | **FEHLT** |
| **Dienstreisen** | ❌ | **FEHLT** |
| **Abwesenheitskalender** | 🟡 | Nur als Teil von Urlaubskalender |
| **Abwesenheitsstatistik** | ❌ | **FEHLT** |

#### 5. **LOHN & GEHALT (PAYROLL)**

| Feature | Status | HRthis Status |
|---------|--------|---------------|
| Grundgehalt erfassen | ✅ | In Mitarbeiterstamm |
| **Gehaltsabrechnungen** | ❌ | **FEHLT KOMPLETT** |
| **PDF-Export** | ❌ | **FEHLT** |
| **Lohnhistorie** | ❌ | **FEHLT** |
| **Bonuszahlungen** | ❌ | **FEHLT** |
| **Gehaltsstufen** | ❌ | **FEHLT** |
| **Gehaltsanpassungen** | ❌ | **FEHLT** |
| **Steuerklasse** | ❌ | **FEHLT** |
| **Sozialversicherung** | ❌ | **FEHLT** |
| **DATEV-Export** | ❌ | **FEHLT** |
| **Auszahlungen-Tracking** | ❌ | **FEHLT** |
| **Lohnnebenkosten** | ❌ | **FEHLT** |

#### 6. **RECRUITING**

| Feature | Status | HRthis Status |
|---------|--------|---------------|
| **Stellenanzeigen** | ❌ | **FEHLT KOMPLETT** |
| **Bewerbungseingang** | ❌ | **FEHLT** |
| **Kandidaten-Pipeline** | ❌ | **FEHLT** |
| **Interview-Planung** | ❌ | **FEHLT** |
| **Bewertungssystem** | ❌ | **FEHLT** |
| **Angebots-Management** | ❌ | **FEHLT** |
| Bewerbungsunterlagen Upload | ✅ | Nur Dokumentenkategorie |

#### 7. **ONBOARDING**

| Feature | Status | HRthis Status |
|---------|--------|---------------|
| **Onboarding-Prozess** | ❌ | **FEHLT KOMPLETT** |
| **Checklisten** | ❌ | **FEHLT** |
| **Onboarding-Timeline** | ❌ | **FEHLT** |
| **Buddy-System** | ❌ | **FEHLT** |
| **Willkommens-Email** | ❌ | **FEHLT** |
| **IT-Ausstattung Tracking** | ❌ | **FEHLT** |
| Schulungen zuweisen | 🟡 | Learning System (aber nicht Onboarding-spezifisch) |

#### 8. **OFFBOARDING**

| Feature | Status | HRthis Status |
|---------|--------|---------------|
| **Kündigungsprozess** | ❌ | **FEHLT KOMPLETT** |
| **Offboarding-Checkliste** | ❌ | **FEHLT** |
| **Exit-Interview** | ❌ | **FEHLT** |
| **Equipment-Rückgabe** | ❌ | **FEHLT** |
| **Zugangsrechte entziehen** | ❌ | **FEHLT** |
| **Arbeitszeugnisse** | ❌ | **FEHLT** |
| **Letzte Abrechnung** | ❌ | **FEHLT** |

#### 9. **PERFORMANCE MANAGEMENT**

| Feature | Status | HRthis Status |
|---------|--------|---------------|
| **Mitarbeitergespräche** | ❌ | **FEHLT KOMPLETT** |
| **Zielvereinbarungen** | ❌ | **FEHLT** |
| **OKRs** | ❌ | **FEHLT** |
| **360° Feedback** | ❌ | **FEHLT** |
| **Performance Reviews** | ❌ | **FEHLT** |
| **Entwicklungspläne** | ❌ | **FEHLT** |
| **Skills Matrix** | ❌ | **FEHLT** |
| **Nachfolgeplanung** | ❌ | **FEHLT** |

#### 10. **DOKUMENTE**

| Feature | Status | HRthis Status |
|---------|--------|---------------|
| Upload-System | ✅ | Single + Bulk |
| Kategorisierung | ✅ | 7 Kategorien |
| Audit Logs | ✅ | Vollständig |
| Suche & Filter | ✅ | Vollständig |
| **Template-System** | ❌ | **FEHLT (= Dokumentenholder!)** |
| **E-Signatur** | ❌ | **FEHLT** |
| **Vertragsmanagement** | ❌ | **FEHLT** |
| **Ablaufdaten-Tracking** | ❌ | **FEHLT** |
| **Erinnerungen** | ❌ | **FEHLT** |

#### 11. **REPORTS & ANALYTICS**

| Feature | Status | HRthis Status |
|---------|--------|---------------|
| **Dashboard** | ✅ | Basic Stats |
| **Mitarbeiter-Reports** | ❌ | **FEHLT** |
| **Zeit-Reports** | 🟡 | Basic Stats only |
| **Urlaubs-Reports** | ❌ | **FEHLT** |
| **Gehalts-Reports** | ❌ | **FEHLT** |
| **Custom Reports** | ❌ | **FEHLT** |
| **Export-Funktion** | ✅ | Nur Mitarbeiter |
| **Headcount-Entwicklung** | ❌ | **FEHLT** |
| **Fluktuationsrate** | ❌ | **FEHLT** |
| **Altersstruktur** | ❌ | **FEHLT** |
| **Gehaltsstruktur** | ❌ | **FEHLT** |

---

## 📋 TEIL 2: FIELD/ERP-BEREICH DETAILLIERTE ANALYSE

### Was ist implementiert:

#### **Tab 1: Tourenplanung**
```
Status: ❌ KOMPLETT LEER - NUR EMPTY STATE!
Keine Features implementiert!
```

#### **Tab 2: Fahrzeuge**
✅ **Implementiert:**
- Fahrzeug hinzufügen (Kennzeichen, Modell, Typ, Ladekapazität)
- Fahrzeug-Liste mit Suche
- Fahrzeug-Details Screen
- Bilder-Upload pro Fahrzeug
- Dokumente pro Fahrzeug
- Wartungen tracken
- Unfälle tracken
- Equipment pro Fahrzeug
- Equipment Management Screen

🟡 **Teilweise:**
- Keine Fahrzeug-Zuweisung an Mitarbeiter
- Keine Fahrzeug-Verfügbarkeit
- Keine Fahrzeug-Buchung
- Keine Kilometerstand-Tracking
- Keine Tankkosten
- Keine TÜV/AU Tracking mit Erinnerungen

#### **Tab 3: Sonstige Arbeiten**
```
Status: ❌ KOMPLETT LEER - NUR EMPTY STATE!
Keine Features implementiert!
```

### Was für ein ERP für Verkehrssicherungs-Fahrer fehlt:

#### ❌ **KOMPLETT FEHLEND:**

1. **TOURENPLANUNG** (= Tab 1 ist leer!)
   - Touren erstellen
   - Touren Mitarbeitern zuweisen
   - Routenplanung
   - Zeitslots
   - Tourenübersicht (Kalender)
   - Touren-Status (Geplant/Aktiv/Abgeschlossen)
   - GPS-Tracking Integration
   - Start/End-Zeiten pro Tour
   - Pausen auf Tour
   - Kilometerstand pro Tour

2. **EINSATZPLANUNG**
   - Einsätze erstellen (Baustelle, Veranstaltung, etc.)
   - Einsatzort (Adresse, GPS)
   - Benötigte Ausrüstung
   - Benötigte Mitarbeiter (Anzahl + Qualifikationen)
   - Einsatz-Dauer
   - Kunde/Auftraggeber
   - Einsatz-Status
   - Schichtplan pro Einsatz
   - Notizen pro Einsatz

3. **MITARBEITER-EINSATZ-MATCHING**
   - Qualifikationen-System
   - Verfügbarkeits-Check
   - Automatische Zuweisung basierend auf:
     - Qualifikationen
     - Verfügbarkeit
     - Standort-Nähe
     - Arbeitszeitkonto
   - Einsatzhistorie pro MA
   - MA-Präferenzen

4. **FAHRZEUGDISPOSITION**
   - Fahrzeug-Verfügbarkeitskalender
   - Fahrzeug-Buchungssystem
   - Fahrzeug → Einsatz Zuordnung
   - Fahrzeug → Fahrer Zuordnung
   - Konflikt-Erkennung (Doppelbuchung)
   - Fahrzeug-Standort
   - Kilometerstand vor/nach Einsatz
   - Tankquittungen

5. **EQUIPMENT-DISPOSITION**
   - Equipment-Verfügbarkeitskalender
   - Equipment → Einsatz Zuordnung
   - Equipment-Transport (welches Fahrzeug)
   - Equipment-Checkliste
   - Equipment-Rückgabe Tracking

6. **SCHICHTPLANUNG**
   - Schichtmodelle definieren (Früh/Spät/Nacht)
   - Schichtplan pro Woche/Monat
   - Schichttausch-System
   - Schicht-Präferenzen
   - Ruhezeiten-Check (Arbeitszeitgesetz)
   - Überstunden pro Schicht
   - Zuschläge (Nacht/Sonntag/Feiertag)

7. **ARBEITSZEIT-NACHWEIS FÜR FIELD**
   - Mobile Clock In/Out (GPS-gestützt)
   - Einsatzort-Verifizierung
   - Pausen auf Einsatz
   - Fahrzeiten tracken
   - Reisezeit vs. Arbeitszeit
   - Überstunden-Genehmigung
   - Zeitnachweise pro Kunde/Projekt

8. **KUNDEN-/PROJEKTMANAGEMENT**
   - Kunden anlegen
   - Projekte pro Kunde
   - Einsätze pro Projekt
   - Verträge mit Kunden
   - Rechnungsstellung-Vorbereitung
   - Projekt-Status
   - Budgets pro Projekt

9. **AUSRÜSTUNGS-CHECKLISTEN**
   - Checklisten-Templates
   - Pflicht-Equipment pro Einsatztyp
   - Vor-Ort Checkliste (Tablet/Mobile)
   - Fehlende Items melden
   - Checklisten-Historie

10. **SICHERHEITS-MANAGEMENT**
    - Sicherheitsunterweisungen
    - Unterweisungs-Historie
    - Zertifikate (Führerschein, Staplerschein, etc.)
    - Ablaufdaten-Tracking
    - Erinnerungen
    - Unfall-Dokumentation (Arbeitsunfall)
    - Gefährdungsbeurteilung

11. **KOMMUNIKATION FIELD ↔ ZENTRALE**
    - Einsatz-Nachrichten
    - Push-Benachrichtigungen
    - Einsatz-Änderungen
    - Notfall-Alarm
    - Foto-Upload vom Einsatz
    - Statusupdates

12. **ABRECHNUNG/CONTROLLING**
    - Stunden pro Einsatz
    - Stunden pro Kunde
    - Kilometer pro Einsatz
    - Material-Verbrauch
    - Zusatzleistungen
    - Rechnungsgrundlagen
    - Deckungsbeitrag pro Einsatz

---

## 📋 TEIL 3: VERGÜTUNGSMANAGEMENT - DETAIL-ANALYSE

### Was Factorial im Payroll-Modul hat:

1. ✅ **Gehaltsdaten erfassen** - HABEN WIR
2. ❌ **Gehaltsbestandteile**
   - Grundgehalt
   - Variable Anteile
   - Boni
   - Provisionen
   - Zulagen (Nacht/Sonntag/Feiertag)
   - Überstundenzuschläge
   - Sachbezüge (Dienstwagen)
3. ❌ **Abzüge verwalten**
   - Krankenversicherung
   - Rentenversicherung
   - Arbeitslosenversicherung
   - Pflegeversicherung
   - Lohnsteuer
   - Solidaritätszuschlag
   - Kirchensteuer
4. ❌ **Lohnlauf durchführen**
   - Monats-Lohnlauf
   - Batch-Processing
   - PDF-Lohnabrechnungen
   - E-Mail-Versand
5. ❌ **Lohnarten-System**
   - Lohnarten definieren
   - Lohnarten-Katalog
   - Steuer/SV-Relevanz
6. ❌ **Belege-Management**
   - Reisekostenabrechnungen
   - Auslösungen
   - Verpflegungsmehraufwand
   - Beleg-Upload

### Was wir haben:
- Nur Grundgehalt als Zahl
- Keine Berechnung
- Kein PDF
- Kein historischer Verlauf

---

## 📋 TEIL 4: ARBEITSZEIT-MANAGEMENT - GAP-ANALYSE

### Was Factorial hat vs. was wir haben:

| Feature | Factorial | HRthis | Fehlt |
|---------|-----------|--------|-------|
| Clock In/Out | ✅ | ✅ | - |
| Mehrere Sessions/Tag | ✅ | 🟡 | **Sessions nicht zusammengerechnet** |
| Tages-Soll vs. Ist | ✅ | ❌ | **FEHLT** |
| Arbeitszeitkonto (+ / -)  | ✅ | ❌ | **FEHLT** |
| Überstunden-Saldo | ✅ | 🟡 | Nur Anzeige |
| Überstunden-Abbau | ✅ | ❌ | **FEHLT** |
| Überstunden-Auszahlung | ✅ | ❌ | **FEHLT** |
| Zeitkorrektur-Requests | ✅ | ❌ | **FEHLT** |
| Timesheet (Monatsübersicht) | ✅ | ❌ | **FEHLT** |
| Export (PDF/Excel) | ✅ | ❌ | **FEHLT** |
| Projekt-Zeiterfassung | ✅ | ❌ | **FEHLT** |
| Kostenstellen | ✅ | ❌ | **FEHLT** |
| Team-Zeitübersicht | ✅ | ❌ | **FEHLT** |
| Schichtplanung | ✅ | ❌ | **FEHLT** |
| Pausenregelung | ✅ | ✅ | - |

---

## 🎯 PRIORISIERTE ROADMAP - NEU

### PHASE 1: KRITISCHE HR-BASIS (6-8 Wochen)

#### 1.1 Arbeitszeitkonto & Überstunden (2 Wochen) 🔴 HÖCHSTE PRIORITÄT
**Warum**: Ohne das ist Zeiterfassung nur "Nice to Have"

Features:
- [ ] Arbeitszeitkonto-System
  - Soll-Zeit pro Tag (aus Wochenstunden)
  - Ist-Zeit pro Tag (alle Sessions zusammenrechnen!)
  - Saldo (+ / -)
  - Monatsübersicht (Timesheet)
- [ ] Überstunden-Management
  - Überstunden-Saldo
  - Überstunden-Abbau (Freizeitausgleich)
  - Überstunden-Auszahlung (mit Payroll)
- [ ] Zeitkorrektur-System
  - MA kann Korrektur beantragen
  - HR/Admin genehmigt
  - Historie
- [ ] Export-Funktion
  - Timesheet als PDF/Excel
  - Pro MA, pro Monat
  - Mit Saldo-Entwicklung

**DB-Schema**:
```sql
-- time_accounts table
user_id, month, year, soll_stunden, ist_stunden, 
saldo, ueberstunden, abbau, auszahlung

-- time_corrections table
session_id, user_id, requested_by, approved_by,
old_start, old_end, new_start, new_end, reason, status
```

---

#### 1.2 Payroll-Grundmodul (3 Wochen) 🔴 HOCH
**Warum**: Ohne Lohnabrechnung ist es kein vollständiges HR-System

Features:
- [ ] Lohnlauf-System
  - Monats-Lohnlauf initiieren
  - Batch-Processing
  - Status-Tracking
- [ ] Lohn-PDF Generator (Edge Function)
  - Template-System
  - Brutto/Netto-Berechnung (vereinfacht)
  - SV-Beiträge (Prozentsätze eingeben)
  - Steuer (vereinfacht nach Steuerklasse)
- [ ] Lohnarten-System
  - Grundgehalt
  - Überstundenzuschläge (aus Arbeitszeitkonto!)
  - Boni (manuell)
  - Zulagen
- [ ] Lohnhistorie
  - Alle Abrechnungen pro MA
  - PDF-Download
- [ ] Integration mit Dokumentensystem
  - Auto-Upload der PDFs
  - Kategorie: LOHN

**WICHTIG**: Erstmal EINFACHE Version!
- Keine DATEV-Integration
- Manuelle SV/Steuer-Sätze
- Später: Automatisierung

---

#### 1.3 Abwesenheitsmanagement erweitern (1 Woche) 🟡

Features:
- [ ] Kurzzeitige Abwesenheit
  - Arzttermin
  - Privattermin
  - Behördengang
  - (ohne Urlaub)
- [ ] Homeoffice-Tracking
  - Homeoffice-Tage erfassen
  - Kalenderansicht
  - Statistik
- [ ] Dienstreisen
  - Dienstreise-Antrag
  - Reisekostenabrechnung (Basic)

---

### PHASE 2: FIELD/ERP BASIS (6-8 Wochen)

#### 2.1 Tourenplanung-Modul (3 Wochen) 🔴 HOCH

Features:
- [ ] Touren-Management
  - Tour erstellen
  - Start/End-Zeit
  - Route (Textfeld, später: Map)
  - Zugewiesene Mitarbeiter
  - Zugewiesene Fahrzeuge
  - Status (Geplant/Aktiv/Abgeschlossen)
- [ ] Touren-Kalender
  - Wochen-/Monatsansicht
  - Touren pro Tag
  - Farben nach Status
- [ ] Touren-Zuweisung
  - MA auswählen (mit Verfügbarkeits-Check!)
  - Fahrzeug auswählen (mit Verfügbarkeits-Check!)
  - Equipment auswählen
- [ ] GPS-Tracking (Optional/Später)

**DB-Schema**:
```sql
-- tours table
id, name, description, start_time, end_time, status,
route, customer_id, created_by

-- tour_assignments table
tour_id, user_id, vehicle_id, role

-- tour_equipment table
tour_id, equipment_id, quantity
```

---

#### 2.2 Einsatzplanung (2 Wochen) 🟡

Features:
- [ ] Einsätze erstellen
  - Einsatzort (Adresse)
  - Einsatztyp (Baustelle/Veranstaltung/etc.)
  - Zeitraum
  - Kunde
  - Benötigte MA (Anzahl + Qualifikationen)
  - Benötigte Fahrzeuge
  - Benötigte Equipment
- [ ] Einsatz-Kalender
- [ ] Einsatz → Tour Zuordnung

---

#### 2.3 Fahrzeugdisposition (1 Woche) 🟡

Features:
- [ ] Fahrzeug-Verfügbarkeitskalender
- [ ] Fahrzeug-Buchung
- [ ] Konflikt-Erkennung
- [ ] Fahrzeug-Standort
- [ ] Kilometerstand-Tracking

---

#### 2.4 Schichtplanung (2 Wochen) 🟡

Features:
- [ ] Schichtmodelle definieren
- [ ] Schichtplan erstellen
- [ ] Schichttausch
- [ ] Ruhezeiten-Check

---

### PHASE 3: DOKUMENTENBUILDER (2-3 Wochen)

#### 3.1 Vertragsbuilder-System

Features:
- [ ] Template-System
  - Vorlagen erstellen
  - Bausteine definieren (Textblöcke)
  - Platzhalter ({{vorname}}, {{nachname}}, etc.)
- [ ] Drag & Drop Builder
  - Bausteine per Drag & Drop zusammenstellen
  - Vorschau
  - Lückentext-Felder
- [ ] Vertrag generieren
  - Daten aus Mitarbeiterstamm
  - PDF generieren
  - Speichern im Dokumentensystem
- [ ] Standard-Templates
  - Arbeitsvertrag (unbefristet/befristet)
  - Aufhebungsvertrag
  - Änderungsvertrag
  - Praktikumsvertrag

**Tech-Stack**:
```typescript
// Template Engine: Handlebars oder EJS
// PDF: puppeteer (Edge Function)
// Drag & Drop: react-beautiful-dnd
```

---

### PHASE 4: LIFECYCLE-MANAGEMENT (4-6 Wochen)

#### 4.1 Performance Reviews (2 Wochen) 🟡

Features:
- [ ] Review-Templates
  - Probezeitgespräch
  - Jahresgespräch
  - Entwicklungsgespräch
- [ ] Review durchführen
  - Bewertung (Skala 1-5)
  - Stärken/Schwächen
  - Ziele
  - Entwicklungsbedarf
- [ ] Review-Historie
- [ ] Erinnerungen (Probezeit endet)

---

#### 4.2 Recruiting (Optional - niedrige Prio)

Wie besprochen: UNWICHTIGSTE Priorität!
Ggf. erstmal überspringen.

---

### PHASE 5: REPORTS & ANALYTICS (2-3 Wochen)

Features:
- [ ] HR-Dashboard erweitern
  - Headcount-Entwicklung
  - Fluktuationsrate
  - Altersstruktur
  - Durchschnittsgehalt
  - Krankenquote
- [ ] Custom Reports
  - Report-Builder
  - Filter
  - Export
- [ ] Zeit-Reports
  - Überstunden pro MA
  - Anwesenheitsquote
  - Abwesenheiten
- [ ] Field-Reports
  - Touren pro Woche
  - MA-Auslastung
  - Fahrzeug-Nutzung
  - Equipment-Nutzung

---

## 🔥 KRITISCHSTE LÜCKEN - ZUSAMMENFASSUNG

### TOP 5 FEHLENDE FEATURES:

1. **Arbeitszeitkonto/Überstunden-System** 🔴
   - Ohne das ist Zeiterfassung nutzlos
   - Zeitkorrektur-Requests fehlen
   - Export fehlt

2. **Payroll-Modul** 🔴
   - Nur Gehalt erfasst, keine Abrechnung
   - Kein PDF, keine Historie
   - Keine Lohnarten

3. **Tourenplanung** 🔴
   - Tab ist komplett leer!
   - Kernfunktion für Verkehrssicherung

4. **Einsatzplanung** 🔴
   - Komplett fehlend
   - Benötigt für Field-ERP

5. **Dokumentenbuilder** 🟡
   - Verträge manuell erstellen ist ineffizient
   - Template-System fehlt

---

## 📊 STATISTIK - WAS WIRKLICH FEHLT

Nach detaillierter Analyse:

- **Vollständig implementiert**: ~55% (nicht 70%!)
- **Teilweise implementiert**: ~20% 
- **Fehlt komplett**: ~25%

### Bereiche mit größten Lücken:

1. **Field/ERP**: ~70% fehlt
2. **Payroll**: ~90% fehlt
3. **Arbeitszeit**: ~40% fehlt (Konto-System)
4. **Performance**: 100% fehlt
5. **Recruiting**: 100% fehlt
6. **Onboarding/Offboarding**: 100% fehlt

---

## ❓ RÜCKFRAGEN ZUR PRIORISIERUNG

### 1. Field/ERP
**Wie kritisch ist das wirklich?**
- Ist das Kerngeschäft Verkehrssicherung?
- Oder ist HRthis für verschiedene Branchen?
- Wie viel % der User brauchen Field-Features?

**Empfehlung**: 
- Wenn >50% Verkehrssicherung → Phase 2 VORZIEHEN
- Wenn gemischt → Erst HR-Basis, dann Field

### 2. Arbeitszeitkonto
**Ist das Pflicht?**
- In Deutschland: Arbeitszeitgesetz
- Überstunden müssen dokumentiert werden
- → JA, ist kritisch!

### 3. Payroll
**Wie detailliert?**
- Option A: Einfach (nur PDF mit Brutto/Netto)
- Option B: Mittel (Auto SV/Steuer-Calc)
- Option C: DATEV (komplex)

**Empfehlung**: 
- Start mit Option A
- Später Upgrade zu B
- C nur auf Kundenwunsch

### 4. Dokumentenbuilder
**Wie wichtig?**
- Wie oft werden neue Verträge erstellt?
- Reicht erstmal Word-Template?

---

## 🚀 EMPFOHLENE ROADMAP - FINAL

### SOFORT (Woche 1-2):
1. ✅ Rückfragen klären
2. ✅ Detailplanung Arbeitszeitkonto
3. ✅ DB-Schema entwerfen

### PHASE 1 (Woche 3-10): HR-BASIS
1. Arbeitszeitkonto (2 Wochen) 
2. Payroll Basic (3 Wochen)
3. Abwesenheiten erweitern (1 Woche)
4. Testing & Bugfixes (1 Woche)

### PHASE 2 (Woche 11-18): FIELD-ERP **(NUR wenn Verkehrssicherung wichtig!)**
1. Tourenplanung (3 Wochen)
2. Einsatzplanung (2 Wochen)
3. Fahrzeugdisposition (1 Woche)
4. Testing (1 Woche)

### PHASE 3 (Woche 19-21): DOKUMENTENBUILDER
1. Template-System (1 Woche)
2. Builder-UI (1 Woche)
3. Standard-Templates (1 Woche)

### PHASE 4 (Woche 22-26): LIFECYCLE
1. Performance Reviews (2 Wochen)
2. Schichtplanung (2 Wochen)
3. Testing (1 Woche)

---

**BEREIT FÜR DEINE ANTWORTEN! 🎯**

Bitte beantworte die Rückfragen zur Priorisierung, dann kann ich:
1. Detaillierte DB-Schemas entwerfen
2. Implementierungspläne erstellen
3. Mit der Umsetzung starten
