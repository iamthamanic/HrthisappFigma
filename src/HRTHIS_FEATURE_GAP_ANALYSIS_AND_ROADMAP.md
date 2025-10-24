# 🎯 HRthis - Umfassende Feature Gap-Analyse & Implementierungs-Roadmap

**Datum**: 16. Oktober 2025  
**Basis**: Mind-Map Analyse + Codebase Audit  
**Referenz**: Factorial, BambooHR, Personio, SAP SuccessFactors

---

## 📊 EXECUTIVE SUMMARY

### Status-Übersicht
- ✅ **Vollständig implementiert**: ~70% der Features
- 🟡 **Teilweise implementiert**: ~15% der Features
- ❌ **Nicht implementiert**: ~15% der Features

### Kritische Findings
1. **Payroll/Lohn & Gehalt** - Nur Grunddaten vorhanden, keine Abrechnungsfunktion
2. **Recruiting** - Nur Dokumentenkategorie, kein Bewerbermanagement
3. **Onboarding/Offboarding** - Keine strukturierten Prozesse
4. **Performance Management** - Komplett fehlend
5. **Dokumentenholder** - Unklar, was damit gemeint ist

---

## 🗺️ FEATURE-BY-FEATURE ANALYSE

### 1️⃣ PERSONALAKTE / EMPLOYEE MANAGEMENT
**Status**: ✅ VOLLSTÄNDIG IMPLEMENTIERT (95%)

#### ✅ Implementiert:
- Persönliche Daten (Name, Geburtsdatum, Geschlecht, Telefon)
- Adressdaten (Straße, PLZ, Stadt, Land)
- Notfallkontakte
- Bankdaten (IBAN, BIC, Bank, Kontoinhaber)
- Kleidungsgrößen
- Sprachkenntnisse
- Firmeninformationen (Position, Abteilung, Teams, Standort)
- Vertragsinformationen (Eintrittsdatum, Probezeit, Vertragsstatus, Befristung)
- Arbeitszeiten (Wochenstunden, Urlaubstage, Beschäftigungsart)
- Gehalt (Brutto/Monat - **NUR Basisdaten**)
- Zeitmodelle (Schichtmodell, Gleitzeit, Bereitschaft, Rufbereitschaft)
- Pausenregelung (Automatisch/Manuell)
- Sonderregelungen (Firmenwagen, Fahrtkosten, Urlaub, Sonstiges)
- Profilbild mit Crop-Funktion
- Card-Level Editing System v4.8.0

#### 🟡 Teilweise implementiert:
- **Gehalt/Lohn**: Nur Grundgehalt erfasst, KEINE Abrechnungsfunktion

#### ❌ Fehlt:
- Gehaltsabrechnungs-Generator (PDF-Export)
- Lohnnebenkosten-Berechnung
- Sozialversicherungs-Daten
- Steuerklasse & Freibeträge
- Lohnhistorie & Gehaltsanpassungen
- Bonuszahlungen & variable Vergütung
- Überstundenabrechnung
- Krankenkasse & Versicherungsdaten

#### 💡 Implementierungsvorschlag - PAYROLL MODULE:
```
📁 /screens/admin/PayrollManagementScreen.tsx
│
├─ Tab 1: Gehaltsübersicht
│  ├─ Liste aller Mitarbeiter mit Gehalt
│  ├─ Filterung nach Abteilung/Team
│  └─ Gehaltsstatistiken
│
├─ Tab 2: Abrechnungen erstellen
│  ├─ Monat/Jahr auswählen
│  ├─ Batch-Abrechnung für alle MA
│  ├─ PDF-Generator (ähnlich wie Faktorial)
│  │  ├─ Brutto/Netto Berechnung
│  │  ├─ Sozialversicherung (RV, KV, PV, AV)
│  │  ├─ Lohnsteuer (Klasse, Freibeträge)
│  │  ├─ Überstunden
│  │  └─ Bonuszahlungen
│  └─ Massen-Download als ZIP
│
├─ Tab 3: Lohnhistorie
│  ├─ Pro Mitarbeiter alle Abrechnungen
│  ├─ Jahresübersicht
│  └─ Gehaltsanpassungen tracken
│
└─ Tab 4: Einstellungen
   ├─ Steuerklassen-Matrix
   ├─ Sozialversicherungs-Sätze
   ├─ Firmen-Zuschüsse
   └─ PDF-Template Editor
```

**Integration**:
- Neue DB-Tabelle: `payroll_runs`, `payroll_documents`, `tax_settings`
- PDF-Generator: `jsPDF` oder `puppeteer` via Edge Function
- Integration mit bestehendem Dokumentensystem (Kategorie: LOHN)

**Inspiration**: Factorial's Payroll Module - sehr clean, einfacher PDF-Export

---

### 2️⃣ ZEITERFASSUNG / TIME TRACKING
**Status**: ✅ VOLLSTÄNDIG IMPLEMENTIERT (100%)

#### ✅ Implementiert:
- Clock In/Out System
- Pausenverwaltung (Auto/Manuell)
- Übersicht aller Sessions
- Statistiken (heute, diese Woche, dieser Monat)
- Mobile Responsive
- Zeitmodelle (Schicht, Gleitzeit, Bereitschaft)

**Keine Lücken!** System ist komplett.

---

### 3️⃣ URLAUBSVERWALTUNG / LEAVE MANAGEMENT
**Status**: ✅ VOLLSTÄNDIG IMPLEMENTIERT (100%)

#### ✅ Implementiert:
- Urlaubsanträge stellen
- 2-Level Approval (Teamlead → HR/Admin)
- Urlaubstypen (Urlaub, Krank, Unbezahlter Urlaub, Sonstiges)
- Kalenderansicht
- Team-Kalender
- Urlaubshistorie
- Urlaubstage-Tracking
- Coverage Chain (Vertretungsregelung)
- Automatische Benachrichtigungen

**Keine Lücken!** System ist komplett.

---

### 4️⃣ DOKUMENTENVERWALTUNG
**Status**: ✅ VOLLSTÄNDIG IMPLEMENTIERT (95%)

#### ✅ Implementiert:
- Upload System (Single + Bulk)
- Kategorien: VERTRAG, ZERTIFIKAT, LOHN, AU, PERSONALDOKUMENTE, BEWERBUNGSUNTERLAGEN, SONSTIGES
- Audit Logs (Wer hat wann was hochgeladen/gelöscht)
- Document Viewer
- Suche & Filter
- Virtualisierte Liste (Performance-optimiert)

#### ❌ Fehlt:
- **Dokumentenholder** (unklar was das sein soll - brauche Klärung!)
  - Ist das ein Dokumenten-Template-System?
  - Oder ein Ablagesystem für wiederkehrende Dokumente?
  - Oder ein Archiv-System?

#### ❓ RÜCKFRAGE:
**Was genau ist der "Dokumentenholder" im Bild?**
- Ein Template-Manager für Standard-Dokumente (z.B. Arbeitsvertrag-Vorlage)?
- Ein Archiv-System für alte Dokumente?
- Ein Shared-Documents Bereich (Firmen-Dokumente für alle)?

---

### 5️⃣ RECRUITING / BEWERBERMANAGEMENT
**Status**: ❌ NICHT IMPLEMENTIERT (0%)

#### ✅ Nur Dokumentenkategorie vorhanden:
- BEWERBUNGSUNTERLAGEN kann hochgeladen werden

#### ❌ Fehlt komplett:
- Stellenanzeigen-Verwaltung
- Bewerbermanagement
- Bewerbungsprozess-Tracking
- Interview-Planung
- Kandidaten-Bewertung
- Pipeline-Ansicht (ähnlich Kanban)
- E-Mail-Integration

#### 💡 Implementierungsvorschlag - RECRUITING MODULE:

**Option 1: Einfaches ATS (Applicant Tracking System)**
```
📁 /screens/admin/RecruitingScreen.tsx
│
├─ Tab 1: Stellenanzeigen
│  ├─ Aktive Jobs
│  ├─ Job erstellen/bearbeiten
│  └─ Job archivieren
│
├─ Tab 2: Bewerbungen (Kanban-View)
│  ├─ Pipeline: Neu → Sichtung → Interview → Angebot → Abgelehnt/Angenommen
│  ├─ Drag & Drop zwischen Stages
│  ├─ Bewerbungsdetails
│  └─ Dokumente-Upload (CV, Anschreiben)
│
├─ Tab 3: Interviews
│  ├─ Interview-Kalender
│  ├─ Interview-Notizen
│  └─ Bewertungsmatrix
│
└─ Tab 4: Statistiken
   ├─ Time-to-Hire
   ├─ Conversion Rates
   └─ Source Tracking
```

**Option 2: Integration mit externem ATS**
- Personio ATS API Integration
- Greenhouse API Integration
- Nur Schnittstelle, keine eigene Implementierung

**Empfehlung**: 
- **Jetzt**: Option 1 - Einfaches ATS (ähnlich wie Faktorial)
- **Später**: Integration mit spezialisiertem ATS wenn nötig

**DB-Struktur**:
```sql
-- jobs table
id, title, description, department, location, status, created_at

-- applications table
id, job_id, candidate_name, email, phone, status, stage, source, applied_at

-- interviews table
id, application_id, interviewer_id, scheduled_at, notes, rating

-- application_documents table
id, application_id, document_type (CV, ANSCHREIBEN, ZEUGNISSE), file_path
```

**Inspiration**: Factorial Recruiting - sehr simpel gehalten, perfekt für KMUs

---

### 6️⃣ ONBOARDING
**Status**: ❌ NICHT IMPLEMENTIERT (0%)

#### ✅ Teilweise vorhanden:
- Mitarbeiter anlegen (AddEmployeeScreen)
- Learning System (Videos, Quizzes) - könnte für Onboarding genutzt werden

#### ❌ Fehlt:
- Strukturierter Onboarding-Prozess
- Checklisten (IT, HR, Team)
- Willkommens-E-Mail automatisch
- Onboarding-Timeline
- Buddy-System
- First-Day Tasks

#### 💡 Implementierungsvorschlag - ONBOARDING MODULE:

```
📁 /screens/admin/OnboardingScreen.tsx
│
├─ Tab 1: Onboarding-Templates
│  ├─ Template erstellen (z.B. "Software Developer Onboarding")
│  ├─ Checklisten-Items
│  │  ├─ Tag 1: Zugang einrichten, Arbeitsplatz vorbereiten
│  │  ├─ Woche 1: Team-Meeting, Einführung
│  │  └─ Monat 1: Probezeitgespräch
│  └─ Verantwortliche zuweisen (HR, IT, Teamlead)
│
├─ Tab 2: Aktive Onboardings
│  ├─ Liste aller neuen Mitarbeiter
│  ├─ Fortschritt-Tracking (% abgeschlossen)
│  ├─ Offene Tasks
│  └─ Timeline-View
│
└─ Tab 3: Abgeschlossene Onboardings
   ├─ Archiv
   └─ Statistiken (Durchschnittsdauer, Completion Rate)
```

**Integration**:
- Mit Learning System: Automatisch Onboarding-Kurse zuweisen
- Mit Dokumentensystem: Checkliste für Dokumente (Arbeitsvertrag unterschrieben?)
- Mit Teams: Buddy automatisch zuweisen

**DB-Struktur**:
```sql
-- onboarding_templates table
id, name, description, department, duration_days

-- onboarding_tasks table
id, template_id, title, description, due_days, responsible_role, category

-- onboarding_processes table
id, user_id, template_id, started_at, completed_at, status

-- onboarding_task_completion table
id, process_id, task_id, completed_at, completed_by, notes
```

**Inspiration**: BambooHR Onboarding - sehr strukturiert, klare Checklisten

---

### 7️⃣ OFFBOARDING
**Status**: ❌ NICHT IMPLEMENTIERT (0%)

#### ❌ Komplett fehlend:
- Kündigungsprozess
- Offboarding-Checklisten
- Exit-Interviews
- Zugangsrechte entziehen
- Equipment-Rückgabe
- Arbeitszeugnisse

#### 💡 Implementierungsvorschlag - OFFBOARDING MODULE:

```
📁 /screens/admin/OffboardingScreen.tsx
│
├─ Tab 1: Offboarding-Prozess starten
│  ├─ Mitarbeiter auswählen
│  ├─ Kündigungsdatum
│  ├─ Kündigungsgrund
│  ├─ Letzter Arbeitstag
│  └─ Template wählen (Freiwillig, Betriebsbedingt, etc.)
│
├─ Tab 2: Offboarding-Checkliste
│  ├─ IT: Zugang deaktivieren, Geräte zurücknehmen
│  ├─ HR: Arbeitszeugnis erstellen, Endabrechnung
│  ├─ Team: Wissensdokumentation, Übergabe
│  └─ Fortschritt tracken
│
├─ Tab 3: Exit-Interview
│  ├─ Fragebogen
│  ├─ Feedback sammeln
│  └─ Auswertung
│
└─ Tab 4: Archiv
   ├─ Abgeschlossene Offboardings
   └─ Statistiken (Fluktuationsrate, Gründe)
```

**DB-Struktur**:
```sql
-- offboarding_processes table
id, user_id, initiated_by, termination_date, last_working_day, 
reason, status, exit_interview_completed

-- offboarding_tasks table
id, process_id, task, responsible, completed, completed_at

-- exit_interviews table
id, process_id, feedback, rating, would_return, comments
```

**Inspiration**: Personio Offboarding - sehr systematisch

---

### 8️⃣ PERFORMANCE MANAGEMENT
**Status**: ❌ NICHT IMPLEMENTIERT (0%)

#### ❌ Komplett fehlend:
- Mitarbeitergespräche (Probezeitgespräch, Jahresgespräch)
- Zielvereinbarungen (OKRs, KPIs)
- 360° Feedback
- Performance Reviews
- Entwicklungspläne

#### 💡 Implementierungsvorschlag - PERFORMANCE MODULE:

**Option 1: Vollständiges Performance Management**
```
📁 /screens/admin/PerformanceScreen.tsx
│
├─ Tab 1: Mitarbeitergespräche
│  ├─ Gesprächstypen (Probezeit, Jahresgespräch, Ad-hoc)
│  ├─ Gespräch planen
│  ├─ Gesprächsnotizen
│  └─ Follow-up Tasks
│
├─ Tab 2: Zielvereinbarungen
│  ├─ OKRs/KPIs definieren
│  ├─ Fortschritt tracken
│  └─ Zielerreichung bewerten
│
├─ Tab 3: Feedback
│  ├─ 360° Feedback-Prozess
│  ├─ Peer Reviews
│  └─ Self-Assessment
│
└─ Tab 4: Entwicklung
   ├─ Entwicklungspläne
   ├─ Schulungsbedarf (Integration mit Learning System!)
   └─ Karrierepfade
```

**Option 2: Einfache Version (für Start)**
```
📁 /screens/admin/PerformanceReviewsScreen.tsx
│
├─ Review erstellen
│  ├─ Mitarbeiter auswählen
│  ├─ Review-Typ (Probezeit, Jahresgespräch)
│  ├─ Datum
│  └─ Bewertung (Formular)
│
├─ Review-Historie
│  └─ Alle Reviews pro Mitarbeiter
│
└─ Statistiken
   └─ Durchschnittliche Bewertungen
```

**Empfehlung**: 
- **Jetzt**: Option 2 - Einfach starten
- **Später**: Ausbau zu Option 1

**DB-Struktur** (einfache Version):
```sql
-- performance_reviews table
id, user_id, reviewer_id, review_date, review_type, 
overall_rating, strengths, areas_for_improvement, 
goals_next_period, notes, status

-- review_goals table
id, review_id, goal, target_date, achieved
```

**Inspiration**: Lattice Performance Management (aber viel simpler)

---

### 9️⃣ TEAMS / ORGANIGRAM / DASHBOARD
**Status**: ✅ VOLLSTÄNDIG IMPLEMENTIERT (100%)

#### ✅ Implementiert:
- Team-Verwaltung
- Teamlead-Rollen
- Organigram (Canvas-basiert, Drag & Drop)
- Dashboard mit allen wichtigen Infos
- Ankündigungen-System
- Team-Kalender

**Keine Lücken!**

---

### 🔟 BENEFITS & GAMIFICATION
**Status**: ✅ VOLLSTÄNDIG IMPLEMENTIERT (100%)

#### ✅ Implementiert:
- Benefits-System
- Coin-Shop
- Achievements
- Learning-Avatar
- XP-System

**Keine Lücken!**

---

### 1️⃣1️⃣ FIELD MANAGEMENT
**Status**: ✅ VOLLSTÄNDIG IMPLEMENTIERT (100%)

#### ✅ Implementiert:
- Tourenplanung
- Fahrzeugverwaltung
- Equipment Management
- Sonstige Arbeiten
- Volltext-Suche

**Keine Lücken!**

---

## 🎯 PRIORISIERTE ROADMAP

### PHASE 1: KRITISCHE FEATURES (4-6 Wochen)
**Ziel**: HR-Basis-Funktionen komplettieren

#### 1.1 Payroll-Modul (2 Wochen)
- [ ] DB-Schema für Payroll
- [ ] Gehaltsabrechnungs-Screen
- [ ] PDF-Generator (Edge Function mit Puppeteer)
- [ ] Lohnhistorie
- [ ] Integration mit Dokumentensystem

**Priority**: 🔴 HOCH (Ohne Lohnabrechnung ist kein HR-System komplett)

#### 1.2 Performance Reviews - Basic (1 Woche)
- [ ] DB-Schema
- [ ] Review-Screen (einfach)
- [ ] Review-Historie
- [ ] Integration mit Mitarbeiterakte

**Priority**: 🟡 MITTEL

### PHASE 2: LIFECYCLE-MANAGEMENT (4-6 Wochen)

#### 2.1 Recruiting-Modul (2-3 Wochen)
- [ ] Stellenanzeigen-Verwaltung
- [ ] Bewerbungen (Kanban-View)
- [ ] Interview-Planung
- [ ] Kandidaten-Bewertung
- [ ] Integration mit Dokumentensystem

**Priority**: 🟠 MITTEL-HOCH

#### 2.2 Onboarding-Modul (1-2 Wochen)
- [ ] Onboarding-Templates
- [ ] Checklisten-System
- [ ] Fortschritt-Tracking
- [ ] Integration mit Learning System

**Priority**: 🟡 MITTEL

#### 2.3 Offboarding-Modul (1 Woche)
- [ ] Offboarding-Prozess
- [ ] Checklisten
- [ ] Exit-Interview (einfach)

**Priority**: 🟡 MITTEL

### PHASE 3: ERWEITERUNGEN (2-4 Wochen)

#### 3.1 Dokumentenholder-Klärung (nach Rückfrage)
- [ ] Feature definieren
- [ ] Implementieren

#### 3.2 Performance Management - Advanced
- [ ] OKRs/KPIs
- [ ] 360° Feedback
- [ ] Entwicklungspläne

**Priority**: 🔵 NIEDRIG

---

## 🤔 KRITISCHE RÜCKFRAGEN

### 1. Dokumentenholder
**Was ist der "Dokumentenholder" genau?**

Mögliche Interpretationen:
- **A)** Template-Manager für Standard-Dokumente (Arbeitsvertrag-Vorlage, Kündigungsvorlage, etc.)
- **B)** Shared Documents - Firmen-Dokumente für alle zugänglich (Handbücher, Policies, etc.)
- **C)** Archiv-System für alte Versionen
- **D)** Etwas komplett anderes?

### 2. Payroll-Umfang
**Wie detailliert soll die Lohnabrechnung sein?**

- **Option A (Einfach)**: Nur Brutto/Netto mit manueller SV-Eingabe
- **Option B (Mittel)**: Automatische Berechnung nach deutschem Steuerrecht
- **Option C (Komplex)**: DATEV-Integration, elektronische Meldungen ans Finanzamt

**Empfehlung**: Start mit Option A, später Upgrade zu B

### 3. Recruiting-Umfang
**Internes ATS oder Integration?**

- **Option A**: Eigenes einfaches ATS (wie Factorial)
- **Option B**: Integration mit externem ATS (Personio, Greenhouse)

**Empfehlung**: Option A - Eigenes ATS

### 4. Performance Management-Umfang
**Wie komplex soll Performance Management werden?**

- **Option A (Einfach)**: Nur Mitarbeitergespräche dokumentieren
- **Option B (Mittel)**: + Zielvereinbarungen
- **Option C (Komplex)**: + 360° Feedback, OKRs, Entwicklungspläne

**Empfehlung**: Start mit Option A

---

## 📋 TECHNISCHE IMPLEMENTIERUNGS-DETAILS

### Payroll PDF-Generator
```typescript
// Edge Function: /supabase/functions/server/payroll.ts
import puppeteer from 'puppeteer';

async function generatePayslip(userId: string, month: string, year: string) {
  // 1. Daten aus DB laden
  const userData = await getUserPayrollData(userId);
  
  // 2. HTML-Template rendern
  const html = renderPayslipTemplate(userData, month, year);
  
  // 3. PDF generieren
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({ format: 'A4' });
  await browser.close();
  
  // 4. In Supabase Storage hochladen
  const fileName = `payslip_${userId}_${year}_${month}.pdf`;
  await supabase.storage
    .from('documents')
    .upload(`payroll/${fileName}`, pdf);
    
  return fileName;
}
```

### Recruiting Kanban-Board
```typescript
// Komponente: /components/admin/HRTHIS_RecruitingKanban.tsx
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const STAGES = [
  'NEW',           // Neu eingegangen
  'SCREENING',     // In Sichtung
  'INTERVIEW',     // Interview geplant
  'OFFER',         // Angebot gemacht
  'HIRED',         // Eingestellt
  'REJECTED'       // Abgelehnt
];

// Drag & Drop zwischen Stages
// Ähnlich wie Trello/Notion
```

### Onboarding-Checklisten
```typescript
// Template-System wie in BambooHR
interface OnboardingTemplate {
  id: string;
  name: string;
  tasks: OnboardingTask[];
}

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  dueInDays: number;        // z.B. 1 = Am ersten Tag
  responsible: 'HR' | 'IT' | 'TEAMLEAD' | 'MANAGER';
  category: 'ADMIN' | 'IT' | 'TEAM' | 'TRAINING';
}

// Automatisch Task-Emails versenden wenn fällig
```

---

## 🎨 UI/UX-INSPIRATION

### Payroll
- **Factorial**: Sehr clean, einfacher Monats-Selector
- **Personio**: Übersichtliche Lohnhistorie-Tabelle

### Recruiting
- **Lever**: Exzellentes Kanban-Board
- **Greenhouse**: Klare Interview-Planung

### Onboarding
- **BambooHR**: Beste Checklisten-UX
- **Workday**: Gute Timeline-Darstellung

### Performance
- **Lattice**: Sehr moderne OKR-Ansicht
- **Culture Amp**: Gutes Feedback-System

---

## 📈 NÄCHSTE SCHRITTE

### SOFORT (diese Woche):
1. **Rückfragen klären** (Dokumentenholder, Payroll-Umfang, etc.)
2. **Roadmap finalisieren** basierend auf Antworten
3. **DB-Schema entwerfen** für Phase 1 Features

### DIESE WOCHE:
1. Payroll-Schema erstellen
2. PDF-Template designen
3. Edge Function für PDF-Generierung vorbereiten

### NÄCHSTE WOCHE:
1. Payroll-Screen implementieren
2. Integration mit Dokumentensystem
3. Testing

---

## 💬 EMPFEHLUNGEN

### Priorität 1: Payroll
**Warum**: Jedes HR-System MUSS Lohnabrechnungen können. Das ist ein Deal-Breaker.

**Quickstart-Ansatz**:
1. Einfache Version: Nur PDF generieren aus vorhandenen Gehaltsdaten
2. Später erweitern: Automatische Berechnungen

### Priorität 2: Recruiting
**Warum**: Employee Lifecycle von Anfang bis Ende. Aktuell fehlt der Anfang.

**Quickstart-Ansatz**:
1. Einfaches Kanban-Board (wie Trello)
2. Bewerbungen tracken
3. Später erweitern: Advanced Features

### Priorität 3: Onboarding/Offboarding
**Warum**: Komplettiert den Employee Lifecycle

**Quickstart-Ansatz**:
1. Template-basiertes Checklisten-System
2. Sehr einfach halten
3. Später erweitern: Automatisierungen

---

## 🔍 FEHLENDE INFORMATIONEN (BITTE KLÄREN)

1. ❓ Was ist der "Dokumentenholder"?
2. ❓ Wie detailliert soll Payroll sein?
3. ❓ Eigenes Recruiting oder Integration?
4. ❓ Performance Management - Umfang?
5. ❓ Gibt es weitere Features im Bild die ich übersehen habe?

---

**Bereit für Detailplanung sobald Rückfragen geklärt sind!** 🚀
