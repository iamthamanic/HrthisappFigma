# Browo Koordinator - Komplette Codebase Analyse
## HR-App mit Node-basierter Workflow-Logik

**Version:** 4.13.2+  
**Datum:** 7. Dezember 2024  
**Dokumentiert für:** Geschäftsführung & Stakeholder

---

## 📋 Inhaltsverzeichnis

1. [Systemarchitektur](#systemarchitektur)
2. [User Screens](#user-screens)
3. [Meine Daten (Settings) - Tab-System](#meine-daten-settings---tab-system)
4. [Admin Screens](#admin-screens)
5. [Edge Functions Übersicht](#edge-functions-übersicht)
6. [Services & API-Integration](#services--api-integration)
7. [Datenbank-Struktur](#datenbank-struktur)
8. [Deployment & Infrastruktur](#deployment--infrastruktur)

---

## 🏗️ Systemarchitektur

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS v4.0 + shadcn/ui Components
- **Backend:** Supabase Edge Functions (Deno Runtime)
- **Datenbank:** PostgreSQL (Supabase)
- **Storage:** Supabase Storage (für Dokumente, Bilder, PDFs)
- **Real-time:** Supabase Realtime Subscriptions
- **State Management:** Zustand Stores
- **Routing:** React Router v6

### Architektur-Pattern
```
Frontend (React/TS)
    ↓
Services Layer (TypeScript)
    ↓
Edge Functions (Deno/Hono)
    ↓
Supabase Database (PostgreSQL)
```

### Berechtigungssystem
- **Rollen:** `user`, `teamleader`, `admin`, `super_admin`
- **Permissions:** Datenbank-basiertes GRANT/REVOKE System
- **Tabellen:**
  - `role_permissions` - Standard-Berechtigungen pro Rolle
  - `user_permissions` - Individuelle Overrides pro User

---

## 👤 USER SCREENS

### 1. Dashboard Screen
**Route:** `/dashboard`  
**Komponente:** `DashboardScreen.tsx`  
**Für:** Alle User (user, teamleader, admin, super_admin)

#### Was der User sieht:
- **Welcome Header**
  - Profilbild (oder Initialen)
  - Vorname, Nachname
  - Personalnummer
  - Begrüßungstext basierend auf Tageszeit

- **Quick Stats Grid (4 Kacheln)**
  - 🏖️ **Urlaubstage:** Verbleibend / Gesamt / Verbraucht
  - 🪙 **Coins:** Gesammelte Browo-Coins (Gamification)
  - 📊 **XP Progress:** Level-Fortschritt mit Progress Bar
  - ✅ **Tasks:** Erledigte / Gesamt Tasks

- **Organigram Card**
  - Mini-Vorschau des Org-Charts
  - Eigene Position hervorgehoben
  - Expandable/Collapsible
  - Button "Vollbild öffnen" → `/organigram`

- **Dashboard Announcement Card**
  - Live-Ankündigung (wenn aktiv)
  - Titel, Message, Veröffentlichungsdatum
  - Author Info
  - CTA Button (wenn konfiguriert)
  - PDF-Anhang Download (wenn vorhanden)

#### Was der User machen kann:
- Überblick über wichtige Kennzahlen
- Schneller Zugriff auf Organigram
- Aktuelle Ankündigungen lesen
- PDF-Anhänge herunterladen

#### Edge Functions:
- **BrowoKoordinator-Server** (`/make-server-f659121d/`)
  - `/health` - Health Check
  - `/storage/status` - Storage Bucket Status
  - Keine direkte API für Dashboard Stats (nutzt direkte Supabase Queries)

#### Services:
- `AnnouncementService.getLiveAnnouncement()` - Lädt aktive Ankündigung
- Direkte Supabase Queries für Stats (kein separater Service)

---

### 2. Kalender Screen
**Route:** `/calendar`  
**Komponente:** `CalendarScreen.tsx`  
**Für:** Alle User

#### Was der User sieht:
- **Interaktiver Kalender**
  - Monatsansicht (react-big-calendar)
  - Farbkodierte Events:
    - 🏖️ Urlaub (grün)
    - 🏥 Krank (rot)
    - 📅 Termine (blau)
    - 🎂 Geburtstage (orange)

- **Event-Typen:**
  - Eigene Urlaubsanträge
  - Eigene Krankheitstage
  - Team-Abwesenheiten (wenn Teamleader)
  - Firmenweite Termine
  - Geburtstage von Kollegen

#### Was der User machen kann:
- Urlaubsanträge planen und einreichen
- Abwesenheiten des Teams sehen (Teamleader)
- Geburtstage von Kollegen sehen
- Termine verwalten

#### Edge Functions:
- Keine dedizierte Edge Function
- Nutzt direkte Supabase Queries

#### Services:
- `LeaveService` - Urlaubsanträge
- Direkte Supabase Queries für Events

---

### 3. Lernen (Learning) Screen
**Route:** `/learning`  
**Komponente:** `LearningScreen.tsx`  
**Für:** Alle User

#### Was der User sieht:
- **Header mit Avatar & Stats**
  - Profilbild (falls vorhanden)
  - Level, XP, Coins
  - Fortschrittsbalken zum nächsten Level

- **Tabs:**
  - 📚 **Bibliothek:** Alle verfügbaren Lerneinheiten
  - 📖 **Mein Lernen:** Zugewiesene Einheiten
  - ✅ **Abgeschlossen:** Fertige Lerneinheiten
  - 🛒 **Shop:** Coins gegen Belohnungen eintauschen
  - 📊 **Wiki:** Wissensdatenbank (FAQ, How-Tos)

- **Lerneinheiten:**
  - **Videos:** Mit Completion-Tracking
  - **Quizze/Tests:** Multiple Choice, Lernfortschritt
  - **Lerneinheiten:** Strukturierte Kurse
  - Tags, Kategorien, Schwierigkeitsgrad
  - Fortschrittsanzeige

- **Coins & Gamification:**
  - Coins für abgeschlossene Einheiten
  - XP für Fortschritt
  - Level-System

#### Was der User machen kann:
- Videos anschauen (`/learning/video/:videoId`)
- Tests absolvieren (`/learning/quiz/:quizId`)
- Lernfortschritt tracken
- Coins im Shop einlösen (`/learning/shop`)
- Wiki durchsuchen

#### Edge Functions:
- **BrowoKoordinator-Lernen**
  - `/videos` - Video-Management
  - `/tests` - Test-Management
  - `/units` - Lerneinheiten
  - `/submissions` - Test-Einreichungen
  - `/wiki` - Wiki-Artikel

#### Services:
- `LearningService`
  - `getVideos()` - Videos laden
  - `getTests()` - Tests laden
  - `submitTestAttempt()` - Test einreichen
  - `getMyProgress()` - Fortschritt laden
- `WikiService`
  - `getArticles()` - Wiki-Artikel laden
  - `searchArticles()` - Suche

---

### 4. Benefits Screen
**Route:** `/benefits`  
**Komponente:** `BenefitsScreen.tsx`  
**Für:** Alle User

#### Was der User sieht:
- **Benefits Grid:**
  - Alle verfügbaren Benefits (Cards)
  - Name, Beschreibung, Icon
  - Kategorie (z.B. Gesundheit, Mobilität)
  - "Details anzeigen" Button

- **Benefit Detail Screen** (`/benefits/:benefitId`)
  - Ausführliche Beschreibung
  - Voraussetzungen
  - So beantragen Sie
  - Status (falls schon beantragt)
  - Beantragen-Button

#### Was der User machen kann:
- Verfügbare Benefits durchsuchen
- Details zu einzelnen Benefits ansehen
- Benefits beantragen (wenn berechtigt)

#### Edge Functions:
- **BrowoKoordinator-Benefits**
  - `/benefits` - Alle Benefits laden
  - `/benefits/:id` - Einzelnes Benefit
  - `/user-benefits` - Meine Benefits
  - `/request-benefit` - Benefit beantragen

#### Services:
- `BenefitsService`
  - `getBenefits()` - Alle Benefits
  - `getBenefit(id)` - Einzelnes Benefit
  - `requestBenefit(benefitId)` - Beantragen

---

### 5. Arbeit (Field) Screen
**Route:** `/arbeit`  
**Komponente:** `FieldScreen.tsx`  
**Für:** Alle User

#### Was der User sieht:
- **Tabs:**
  - 🏢 **Büro:** Office-Mitarbeiter
  - 🚜 **Außendienst:** Field-Mitarbeiter
  - 🌐 **Extern:** Externe Mitarbeiter

- **Für jeden Tab:**
  - Liste der Mitarbeiter (gefiltert)
  - Name, Position, Abteilung
  - Profilbild (oder Initialen)
  - Status (Online/Offline - falls implementiert)

#### Was der User machen kann:
- Kollegen nach Arbeitsort filtern
- Kontaktdaten sehen
- Zu Profilen navigieren

#### Edge Functions:
- **BrowoKoordinator-Field**
  - `/field-users` - Field-Mitarbeiter
  - `/office-users` - Office-Mitarbeiter
  - `/external-users` - Externe

#### Services:
- `UserService`
  - `getFieldUsers()` - Field-Mitarbeiter
  - `getOfficeUsers()` - Office-Mitarbeiter

---

### 6. Tasks Screen
**Route:** `/tasks`  
**Komponente:** `TasksScreen.tsx`  
**Für:** Alle User

#### Was der User sieht:
- **Task Liste:**
  - Titel, Beschreibung
  - Fälligkeitsdatum
  - Status (Offen, In Bearbeitung, Erledigt)
  - Priorität
  - Zugewiesen von

- **Filter:**
  - Nach Status
  - Nach Fälligkeit
  - Nach Priorität

#### Was der User machen kann:
- Eigene Tasks sehen
- Tasks als erledigt markieren
- Task-Details ansehen

#### Edge Functions:
- **BrowoKoordinator-Tasks**
  - `/tasks` - Task-Management
  - `/tasks/:id/complete` - Task abschließen

#### Services:
- `TaskService`
  - `getMyTasks()` - Eigene Tasks
  - `completeTask(id)` - Task abschließen

---

### 7. Avatar Screen
**Route:** `/avatar`  
**Komponente:** `AvatarScreen.tsx`  
**Für:** Alle User

#### Was der User sieht:
- **Avatar Customization:**
  - Körper (Skin Tone, Body Type)
  - Haare (Stil, Farbe)
  - Kleidung
  - Accessoires
  - Hintergrund

- **Inventory:**
  - Freischaltbare Items
  - Gekaufte Items (mit Coins)
  - Level-Belohnungen

#### Was der User machen kann:
- Avatar personalisieren
- Items mit Coins kaufen
- Avatar-Vorschau in Echtzeit

#### Edge Functions:
- Keine - nutzt localStorage für Prototyping

#### Services:
- Lokales State Management (Zustand Store)

---

### 8. Achievements Screen
**Route:** `/achievements`  
**Komponente:** `AchievementsScreen.tsx`  
**Für:** Alle User

#### Was der User sieht:
- **Achievement Cards:**
  - Name, Beschreibung
  - Icon/Badge
  - Fortschritt (z.B. 5/10 Videos)
  - Status (Locked/Unlocked)
  - Belohnung (XP, Coins)

- **Kategorien:**
  - Lernen
  - Teamwork
  - Produktivität
  - Spezielle Events

#### Was der User machen kann:
- Fortschritt zu Achievements tracken
- Badges sammeln
- Belohnungen freischalten

#### Edge Functions:
- **BrowoKoordinator-Server**
  - Achievements sind in KV-Store gespeichert

#### Services:
- `CoinAchievementsService`
  - `getAchievements()` - Alle Achievements
  - `checkAchievements(userId)` - Fortschritt prüfen

---

### 9. Organigram Screen
**Route:** `/organigram`  
**Komponente:** `OrganigramViewScreen.tsx`  
**Für:** Alle User

#### Was der User sieht:
- **Interaktives Organigramm:**
  - Hierarchische Baumstruktur
  - Zoom/Pan Controls
  - Node-Informationen:
    - Name
    - Position
    - Abteilung
    - Profilbild

- **Features:**
  - Vollbild-Modus
  - Suchfunktion
  - Exportieren (PNG, PDF)

#### Was der User machen kann:
- Organisationsstruktur ansehen
- Nach Mitarbeitern suchen
- Zoom/Pan durch Org-Chart

#### Edge Functions:
- **BrowoKoordinator-Organigram**
  - `/nodes` - Org-Nodes laden
  - `/connections` - Verbindungen laden

#### Services:
- `OrganigramService`
  - `getNodes()` - Nodes laden
  - `getConnections()` - Verbindungen

---

### 10. Chat Screen
**Route:** `/chat`  
**Komponente:** `ChatScreen.tsx`  
**Für:** Alle User

#### Was der User sieht:
- **Tabs:**
  - 💬 **DMs:** Direkte Nachrichten
  - 👥 **Channels:** Team-Channels
  - 🔔 **Announcements:** Firmenweite Ankündigungen

- **Chat Interface:**
  - Nachrichtenliste
  - Eingabefeld
  - User-Status (Online/Offline)
  - Typing Indicators
  - Ungelesene Nachrichten (Badge)

#### Was der User machen kann:
- Mit Kollegen chatten
- Team-Channels beitreten
- Nachrichten senden/empfangen
- Dateien teilen

#### Edge Functions:
- **BrowoKoordinator-Chat**
  - `/messages` - Nachrichten
  - `/channels` - Channels
  - `/send` - Nachricht senden

#### Services:
- `ChatService`
  - `getMessages(channelId)` - Nachrichten laden
  - `sendMessage()` - Nachricht senden
  - `subscribeToChannel()` - Real-time Updates

---

## ⚙️ MEINE DATEN (Settings) - Tab-System

**Route:** `/settings`  
**Komponente:** `SettingsScreen.tsx` → `MeineDaten.tsx`  
**Für:** Alle User

### Tab-Navigation (Dynamisches System)

Das Tab-System ist **dynamisch** und **URL-basiert**. Jeder Tab-Name wird automatisch zu einer Route:
- `?tab=meinepersonalakte` → "Meine Personalakte"
- `?tab=logs` → "Logs"
- `?tab=berechtigungen` → "Berechtigungen"

---

### Tab 1: Meine Personalakte
**URL:** `/settings?tab=meinepersonalakte`  
**Komponente:** `PersonalakteTabContent.tsx`

#### Was der User sieht:
- **Persönliche Informationen:**
  - Vorname, Nachname
  - E-Mail, Telefon
  - Adresse
  - Geburtsdatum
  - Personalnummer

- **Vertragsdaten:**
  - Eintrittsdatum
  - Vertragsart
  - Position
  - Abteilung
  - Vorgesetzter

- **Urlaubskonto:**
  - Jahresurlaubsanspruch
  - Verbleibende Tage
  - Verbrauchte Tage

- **Profilbild Upload:**
  - Drag & Drop oder File Picker
  - Max 5MB
  - PNG, JPG, JPEG

#### Was der User machen kann:
- Persönliche Daten ansehen (Read-Only meist)
- Profilbild hochladen/ändern
- Urlaubskonto einsehen

#### Edge Functions:
- **BrowoKoordinator-Server**
  - `/profile-picture/upload` - Profilbild hochladen
  - `/profile-picture/:userId` - Profilbild löschen

#### Services:
- `UserService`
  - `updateProfile()` - Profil aktualisieren
  - `uploadProfilePicture()` - Profilbild hochladen

---

### Tab 2: Logs
**URL:** `/settings?tab=logs`  
**Komponente:** `LogsTabContent.tsx`

#### Was der User sieht:
- **Audit Log Tabelle:**
  - Timestamp
  - Aktion (z.B. "Dokument hochgeladen", "Profil geändert")
  - Details
  - IP-Adresse
  - User Agent

- **Filter:**
  - Nach Datum
  - Nach Aktion
  - Suche

#### Was der User machen kann:
- Eigene Aktivitäten nachvollziehen
- Sicherheitsrelevante Aktionen einsehen
- Log-Historie filtern

#### Edge Functions:
- **BrowoKoordinator-Server**
  - Audit Logs werden automatisch erstellt

#### Services:
- `AuditLogService`
  - `getMyLogs()` - Eigene Logs
  - `createLog()` - Log erstellen (automatisch)

---

### Tab 3: Berechtigungen
**URL:** `/settings?tab=berechtigungen`  
**Komponente:** `BerechtigungenTabContent.tsx`

#### Was der User sieht:
- **Berechtigungs-Liste:**
  - Permission Name
  - Beschreibung
  - Status (Granted/Revoked)
  - Quelle (Rolle oder individuell)

- **Kategorien:**
  - Dashboard
  - Mitarbeiterverwaltung
  - Dokumente
  - Reports
  - Admin-Bereich
  - System-Einstellungen

#### Was der User machen kann:
- Eigene Berechtigungen einsehen (Read-Only)
- Verstehen, was er darf und was nicht

#### Edge Functions:
- Keine - nutzt direkte Supabase Queries

#### Services:
- Direkte Supabase Queries zu `user_permissions` und `role_permissions`

---

### Tab 4: Anträge
**URL:** `/settings?tab=anträge`  
**Komponente:** `AnträgeTabContent.tsx`

#### Was der User sieht:
- **Antragstypen (Cards):**
  - 🏖️ **Urlaubsantrag**
  - 🏥 **Krankmeldung**
  - 🏠 **Homeoffice-Antrag**
  - 💰 **Spesenabrechnung**
  - 📄 **Sonstiges**

- **Antrags-Historie:**
  - Typ
  - Datum
  - Status (Pending, Approved, Rejected)
  - Bearbeiter
  - Begründung (bei Ablehnung)

#### Was der User machen kann:
- Neue Anträge erstellen:
  - Urlaubsantrag (Datum, Grund)
  - Krankmeldung (Datum, Beschreibung)
  - Homeoffice (Datum, Begründung)
- Antragsstatus verfolgen
- Abgelehnte Anträge einsehen

#### Edge Functions:
- **BrowoKoordinator-Antragmanager**
  - `/requests` - Anträge laden
  - `/requests/create` - Neuen Antrag erstellen
  - `/requests/:id/approve` - Genehmigen (Admin)
  - `/requests/:id/reject` - Ablehnen (Admin)

#### Services:
- `RequestService` (in Antragmanager Edge Function)
  - `createLeaveRequest()` - Urlaubsantrag
  - `createSickLeaveRequest()` - Krankmeldung
  - `getMyRequests()` - Meine Anträge

---

### Tab 5: Dokumente
**URL:** `/settings?tab=dokumente`  
**Komponente:** `DocumentsTabContent.tsx`

#### Was der User sieht:
- **Dokument-Kategorien (Tabs):**
  - 📄 **Verträge:** Arbeitsvertrag, Zusatzvereinbarungen
  - 🎓 **Zertifikate:** Schulungen, Qualifikationen
  - 💰 **Lohn:** Gehaltsabrechnungen, Bescheinigungen
  - 📋 **Sonstiges:** Andere Dokumente

- **Für jedes Dokument:**
  - Dateiname
  - Kategorie
  - Größe
  - Upload-Datum
  - Hochgeladen von
  - Download-Button
  - Löschen-Button (falls berechtigt)

- **Upload-Dialog:**
  - Drag & Drop oder File Picker
  - Kategorie auswählen
  - Max 20MB (PDFs)
  - Fortschrittsbalken

#### Was der User machen kann:
- Dokumente hochladen (falls berechtigt)
- Dokumente herunterladen
- Dokumente löschen (eigene)
- Nach Kategorie filtern
- Suche nach Dateiname

#### Edge Functions:
- **BrowoKoordinator-Dokumente**
  - `/documents` - Dokumente laden
  - `/documents/upload` - Upload
  - `/documents/:id` - Download
  - `/documents/:id/delete` - Löschen

#### Services:
- `DocumentService`
  - `getMyDocuments()` - Meine Dokumente
  - `uploadDocument()` - Hochladen
  - `downloadDocument()` - Herunterladen
  - `deleteDocument()` - Löschen
- `DocumentAuditService`
  - `logDocumentAction()` - Audit Log erstellen

---

### Tab 6: Mitarbeitergespräche
**URL:** `/settings?tab=mitarbeitergespräche`  
**Komponente:** `PerformanceReviewsTabContent.tsx`

#### Was der User sieht:
- **Gesprächsliste:**
  - Titel (z.B. "Halbjahresgespräch 2024")
  - Status (Sent, In Progress, Submitted, Completed)
  - Fälligkeitsdatum
  - Erstellt von (Manager/HR)
  - "Ausfüllen" Button

- **Performance Review Screen** (`/employee-performance-review/:reviewId`)
  - Fragebogen mit verschiedenen Frage-Typen:
    - Text (kurz/lang)
    - Rating-Skala (1-5, 1-10)
    - Ja/Nein
    - Checkboxen
    - Datum
    - Unterschrift (Canvas)
  - Fortschrittsanzeige
  - Auto-Save
  - Submit-Button

#### Was der User machen kann:
- Zugewiesene Gespräche sehen
- Fragebogen ausfüllen
- Zwischen Fragen navigieren
- Entwurf speichern
- Gesprächsbogen einreichen
- Digital unterschreiben

#### Edge Functions:
- **BrowoKoordinator-Mitarbeitergespraeche**
  - `/make-server-f659121d/performance-reviews/my-reviews` - Meine Gespräche
  - `/make-server-f659121d/performance-reviews/:id` - Einzelnes Gespräch
  - `/make-server-f659121d/performance-reviews/:id/answer` - Antwort speichern
  - `/make-server-f659121d/performance-reviews/:id/submit` - Einreichen
  - `/make-server-f659121d/performance-reviews/:id/signature` - Unterschrift

#### Services:
- `PerformanceReviewService`
  - `getMyReviews()` - Meine Gespräche
  - `getReview(id)` - Einzelnes Gespräch
  - `saveAnswer(reviewId, questionId, answer)` - Antwort speichern
  - `submitReview(reviewId)` - Einreichen
  - `saveSignature(reviewId, signatureData, role)` - Unterschreiben

---

## 🔐 ADMIN SCREENS

### 1. Team und Mitarbeiterverwaltung
**Route:** `/admin/team-und-mitarbeiterverwaltung`  
**Komponente:** `TeamUndMitarbeiterverwaltung.tsx`  
**Für:** Admin, Super Admin

#### Was der Admin sieht:
- **Header Stats:**
  - Gesamtzahl Mitarbeiter
  - Aktive Mitarbeiter
  - Neue Mitarbeiter (letzter Monat)
  - Abwesend heute

- **Mitarbeiter-Tabelle:**
  - Profilbild
  - Name
  - E-Mail
  - Position
  - Abteilung
  - Status (Aktiv/Inaktiv)
  - Eintrittsdatum
  - Actions (Bearbeiten, Details, Löschen)

- **Filter & Suche:**
  - Volltext-Suche (Name, E-Mail, Position)
  - Filter nach Abteilung
  - Filter nach Status

- **Bulk Actions:**
  - Mehrere Mitarbeiter auswählen
  - Massenaktionen (z.B. Abteilung ändern)

#### Was der Admin machen kann:
- **Mitarbeiter hinzufügen:**
  - `/admin/team-und-mitarbeiterverwaltung/add-employee` - Schnelles Formular
  - `/admin/team-und-mitarbeiterverwaltung/add-employee-wizard` - Wizard mit Onboarding

- **Mitarbeiter bearbeiten:**
  - `/admin/team-und-mitarbeiterverwaltung/user/:userId` - Detail-Screen
  - Alle Felder editierbar
  - Profilbild ändern
  - Rolle ändern
  - Abteilung zuweisen

- **Mitarbeiter löschen/deaktivieren**

- **Export:**
  - Excel/CSV Export
  - PDF-Liste

#### Edge Functions:
- **BrowoKoordinator-Server**
  - `/users/create` - User erstellen (inkl. Auth)
  - `/users` - User-Liste
  - `/users/:id` - User-Details

#### Services:
- `TeamService`
  - `getTeamMembers()` - Team laden
  - `createUser()` - User erstellen
  - `updateUser()` - User aktualisieren
- `UserService`
  - `getAllUsers()` - Alle User
  - `deleteUser()` - User löschen

---

### 2. Team Member Details Screen
**Route:** `/admin/team-und-mitarbeiterverwaltung/user/:userId`  
**Komponente:** `TeamMemberDetailsScreen.tsx`  
**Für:** Admin, Super Admin, Teamleader (eigenes Team)

#### Was der Admin sieht:
- **Tabs:**
  - 📋 **Übersicht:** Stammdaten
  - 📄 **Personalakte:** Vertragsdaten
  - 🏖️ **Urlaub:** Urlaubskonto & Anträge
  - 📚 **Lernen:** Lernfortschritt
  - 📋 **Dokumente:** Mitarbeiter-Dokumente
  - 🎁 **Benefits:** Zugewiesene Benefits
  - 📝 **Logs:** Aktivitäten
  - 💬 **Mitarbeitergespräche:** Performance Reviews

#### Tab: Übersicht
- Profilbild (editierbar)
- Persönliche Daten (editierbar)
- Kontaktdaten
- Notizen (Admin-intern)
- Quick Actions (E-Mail senden, Termin erstellen)

#### Tab: Personalakte
- Vertragsdaten
- Position, Abteilung
- Gehalt (falls berechtigt)
- Arbeitszeit
- Vorgesetzter

#### Tab: Urlaub
- Jahresanspruch
- Verbleibende Tage
- Urlaubshistorie (Tabelle)
- Antragsstatus
- Genehmigen/Ablehnen (Admin)

#### Tab: Lernen
- Zugewiesene Lerneinheiten
- Fortschritt (%)
- Abgeschlossene Einheiten
- Test-Ergebnisse
- "Lerneinheit zuweisen" Button

#### Tab: Dokumente
- Alle Dokumente des Mitarbeiters
- Upload für Admin
- Download/Löschen

#### Tab: Benefits
- Zugewiesene Benefits
- Beantragte Benefits
- "Benefit zuweisen" Button

#### Tab: Logs
- Alle Aktivitäten des Mitarbeiters
- Filter nach Aktion
- Export

#### Tab: Mitarbeitergespräche
- Alle Gespräche des Mitarbeiters
- Status, Datum
- "Neues Gespräch erstellen" Button
- Auswertung ansehen

#### Was der Admin machen kann:
- Alle Mitarbeiterdaten bearbeiten
- Dokumente verwalten
- Urlaub genehmigen/ablehnen
- Lerneinheiten zuweisen
- Benefits zuweisen
- Performance Reviews erstellen/einsehen
- Aktivitäten nachverfolgen

#### Edge Functions:
- Siehe jeweilige Tabs (Dokumente, Urlaub, Lernen, Benefits, Performance Reviews)

---

### 3. Add Employee Screen (Simple)
**Route:** `/admin/team-und-mitarbeiterverwaltung/add-employee`  
**Komponente:** `AddEmployeeScreen.tsx`  
**Für:** Admin, Super Admin

#### Was der Admin sieht:
- **Formular:**
  - Vorname*, Nachname*
  - E-Mail*, Passwort*
  - Position, Abteilung
  - Eintrittsdatum
  - Rolle (User/Teamleader/Admin)
  - Urlaubsanspruch

#### Was der Admin machen kann:
- Schnell einen Mitarbeiter anlegen
- Auth-User wird automatisch erstellt
- Trigger: `handle_new_user()` → User-Profil, Avatar, Welcome Notification

#### Edge Functions:
- **BrowoKoordinator-Server**
  - `/users/create` - User + Auth erstellen

---

### 4. Add Employee Wizard Screen
**Route:** `/admin/team-und-mitarbeiterverwaltung/add-employee-wizard`  
**Komponente:** `AddEmployeeWizardScreen.tsx`  
**Für:** Admin, Super Admin

#### Was der Admin sieht:
- **Multi-Step Wizard:**
  1. **Persönliche Daten:** Name, Geburtsdatum, Kontakt
  2. **Vertragsdaten:** Position, Abteilung, Eintrittsdatum, Gehalt
  3. **Zugangsdaten:** E-Mail, Passwort, Rolle
  4. **Onboarding-Auswahl:** Workflows, Lerneinheiten, Benefits
  5. **Zusammenfassung:** Review & Submit

#### Was der Admin machen kann:
- Vollständiges Onboarding in einem Flow
- Workflows direkt zuweisen
- Lernpfad festlegen
- Benefits vorab zuweisen
- Equipment/Fahrzeuge zuordnen

#### Edge Functions:
- **BrowoKoordinator-Server**
  - `/users/create` - User erstellen
- **BrowoKoordinator-Workflows**
  - `/trigger` - Onboarding-Workflows starten

---

### 5. Organigram Unified Screen
**Route:** `/admin/organigram-unified`  
**Komponente:** `OrganigramUnifiedScreen.tsx`  
**Für:** Admin, Super Admin

#### Was der Admin sieht:
- **Tabs:**
  - 🎨 **Canvas:** Interaktiver Org-Chart Editor
  - ⚙️ **Einstellungen:** Firmen-Einstellungen

#### Tab: Canvas
- **Drag & Drop Org-Chart:**
  - Nodes erstellen/bearbeiten/löschen
  - Verbindungen ziehen
  - Hierarchie festlegen
  - Abteilungen definieren
  - Team-Zuordnungen

- **Toolbar:**
  - Zoom/Pan
  - Auto-Layout
  - Export (PNG, PDF, JSON)
  - Speichern

#### Tab: Einstellungen
- **Firmen-Informationen:**
  - Firmenname*
  - Adresse
  - Telefon, E-Mail
  - Logo-Upload (Max 5MB)

- **Org-Chart Settings:**
  - Layout-Typ (Hierarchisch, Horizontal)
  - Node-Farben
  - Abstände

#### Was der Admin machen kann:
- Org-Chart visuell bearbeiten
- Firmen-Logo hochladen/ändern
- Einstellungen speichern

#### Edge Functions:
- **BrowoKoordinator-Organigram**
  - `/nodes` - Nodes CRUD
  - `/connections` - Connections CRUD
  - `/settings` - Settings laden/speichern
- **BrowoKoordinator-Server**
  - `/logo/upload` - Logo hochladen
  - `/logo/:organizationId` - Logo löschen

#### Services:
- `OrganigramService`
  - `createNode()`, `updateNode()`, `deleteNode()`
  - `createConnection()`, `deleteConnection()`
  - `saveSettings()`

---

### 6. Field Management Screen
**Route:** `/admin/field-management`  
**Komponente:** `FieldManagementScreen.tsx`  
**Für:** Admin, Super Admin

#### Was der Admin sieht:
- **Tabs:**
  - 🏢 **Büro-Mitarbeiter**
  - 🚜 **Außendienst-Mitarbeiter**
  - 🌐 **Externe Mitarbeiter**

- **Für jeden Tab:**
  - Mitarbeiter-Liste (Cards)
  - Zuordnung bearbeiten
  - "Mitarbeiter hinzufügen" Button

#### Was der Admin machen kann:
- Mitarbeiter zu Field/Office/Extern zuordnen
- Batch-Zuordnung (mehrere auf einmal)
- Filter & Suche

#### Edge Functions:
- **BrowoKoordinator-Field**
  - `/assign-field` - Zu Field zuordnen
  - `/assign-office` - Zu Office zuordnen
  - `/assign-external` - Als extern markieren

#### Services:
- `UserService`
  - `assignToField()`, `assignToOffice()`, `assignToExternal()`

---

### 7. Vehicle Detail Screen
**Route:** `/admin/vehicle/:vehicleId`  
**Komponente:** `VehicleDetailScreen.tsx`  
**Für:** Admin, Super Admin

#### Was der Admin sieht:
- **Tabs:**
  - 🚗 **Fahrzeugdaten:** Stammdaten
  - 👤 **Fahrer:** Zugeordnete Fahrer
  - 🔧 **Wartungen:** Wartungshistorie
  - 🛠️ **Equipment:** Zugeordnetes Equipment
  - 💥 **Schäden:** Schadensmeldungen
  - 📄 **Dokumente:** Fahrzeugpapiere

#### Tab: Fahrzeugdaten
- Kennzeichen, Marke, Modell
- Baujahr, Farbe
- VIN, Kilometerstand
- Versicherung, TÜV-Datum
- Bilder

#### Tab: Fahrer
- Liste aller Fahrer (aktuell + historisch)
- "Fahrer zuweisen" Button
- "Fahrer entfernen" Button

#### Tab: Wartungen
- Wartungshistorie (Tabelle)
- Nächste Wartung
- "Wartung hinzufügen" Button
- Kosten

#### Tab: Equipment
- Zugeordnetes Equipment (Anhänger, Werkzeug, etc.)
- Name, Seriennummer, Status
- "Equipment hinzufügen" Button

#### Tab: Schäden
- Schadensmeldungen
- Datum, Beschreibung, Fotos
- Status (Offen, Reparatur, Erledigt)
- "Schaden melden" Button

#### Tab: Dokumente
- Fahrzeugschein, Versicherung, TÜV
- Upload/Download

#### Was der Admin machen kann:
- Fahrzeugdaten verwalten
- Fahrer zuweisen/entfernen
- Wartungen planen
- Equipment zuordnen
- Schäden dokumentieren
- Dokumente hochladen

#### Edge Functions:
- **BrowoKoordinator-Fahrzeuge**
  - `/vehicles` - Fahrzeug CRUD
  - `/vehicles/:id/drivers` - Fahrer zuweisen
  - `/vehicles/:id/maintenance` - Wartungen
  - `/vehicles/:id/equipment` - Equipment
  - `/vehicles/:id/damages` - Schäden

#### Services:
- `VehicleService`
  - `getVehicle()`, `updateVehicle()`
  - `assignDriver()`, `removeDriver()`
  - `addMaintenance()`, `addDamage()`

---

### 8. Equipment Management Screen
**Route:** `/admin/equipment-management`  
**Komponente:** `EquipmentManagementScreen.tsx`  
**Für:** Admin, Super Admin

#### Was der Admin sieht:
- **Stats Cards:**
  - Gesamt-Equipment
  - Aktiv
  - In Wartung
  - Defekt

- **Equipment-Tabelle:**
  - Name, Beschreibung
  - Seriennummer
  - Zugeordnet zu (Fahrzeug)
  - Status (Aktiv, Wartung, Defekt)
  - Nächste Wartung
  - Actions

- **Filter:**
  - Nach Status
  - Nach Fahrzeug
  - Suche (Name, Seriennummer)

#### Was der Admin machen kann:
- Equipment hinzufügen (Dialog)
- Equipment bearbeiten
- Status ändern
- Wartung planen
- Zu Fahrzeug zuordnen
- Löschen
- Click auf Equipment → Zum Fahrzeug navigieren

#### Edge Functions:
- Aktuell localStorage (Prototyping)
- Geplant: **BrowoKoordinator-Equipment**

#### Services:
- Lokales State Management (geplant: EquipmentService)

---

### 9. IT Equipment Management Screen
**Route:** `/admin/it-equipment-management`  
**Komponente:** `ITEquipmentManagementScreen.tsx`  
**Für:** Admin, Super Admin

#### Was der Admin sieht:
- **Kategorien:**
  - 💻 Laptops
  - 🖥️ Desktops
  - 📱 Smartphones
  - 🖨️ Drucker
  - 🖱️ Zubehör

- **Equipment-Liste:**
  - Gerätetyp, Modell
  - Seriennummer, Asset-Tag
  - Zugeordnet an (Mitarbeiter)
  - Status (Verfügbar, Zugewiesen, Defekt)
  - Garantie bis

#### Was der Admin machen kann:
- IT-Equipment hinzufügen
- Mitarbeitern zuweisen
- Rücknahme erfassen
- Wartung/Reparatur dokumentieren
- Inventar tracken

#### Edge Functions:
- Aktuell localStorage (Prototyping)
- Geplant: **BrowoKoordinator-ITEquipment**

---

### 10. Avatar Management Screen
**Route:** `/admin/avatar-management`  
**Komponente:** `AvatarSystemAdminScreen.tsx`  
**Für:** Admin, Super Admin

#### Was der Admin sieht:
- **Tabs:**
  - 🎨 **Items:** Avatar-Items verwalten
  - 📊 **Levels:** Level-System konfigurieren
  - 🏆 **Achievements:** Achievement-System

#### Tab: Items
- Item-Liste (Haare, Kleidung, etc.)
- "Item hinzufügen" Button
- Kategorie, Preis (Coins), Level-Requirement
- Bild-Upload

#### Tab: Levels
- Level-Tabelle
- XP-Requirements pro Level
- Belohnungen (Coins, Items)

#### Tab: Achievements
- Achievement-Liste
- Bedingungen konfigurieren
- Belohnungen festlegen

#### Was der Admin machen kann:
- Avatar-Items erstellen/bearbeiten
- Level-System anpassen
- Achievements konfigurieren
- Gamification-Ökonomie verwalten

#### Edge Functions:
- Aktuell localStorage
- Geplant: **BrowoKoordinator-Avatar**

---

### 11. Benefits Management Screen
**Route:** `/admin/benefits-management`  
**Komponente:** `BenefitsManagementScreen.tsx`  
**Für:** Admin, Super Admin

#### Was der Admin sieht:
- **Tabs:**
  - 🎁 **Benefits:** Benefit-Verwaltung
  - 🏆 **Achievements:** Coin-Achievements

#### Tab: Benefits
- Benefit-Liste (Cards)
- "Benefit hinzufügen" Dialog
- Name, Beschreibung, Kategorie
- Voraussetzungen
- Aktivieren/Deaktivieren

#### Tab: Achievements
- Achievement-Liste
- Coin-Belohnungen
- Aktivieren/Deaktivieren

#### Was der Admin machen kann:
- Benefits erstellen/bearbeiten/löschen
- Kategorien verwalten
- Coin-Achievements konfigurieren
- Anfragen genehmigen/ablehnen

#### Edge Functions:
- **BrowoKoordinator-Benefits**
  - `/admin/benefits` - CRUD
  - `/admin/requests` - Anfragen verwalten
  - `/admin/assign` - Benefit zuweisen

---

### 12. Dashboard Announcements Screen
**Route:** `/admin/dashboard-announcements`  
**Komponente:** `DashboardAnnouncementsScreen.tsx`  
**Für:** Admin, Super Admin

#### Was der Admin sieht:
- **Ankündigungs-Liste:**
  - Titel, Message
  - Status (Active/Inactive)
  - Veröffentlichungsdatum
  - Author
  - Actions (Bearbeiten, Löschen, Aktivieren/Deaktivieren)

- **Create/Edit Dialog:**
  - Titel*, Message*
  - CTA Button (Text, Link)
  - PDF-Anhang Upload (Max 20MB)
  - Active Toggle

#### Was der Admin machen kann:
- Ankündigung erstellen
- Ankündigung bearbeiten
- Ankündigung aktivieren/deaktivieren (nur eine aktiv)
- PDF-Anhang hochladen
- Ankündigung löschen

#### Edge Functions:
- **BrowoKoordinator-Server**
  - KV-Store für Announcements
  - `/announcements` - CRUD
  - `/announcements/active` - Aktive Ankündigung

#### Services:
- `AnnouncementService`
  - `getAnnouncements()`, `createAnnouncement()`, `updateAnnouncement()`
  - `setActive()`, `deleteAnnouncement()`

---

### 13. Learning Management Screen
**Route:** `/admin/learning-management`  
**Komponente:** `LearningManagementScreen.tsx`  
**Für:** Admin, Super Admin

#### Was der Admin sieht:
- **Tabs:**
  - 📊 **Übersicht:** Statistiken
  - 🎥 **Videos:** Video-Verwaltung
  - 📝 **Tests:** Test-Verwaltung
  - 📚 **Lerneinheiten:** Unit-Verwaltung
  - 🎨 **Avatar:** Avatar-System (lazy loaded)
  - 📖 **Wiki:** Wiki-Artikel

#### Tab: Übersicht
- Statistik-Cards (Gesamt Videos, Tests, Einheiten)
- Aktivität-Timeline
- Fortschritts-Charts

#### Tab: Videos
- Video-Liste
- "Video hinzufügen" Button
- Titel, Beschreibung, URL
- Kategorie, Tags, Schwierigkeit
- XP/Coin-Belohnung
- Aktiv/Inaktiv

#### Tab: Tests
- Test-Liste
- "Test erstellen" Button → `/admin/lernen/test-builder/:testId`
- Test-Builder (Drag & Drop Fragen)
- Frage-Typen: Multiple Choice, Single Choice, True/False
- Punkte, Zeit-Limit
- Bestehens-Quote

#### Tab: Lerneinheiten
- Unit-Liste
- Units kombinieren Videos & Tests
- Lernpfade definieren
- Prerequisites

#### Tab: Avatar
- Lazy-loaded `AvatarSystemAdminScreen`
- Items, Levels, Achievements

#### Tab: Wiki
- Wiki-Artikel-Liste
- "Artikel hinzufügen" Button
- WYSIWYG Editor (Markdown)
- Kategorien, Tags
- Versionierung

#### Was der Admin machen kann:
- Videos hinzufügen/bearbeiten/löschen
- Tests mit Test-Builder erstellen
- Lerneinheiten strukturieren
- Wiki-Artikel schreiben
- Avatar-System verwalten
- Statistiken einsehen

#### Edge Functions:
- **BrowoKoordinator-Lernen**
  - `/admin/videos` - Video CRUD
  - `/admin/tests` - Test CRUD
  - `/admin/units` - Unit CRUD
  - `/admin/wiki` - Wiki CRUD

---

### 14. Test Builder Screen
**Route:** `/admin/lernen/test-builder/:testId`  
**Komponente:** `TestBuilderScreen.tsx`  
**Für:** Admin, Super Admin

#### Was der Admin sieht:
- **Drag & Drop Interface:**
  - Frage-Palette (links):
    - Multiple Choice
    - Single Choice
    - True/False
    - Text-Eingabe (geplant)

  - Canvas (Mitte):
    - Fragen per Drag & Drop hinzufügen
    - Reihenfolge ändern
    - Inline-Editing

  - Frage-Editor (rechts):
    - Frage-Text
    - Antwort-Optionen (editierbar)
    - Richtige Antwort markieren
    - Punkte
    - Erklärung (optional)

- **Test-Settings:**
  - Titel, Beschreibung
  - Zeit-Limit (optional)
  - Bestehens-Quote (z.B. 80%)
  - Shuffle-Optionen
  - XP/Coin-Belohnung

#### Was der Admin machen kann:
- Fragen per Drag & Drop erstellen
- Frage-Reihenfolge ändern
- Antworten konfigurieren
- Punkte verteilen
- Test speichern
- Vorschau

#### Edge Functions:
- **BrowoKoordinator-Lernen**
  - `/admin/tests/:id` - Test laden/speichern
  - `/admin/tests/:id/questions` - Fragen CRUD

---

### 15. Automation Management Screen
**Route:** `/admin/automationenverwaltung`  
**Komponente:** `AutomationManagementScreen.tsx`  
**Für:** Super Admin

#### Was der Admin sieht:
- **API-Keys Verwaltung:**
  - Liste aller API-Keys
  - Service-Name (z.B. "n8n", "Slack", "Email")
  - Key (maskiert)
  - Erstellt am
  - Actions (Bearbeiten, Löschen)

- **Hinweis:**
  - Diese Keys werden als Environment Variables gespeichert
  - Für externe Integrationen (n8n, Slack, etc.)

#### Was der Admin machen kann:
- API-Keys hinzufügen
- Keys rotieren
- Keys löschen
- Sicherer Zugriff auf Secrets

#### Edge Functions:
- **BrowoKoordinator-Automation**
  - `/api-keys` - Key-Verwaltung
  - Environment Variables werden in Supabase Secrets gespeichert

#### Services:
- `AutomationService`
  - `getAPIKeys()`, `createAPIKey()`, `deleteAPIKey()`

---

### 16. System Health Screen
**Route:** `/admin/system-health`  
**Komponente:** `SystemHealthScreen.tsx`  
**Für:** Super Admin

#### Was der Admin sieht:
- **Edge Function Monitoring:**
  - Liste aller Edge Functions
  - Status (Online/Offline)
  - Letzter Ping
  - Response Time
  - Error Rate
  - Deployment Info

- **Health Indicators:**
  - 🟢 Grün: Alles OK
  - 🟡 Gelb: Langsam
  - 🔴 Rot: Offline/Error

- **Actions:**
  - "Alle prüfen" Button
  - "Logs anzeigen" (pro Function)

#### Was der Admin machen kann:
- Edge Functions überwachen
- Health-Checks durchführen
- Probleme identifizieren
- Deployment-Status prüfen

#### Edge Functions:
- Alle Edge Functions haben einen `/health` Endpoint

---

### 17. Workflows Screen
**Route:** `/admin/workflows`  
**Komponente:** `WorkflowsScreen.tsx`  
**Für:** Admin, Super Admin

#### Was der Admin sieht:
- **Workflow-Liste:**
  - Name, Beschreibung
  - Trigger (z.B. "EMPLOYEE_CREATED")
  - Status (Active/Inactive)
  - Letzte Ausführung
  - Erfolgsrate
  - Actions (Bearbeiten, Löschen, Aktivieren)

- **"Workflow erstellen" Button**

#### Was der Admin machen kann:
- Neue Workflows erstellen
- Workflows bearbeiten (`/admin/workflows/builder/:workflowId`)
- Workflows aktivieren/deaktivieren
- Ausführungshistorie ansehen

#### Edge Functions:
- **BrowoKoordinator-Workflows**
  - `/workflows` - CRUD
  - `/workflows/:id/execute` - Manuell ausführen
  - `/trigger` - Automatisch triggern

---

### 18. Workflow Detail Screen (Builder)
**Route:** `/admin/workflows/builder/:workflowId`  
**Komponente:** `WorkflowDetailScreen.tsx`  
**Für:** Admin, Super Admin

#### Was der Admin sieht:
- **Node-Based Workflow Builder:**
  - Drag & Drop Canvas (ReactFlow)
  - Node-Palette (links):
    - **Trigger Nodes:** Employee Created, Task Completed, etc.
    - **Action Nodes:**
      - Send Email
      - Create Task
      - Assign Training
      - Assign Benefit
      - Create Notification
      - HTTP Request (Webhook)
      - Delay/Wait
      - Conditional (If/Else)
    - **Integration Nodes:**
      - Slack
      - n8n Webhook
      - Custom API Call

  - Connection Lines
  - Minimap, Zoom Controls

- **Node-Editor (rechts):**
  - Node-spezifische Settings
  - Input/Output Konfiguration
  - Mapping von Variablen

- **Workflow-Settings:**
  - Name, Beschreibung
  - Trigger-Type
  - Active/Inactive
  - Error Handling
  - Retry Policy

#### Was der Admin machen kann:
- Visuell Workflows bauen
- Nodes verbinden
- Bedingungen festlegen
- Workflows testen
- Speichern & Aktivieren

#### Edge Functions:
- **BrowoKoordinator-Workflows**
  - `/workflows/:id` - Workflow laden/speichern
  - `/workflows/:id/nodes` - Nodes CRUD
  - `/workflows/:id/execute` - Testen

---

### 19. Email Templates Screen
**Route:** `/admin/email-templates`  
**Komponente:** `EmailTemplatesScreen.tsx`  
**Für:** Admin, Super Admin

#### Was der Admin sieht:
- **Template-Liste:**
  - Name (z.B. "Welcome Email", "Password Reset")
  - Betreff
  - Template-Typ (Transactional, Marketing)
  - Variablen ({{firstName}}, {{link}})
  - Letzte Änderung

- **Template-Editor:**
  - WYSIWYG oder HTML-Editor
  - Variablen-Picker
  - Vorschau
  - Test-Email senden

#### Was der Admin machen kann:
- Email-Templates erstellen
- Templates bearbeiten
- Variablen verwenden ({{firstName}}, etc.)
- Vorschau ansehen
- Test-Email verschicken

#### Edge Functions:
- **BrowoKoordinator-EmailTemplates**
  - `/templates` - CRUD
  - `/templates/:id/send-test` - Test-Email

#### Services:
- `EmailTemplateService`
  - `getTemplates()`, `updateTemplate()`
  - `sendTestEmail()`

---

### 20. Performance Review Management Screen
**Route:** `/admin/performance-reviews`  
**Komponente:** `PerformanceReviewManagementScreen.tsx`  
**Für:** Admin, Super Admin, Teamleader

#### Was der Admin sieht:
- **Tabs:**
  - 📝 **Templates:** Fragebogen-Templates
  - 📊 **Gespräche:** Alle Gespräche
  - 📈 **Auswertung:** Statistiken

#### Tab: Templates
- Template-Liste (Cards)
- "Template erstellen" Button
- Titel, Beschreibung
- Anzahl Fragen
- Actions (Bearbeiten, Löschen, Duplizieren)

#### Tab: Gespräche
- Gesprächs-Liste (Tabelle)
- Filter nach:
  - Status (Sent, In Progress, Submitted, Completed)
  - Mitarbeiter
  - Manager
  - Datum
- Actions:
  - Gespräch ansehen
  - Als abgeschlossen markieren
  - PDF exportieren

#### Tab: Auswertung
- Statistiken:
  - Anzahl durchgeführter Gespräche
  - Durchschnittliche Bewertungen
  - Trends
- Charts & Graphs

#### Was der Admin machen kann:
- **Templates erstellen:**
  - `/admin/performance-reviews/template-builder/:templateId`
  - Drag & Drop Frage-Builder (ähnlich Test-Builder)

- **Gespräch versenden:**
  - Template auswählen
  - Mitarbeiter auswählen
  - Manager zuweisen
  - Fälligkeitsdatum
  - → Erstellt Snapshot des Templates
  - → Task & Notification für Mitarbeiter

- **Gespräche auswerten:**
  - Alle Antworten einsehen
  - Manager-Kommentare hinzufügen
  - Als abgeschlossen markieren
  - PDF exportieren

#### Edge Functions:
- **BrowoKoordinator-Mitarbeitergespraeche**
  - `/make-server-f659121d/performance-reviews/templates` - Templates CRUD
  - `/make-server-f659121d/performance-reviews/send` - Gespräch versenden
  - `/make-server-f659121d/performance-reviews/team-reviews` - Alle Gespräche
  - `/make-server-f659121d/performance-reviews/:id/complete` - Abschließen
  - `/make-server-f659121d/performance-reviews/:id/export-pdf` - PDF Export

#### Services:
- `PerformanceReviewService`
  - `getTemplates()`, `createTemplate()`, `updateTemplate()`, `deleteTemplate()`
  - `sendReview()` - Gespräch versenden
  - `getTeamReviews()` - Alle Gespräche (Admin/Manager)
  - `completeReview()` - Abschließen
  - `exportPDF()` - PDF Export

---

### 21. Performance Review Template Builder Screen
**Route:** `/admin/performance-reviews/template-builder/:templateId`  
**Komponente:** `PerformanceReviewTemplateBuilderScreen.tsx`  
**Für:** Admin, Super Admin

#### Was der Admin sieht:
- **Drag & Drop Frage-Builder:**
  - Frage-Palette (links):
    - 📝 Text (kurz)
    - 📄 Text (lang)
    - ⭐ Rating-Skala (1-5, 1-10)
    - ✅ Ja/Nein
    - ☑️ Checkboxen
    - 📅 Datumseingabe
    - ✍️ Unterschrift

  - Canvas (Mitte):
    - Fragen per Drag & Drop hinzufügen
    - Reihenfolge ändern (Drag)
    - Inline-Editing

  - Frage-Editor (rechts):
    - Frage-Text*
    - Beschreibung (optional)
    - Pflichtfeld (Toggle)
    - Type-spezifische Settings:
      - Rating: Min/Max, Labels
      - Checkboxen: Optionen

- **Template-Settings:**
  - Titel*, Beschreibung
  - Preview

#### Was der Admin machen kann:
- Fragen per Drag & Drop erstellen
- Verschiedene Frage-Typen kombinieren
- Reihenfolge ändern
- Template speichern
- Vorschau ansehen

#### Edge Functions:
- **BrowoKoordinator-Mitarbeitergespraeche**
  - `/make-server-f659121d/performance-reviews/templates/:id` - Template laden/speichern

---

### 22. Environment Variables Screen (Geplant)
**Route:** `/admin/environment-variables`  
**Komponente:** `EnvironmentVariablesScreen.tsx`  
**Für:** Super Admin

#### Was der Admin sieht:
- **Hinweis:** Dieses Feature ist noch nicht vollständig implementiert
- Liste von Environment Variables
- Add/Edit/Delete

---

## 🔌 EDGE FUNCTIONS ÜBERSICHT

Alle Edge Functions beginnen mit **`BrowoKoordinator-`** und werden manuell über das Supabase Dashboard deployed.

### 1. BrowoKoordinator-Server
**Pfad:** `/supabase/functions/server/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/make-server-f659121d/`

**Endpoints:**
- `/health` - Health Check
- `/storage/status` - Storage Bucket Status
- `/logo/upload` - Firmen-Logo hochladen
- `/logo/:organizationId` - Logo löschen
- `/profile-picture/upload` - Profilbild hochladen
- `/profile-picture/:userId` - Profilbild löschen
- `/time-account/:userId/:month/:year` - Zeitkonto abrufen
- `/users/create` - User + Auth erstellen
- `/documents/upload` - Dokument hochladen
- `/documents` - Dokumente löschen (DELETE)

**Funktionen:**
- Zentrale Server-Logik (BFF Pattern)
- Storage-Management (Buckets: Logos, Profilbilder, Dokumente, Announcements)
- User-Management (inkl. Auth)
- Workflow-Triggering (ruft BrowoKoordinator-Workflows auf)
- KV-Store Integration (Key-Value Datenbank)

---

### 2. BrowoKoordinator-Mitarbeitergespraeche
**Pfad:** `/supabase/functions/BrowoKoordinator-Mitarbeitergespraeche/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Mitarbeitergespraeche/make-server-f659121d/performance-reviews/`

**Endpoints:**

**Templates:**
- `GET /templates` - Alle Templates
- `GET /templates/:id` - Einzelnes Template
- `POST /templates` - Template erstellen (Admin)
- `PUT /templates/:id` - Template aktualisieren (Admin)
- `DELETE /templates/:id` - Template löschen (Admin)

**Reviews:**
- `POST /send` - Gespräch versenden (Admin/Manager)
- `GET /my-reviews` - Meine Gespräche (Employee)
- `GET /team-reviews` - Team-Gespräche (Manager/Admin)
- `GET /:id` - Einzelnes Gespräch mit Antworten
- `PUT /:id/answer` - Antwort speichern (Employee)
- `PUT /:id/manager-comment` - Manager-Kommentar (Manager)
- `PUT /:id/submit` - Gespräch einreichen (Employee)
- `PUT /:id/complete` - Gespräch abschließen (Manager/Admin)
- `POST /:id/signature` - Unterschrift speichern
- `POST /:id/export-pdf` - PDF exportieren

**Funktionen:**
- Template-Verwaltung (CRUD)
- Gespräche versenden (mit Template-Snapshot)
- Antworten speichern (Employee + Manager)
- Unterschriften (Canvas → Base64)
- PDF-Export
- Notifications & Tasks erstellen
- Permissions-Checks

---

### 3. BrowoKoordinator-Workflows
**Pfad:** `/supabase/functions/BrowoKoordinator-Workflows/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Workflows/`

**Endpoints:**
- `POST /trigger` - Workflow triggern (Event-basiert)
- `GET /workflows` - Alle Workflows
- `POST /workflows` - Workflow erstellen
- `PUT /workflows/:id` - Workflow aktualisieren
- `DELETE /workflows/:id` - Workflow löschen
- `POST /workflows/:id/execute` - Workflow manuell ausführen

**Funktionen:**
- Event-basierte Workflow-Ausführung
- Trigger-Types:
  - `EMPLOYEE_CREATED`, `EMPLOYEE_UPDATED`, `EMPLOYEE_DELETED`
  - `ONBOARDING_START`, `OFFBOARDING_START`
  - `BENEFIT_ASSIGNED`, `BENEFIT_REMOVED`
  - `TASK_CREATED`, `TASK_COMPLETED`
  - `TRAINING_ASSIGNED`, `TRAINING_COMPLETED`
  - `DOCUMENT_UPLOADED`, `DOCUMENT_SIGNED`
  - `EQUIPMENT_ASSIGNED`, `EQUIPMENT_RETURNED`
  - `VEHICLE_ASSIGNED`, `VEHICLE_RETURNED`
  - `CONTRACT_SIGNED`, `CONTRACT_UPDATED`
- Node-Ausführung (Send Email, Create Task, etc.)
- Error Handling & Retry

---

### 4. BrowoKoordinator-Lernen
**Pfad:** `/supabase/functions/BrowoKoordinator-Lernen/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Lernen/`

**Endpoints:**
- `/videos` - Video CRUD
- `/tests` - Test CRUD
- `/units` - Lerneinheit CRUD
- `/submissions` - Test-Einreichungen
- `/wiki` - Wiki-Artikel CRUD
- `/progress/:userId` - Lernfortschritt

**Funktionen:**
- Video-Management
- Test-Management (inkl. Auswertung)
- Lerneinheiten-Verwaltung
- Test-Submissions & Grading
- Wiki-Artikel
- Fortschritts-Tracking
- XP/Coin-Vergabe

---

### 5. BrowoKoordinator-Benefits
**Pfad:** `/supabase/functions/BrowoKoordinator-Benefits/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Benefits/`

**Endpoints:**
- `/benefits` - Alle Benefits
- `/benefits/:id` - Einzelnes Benefit
- `/user-benefits` - Meine Benefits
- `/request-benefit` - Benefit beantragen
- `/admin/benefits` - CRUD (Admin)
- `/admin/requests` - Anfragen verwalten
- `/admin/assign` - Benefit zuweisen

**Funktionen:**
- Benefit-Verwaltung
- Benefit-Anfragen
- Genehmigung/Ablehnung
- Zuweisung an Mitarbeiter

---

### 6. BrowoKoordinator-Fahrzeuge
**Pfad:** `/supabase/functions/BrowoKoordinator-Fahrzeuge/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/`

**Endpoints:**
- `/vehicles` - Fahrzeug CRUD
- `/vehicles/:id/drivers` - Fahrer zuweisen/entfernen
- `/vehicles/:id/maintenance` - Wartungen
- `/vehicles/:id/equipment` - Equipment
- `/vehicles/:id/damages` - Schäden

**Funktionen:**
- Fahrzeugverwaltung
- Fahrer-Zuweisung
- Wartungsplanung
- Equipment-Tracking
- Schadensmanagement

---

### 7. BrowoKoordinator-Dokumente
**Pfad:** `/supabase/functions/BrowoKoordinator-Dokumente/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Dokumente/`

**Endpoints:**
- `/documents` - Dokument CRUD
- `/documents/upload` - Upload
- `/documents/:id` - Download
- `/documents/:id/delete` - Löschen
- `/documents/category/:category` - Nach Kategorie filtern

**Funktionen:**
- Dokumenten-Management
- Upload zu Supabase Storage
- Kategorisierung (Vertrag, Zertifikat, Lohn, Sonstiges)
- Audit-Logging (wer hat was wann gemacht)
- Signed URLs für private Buckets

---

### 8. BrowoKoordinator-Organigram
**Pfad:** `/supabase/functions/BrowoKoordinator-Organigram/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Organigram/`

**Endpoints:**
- `/nodes` - Node CRUD
- `/connections` - Connection CRUD
- `/settings` - Org-Chart Settings

**Funktionen:**
- Org-Chart-Verwaltung
- Hierarchie-Management
- Node-Positionierung
- Settings (Layout, Farben)

---

### 9. BrowoKoordinator-Field
**Pfad:** `/supabase/functions/BrowoKoordinator-Field/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Field/`

**Endpoints:**
- `/field-users` - Field-Mitarbeiter
- `/office-users` - Office-Mitarbeiter
- `/external-users` - Externe
- `/assign-field` - Zu Field zuordnen
- `/assign-office` - Zu Office zuordnen
- `/assign-external` - Als extern markieren

**Funktionen:**
- Arbeitsort-Zuordnung
- Filter-Logik
- Batch-Zuordnung

---

### 10. BrowoKoordinator-Chat
**Pfad:** `/supabase/functions/BrowoKoordinator-Chat/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Chat/`

**Endpoints:**
- `/messages` - Nachrichten laden
- `/channels` - Channels laden
- `/send` - Nachricht senden
- `/mark-read` - Als gelesen markieren

**Funktionen:**
- Chat-Nachrichten
- Channel-Management
- Real-time Updates (Supabase Realtime)
- Unread-Counter

---

### 11. BrowoKoordinator-Tasks
**Pfad:** `/supabase/functions/BrowoKoordinator-Tasks/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Tasks/`

**Endpoints:**
- `/tasks` - Task CRUD
- `/tasks/:id/complete` - Task abschließen
- `/tasks/:id/assign` - Task zuweisen

**Funktionen:**
- Task-Management
- Zuweisung
- Status-Updates
- Notifications

---

### 12. BrowoKoordinator-Antragmanager
**Pfad:** `/supabase/functions/BrowoKoordinator-Antragmanager/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Antragmanager/`

**Endpoints:**
- `/requests` - Anträge laden
- `/requests/create` - Antrag erstellen
- `/requests/:id/approve` - Genehmigen (Admin)
- `/requests/:id/reject` - Ablehnen (Admin)

**Funktionen:**
- Urlaubsanträge
- Krankmeldungen
- Homeoffice-Anträge
- Spesenabrechnung
- Genehmigungsprozess

---

### 13. BrowoKoordinator-Kalender
**Pfad:** `/supabase/functions/BrowoKoordinator-Kalender/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Kalender/`

**Endpoints:**
- `/events` - Event CRUD
- `/events/user/:userId` - User-Events
- `/events/team/:teamId` - Team-Events

**Funktionen:**
- Event-Management
- Termin-Koordination
- Abwesenheiten-Tracking

---

### 14. BrowoKoordinator-Zeiterfassung
**Pfad:** `/supabase/functions/BrowoKoordinator-Zeiterfassung/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/`

**Endpoints:**
- `/time-entries` - Zeiteinträge
- `/clock-in` - Einstempeln
- `/clock-out` - Ausstempeln
- `/time-account` - Zeitkonto

**Funktionen:**
- Zeit-Tracking
- Stempeluhr
- Überstunden-Berechnung
- Zeitkonto-Verwaltung

---

### 15. BrowoKoordinator-Notification
**Pfad:** `/supabase/functions/BrowoKoordinator-Notification/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Notification/`

**Endpoints:**
- `/notifications` - Notifications CRUD
- `/notifications/send` - Notification senden
- `/notifications/:id/read` - Als gelesen markieren

**Funktionen:**
- Notification-Verwaltung
- Push-Notifications (geplant)
- Real-time Updates
- Badge-Counter

---

### 16. BrowoKoordinator-Analytics
**Pfad:** `/supabase/functions/BrowoKoordinator-Analytics/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Analytics/`

**Endpoints:**
- `/analytics/dashboard` - Dashboard-Metriken
- `/analytics/reports` - Reports

**Funktionen:**
- Metriken sammeln
- Reports generieren
- Charts-Daten

---

### 17. BrowoKoordinator-EmailTemplates
**Pfad:** `/supabase/functions/BrowoKoordinator-EmailTemplates/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-EmailTemplates/`

**Endpoints:**
- `/templates` - Template CRUD
- `/templates/:id/send-test` - Test-Email

**Funktionen:**
- Email-Template-Management
- Variablen-Replacement ({{firstName}})
- Test-Email-Versand

---

### 18. BrowoKoordinator-EmailTracking
**Pfad:** `/supabase/functions/BrowoKoordinator-EmailTracking/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-EmailTracking/`

**Endpoints:**
- `/track/open` - Email geöffnet
- `/track/click` - Link geklickt

**Funktionen:**
- Email-Tracking
- Open-Rate
- Click-Rate

---

### 19. BrowoKoordinator-Automation
**Pfad:** `/supabase/functions/BrowoKoordinator-Automation/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Automation/`

**Endpoints:**
- `/api-keys` - API-Key-Management
- `/integrations` - Integrationen

**Funktionen:**
- API-Key-Verwaltung
- n8n-Integration
- Webhook-Management

---

### 20. BrowoKoordinator-Personalakte
**Pfad:** `/supabase/functions/BrowoKoordinator-Personalakte/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-Personalakte/`

**Endpoints:**
- `/personal-files` - Personalakten-Daten
- `/contract-info` - Vertragsdaten

**Funktionen:**
- Personalakten-Management
- Vertragsdaten
- Urlaubskonto

---

### 21. BrowoKoordinator-ScheduledExecutions
**Pfad:** `/supabase/functions/BrowoKoordinator-ScheduledExecutions/index.tsx`  
**Basis-URL:** `https://{projectId}.supabase.co/functions/v1/BrowoKoordinator-ScheduledExecutions/`

**Funktionen:**
- Cron-Jobs
- Scheduled Tasks
- Batch-Prozesse (z.B. monatliche Zeitkonto-Berechnung)

---

## 📊 SERVICES & API-INTEGRATION

### Frontend Services (TypeScript)

Alle Services befinden sich in `/services/` und folgen dem gleichen Pattern:

```typescript
class SomeService {
  private supabase: SupabaseClient;
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }
  
  private async getAccessToken(): Promise<string> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session?.access_token;
  }
  
  async someMethod() {
    const token = await this.getAccessToken();
    const response = await fetch(EDGE_FUNCTION_URL, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
}
```

### Service-Liste:

1. **AnnouncementService** (`BrowoKo_announcementService.ts`)
   - Ankündigungen laden/erstellen/löschen
   - Live-Ankündigung abrufen

2. **AuditLogService** (`BrowoKo_auditLogService.ts`)
   - Audit-Logs erstellen/laden
   - User-Aktivitäten tracken

3. **AuthService** (`BrowoKo_authService.ts`)
   - Login/Logout
   - Passwort-Reset
   - Session-Management

4. **AutomationService** (`BrowoKo_automationService.ts`)
   - API-Keys verwalten
   - Integrationen

5. **BenefitsService** (`BrowoKo_benefitsService.ts`)
   - Benefits laden/beantragen
   - Admin: Benefits verwalten

6. **ChatService** (`BrowoKo_chatService.ts`)
   - Nachrichten senden/empfangen
   - Channels verwalten
   - Real-time Subscriptions

7. **CoinAchievementsService** (`BrowoKo_coinAchievementsService.ts`)
   - Achievements laden
   - Fortschritt prüfen
   - Coins vergeben

8. **DocumentService** (`BrowoKo_documentService.ts`)
   - Dokumente hochladen/herunterladen/löschen
   - Kategorien verwalten

9. **DocumentAuditService** (`BrowoKo_documentAuditService.ts`)
   - Dokument-Aktionen loggen
   - Audit-Trail

10. **LearningService** (`BrowoKo_learningService.ts`)
    - Videos/Tests/Units laden
    - Fortschritt tracken
    - Submissions

11. **LeaveService** (`BrowoKo_leaveService.ts`)
    - Urlaubsanträge erstellen/laden
    - Genehmigung/Ablehnung

12. **NotificationService** (`BrowoKo_notificationService.ts`)
    - Notifications laden/erstellen
    - Als gelesen markieren
    - Real-time Updates

13. **OrganigramService** (`BrowoKo_organigramService.ts`)
    - Nodes/Connections CRUD
    - Settings

14. **PerformanceReviewService** (`BrowoKo_performanceReviewService.ts`)
    - Templates CRUD
    - Reviews senden/laden
    - Antworten speichern
    - Unterschriften
    - PDF-Export

15. **RealtimeService** (`BrowoKo_realtimeService.ts`)
    - Supabase Realtime Subscriptions
    - Channel-Management

16. **TeamService** (`BrowoKo_teamService.ts`)
    - Team-Mitglieder laden
    - User-Management

17. **UserService** (`BrowoKo_userService.ts`)
    - User CRUD
    - Profilbild-Upload
    - Profil-Update

18. **WikiService** (`BrowoKo_wikiService.ts`)
    - Wiki-Artikel laden/erstellen
    - Suche

---

## 🗄️ DATENBANK-STRUKTUR

### Wichtige Tabellen:

#### Users & Auth
- `users` - User-Profile (Stammdaten)
- `user_permissions` - Individuelle Berechtigungen
- `role_permissions` - Rollen-Berechtigungen
- `user_avatars` - Avatar-Daten (Gamification)
- `audit_logs` - Audit-Trail

#### Organization
- `organizations` - Firmendaten
- `organigram_nodes` - Org-Chart Nodes
- `organigram_connections` - Org-Chart Verbindungen
- `teams` - Teams/Abteilungen

#### Learning
- `learning_videos` - Videos
- `learning_tests` - Tests
- `learning_units` - Lerneinheiten
- `test_submissions` - Test-Einreichungen
- `wiki_articles` - Wiki-Artikel

#### HR
- `leave_requests` - Urlaubsanträge
- `documents` - Dokumente
- `time_entries` - Zeiterfassung
- `time_accounts` - Zeitkonten
- `benefits` - Benefits
- `user_benefits` - Zugewiesene Benefits

#### Performance Reviews
- `performance_review_templates` - Fragebogen-Templates
- `performance_reviews` - Gespräche
- `performance_review_answers` - Antworten
- `performance_review_signatures` - Unterschriften

#### Workflows
- `workflows` - Workflow-Definitionen
- `workflow_nodes` - Workflow-Nodes
- `workflow_executions` - Ausführungshistorie

#### Vehicles & Equipment
- `vehicles` - Fahrzeuge
- `vehicle_drivers` - Fahrer-Zuordnung
- `vehicle_maintenance` - Wartungen
- `vehicle_damages` - Schäden
- `vehicle_equipment` - Equipment

#### Communication
- `notifications` - Benachrichtigungen
- `chat_messages` - Chat-Nachrichten
- `chat_channels` - Chat-Channels
- `tasks` - Tasks

#### KV Store
- `kv_store_f659121d` - Key-Value Store (für Prototyping, Announcements, etc.)

---

## 🚀 DEPLOYMENT & INFRASTRUKTUR

### Frontend
- **Hosting:** Figma Make (oder Vercel/Netlify für Produktion)
- **Build:** Vite
- **Deployment:** Automatisch bei Push

### Backend (Edge Functions)
- **Runtime:** Deno (Supabase Edge Functions)
- **Deployment:** Manuell über Supabase Dashboard
- **Naming:** Alle Funktionen beginnen mit `BrowoKoordinator-`

### Datenbank
- **Hosting:** Supabase (PostgreSQL)
- **Migrationen:** SQL-Dateien in `/migrations/` (manuell ausführen)
- **Backup:** Automatisch durch Supabase

### Storage
- **Buckets:**
  - `make-f659121d-company-logos` (Public)
  - `make-f659121d-profile-pictures` (Public)
  - `make-f659121d-announcements` (Private, 20MB PDFs)
  - `make-f659121d-documents` (Private)

---

## 📈 NEXT STEPS & ROADMAP

### Geplante Features:
1. **Email-Integration:**
   - Transactional Emails (Sendgrid/Resend)
   - Email-Vorlagen vollständig implementieren

2. **n8n-Integration:**
   - Workflow-Trigger an n8n weitergeben
   - Externe Automationen

3. **Mobile App:**
   - React Native oder PWA
   - Push-Notifications

4. **Reporting:**
   - Custom Reports
   - PDF-Export
   - Charts & Dashboards

5. **AI-Features:**
   - Chatbot für HR-Fragen
   - Automatische Dokumenten-Kategorisierung
   - Performance-Predictions

6. **Zeiterfassung:**
   - GPS-Tracking (Field-Mitarbeiter)
   - Projekt-Zeiten
   - Überstunden-Management

---

## 📞 SUPPORT & KONTAKT

Bei Fragen zur Codebase oder Features wenden Sie sich bitte an:
- **Entwicklung:** [Ihr Name]
- **Dokumentation:** Diese Datei (CODEBASE_ANALYSIS.md)

---

**Stand:** 7. Dezember 2024  
**Version:** 4.13.2+  
**Autor:** AI-generiert für Geschäftsführung & Stakeholder
