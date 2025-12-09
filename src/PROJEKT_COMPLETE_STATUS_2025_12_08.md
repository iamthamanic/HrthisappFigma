# 📊 BROWO KOORDINATOR - KOMPLETTER PROJEKT-STATUS

**Stand:** 8. Dezember 2025  
**Version:** v4.13.4+  
**Zweck:** Ehrliche Bestandsaufnahme für PWA-Entwicklung

---

## 🎯 EXECUTIVE SUMMARY

**Gesamt-Status:** 🟡 **70-80% Production-Ready**

- ✅ **Frontend-Architektur:** Solid, gut strukturiert
- ✅ **UI/UX:** Responsive, moderne Oberfläche
- 🟡 **Backend:** Teilweise migriert zu Edge Functions
- ⚠️ **Testing:** Kaum systematische Tests
- ⚠️ **Bugs:** Diverse kleinere Bugs bekannt
- ✅ **Dokumentation:** Sehr umfangreich

**Kann an Entwickler übergeben werden?**  
✅ **JA** - mit klarer Kommunikation über:
- Fehlende Tests
- Bekannte Bugs
- Notwendige Pre-Production-Tests
- Backend-Migrations-Status

---

## 📊 STATUS-KATEGORIEN

| Symbol | Status | Beschreibung |
|--------|--------|--------------|
| 🔴 | **Backlog** | Nicht angefangen oder <25% fertig |
| 🟠 | **25%+** | Grundstruktur vorhanden, viele Features fehlen |
| 🟡 | **50%+** | Hälfte implementiert, braucht viel Arbeit |
| 🟢 | **75%+** | Fast fertig, braucht Testing & Polish |
| ✅ | **Production Ready** | Kann an Dev übergeben werden |

---

## 👥 ROLLEN-ÜBERSICHT

| Rolle | Beschreibung | Hauptaufgaben |
|-------|--------------|---------------|
| **USER** | Standard-Mitarbeiter | Zeiterfassung, Urlaub beantragen, Lernen, Benefits |
| **TEAMLEAD** | Team-Leiter | Wie USER + Urlaubsanträge genehmigen (1. Stufe) |
| **HR** | HR-Abteilung | Wie TEAMLEAD + Urlaubsanträge genehmigen (2. Stufe), Mitarbeiter verwalten |
| **ADMIN** | Administrator | Wie HR + Vollzugriff auf alle Admin-Features |
| **SUPERADMIN** | Super-Administrator | Wie ADMIN + System-Settings, Permissions |
| **EXTERN** | Externe Mitarbeiter | Eingeschränkter Zugriff |

---

## 📱 ALLE SCREENS & FEATURES

### **1. USER SCREENS** (17 Screens)

---

#### **1.1 DashboardScreen** 📊

**Datei:** `/screens/DashboardScreen.tsx`  
**Zugriff:** 👤 **Alle Rollen** (USER, TEAMLEAD, HR, ADMIN, SUPERADMIN)  
**Status:** ✅ **Production Ready** (80% fertig, braucht Testing)

**Was macht dieser Screen?**
Der Dashboard ist die Startseite für alle User. Zeigt persönliche Stats, Ankündigungen und Quick Actions.

**Userflow:**

1. **User öffnet App** → Dashboard lädt automatisch
2. **Welcome Header** zeigt:
   - Begrüßung mit Name
   - Aktuelle Zeit
   - Persönliche XP & Level
3. **Stats-Cards** zeigen:
   - ⏱️ Heute getrackte Zeit
   - 🏖️ Verfügbarer Urlaub
   - 🏆 Achievements
   - 📊 Team-Activity
4. **Quick Actions:**
   - ✅ Clock In/Out Button (Zeiterfassung starten/stoppen)
   - 📝 Request Leave Button (Urlaub beantragen)
   - 📄 Upload Document (Dokument hochladen)
5. **Dashboard Announcements:**
   - HR-Mitteilungen werden als Cards angezeigt
   - Rich-Text-Content (Bilder, Links, etc.)
   - Sortiert nach Priority & Datum
6. **Organigram Vorschau:**
   - Mini-Vorschau des Unternehmens-Organigrams
   - Click → Zum vollständigen Organigram
7. **Team Activity Feed:**
   - Letzte Aktivitäten von Kollegen
   - Urlaubsanträge, Achievements, etc.

**Admin-Unterschiede:**
- Admins sehen zusätzlich:
  - Pending Approvals Badge
  - System Health Warning (falls Probleme)

**Bekannte Issues:**
- ⚠️ Stats werden nicht immer live aktualisiert
- ⚠️ Activity Feed könnte Performance-Probleme bei vielen Einträgen haben
- 🐛 Keine Error States bei API-Fehlern

**Was fehlt:**
- Error Handling verbessern
- Live-Updates für Stats
- Performance-Testing mit vielen Usern

---

#### **1.2 CalendarScreen** 📅

**Datei:** `/screens/CalendarScreen.tsx`  
**Zugriff:** 👤 **Alle Rollen**  
**Status:** ✅ **Production Ready** (85% fertig)

**Was macht dieser Screen?**
Zeigt Kalender mit Abwesenheiten, Team-Übersicht und Export-Funktion.

**Userflow:**

1. **User öffnet Kalender**
2. **Monatsansicht** zeigt:
   - 📅 Aktueller Monat
   - 🔴 Eigene Abwesenheiten (rot markiert)
   - 🔵 Team-Abwesenheiten (blau)
   - Vertretungs-Infos bei Hover
3. **Team-Kalender:**
   - Profilbilder aller Mitarbeiter
   - Roter Ring = Im Urlaub/Abwesend
   - Hover zeigt: Vertretung + Department
4. **Filter:**
   - Nach Team filtern
   - Nach Department filtern
   - Nur eigene Abwesenheiten
5. **View-Mode-Switch:**
   - Monat / Woche / Tag
6. **Export-Funktion:**
   - Download als iCal
   - Import in Outlook/Google Calendar

**Admin-Unterschiede:**
- Admins sehen alle Teams (User nur eigenes Team)
- Admins können Abwesenheiten aller User sehen

**Bekannte Issues:**
- ✅ Kalender-Symbole sind schwarz (FIXED)
- ⚠️ View Mode Switch buggy bei bestimmten Datumsangaben
- 🐛 Export-Funktion nicht vollständig getestet

**Was fehlt:**
- View-Mode-Switch stabilisieren
- Export-Funktion testen
- Mobile-Optimierung

---

#### **1.3 Zeit & Urlaub** ⏱️

**Datei:** Mehrere Komponenten (kein eigener Screen, integriert in Dashboard + Calendar)  
**Zugriff:** 👤 **Alle Rollen** (außer EXTERN)  
**Status:** ✅ **Production Ready** (85% fertig)

**Was macht dieses Feature?**
Zeiterfassung (Clock In/Out) und Urlaubsanträge verwalten.

**Userflow - Zeiterfassung:**

1. **User klickt "Clock In"** auf Dashboard
2. **Zeiterfassung startet:**
   - Timer läuft
   - Button ändert sich zu "Clock Out"
   - "Heute getrackte Zeit" aktualisiert live
3. **Pausen verwalten:**
   - Automatische Pausen (konfigurierbar)
   - Manuelle Pausen (Start/Stop)
4. **User klickt "Clock Out":**
   - Timer stoppt
   - Gesamt-Zeit wird berechnet
   - Pausen werden abgezogen
   - Eintrag in Work Sessions gespeichert

**Userflow - Urlaubsantrag:**

1. **User klickt "Request Leave"**
2. **Dialog öffnet sich** mit 3 Buttons:
   - 🏖️ Urlaub
   - 🤒 Krankheit
   - 💸 Unbezahlter Urlaub
3. **User wählt Typ** → Formular öffnet sich:
   - Start-Datum
   - End-Datum
   - Grund (optional)
   - Vertretung auswählen
4. **User klickt "Submit":**
   - Antrag wird erstellt
   - Status: PENDING
   - 2-Level-Approval-Flow startet:
     - Stufe 1: TeamLead muss genehmigen
     - Stufe 2: HR muss genehmigen
5. **Notifications:**
   - User bekommt Notification bei Approve/Reject
   - TeamLead/HR bekommen Notification bei neuem Antrag

**Userflow - Meine Anträge:**

1. **User öffnet "Meine Anträge"**
2. **Übersicht zeigt:**
   - Alle eigenen Anträge
   - Status-Badge (PENDING / APPROVED / REJECTED)
   - Approval-Chain anzeigen
   - Grund für Reject (falls abgelehnt)
3. **User kann:**
   - PENDING-Anträge stornieren
   - Details ansehen
   - Kalender-View öffnen

**Admin/HR/TeamLead-Unterschiede:**

**TeamLead:**
- Sieht "Pending Approvals" Badge
- Kann Anträge seines Teams genehmigen (1. Stufe)
- Kann Priority-Tags setzen

**HR:**
- Sieht alle Anträge (alle Teams)
- Kann Anträge genehmigen (2. Stufe, finale Genehmigung)
- Kann Anträge für andere erstellen (Admin Request Leave Dialog)

**Admin/Superadmin:**
- Wie HR + Vollzugriff
- Kann Approval-Hierarchie umgehen
- Kann Anträge direkt approven

**Bekannte Issues:**
- ⚠️ 2-Level-Approval-Flow mehrfach gefixt
- 🐛 Admin-Auto-Add wurde entfernt (Migration 045)
- ⚠️ Priority-Tags nicht vollständig getestet

**Was fehlt:**
- Approval-Flow mit echten Usern testen
- Email-Notifications (aktuell nur In-App)
- Carry-Over-System für Urlaubstage (teilweise implementiert)

---

#### **1.4 LearningScreen** 🎓

**Datei:** `/screens/LearningScreen.tsx`  
**Zugriff:** 👤 **Alle Rollen**  
**Status:** 🟢 **75%+** (braucht Testing & Bug-Fixes)

**Was macht dieser Screen?**
E-Learning-Plattform mit Videos, Quizzes, Tests und XP-System.

**Userflow - Videos ansehen:**

1. **User öffnet Learning-Screen**
2. **Übersicht-Tab** zeigt:
   - Lernfortschritt (Overall Progress Bar)
   - XP & Level
   - Coin-Wallet
   - Learning-Avatar-Widget
3. **Videos-Tab:**
   - Video-Grid mit Kategorien
   - Filter nach Kategorie
   - Suche nach Titel
   - Jedes Video zeigt:
     - Thumbnail
     - Titel
     - Beschreibung
     - Progress-Bar (0-100%)
     - XP-Belohnung
4. **User klickt Video:**
   - → VideoDetailScreen öffnet sich
   - YouTube-Player lädt
   - User schaut Video
   - Progress wird getrackt (z.B. 50% gesehen)
   - Bei 100%: XP-Belohnung + Coins
5. **Comment-System:**
   - User kann Kommentare schreiben
   - Andere User sehen Kommentare
   - Image-Comments (Screenshots markieren)

**Userflow - Quizzes:**

1. **User öffnet "Quizzes"-Tab**
2. **Quiz-Liste** zeigt verfügbare Quizzes
3. **User klickt Quiz:**
   - → QuizDetailScreen öffnet sich
   - Multiple-Choice-Fragen
   - User wählt Antworten
   - Submit Quiz
4. **Score-Berechnung:**
   - Richtige Antworten / Gesamt
   - XP-Belohnung basierend auf Score
5. **Quiz-Attempts:**
   - User kann Quiz wiederholen
   - Beste Score wird gespeichert

**Userflow - Tests:**

1. **User öffnet "Tests"-Tab**
2. **Test-Liste** zeigt verfügbare Tests
3. **User klickt Test:**
   - Test startet
   - Fragen in Blocks organisiert
   - Timer (optional)
   - Submit Test
4. **Test-Submission:**
   - Review-System (HR/Admin bewertet)
   - User bekommt Feedback
   - XP bei bestandenem Test

**Admin-Unterschiede:**

**HR/Admin:**
- Sehen zusätzlich "Admin"-Button
- Können zu LearningManagementScreen wechseln
- Dort:
  - Videos erstellen/bearbeiten/löschen
  - Tests erstellen mit Test-Builder
  - Quizzes erstellen
  - Training-Compliance tracken
  - Wiki-Artikel verwalten

**Bekannte Issues:**
- 🐛 **Video-Linking manchmal buggy** (orphaned assignments)
- 🐛 **organization_id NULL** bei einigen Videos
- 🐛 **"Failed to fetch"** Errors bei schlechter Connection
- ⚠️ RLS Policies für test_blocks mehrfach gefixt
- ⚠️ Quiz-Attempts-System nicht vollständig getestet

**Was fehlt:**
- Video-Linking-Bugs fixen
- Failed-to-fetch Error Handling
- Test-Submission-Review-Flow testen
- Mobile-Optimierung

---

#### **1.5 BenefitsScreen** 🎁

**Datei:** `/screens/BenefitsScreen.tsx`  
**Zugriff:** 👤 **Alle Rollen**  
**Status:** ✅ **Production Ready** (80% fertig)

**Was macht dieser Screen?**
Mitarbeiter-Benefits durchsuchen, anfragen und Coin-Shop.

**Userflow - Benefits durchsuchen:**

1. **User öffnet Benefits-Screen**
2. **Browse-Tab** zeigt:
   - Grid mit allen Benefits
   - Jedes Benefit zeigt:
     - Bild
     - Titel
     - Kurz-Beschreibung
     - Coin-Preis (wenn Coin-Shop aktiviert)
     - "Details"-Button
3. **User kann:**
   - Suchen nach Titel
   - Filtern nach Kategorie
   - Sortieren nach Preis/Datum

**Userflow - Benefit anfragen:**

1. **User klickt "Details"** auf einem Benefit
2. **BenefitDetailScreen** öffnet sich:
   - Vollständige Beschreibung
   - Bilder
   - Coin-Preis
   - "Request Benefit"-Button
3. **User klickt "Request":**
   - Dialog öffnet sich
   - Optional: Nachricht an HR
   - "Submit Request"
4. **Request-Flow:**
   - Request wird erstellt (Status: PENDING)
   - HR bekommt Notification
   - HR prüft Request
   - HR approved oder rejected
   - User bekommt Notification

**Userflow - Meine Benefits:**

1. **User öffnet "Meine Benefits"-Tab**
2. **Übersicht** zeigt:
   - Alle angefragten Benefits
   - Status-Badge (PENDING / APPROVED / REJECTED)
   - Approved-Datum
3. **User kann:**
   - PENDING-Requests stornieren
   - Details ansehen

**Coin-Shop-System:**

**Userflow - Coins verdienen:**
- XP-Aktivitäten → Coins automatisch
- Achievements → Coin-Belohnung
- HR kann manuell Coins verteilen

**Userflow - Coins ausgeben:**
1. User sucht Benefit mit Coin-Preis
2. User klickt "Purchase with Coins"
3. Coins werden abgezogen
4. Benefit wird automatisch approved (oder geht in Approval)

**Admin-Unterschiede:**

**HR/Admin:**
- Sehen zusätzlich "Admin"-Button
- Können zu BenefitsManagementScreen wechseln
- Dort:
  - Benefits erstellen/bearbeiten/löschen
  - Coin-Preise setzen
  - Approval-Queue verwalten
  - Bulk-Approve/Reject
  - Coin-Distribution-Tool
  - Achievements verwalten

**Bekannte Issues:**
- ✅ Coin-Preise werden korrekt angezeigt (FIXED v3.9.6)
- ⚠️ Approval-Flow nicht vollständig getestet
- 🐛 coin_transactions RLS Policies fehlen (Quick Fix vorhanden)

**Was fehlt:**
- coin_transactions RLS Policies deployen
- Approval-Flow mit echten Usern testen
- Email-Notifications

---

#### **1.6 DocumentsScreen** 📄

**Datei:** `/screens/DocumentsScreen.tsx`  
**Zugriff:** 👤 **Alle Rollen**  
**Status:** ✅ **Production Ready** (85% fertig)

**Was macht dieser Screen?**
Dokumente hochladen, verwalten, durchsuchen und downloaden mit Audit-Log.

**Userflow - Dokumente durchsuchen:**

1. **User öffnet Documents-Screen**
2. **Übersicht** zeigt:
   - Kategorie-Cards (7 Kategorien):
     - Arbeitsvertrag
     - Gehaltsnachweis
     - Krankschreibung
     - Weiterbildung
     - Führerschein
     - Sonstiges
     - Unternehmens-Dokumente
   - Anzahl Dokumente pro Kategorie
3. **User klickt Kategorie:**
   - Virtualisierte Dokument-Liste lädt
   - Dokumente zeigen:
     - Dateiname
     - Hochgeladen von
     - Hochgeladen am
     - Kategorie
     - Größe
     - Actions (View, Download, Delete)

**Userflow - Dokument hochladen:**

1. **User klickt "Upload Document"**
2. **Dialog öffnet sich:**
   - Kategorie auswählen
   - Datei auswählen (oder Drag & Drop)
   - Optional: Titel eingeben
   - "Upload"-Button
3. **Upload:**
   - Progress-Bar zeigt Fortschritt
   - Datei wird in Supabase Storage gespeichert
   - Metadata in Database
   - Success-Message

**Userflow - Bulk-Upload:**

1. **User klickt "Bulk Upload"**
2. **Dialog öffnet sich:**
   - Mehrere Dateien auswählen
   - Kategorie für alle festlegen
   - "Upload All"-Button
3. **Upload:**
   - Alle Dateien werden hochgeladen
   - Progress pro Datei
   - Success/Error pro Datei

**Userflow - Dokument ansehen:**

1. **User klickt "View" auf Dokument**
2. **DocumentViewDialog** öffnet sich:
   - PDF-Viewer (falls PDF)
   - Image-Viewer (falls Bild)
   - Download-Button
   - Close-Button
3. **Audit-Log:**
   - Jeder View wird geloggt:
     - Wer hat wann gesehen
     - IP-Adresse (optional)
     - Aktion (VIEWED / DOWNLOADED)

**Userflow - Dokument downloaden:**

1. **User klickt "Download"**
2. **Download startet:**
   - Datei wird vom Storage geladen
   - Browser-Download startet
3. **Audit-Log:**
   - Download wird geloggt

**Admin-Unterschiede:**

**HR/Admin:**
- Können Dokumente aller User sehen
- Können Dokumente für andere User hochladen
- Können Dokumente löschen (User nur eigene)
- Sehen vollständigen Audit-Log (wer hat was wann gesehen)

**USER:**
- Sieht nur eigene Dokumente
- Kann eigene Dokumente löschen
- Kann eigene Dokumente uploaden

**Bekannte Issues:**
- ✅ Storage Bucket erfolgreich deployed (FIXED v3.5.9)
- ✅ Audit System vollständig implementiert (FIXED v3.6.8)
- ⚠️ Bulk-Upload könnte bei vielen Dateien langsam sein
- 🐛 Upload-Progress manchmal nicht korrekt

**Was fehlt:**
- Upload-Progress-Bug fixen
- Performance-Testing mit vielen Dateien
- OCR/Fulltext-Search (optional)

---

#### **1.7 SettingsScreen** (Meine Daten) ⚙️

**Datei:** `/screens/SettingsScreen.tsx` (nutzt `MeineDaten.tsx` Component)  
**Zugriff:** 👤 **Alle Rollen**  
**Status:** ✅ **Production Ready** (90% fertig)

**Was macht dieser Screen?**
Persönliche Daten bearbeiten mit Tab-System.

**Userflow:**

1. **User öffnet Settings (Meine Daten)**
2. **Tab-Navigation** zeigt 8 Tabs:
   - 👤 Persönliche Daten
   - 🏠 Adresse
   - 🏦 Bank-Informationen
   - 🚨 Notfall-Kontakt
   - 👕 Kleidergrößen
   - 🗣️ Sprachkenntnisse
   - 💼 Arbeitsinformationen (Read-Only für User)
   - 🖼️ Profilbild

**Tab 1: Persönliche Daten**
- Vorname, Nachname (Read-Only)
- Email, Telefon
- Geburtsdatum
- Geschlecht
- Nationalität
- Card-Level-Editing (inline Edit-Mode)

**Tab 2: Adresse**
- Straße, Hausnummer
- PLZ, Stadt
- Land
- Card-Level-Editing

**Tab 3: Bank-Informationen**
- IBAN
- BIC
- Bank-Name
- Kontoinhaber
- Card-Level-Editing

**Tab 4: Notfall-Kontakt**
- Name
- Beziehung
- Telefon
- Email
- Card-Level-Editing

**Tab 5: Kleidergrößen**
- T-Shirt-Größe
- Hosen-Größe
- Schuhgröße
- Jacken-Größe
- Card-Level-Editing

**Tab 6: Sprachkenntnisse**
- Sprache auswählen
- Level (A1-C2)
- Mehrere Sprachen möglich
- Card-Level-Editing

**Tab 7: Arbeitsinformationen**
- Position, Abteilung, Standort (Read-Only)
- Eintrittsdatum (Read-Only)
- Gehalt (Read-Only, nur für HR/Admin sichtbar)
- Work-Time-Model (Read-Only)

**Tab 8: Profilbild**
- Aktuelles Bild anzeigen
- Upload-Button
- Image-Crop-Dialog:
  - Zoom
  - Rotate
  - Crop-Area
  - Save → Upload zu Storage

**Admin-Unterschiede:**

**HR/Admin:**
- Können Arbeitsinformationen bearbeiten
- Können Gehalt sehen
- Können alle Felder bearbeiten

**USER:**
- Arbeitsinformationen nur lesen
- Gehalt nicht sichtbar

**Bekannte Issues:**
- ✅ Profilbild-Upload funktioniert (FIXED v4.7.3)
- ✅ Form-Validation vorhanden (FIXED v4.7.1)
- ⚠️ Keine Fehler-Logs bei fehlgeschlagenen Updates

**Was fehlt:**
- Error-Logging verbessern
- Success-Messages nach Save

---

#### **1.8 AvatarScreen** 👤

**Datei:** `/screens/AvatarScreen.tsx`  
**Zugriff:** 👤 **Alle Rollen**  
**Status:** 🟢 **75%+** (braucht Testing)

**Was macht dieser Screen?**
Emoji-Avatar-System mit XP, Levels, Coins und Leaderboard.

**Userflow - Avatar anpassen:**

1. **User öffnet Avatar-Screen**
2. **Avatar-Editor** zeigt:
   - Preview des aktuellen Avatars
   - 3 Kategorien:
     - Background (Hintergrund-Emojis)
     - Face (Gesicht-Emojis)
     - Accessories (Accessoires-Emojis)
3. **User wählt Kategorie:**
   - Grid mit verfügbaren Items
   - Gekaufte Items sind grün markiert
   - Ungekaufte Items zeigen Coin-Preis
   - Locked Items sind ausgegraut
4. **User kauft Item:**
   - Click auf ungekauftes Item
   - "Purchase for X Coins"-Dialog
   - Confirm → Coins werden abgezogen
   - Item wird freigeschaltet
5. **User equipped Item:**
   - Click auf gekauftes Item
   - Item wird am Avatar angezeigt
   - Preview aktualisiert live

**Userflow - XP & Levels:**

1. **XP verdienen:**
   - Videos ansehen
   - Quizzes absolvieren
   - Tests bestehen
   - Achievements freischalten
   - Zeiterfassung (optional)
2. **Level-Up:**
   - Bei bestimmten XP-Schwellen
   - Animation (optional)
   - Neue Avatar-Items werden freigeschaltet
   - Coin-Belohnung
3. **Level-Milestones:**
   - Anzeige der nächsten Milestones
   - Was wird bei Level X freigeschaltet

**Userflow - Leaderboard:**

1. **User öffnet "Leaderboard"-Tab**
2. **Leaderboard** zeigt:
   - Top 10 User (oder alle)
   - Sortiert nach XP
   - Avatar-Preview
   - Name
   - XP
   - Level
   - Rank (#1, #2, etc.)
3. **User kann:**
   - Eigene Position sehen (hervorgehoben)
   - Nach Zeitraum filtern (Woche/Monat/Alle Zeit)

**Userflow - Stats:**

1. **Stats-Grid** zeigt:
   - Gesamt-XP
   - Aktuelles Level
   - XP bis nächstes Level
   - Gesamt-Coins
   - Gekaufte Items
   - Freigeschaltete Achievements

**Admin-Unterschiede:**

**HR/Admin:**
- Sehen zusätzlich "Admin"-Button
- Können zu AvatarSystemAdminScreen wechseln
- Dort:
  - Avatar-Items verwalten (CRUD)
  - Level-System konfigurieren
  - XP-Belohnungen festlegen
  - Coins manuell verteilen

**Bekannte Issues:**
- ⚠️ Avatar-RLS Policies mehrfach gefixt
- 🐛 Avatar-Preview manchmal nicht synchron
- ⚠️ Leaderboard nicht getestet mit vielen Usern

**Was fehlt:**
- Avatar-Preview-Sync-Bug fixen
- Leaderboard Performance-Testing
- Level-Up-Animationen

---

#### **1.9 AchievementsScreen** 🏆

**Datei:** `/screens/AchievementsScreen.tsx`  
**Zugriff:** 👤 **Alle Rollen**  
**Status:** 🟢 **75%+** (braucht Testing)

**Was macht dieser Screen?**
Achievement-System mit Unlock-Status und Coin-Belohnungen.

**Userflow:**

1. **User öffnet Achievements-Screen**
2. **Achievement-Grid** zeigt:
   - Alle Achievements
   - Kategorien:
     - 🎓 Learning (Videos, Quizzes)
     - ⏱️ Time Tracking (Arbeitsstunden)
     - 🎯 Engagement (Aktivität)
     - 🏆 Milestones (Level-Ups)
     - 🎁 Benefits (Benefits anfragen)
3. **Jedes Achievement zeigt:**
   - Icon (Emoji oder Badge)
   - Titel
   - Beschreibung
   - Progress-Bar (0-100%)
   - Status:
     - 🔓 Unlocked (grün)
     - 🔒 Locked (grau)
     - 🔄 In Progress (gelb)
   - Belohnung:
     - XP-Punkte
     - Coin-Belohnung
4. **User klickt Achievement:**
   - Detail-Dialog öffnet sich
   - Vollständige Beschreibung
   - Unlock-Bedingungen
   - Fortschritt (z.B. 7/10 Videos angesehen)
   - Unlock-Datum (falls unlocked)

**Userflow - Achievement freischalten:**

1. **User erfüllt Bedingung** (z.B. 10 Videos ansehen)
2. **Achievement unlocked:**
   - Notification: "Achievement unlocked!"
   - Coin-Belohnung wird gutgeschrieben
   - XP-Belohnung wird gutgeschrieben
   - Achievement-Badge wird grün
3. **Achievement-Tracking:**
   - System trackt automatisch
   - Progress aktualisiert live
   - User muss nichts manuell tun

**Admin-Unterschiede:**

**HR/Admin:**
- Sehen zusätzlich "Admin"-Button
- Können zu BenefitsManagementScreen → Achievements-Tab wechseln
- Dort:
  - Achievements erstellen/bearbeiten/löschen
  - Unlock-Bedingungen festlegen
  - Coin-Belohnungen setzen
  - Achievements manuell freischalten (für User)
  - Bulk-Operations

**Bekannte Issues:**
- 🐛 Achievement-Unlock-Logic nicht vollständig getestet
- ⚠️ coin_achievements Functions mehrfach gefixt
- ⚠️ Ambiguous achievement_id Error gefixt (Quick Fix vorhanden)

**Was fehlt:**
- Unlock-Logic mit Edge Cases testen
- Coin-Achievement-Functions deployen
- Achievement-Categories erweitern

---

#### **1.10 BenefitDetailScreen** 🎁

**Datei:** `/screens/BenefitDetailScreen.tsx`  
**Zugriff:** 👤 **Alle Rollen**  
**Status:** ✅ **Production Ready** (80% fertig)

**Was macht dieser Screen?**
Detail-Ansicht für ein Benefit mit vollständiger Beschreibung und Request-Option.

**Userflow:**

1. **User klickt "Details"** auf einem Benefit (in BenefitsScreen)
2. **BenefitDetailScreen** öffnet sich mit Route `/benefits/:benefitId`
3. **Screen zeigt:**
   - **Header:**
     - Benefit-Titel
     - Kategorie-Badge
   - **Bild-Galerie:**
     - Haupt-Bild (groß)
     - Weitere Bilder (Thumbnails)
     - Click → Fullscreen-Viewer
   - **Beschreibung:**
     - Vollständiger Text
     - Rich-Content (falls vorhanden)
   - **Details-Card:**
     - Verfügbarkeit (Anzahl verfügbar)
     - Wert (falls angegeben)
     - Coin-Preis (prominent angezeigt)
   - **Request-Status** (falls User bereits angefragt):
     - Status-Badge (PENDING / APPROVED / REJECTED)
     - Approval-Datum
     - Ablehnung-Grund (falls rejected)
4. **Action-Buttons:**
   - "Request Benefit" (falls noch nicht angefragt)
   - "Purchase with Coins" (falls Coin-Preis gesetzt)
   - "Cancel Request" (falls PENDING)
   - "Back to Benefits"

**Bekannte Issues:**
- ⚠️ Keine bekannten Issues

**Was fehlt:**
- Fullscreen-Image-Viewer
- Sharing-Funktion (Link zu Benefit)

---

#### **1.11 VideoDetailScreen** 🎬

**Datei:** `/screens/VideoDetailScreen.tsx`  
**Zugriff:** 👤 **Alle Rollen**  
**Status:** 🟡 **50%+** (viele Bugs)

**Was macht dieser Screen?**
Video ansehen mit YouTube-Player, Progress-Tracking und XP-Belohnung.

**Userflow:**

1. **User klickt Video** in LearningScreen
2. **VideoDetailScreen** öffnet sich mit Route `/learning/videos/:videoId`
3. **Screen zeigt:**
   - **YouTube-Player:**
     - Eingebetteter YouTube-Player
     - Vollbild-Option
     - Playback-Controls
   - **Video-Info:**
     - Titel
     - Beschreibung
     - Kategorie
     - Upload-Datum
     - XP-Belohnung (angezeigt)
   - **Progress-Bar:**
     - Wie viel % angesehen
     - Zeit verbleibend
   - **Related Videos:**
     - Andere Videos aus gleicher Kategorie
4. **User schaut Video:**
   - Player trackt Progress automatisch
   - Bei bestimmten Milestones (25%, 50%, 75%, 100%):
     - Progress wird in DB gespeichert
   - Bei 100%:
     - XP-Belohnung wird gutgeschrieben
     - Coins werden gutgeschrieben
     - Success-Message
     - Achievement-Check (z.B. "10 Videos angesehen")
5. **Comment-System:**
   - User kann Kommentare schreiben
   - Text-Kommentare
   - Image-Kommentare (Screenshot mit Markierung)
   - Andere User sehen Kommentare

**Admin-Unterschiede:**

**HR/Admin:**
- Können Video bearbeiten (Edit-Button)
- Können Video löschen (Delete-Button)
- Sehen zusätzliche Stats (wie viele User haben gesehen)

**Bekannte Issues:**
- 🐛 **Video-Progress wird nicht immer korrekt gespeichert**
- ⚠️ **YouTube API Key muss konfiguriert werden** (Env-Variable)
- 🐛 **organization_id NULL** bei einigen Videos
- 🐛 **Video-Linking buggy** (orphaned assignments)

**Was fehlt:**
- Progress-Tracking-Bug fixen
- organization_id NULL-Bug fixen
- YouTube API Setup dokumentieren
- Comment-System testen

---

#### **1.12 QuizDetailScreen** 📝

**Datei:** `/screens/QuizDetailScreen.tsx`  
**Zugriff:** 👤 **Alle Rollen**  
**Status:** 🟡 **50%+** (braucht Testing)

**Was macht dieser Screen?**
Quiz absolvieren mit Multiple-Choice-Fragen und Score-Berechnung.

**Userflow:**

1. **User klickt Quiz** in LearningScreen
2. **QuizDetailScreen** öffnet sich mit Route `/learning/quizzes/:quizId`
3. **Quiz-Player** zeigt:
   - Quiz-Titel
   - Anzahl Fragen
   - XP-Belohnung (bei Bestehen)
   - "Start Quiz"-Button
4. **User klickt "Start":**
   - Quiz startet
   - **Fragen-Ansicht:**
     - Frage-Text
     - 4 Antwort-Optionen (Radio-Buttons)
     - "Next"-Button
   - User wählt Antwort → Next
   - Nächste Frage lädt
5. **Quiz abschließen:**
   - Letzte Frage → "Submit Quiz"-Button
   - Click → Quiz wird ausgewertet
6. **Score-Berechnung:**
   - Richtige Antworten / Gesamt
   - Prozent-Score
   - Bestanden-Schwelle (z.B. 80%)
7. **Ergebnis-Screen:**
   - Score anzeigen (z.B. "8/10 richtig - 80%")
   - Bestanden/Nicht bestanden Badge
   - XP-Belohnung (falls bestanden)
   - "Retry"-Button (falls nicht bestanden)
   - "Back to Learning"-Button
8. **Quiz-Attempts:**
   - Alle Versuche werden gespeichert
   - Bester Score wird angezeigt
   - User kann unbegrenzt wiederholen

**Bekannte Issues:**
- 🐛 **Quiz-Attempts-Column mehrfach gefixt** (Migration 056)
- ⚠️ **Quiz-Submit manchmal buggy**
- 🐛 **Score-Berechnung nicht getestet** mit Edge Cases

**Was fehlt:**
- Submit-Bug fixen
- Score-Berechnung testen (0/10, 10/10, etc.)
- Timer-Funktion (optional)
- Detailed-Results (welche Frage falsch)

---

#### **1.13 LearningShopScreen** 🛒

**Datei:** `/screens/LearningShopScreen.tsx`  
**Zugriff:** 👤 **Alle Rollen**  
**Status:** ✅ **Production Ready** (80% fertig)

**Was macht dieser Screen?**
Avatar-Items mit Coins kaufen.

**Userflow:**

1. **User öffnet Learning-Shop** (über LearningScreen → Shop-Button)
2. **Shop-Grid** zeigt:
   - Coin-Balance (oben prominent)
   - Kategorie-Filter:
     - Background
     - Face
     - Accessories
     - All
   - Item-Cards:
     - Preview (Emoji/Icon)
     - Name
     - Coin-Preis
     - Status:
       - "Gekauft" (grün)
       - "Kaufen" (blau Button)
       - "Zu teuer" (grau, disabled)
3. **User klickt "Kaufen":**
   - Confirmation-Dialog:
     - "Kaufe [Item] für [X] Coins?"
     - Coin-Balance after purchase
     - "Confirm" / "Cancel"
   - Click "Confirm":
     - Coins werden abgezogen
     - Item wird gekauft
     - Success-Message
     - Item-Card aktualisiert zu "Gekauft"
4. **User equipped Item:**
   - Automatisch zu AvatarScreen wechseln
   - Oder: Direct-Equip-Funktion im Shop

**Bekannte Issues:**
- ⚠️ Keine bekannten größeren Issues

**Was fehlt:**
- Direct-Equip-Funktion
- Item-Preview beim Hover
- "Insufficient Coins"-Message verbessern

---

#### **1.14 OrganigramViewScreen** 🏢

**Datei:** `/screens/OrganigramViewScreen.tsx`  
**Zugriff:** 👤 **Alle Rollen**  
**Status:** ✅ **Production Ready** (85% fertig)

**Was macht dieser Screen?**
Unternehmens-Organigram anzeigen mit interaktiver Canvas.

**Userflow:**

1. **User öffnet Organigram** (über Navigation oder Dashboard-Card)
2. **Organigram-Canvas** lädt:
   - Live-Version wird angezeigt (published)
   - Alle Departments als Nodes
   - Alle Verbindungen als Lines
   - Mitarbeiter-Assignments als kleine Icons in Nodes
3. **User kann:**
   - **Zoom:** Mausrad oder Pinch-Gesture
   - **Pan:** Drag mit Maus oder Touch
   - **Node klicken:** Details anzeigen
     - Department-Info
     - Zugewiesene Mitarbeiter
     - Reporting-Line (zu welchem Node berichtet)
4. **Node-Detail-Panel:**
   - Department-Name
   - Team-Lead (falls vorhanden)
   - Mitarbeiter-Liste
   - Kontakt-Infos
   - "Schließen"-Button

**Admin-Unterschiede:**

**HR/Admin:**
- Sehen zusätzlich "Edit"-Button
- Können zu OrganigramCanvasScreenV2 wechseln
- Sehen "Draft/Live"-Toggle:
  - Draft-Version anzeigen
  - Live-Version anzeigen
- Können Organigram bearbeiten:
  - Nodes hinzufügen/löschen
  - Verbindungen erstellen
  - Mitarbeiter zuweisen
  - Publish-Funktion

**USER:**
- Nur Live-Version sehen
- Read-Only

**Bekannte Issues:**
- ⚠️ **Performance bei sehr großen Organigrammen ungetestet** (100+ Nodes)
- 🐛 **Trackpad-Interaktion manchmal buggy** (Reconnection Guide vorhanden)

**Was fehlt:**
- Performance-Testing mit großen Organigrammen
- Trackpad-Bug fixen
- Mobile-Optimierung (Touch-Controls)

---

#### **1.15 FieldScreen** 🚜

**Datei:** `/screens/FieldScreen.tsx`  
**Zugriff:** 👤 **Alle Rollen**  
**Status:** 🟠 **25%+** (sehr wenig Funktionalität)

**Was macht dieser Screen?**
Unklar - scheint Mitarbeiter nach Arbeitsort zu gruppieren (Büro/Außendienst/Extern).

**Userflow:**

1. **User öffnet Field-Screen**
2. **3 Tabs:**
   - Büro
   - Außendienst (Field)
   - Extern
3. **Jeder Tab zeigt:**
   - Liste von Mitarbeitern
   - Basic Info (Name, Position)
   - Keine weiteren Features

**Bekannte Issues:**
- ⚠️ **Sehr wenig Funktionalität**
- 🐛 **Keine echten Features implementiert** (nur Platzhalter)
- ⚠️ **Unklar was dieses Feature machen soll**

**Was fehlt:**
- Feature-Definition
- Klare User-Stories
- Funktionalität implementieren

**Empfehlung:** Feature-Scope klären oder entfernen

---

#### **1.16 ChatScreen** 💬

**Datei:** `/screens/ChatScreen.tsx`  
**Zugriff:** 👤 **Alle Rollen**  
**Status:** 🟡 **50%+** (unreif, viele Bugs)

**Was macht dieser Screen?**
Team-Chat mit DMs und Channels.

**Userflow (geplant):**

1. **User öffnet Chat-Screen**
2. **2 Tabs:**
   - DM (Direct Messages)
   - Channels (Team-Channels)
3. **DM-Tab:**
   - Liste aller User
   - Click auf User → Chat öffnet sich
   - Message-Input
   - Send-Button
   - Messages werden angezeigt (chronologisch)
4. **Channels-Tab:**
   - Liste aller Channels (z.B. #general, #hr, #random)
   - Click auf Channel → Channel-Chat öffnet sich
   - Wie DM, aber alle im Channel sehen Messages
5. **Real-time:**
   - Neue Messages erscheinen sofort
   - Typing-Indicators (optional)
   - Read-Receipts (optional)

**Bekannte Issues:**
- 🐛 **Chat-System mehrfach überarbeitet**
- 🐛 **RLS Policies mehrfach gefixt** (Migration 065)
- ⚠️ **Real-time Messaging nicht vollständig implementiert**
- ⚠️ **Keine Tests mit echten Usern**
- 🐛 **Security-Migration war problematisch**

**Was fehlt:**
- Real-time-Funktionalität stabilisieren
- RLS testen
- UI polieren
- Typing-Indicators
- Read-Receipts
- File-Sharing

**Empfehlung:** Feature ist zu unreif für Production. Entweder:
- Gründlich überarbeiten (2-3 Wochen)
- Oder: Disablen bis nach Launch

---

#### **1.17 TasksScreen** ✅

**Datei:** `/screens/TasksScreen.tsx`  
**Zugriff:** 👤 **Alle Rollen**  
**Status:** 🟡 **50%+** (unreif)

**Was macht dieser Screen?**
Kanban-Board für Task-Management.

**Userflow (geplant):**

1. **User öffnet Tasks-Screen**
2. **Kanban-Board** zeigt:
   - 3 Spalten:
     - To Do
     - In Progress
     - Done
   - Task-Cards in Spalten
3. **Task-Card** zeigt:
   - Titel
   - Beschreibung (kurz)
   - Assignee (Profilbild)
   - Due-Date
   - Priority-Tag
4. **User kann:**
   - Task erstellen (+ Button)
   - Task bearbeiten (Click auf Card)
   - Task zwischen Spalten verschieben (Drag & Drop)
   - Task löschen
5. **Task-Modal:**
   - Vollständige Beschreibung
   - Assignee wählen
   - Due-Date setzen
   - Priority setzen
   - Kommentare schreiben
   - Save-Button

**Bekannte Issues:**
- ⚠️ **Keine vollständige Backend-Integration**
- 🐛 **Drag & Drop nicht vollständig funktional**
- ⚠️ **Keine Tests**
- 🐛 **Task-Creation buggy**

**Was fehlt:**
- Backend-Integration vollständig implementieren
- Drag & Drop stabilisieren
- Task-Assignment-Logic
- Notifications bei neuen Tasks
- Mobile-Optimierung

**Empfehlung:** Feature ist zu unreif für Production. Entweder:
- Vollständig implementieren (1-2 Wochen)
- Oder: Disablen bis nach Launch

---

#### **1.18 EmployeePerformanceReviewScreen** 📊

**Datei:** `/screens/EmployeePerformanceReviewScreen.tsx`  
**Zugriff:** 👤 **USER** (eigene Reviews)  
**Status:** 🟠 **25%+** (Feature unvollständig)

**Was macht dieser Screen?**
Mitarbeiter sehen ihre Performance Reviews.

**Userflow (geplant):**

1. **User öffnet Performance Review Screen**
2. **Übersicht** zeigt:
   - Vergangene Reviews (Liste)
   - Nächstes Review (Datum)
3. **User klickt Review:**
   - Review-Details öffnen sich
   - Feedback von Manager
   - Rating (1-5 Sterne)
   - Kommentare
   - Ziele für nächstes Quartal

**Bekannte Issues:**
- ⚠️ **Feature nicht vollständig implementiert**
- 🐛 **Keine Backend-Integration**
- ⚠️ **Schema vorhanden, aber nicht getestet**

**Was fehlt:**
- Backend-Integration
- Review-Template-System
- Rating-System
- Goals-Tracking

**Empfehlung:** Feature ist zu unreif. Entweder:
- Vollständig implementieren (2-3 Wochen)
- Oder: Entfernen/Disablen

---

### **2. ADMIN SCREENS** (24 Screens)

---

#### **2.1 TeamUndMitarbeiterverwaltung** 👥

**Datei:** `/screens/admin/TeamUndMitarbeiterverwaltung.tsx`  
**Zugriff:** 🔐 **HR, ADMIN, SUPERADMIN**  
**Status:** ✅ **Production Ready** (85% fertig)

**Was macht dieser Screen?**
Zentrale Verwaltung aller Mitarbeiter und Teams.

**Userflow - Mitarbeiter-Verwaltung:**

1. **Admin öffnet Team & Mitarbeiterverwaltung**
2. **Tab "Mitarbeiter":**
   - **Virtualisierte Liste** aller Mitarbeiter:
     - Name
     - Email
     - Position
     - Abteilung
     - Standort
     - Status (Aktiv/Inaktiv)
   - **Suche:**
     - Nach Name
     - Nach Email
     - Nach Position
   - **Filter:**
     - Nach Abteilung
     - Nach Standort
     - Nach Rolle
     - Nach Status
   - **Sortierung:**
     - Nach Name (A-Z / Z-A)
     - Nach Eintrittsdatum
     - Nach Position
3. **Quick Actions pro Mitarbeiter:**
   - **View Details** → TeamMemberDetailsScreen öffnet sich
   - **Edit** → Quick-Edit-Dialog
   - **Delete** (nur SUPERADMIN)
   - **Send Message** (optional)
4. **Bulk-Operations:**
   - Mehrere Mitarbeiter auswählen (Checkboxen)
   - Bulk-Actions:
     - Export to CSV
     - Bulk-Edit (z.B. Abteilung ändern)
     - Bulk-Delete (nur SUPERADMIN)

**Userflow - Team-Verwaltung:**

1. **Admin wechselt zu Tab "Teams"**
2. **Team-Liste** zeigt:
   - Team-Name
   - Team-Lead
   - Anzahl Mitglieder
   - Abteilung
   - Actions
3. **Team-Card:**
   - Team-Info
   - Mitglieder-Liste (mit Profilbildern)
   - "Edit"-Button → TeamDialog öffnet sich
   - "Delete"-Button (nur SUPERADMIN)
4. **Team erstellen:**
   - "+ Neues Team"-Button
   - TeamDialog öffnet sich:
     - Team-Name
     - Team-Lead auswählen
     - Abteilung auswählen
     - Mitglieder hinzufügen (Multi-Select)
     - Save
5. **Team bearbeiten:**
   - Click "Edit" auf Team-Card
   - TeamDialog mit vorausgefüllten Daten
   - Änderungen vornehmen
   - Save

**Bekannte Issues:**
- ✅ **Card-Header-Buttons responsive** (FIXED)
- ⚠️ **Bulk-Operations nicht vollständig getestet**
- 🐛 **Filter manchmal buggy** bei komplexen Queries

**Was fehlt:**
- Bulk-Operations testen
- CSV-Export implementieren
- Filter-Bug fixen

---

#### **2.2 TeamMemberDetailsScreen** 👤

**Datei:** `/screens/admin/TeamMemberDetailsScreen.tsx`  
**Zugriff:** 🔐 **HR, ADMIN, SUPERADMIN**  
**Status:** ✅ **Production Ready** (90% fertig)

**Was macht dieser Screen?**
Detaillierte Mitarbeiter-Ansicht mit 4 Tabs.

**Userflow:**

1. **Admin klickt "View Details"** auf einem Mitarbeiter
2. **TeamMemberDetailsScreen** öffnet sich mit Route `/admin/team/:userId`
3. **4 Tabs:**

**Tab 1: Mitarbeiterdaten** 📝

1. **5 Cards werden angezeigt:**
   - **Persönliche Informationen:**
     - Vorname, Nachname, Email, Telefon
     - Geburtsdatum, Geschlecht, Nationalität
     - Card-Level-Editing (Edit/Save Buttons)
   - **Arbeitsinformationen:**
     - Position, Abteilung, Standort
     - Eintrittsdatum, Austrittsdatum
     - Gehalt (nur ADMIN/SUPERADMIN)
     - Work-Time-Model
     - Card-Level-Editing
   - **Adresse:**
     - Straße, PLZ, Stadt, Land
     - Card-Level-Editing
   - **Bank-Informationen:**
     - IBAN, BIC, Bank-Name
     - Card-Level-Editing
   - **Notfall-Kontakt:**
     - Name, Beziehung, Telefon
     - Card-Level-Editing
2. **Admin kann:**
   - Jede Card einzeln bearbeiten (Edit-Button)
   - Änderungen speichern (Save-Button)
   - Bearbeitung abbrechen (Cancel-Button)

**Tab 2: Lernfortschritt** 🎓

1. **Übersicht** zeigt:
   - Gesamt-XP
   - Level
   - Coins
2. **Videos-Section:**
   - Liste aller Videos mit Progress
   - Wie viel % angesehen
   - Abgeschlossen-Datum
3. **Quizzes-Section:**
   - Liste aller Quizzes
   - Score pro Quiz
   - Bestanden/Nicht bestanden
4. **Tests-Section:**
   - Liste aller Tests
   - Status (SUBMITTED / REVIEWED)
   - Score (falls reviewed)
   - Review-Button (HR kann bewerten)

**Tab 3: Logs** 📊

1. **Time Records:**
   - Letzte 30 Tage Zeiterfassung
   - Datum, Start, Ende, Gesamt, Pausen
   - Filter nach Zeitraum
2. **Leave Requests:**
   - Alle Urlaubsanträge
   - Status, Zeitraum, Typ
   - Approval-Chain anzeigen
3. **Document-Activity:**
   - Hochgeladene Dokumente
   - Downloads
   - Views (Audit-Log)
4. **System-Activity:**
   - Logins
   - Settings-Änderungen
   - Permission-Änderungen

**Tab 4: Berechtigungen** 🔐

1. **Rollen-Management:**
   - Aktuelle Rolle anzeigen (USER / TEAMLEAD / HR / ADMIN / SUPERADMIN)
   - Rolle ändern (Dropdown)
   - Save-Button
2. **Individual Permissions:**
   - Liste aller Permission-Keys (~50+)
   - Checkboxen:
     - ✅ Granted (grün)
     - ❌ Revoked (rot)
     - ⚪ Default (grau, von Rolle geerbt)
   - GRANT/REVOKE-Buttons
3. **Permission-Categories:**
   - Mitarbeiter-Verwaltung
   - Dokumente
   - Learning
   - Benefits
   - Zeiterfassung
   - System

**Bekannte Issues:**
- ⚠️ Keine bekannten größeren Issues
- 🐛 **Permissions-Editor könnte mehr Validierung brauchen**

**Was fehlt:**
- Permissions-Validierung (z.B. SUPERADMIN darf nicht zu USER degradiert werden)
- Change-Log für Permission-Änderungen

---

#### **2.3 AddEmployeeScreen** ➕

**Datei:** `/screens/admin/AddEmployeeScreen.tsx`  
**Zugriff:** 🔐 **HR, ADMIN, SUPERADMIN**  
**Status:** ✅ **Production Ready** (85% fertig)

**Was macht dieser Screen?**
Neuen Mitarbeiter anlegen (Single-Page-Form).

**Userflow:**

1. **Admin klickt "+ Neuer Mitarbeiter"**
2. **AddEmployeeScreen** öffnet sich
3. **3 Sektionen:**

**Sektion 1: Login-Daten** 🔐
- Email (wird Username)
- Passwort
- Passwort wiederholen
- Validation:
  - Email-Format prüfen
  - Passwort-Stärke (min. 8 Zeichen)
  - Passwörter stimmen überein

**Sektion 2: Persönliche Daten** 👤
- Vorname, Nachname
- Geburtsdatum
- Geschlecht
- Telefon
- Nationalität
- Validation:
  - Alle Pflichtfelder ausgefüllt

**Sektion 3: Rollenzuweisung** 🔐
- Rolle auswählen (Dropdown):
  - USER
  - TEAMLEAD
  - HR
  - ADMIN
  - SUPERADMIN (nur für SUPERADMIN sichtbar)
  - EXTERN
- Position
- Abteilung (Dropdown)
- Standort (Dropdown)
- Team zuweisen (Multi-Select)
- Eintrittsdatum
- Gehalt (optional, nur ADMIN/SUPERADMIN)
- Work-Time-Model (Dropdown)

4. **Admin klickt "Mitarbeiter anlegen":**
   - Validation läuft
   - Fehlermeldungen werden angezeigt (falls Fehler)
   - Bei Erfolg:
     - User wird in Supabase Auth angelegt
     - Profil wird in users-Tabelle erstellt
     - Team-Assignments werden erstellt
     - Success-Message
     - Redirect zu TeamUndMitarbeiterverwaltung

**Bekannte Issues:**
- ✅ **Salary-Input funktioniert** (FIXED v4.8.0)
- ✅ **Duplicate Key Error behoben** (FIXED)
- ✅ **User Creation funktioniert** (FIXED)
- ⚠️ **Keine systematischen Tests mit Edge Cases**

**Was fehlt:**
- Email-Verification (aktuell deaktiviert)
- Welcome-Email senden
- Edge-Case-Testing

---

#### **2.4 AddEmployeeWizardScreen** 🧙

**Datei:** `/screens/admin/AddEmployeeWizardScreen.tsx`  
**Zugriff:** 🔐 **HR, ADMIN, SUPERADMIN**  
**Status:** 🟢 **75%+** (braucht Testing)

**Was macht dieser Screen?**
Mitarbeiter anlegen mit 4-Schritt-Wizard (Alternative zu AddEmployeeScreen).

**Userflow:**

1. **Admin wählt "Wizard-Modus"** (optional)
2. **Step 1: Basisdaten:**
   - Vorname, Nachname
   - Email, Passwort
   - "Weiter"-Button
3. **Step 2: Arbeitsinformationen:**
   - Position, Abteilung, Standort
   - Eintrittsdatum
   - Gehalt
   - "Zurück" / "Weiter"
4. **Step 3: Persönliche Daten:**
   - Geburtsdatum, Geschlecht
   - Telefon, Nationalität
   - Adresse
   - "Zurück" / "Weiter"
5. **Step 4: Workflow-Zuweisung:**
   - Team zuweisen
   - Rolle zuweisen
   - Permissions setzen
   - "Zurück" / "Mitarbeiter anlegen"
6. **Progress-Anzeige:**
   - 4 Steps mit Checkmarks
   - Aktiver Step hervorgehoben

**Bekannte Issues:**
- ⚠️ **Wizard-Flow nicht vollständig getestet**
- 🐛 **Zurück-Navigation manchmal buggy**
- ⚠️ **Workflow-Zuweisung nicht implementiert**

**Was fehlt:**
- Zurück-Navigation stabilisieren
- Workflow-Zuweisung implementieren (oder entfernen)
- Wizard vs. Single-Page entscheiden

**Empfehlung:** AddEmployeeScreen ist besser. Wizard optional oder entfernen.

---

#### **2.5 CompanySettingsScreen** 🏢

**Datei:** `/screens/admin/CompanySettingsScreen.tsx`  
**Zugriff:** 🔐 **ADMIN, SUPERADMIN**  
**Status:** ✅ **Production Ready** (85% fertig)

**Was macht dieser Screen?**
Firmen-Einstellungen verwalten (Logo, Standorte, Abteilungen, etc.).

**Userflow:**

1. **Admin öffnet Firmeneinstellungen**
2. **5 Tabs:**

**Tab 1: Basic Settings** ⚙️
- Firmenname
- Adresse
- Telefon
- Website
- Email
- Branche
- Anzahl Mitarbeiter
- Gründungsjahr
- Card-Level-Editing

**Tab 2: Company Logo** 🖼️
- Aktuelles Logo anzeigen
- Upload-Button:
  - Datei auswählen
  - Image-Crop-Dialog
  - Upload → Storage
  - Logo wird in organization-Tabelle gespeichert
- Logo wird überall in der App angezeigt

**Tab 3: Standorte** 📍
- **LocationManager-Component:**
  - Liste aller Standorte
  - Jeder Standort zeigt:
    - Name
    - Adresse
    - Anzahl Mitarbeiter
    - Edit/Delete Buttons
  - "+ Neuer Standort"-Button (responsive Pattern):
    - Desktop: Button mit Text
    - Mobile: Icon-Only
  - **Create-Dialog:**
    - Name
    - Straße, PLZ, Stadt, Land
    - Save → Standort wird erstellt
  - **Edit-Dialog:**
    - Vorausgefüllte Daten
    - Änderungen speichern
  - **Delete:**
    - Confirmation-Dialog
    - Delete → Standort wird gelöscht (nur wenn keine Mitarbeiter zugewiesen)

**Tab 4: Abteilungen** 🏬
- **DepartmentManager-Component:**
  - Liste aller Abteilungen
  - Jede Abteilung zeigt:
    - Name
    - Beschreibung
    - Anzahl Mitarbeiter
    - Edit/Delete Buttons
  - "+ Neue Abteilung"-Button (responsive Pattern)
  - **Create-Dialog:**
    - Name
    - Beschreibung
    - Standort zuweisen (optional)
    - Save
  - **Edit-Dialog:**
    - Vorausgefüllte Daten
    - Änderungen speichern
  - **Delete:**
    - Confirmation
    - Delete (nur wenn keine Mitarbeiter)

**Tab 5: Spezialisierungen** 🎯
- **SpecializationManager-Component:**
  - Master-Tabelle für Spezialisierungen (z.B. React, Python, SAP)
  - Wird in Wiki-System verwendet
  - Liste aller Spezialisierungen
  - Create/Edit/Delete-Dialogs

**Bekannte Issues:**
- ✅ **Location/Department Manager Buttons responsive** (FIXED)
- ⚠️ Keine bekannten Issues

**Was fehlt:**
- Working-Hours-Settings (Bürozeiten)
- Break-Settings (Pausenregelungen) - teilweise implementiert
- Vacation-Days-Settings (Urlaubstage-Regelungen)

---

#### **2.6 LearningManagementScreen** 🎓

**Datei:** `/screens/admin/LearningManagementScreen.tsx`  
**Zugriff:** 🔐 **HR, ADMIN, SUPERADMIN**  
**Status:** 🟢 **75%+** (komplex, braucht Testing)

**Was macht dieser Screen?**
Learning-Content verwalten: Videos, Tests, Wiki, Avatar-Items, Training-Compliance.

**Userflow:**

1. **Admin öffnet Learning-Management**
2. **6 Tabs:**

**Tab 1: Overview** 📊
- **Stats-Grid:**
  - Gesamt-Videos
  - Gesamt-Tests
  - Gesamt-Wiki-Artikel
  - Active-Learners (diese Woche)
- **Recent-Activity:**
  - Letzte Video-Views
  - Letzte Test-Submissions
  - Letzte Wiki-Edits

**Tab 2: Videos** 🎬
- **Videos-Liste:**
  - Alle Videos (Admin-Ansicht)
  - Jedes Video zeigt:
    - Thumbnail
    - Titel
    - Kategorie
    - Views
    - Avg. Progress
    - Edit/Delete Buttons
- **+ Neues Video"-Button:**
  - **CreateVideoDialog:**
    - Titel
    - Beschreibung
    - Kategorie
    - YouTube-URL
    - XP-Belohnung
    - Coin-Belohnung
    - Visibility (Alle / Bestimmte Rollen)
    - Save → Video wird erstellt
- **Edit-Video:**
  - **EditVideoDialog:**
    - Vorausgefüllte Daten
    - Änderungen speichern
- **Delete-Video:**
  - Confirmation
  - Delete → Video + alle Assignments werden gelöscht
- **Video-Linking:**
  - Videos zu Tests/Units verknüpfen (Feature komplex, buggy)

**Tab 3: Tests** 📝
- **Test-Liste:**
  - Alle Tests
  - Jeder Test zeigt:
    - Titel
    - Anzahl Fragen
    - Anzahl Blocks
    - Submissions
    - Edit/Delete Buttons
- **+ Neuer Test"-Button:**
  - → Redirect zu TestBuilderScreen
- **Edit-Test:**
  - → Redirect zu TestBuilderScreen mit testId
- **Test-Submissions:**
  - Liste aller User-Submissions
  - Review-Funktion (HR bewertet)

**Tab 4: Wiki** 📚
- **Wiki-Artikel-Liste:**
  - Alle Artikel
  - Jeder Artikel zeigt:
    - Titel
    - Autor
    - Last-Edit
    - Spezialisierungen
    - RAG-Access-Control
    - Views
    - Edit/Delete Buttons
- **+ Neuer Artikel"-Button:**
  - **CreateWikiArticleDialog:**
    - Titel
    - Kategorie
    - Spezialisierungen (Multi-Select)
    - RAG-Access:
      - INTERN_WIKI
      - WEBSITE_RAG
      - HOTLINE_RAG
    - Content (Rich-Text-Editor)
    - Images uploaden
    - Save
- **Edit-Artikel:**
  - **EditWikiArticleDialog:**
    - Vorausgefüllte Daten
    - Versionierung
    - Save
- **Wiki-Fulltext-Search:**
  - Search-Bar
  - Filtert Artikel
  - Migration 071 vorhanden

**Tab 5: Avatar** 👤
- **Avatar-Items-Management:**
  - Wie AvatarSystemAdminScreen
  - Items erstellen/bearbeiten/löschen

**Tab 6: Training-Compliance** 🎯
- **Training-Compliance-Tracking:**
  - Externe Trainings erfassen
  - Verpflichtende Trainings definieren
  - Compliance-Status pro Mitarbeiter
  - Ablauf-Warnungen
  - **Feature neu implementiert (v4.13.3)**

**Bekannte Issues:**
- 🐛 **Video-Management hatte mehrere Bugs** (teilweise gefixt)
- ⚠️ **Test-Builder sehr komplex**, nicht vollständig getestet
- 🐛 **Wiki-System mehrfach überarbeitet** (v4.12.17 - v4.12.33)
- ⚠️ **Training-Compliance System neu**, ungetestet
- 🐛 **Video-Linking buggy** (orphaned assignments)

**Was fehlt:**
- Video-Linking-Bugs fixen
- Test-Builder stabilisieren
- Wiki-Image-Upload testen
- Training-Compliance mit echten Daten testen

---

#### **2.7 BenefitsManagementScreen** 🎁

**Datei:** `/screens/admin/BenefitsManagementScreen.tsx`  
**Zugriff:** 🔐 **HR, ADMIN, SUPERADMIN**  
**Status:** ✅ **Production Ready** (85% fertig)

**Was macht dieser Screen?**
Benefits und Achievements verwalten, Approval-Queue, Coin-Distribution.

**Userflow:**

1. **Admin öffnet Benefits-Management**
2. **2 Tabs:**

**Tab 1: Benefits** 🎁

- **Benefits-Liste:**
  - Alle Benefits (Admin-Ansicht)
  - Jedes Benefit zeigt:
    - Titel
    - Kategorie
    - Coin-Preis (falls gesetzt)
    - Verfügbarkeit
    - Requests (Anzahl)
    - Edit/Delete Buttons
- **+ Neues Benefit"-Button:**
  - **CreateBenefitDialog:**
    - Titel
    - Beschreibung
    - Kategorie
    - Coin-Preis (optional)
    - Verfügbarkeit (Anzahl)
    - Wert (optional)
    - Bild hochladen
    - Visibility (Alle / Bestimmte Rollen)
    - Save
- **Edit-Benefit:**
  - **EditBenefitDialog:**
    - Vorausgefüllte Daten
    - Änderungen speichern
- **Delete-Benefit:**
  - Confirmation
  - Delete (nur wenn keine PENDING Requests)
- **Approval-Queue:**
  - Liste aller PENDING Benefit-Requests
  - Jeder Request zeigt:
    - User-Name
    - Benefit-Name
    - Request-Datum
    - Nachricht (falls vorhanden)
    - Approve/Reject Buttons
  - **Approve:**
    - Click → Request wird approved
    - User bekommt Notification
    - Status ändert sich zu APPROVED
  - **Reject:**
    - Grund eingeben (optional)
    - Click → Request wird rejected
    - User bekommt Notification mit Grund
  - **Bulk-Approve/Reject:**
    - Mehrere Requests auswählen
    - Approve/Reject All

**Tab 2: Achievements** 🏆

- **Achievements-Liste:**
  - Alle Achievements
  - Jedes Achievement zeigt:
    - Icon
    - Titel
    - Kategorie
    - Unlock-Bedingung
    - Coin-Belohnung
    - XP-Belohnung
    - Unlocked-by (Anzahl User)
    - Edit/Delete Buttons
- **+ Neues Achievement"-Button:**
  - **CreateAchievementDialog:**
    - Titel
    - Beschreibung
    - Kategorie
    - Icon (Emoji-Picker)
    - Unlock-Bedingung (z.B. "10 Videos ansehen")
    - Coin-Belohnung
    - XP-Belohnung
    - Save
- **Edit-Achievement:**
  - Vorausgefüllte Daten
  - Änderungen speichern
- **Delete-Achievement:**
  - Confirmation
  - Delete
- **Coin-Distribution-Tool:**
  - Coins manuell an User verteilen
  - User auswählen (Multi-Select)
  - Anzahl Coins
  - Grund (optional)
  - "Distribute"-Button
  - Coins werden gutgeschrieben
  - Notification an User

**Bekannte Issues:**
- ✅ **Coin-Shop vollständig implementiert** (v3.8.0)
- ✅ **Achievements System implementiert** (v3.9.0)
- ⚠️ **Approval-Flow nicht vollständig getestet**

**Was fehlt:**
- Approval-Flow mit echten Usern testen
- Bulk-Operations testen
- Achievement-Auto-Unlock testen

---

#### **2.8 DashboardAnnouncementsScreen** 📢

**Datei:** `/screens/admin/DashboardAnnouncementsScreen.tsx`  
**Zugriff:** 🔐 **HR, ADMIN, SUPERADMIN**  
**Status:** ✅ **Production Ready** (90% fertig)

**Was macht dieser Screen?**
Dashboard-Mitteilungen erstellen und verwalten (Rich-Content).

**Userflow:**

1. **Admin öffnet Dashboard-Announcements**
2. **Announcements-Liste:**
   - Alle Announcements (chronologisch)
   - Jedes Announcement zeigt:
     - Titel
     - Autor
     - Erstellt/Bearbeitet von
     - Published/Draft Status
     - Priority (HIGH / MEDIUM / LOW)
     - Preview (erste Zeilen)
     - Edit/Delete Buttons
3. **+ Neue Mitteilung"-Button:**
   - **Create-Dialog öffnet sich:**
     - **Titel** (Pflichtfeld)
     - **Priority** (Dropdown):
       - HIGH (rot)
       - MEDIUM (gelb)
       - LOW (grau)
     - **Rich-Text-Editor (WYSIWYG):**
       - Bold, Italic, Underline
       - Headings (H1-H6)
       - Lists (Bullets, Numbers)
       - Links
       - Images (Upload)
       - Code-Blocks
       - Tables (optional)
     - **Preview-Button:**
       - Zeigt wie Announcement auf Dashboard aussieht
     - **Visibility:**
       - Alle User
       - Bestimmte Rollen (Multi-Select)
       - Bestimmte Teams (Multi-Select)
     - **Published/Draft:**
       - Draft → Nur Admins sehen
       - Published → Alle User sehen
     - **Save"-Button:**
       - Announcement wird gespeichert
       - Success-Message
4. **Edit-Announcement:**
   - Click "Edit"
   - Dialog öffnet sich mit vorausgefüllten Daten
   - "Edited-by"-Tracking (wer hat wann bearbeitet)
   - Änderungen speichern
5. **Delete-Announcement:**
   - Confirmation
   - Delete

**Bekannte Issues:**
- ✅ **Storage Bucket erfolgreich deployed** (FIXED v3.5.9)
- ✅ **Preview funktioniert** (FIXED v3.6.1)
- ✅ **Edited-by-Feature implementiert** (v3.6.2)
- ⚠️ Keine bekannten Issues

**Was fehlt:**
- Email-Notification bei neuen Announcements (optional)
- Scheduling (Announcement zu bestimmtem Zeitpunkt publishen)

---

#### **2.9 OrganigramCanvasScreenV2** 🎨

**Datei:** `/screens/admin/OrganigramCanvasScreenV2.tsx`  
**Zugriff:** 🔐 **HR, ADMIN, SUPERADMIN**  
**Status:** ✅ **Production Ready** (80% fertig)

**Was macht dieser Screen?**
Canvas-basierter Organigram-Editor (wie Canva/Figma).

**Userflow:**

1. **Admin öffnet Organigram-Editor**
2. **Canvas-View** zeigt:
   - Alle Nodes (Departments)
   - Alle Connections (Reporting-Lines)
   - Draft/Live-Toggle (oben rechts)
   - Auto-Save-Indicator
3. **Toolbar** (links):
   - **Add Node** (+ Button)
   - **Add Connection** (Link-Icon)
   - **Delete** (Trash-Icon)
   - **Undo/Redo** (History)
   - **Zoom In/Out**
   - **Fit to Screen**
   - **Line-Style** (Solid / Dashed / Curved)
   - **Publish**-Button (macht Draft → Live)

**Userflow - Node erstellen:**

1. **Admin klickt "+ Add Node"**
2. **CreateNodeDialog öffnet sich:**
   - Node-Type:
     - Department
     - Team
     - Position
   - Name
   - Beschreibung
   - Farbe (Color-Picker)
   - Team-Lead auswählen (falls Department)
   - Save
3. **Node erscheint auf Canvas:**
   - Drag & Drop zu beliebiger Position
   - Click auf Node → Select
   - Double-Click → Edit-Dialog

**Userflow - Connection erstellen:**

1. **Admin klickt "Add Connection"**
2. **Click auf Source-Node** (z.B. CEO)
3. **Click auf Target-Node** (z.B. CTO)
4. **Connection-Line wird gezeichnet:**
   - Typ: Reporting-Line (Target berichtet an Source)
   - Line-Style auswählbar
   - Click auf Line → Delete
5. **Multi-Connection:**
   - Ein Node kann mehrere Connections haben
   - Multi-Connection-Guide vorhanden

**Userflow - Employee-Assignment:**

1. **Admin klickt Node**
2. **Node-Detail-Panel öffnet sich:**
   - Assigned-Employees (Liste)
   - "+ Add Employee"-Button
   - **AssignEmployeesDialog:**
     - Multi-Select aller Mitarbeiter
     - Search & Filter
     - Save
   - Mitarbeiter werden dem Node zugewiesen
   - Im Node erscheinen kleine Profilbilder

**Userflow - Draft/Live-System:**

1. **Admin arbeitet in Draft-Version:**
   - Änderungen werden automatisch in Draft gespeichert
   - Auto-Save alle 30 Sekunden
2. **Admin klickt "Publish":**
   - Confirmation-Dialog
   - "Publish"-Button
   - Draft wird zu Live kopiert
   - Alle User sehen neue Version
3. **History/Undo:**
   - Admin kann Änderungen rückgängig machen
   - History-Panel zeigt letzte 20 Änderungen

**Userflow - Department-Integration:**

1. **Departments aus CompanySettings werden automatisch synchronisiert**
2. **Admin kann:**
   - Neues Department anlegen (erscheint in CompanySettings)
   - Department bearbeiten
   - Department löschen (nur wenn keine Mitarbeiter)

**Bekannte Issues:**
- ⚠️ **Trackpad-Interaktion manchmal buggy** (Reconnection Guide vorhanden)
- 🐛 **Performance bei sehr großen Organigrammen ungetestet** (100+ Nodes)
- ⚠️ **Multi-Connection manchmal konfus für User**

**Was fehlt:**
- Trackpad-Bug fixen
- Performance-Testing mit großen Organigrammen
- Templates (z.B. Standard-Hierarchien)

---

#### **2.10 FieldManagementScreen** 🚜

**Datei:** `/screens/admin/FieldManagementScreen.tsx`  
**Zugriff:** 🔐 **HR, ADMIN, SUPERADMIN**  
**Status:** 🟢 **75%+** (viele Bugs gefixt, braucht Testing)

**Was macht dieser Screen?**
Schichtplanung für Außendienst/Field-Mitarbeiter.

**Userflow:**

1. **Admin öffnet Feldverwaltung**
2. **Tab "Einsatzplanung":**

**Schichtplanung-Ansicht:**

1. **Weekly-Shift-Calendar:**
   - 7 Tage (Mo-So)
   - 24h-Timeline (0:00-23:59)
   - Grid mit Timeslots
2. **Sidebar (links):**
   - **Mini-Calendar:**
     - Woche auswählen
   - **Team-Accordion:**
     - Teams aufklappbar
     - Mitarbeiter-Liste pro Team
     - Drag & Drop Mitarbeiter auf Timeline
3. **Schicht erstellen:**
   - **Drag Mitarbeiter von Sidebar auf Timeline**
   - **Shift-Block erscheint:**
     - Profilbild
     - Name
     - Zeitbereich (z.B. 8:00-16:00)
   - **Resize-Handles:**
     - Schicht verlängern/verkürzen
   - **Drag Shift-Block:**
     - Zu anderem Tag verschieben
     - Zeit ändern
4. **Schicht bearbeiten:**
   - Click auf Shift-Block
   - **EditShiftDialog:**
     - Mitarbeiter ändern
     - Zeitbereich ändern
     - Notizen hinzufügen
     - Save
5. **Schicht löschen:**
   - Click auf Shift-Block
   - Delete-Button
   - Confirmation
   - Delete
6. **Multi-Shift-Assignment:**
   - Mehrere Mitarbeiter gleichzeitig zuweisen
   - Bulk-Create-Dialog

**Bekannte Issues:**
- 🐛 **Schichtplanung hatte sehr viele Bugs** (mehrfach gefixt)
- ✅ **SQL-Fehler behoben** (v4.12.0)
- ✅ **UI repariert** (v4.12.0)
- ✅ **Scrollbar-Visual-Improvements** (v4.12.30.2)
- ✅ **24h-Mitarbeiterauswahl-Bugs gefixt** (v4.12.3)
- ✅ **Avatar-URL-Fix** (v4.12.3)
- ⚠️ **RLS Policies mehrfach überarbeitet**
- 🐛 **Layout auf großen Monitoren nicht optimal** (Desktop Audit vorhanden v4.12.28)

**Was fehlt:**
- Desktop-Optimierung (max-width Container)
- Gründliches Testing mit echten Daten
- Konflikt-Detection (Mitarbeiter doppelt zugewiesen)
- Email-Notifications bei neuen Schichten

**Empfehlung:** Feature ist funktional, braucht aber Testing & Desktop-Optimierung.

---

#### **2.11 EquipmentManagementScreen** 🚗

**Datei:** `/screens/admin/EquipmentManagementScreen.tsx`  
**Zugriff:** 🔐 **HR, ADMIN, SUPERADMIN**  
**Status:** ✅ **Production Ready** (80% fertig, nur Fahrzeuge)

**Was macht dieser Screen?**
Fahrzeug- und Geräte-Management.

**Userflow:**

1. **Admin öffnet Equipment-Management**
2. **2 Tabs:**

**Tab 1: Fahrzeuge** 🚗

- **Fahrzeug-Liste:**
  - Alle Fahrzeuge
  - Jedes Fahrzeug zeigt:
    - Kennzeichen
    - Marke, Modell
    - Baujahr
    - Kilometerststand
    - Nächste Wartung
    - Zugewiesen an (Mitarbeiter)
    - View-Details-Button
- **+ Neues Fahrzeug"-Button:**
  - **CreateVehicleDialog:**
    - Kennzeichen
    - Marke, Modell
    - Baujahr
    - VIN (Fahrzeug-ID)
    - Kilometerstand
    - Kraftstoff-Typ
    - Versicherung (Details)
    - Nächste Wartung (Datum)
    - Save
- **View-Details:**
  - → VehicleDetailScreen öffnet sich
  - Vollständige Fahrzeug-Details
  - Dokumente (TÜV, Versicherung, etc.)
  - Wartungs-Historie
  - Zuweisungs-Historie
- **Fulltext-Search:**
  - Search-Bar
  - Suche nach Kennzeichen, Marke, Modell
  - Migration 20241127_vehicles_fts.sql vorhanden

**Tab 2: Geräte** 🔧

- ⚠️ **Nicht implementiert** (nur Platzhalter)

**Bekannte Issues:**
- ⚠️ **Geräte-Tab nicht implementiert**
- 🐛 **FTS Migration vorhanden aber nicht getestet**

**Was fehlt:**
- Geräte-Management implementieren (oder Tab entfernen)
- FTS testen

---

#### **2.12 VehicleDetailScreen** 🚙

**Datei:** `/screens/admin/VehicleDetailScreen.tsx`  
**Zugriff:** 🔐 **HR, ADMIN, SUPERADMIN**  
**Status:** ✅ **Production Ready** (85% fertig)

**Userflow:**

1. **Admin klickt "View Details"** auf Fahrzeug
2. **VehicleDetailScreen** öffnet sich mit Route `/admin/vehicles/:vehicleId`
3. **Screen zeigt:**
   - **Fahrzeug-Info-Card:**
     - Kennzeichen, Marke, Modell
     - Baujahr, VIN
     - Kilometerstand
     - Kraftstoff-Typ
     - Edit-Button
   - **Versicherung-Card:**
     - Versicherungs-Nummer
     - Versicherung-Firma
     - Ablauf-Datum
     - Edit-Button
   - **Wartung-Card:**
     - Nächste Wartung (Datum)
     - Letzte Wartung
     - Wartungs-Historie (Liste)
     - "+ Wartung hinzufügen"-Button
   - **Dokumente-Card:**
     - TÜV-Bericht
     - Versicherungs-Dokumente
     - Zulassungs-Bescheinigung
     - Upload-Button
   - **Zuweisungs-Card:**
     - Aktuell zugewiesen an (Mitarbeiter)
     - Zuweisungs-Historie
     - "Zuweisung ändern"-Button
4. **Wartung hinzufügen:**
   - **VehicleMaintenanceDialog:**
     - Datum
     - Typ (Inspektion / Reparatur / TÜV)
     - Werkstatt
     - Kosten
     - Beschreibung
     - Save
5. **Dokument hochladen:**
   - **VehicleDocumentUploadDialog:**
     - Kategorie (TÜV / Versicherung / Sonstiges)
     - Datei auswählen
     - Upload

**Bekannte Issues:**
- ⚠️ Keine bekannten Issues

**Was fehlt:**
- Kosten-Tracking (Gesamt-Kosten pro Fahrzeug)
- Wartungs-Erinnerungen (Email/Notification)

---

#### **2.13 ITEquipmentManagementScreen** 💻

**Datei:** `/screens/admin/ITEquipmentManagementScreen.tsx`  
**Zugriff:** 🔐 **HR, ADMIN, SUPERADMIN**  
**Status:** 🟡 **50%+** (Basic funktioniert)

**Was macht dieser Screen?**
IT-Equipment (Laptops, Monitore, etc.) verwalten.

**Userflow:**

1. **Admin öffnet IT-Equipment-Management**
2. **Equipment-Liste:**
   - Alle IT-Geräte
   - Jedes Gerät zeigt:
     - Typ (Laptop / Monitor / Phone / etc.)
     - Marke, Modell
     - Seriennummer
     - Zugewiesen an
     - Status (Verfügbar / Zugewiesen / Defekt)
     - Edit/Delete Buttons
3. **+ Neues Gerät"-Button:**
   - **CreateEquipmentDialog:**
     - Typ (Dropdown)
     - Marke, Modell
     - Seriennummer
     - Kaufdatum
     - Wert
     - Save
4. **Assignment:**
   - Gerät an Mitarbeiter zuweisen
   - Zuweisungs-Historie

**Bekannte Issues:**
- ⚠️ **Feature nicht vollständig implementiert**
- 🐛 **Keine Tests**

**Was fehlt:**
- Wartungs-Tracking
- Defekt-Meldungen
- Kosten-Tracking
- Assignment-Workflow

---

#### **2.14 AvatarSystemAdminScreen** 👤

**Datei:** `/screens/admin/AvatarSystemAdminScreen.tsx`  
**Zugriff:** 🔐 **HR, ADMIN, SUPERADMIN**  
**Status:** 🟢 **75%+** (braucht Testing)

**Userflow:**

1. **Admin öffnet Avatar-System-Admin**
2. **3 Tabs:**

**Tab 1: Items** 🎨
- Liste aller Avatar-Items
- Create/Edit/Delete-Dialogs
- Item-Properties:
  - Kategorie (Background / Face / Accessories)
  - Emoji/Icon
  - Coin-Preis
  - Unlock-Level
  - Visibility

**Tab 2: Levels** 📈
- Level-System konfigurieren
- XP-Requirements pro Level
- Belohnungen pro Level
- Level-Milestones

**Tab 3: Achievements** 🏆
- Wie BenefitsManagementScreen → Achievements-Tab

**Bekannte Issues:**
- ⚠️ Nicht vollständig getestet
- 🐛 Achievement-Unlock-Logic komplex

**Was fehlt:**
- Testing
- Level-System-Konfigurator verbessern

---

#### **2.15 TestBuilderScreen** 📝

**Datei:** `/screens/admin/TestBuilderScreen.tsx`  
**Zugriff:** 🔐 **HR, ADMIN, SUPERADMIN**  
**Status:** 🟡 **50%+** (sehr komplex, braucht viel Arbeit)

**Was macht dieser Screen?**
Tests erstellen mit Wizard-System und Block-Editor.

**Userflow:**

1. **Admin öffnet Test-Builder** (von LearningManagementScreen)
2. **Wizard-Steps:**

**Step 1: Test-Info**
- Titel
- Beschreibung
- Passing-Score (z.B. 80%)
- Timer (optional)
- "Weiter"

**Step 2: Blocks erstellen**
- **Blocks** = Gruppen von Fragen (z.B. "Grundlagen", "Fortgeschritten")
- "+ Block hinzufügen"-Button
- Jeder Block:
  - Block-Name
  - Block-Beschreibung
  - Reihenfolge (Drag & Drop)

**Step 3: Fragen hinzufügen**
- Pro Block:
  - "+ Frage hinzufügen"
  - **Frage-Editor:**
    - Frage-Text
    - Frage-Typ (Multiple-Choice / True-False / Text)
    - Antwort-Optionen (4 Optionen)
    - Richtige Antwort markieren
    - Punkte pro Frage
    - Save
  - Drag & Drop Fragen zwischen Blocks

**Step 4: Preview & Publish**
- Test-Preview
- "Publish"-Button
- Test wird veröffentlicht

**Bekannte Issues:**
- 🐛 **Test-Builder sehr komplex**
- ⚠️ **Block-System hatte RLS-Issues** (Migration 056)
- 🐛 **Test-Submission-System nicht vollständig getestet**
- ⚠️ **Drag & Drop manchmal buggy**

**Was fehlt:**
- Drag & Drop stabilisieren
- Block-RLS testen
- Submission-Review-Flow testen
- UI vereinfachen

**Empfehlung:** Feature braucht Überarbeitung oder Vereinfachung.

---

#### **2.16 AutomationManagementScreen** 🤖

**Datei:** `/screens/admin/AutomationManagementScreen.tsx`  
**Zugriff:** 🔐 **SUPERADMIN**  
**Status:** 🟢 **75%+** (braucht Testing)

**Was macht dieser Screen?**
API-Keys für n8n/Zapier-Integration verwalten.

**Userflow:**

1. **Superadmin öffnet Automation-Management**
2. **API-Keys-Liste:**
   - Alle API-Keys
   - Jeder Key zeigt:
     - Key-Name
     - Erstellt von
     - Erstellt am
     - Last-Used (optional)
     - Actions (Copy / Delete)
3. **+ Neuer API-Key"-Button:**
   - **CreateAPIKeyDialog:**
     - Key-Name
     - Beschreibung
     - "Generate"-Button
   - API-Key wird generiert (UUID)
   - Key wird angezeigt (nur einmal!)
   - "Copy to Clipboard"-Button
   - User muss Key speichern
4. **API-Key-Usage:**
   - Für n8n/Zapier-Integration
   - 186+ Automation-Actions verfügbar
   - Alle Edge-Function-Routes automatisch
5. **Workflow-Übersicht:**
   - Liste aller aktiven Workflows (optional)
   - Trigger-Count
   - Success/Error-Rate

**Bekannte Issues:**
- 🐛 **RLS Policies mehrfach gefixt**
- ⚠️ **API-Key-Generation hatte Bugs** (v4.11.1)
- 🐛 **Case-Insensitive-Fix notwendig**
- ✅ **Chevron-Button-Fix** (v4.11.7)
- ✅ **Collapsible-Details** (v4.11.6)

**Was fehlt:**
- API-Key-Rotation
- Usage-Metrics
- Rate-Limiting

---

#### **2.17 WorkflowsScreen** 🔄

**Datei:** `/screens/admin/WorkflowsScreen.tsx`  
**Zugriff:** 🔐 **ADMIN, SUPERADMIN**  
**Status:** 🟡 **50%+** (unreif)

**Was macht dieser Screen?**
Workflow-Automation mit Visual-Editor (n8n-ähnlich).

**Userflow (geplant):**

1. **Admin öffnet Workflows**
2. **Workflow-Liste:**
   - Alle Workflows
   - Status (Active / Inactive)
   - Trigger-Type
   - Last-Run
   - Actions
3. **+ Neuer Workflow"-Button:**
   - → WorkflowDetailScreen
4. **Workflow-Status:**
   - Active/Inactive Toggle
   - Delete-Button

**Bekannte Issues:**
- ⚠️ **Workflow-Engine nicht vollständig implementiert**
- 🐛 **Trigger-System komplex und ungetestet**
- ⚠️ **n8n-Integration nur als Konzept**

**Was fehlt:**
- Workflow-Engine vollständig implementieren
- Trigger-System testen
- Visual-Editor stabilisieren

**Empfehlung:** Feature braucht viel Arbeit oder sollte entfernt werden.

---

#### **2.18 WorkflowDetailScreen** 🔄

**Datei:** `/screens/admin/WorkflowDetailScreen.tsx`  
**Zugriff:** 🔐 **ADMIN, SUPERADMIN**  
**Status:** 🟠 **25%+** (zu unreif)

**Was macht dieser Screen?**
Visual Workflow-Editor mit React-Flow.

**Userflow (geplant):**

1. **Admin erstellt/öffnet Workflow**
2. **Visual-Editor:**
   - Canvas mit Nodes
   - Trigger-Node (Start)
   - Action-Nodes (HTTP-Request, Email, etc.)
   - Verbindungen zwischen Nodes
3. **Node-Editor:**
   - Config-Panel rechts
   - Node-Properties bearbeiten
4. **Save & Activate**

**Bekannte Issues:**
- ⚠️ **Sehr komplex, kaum getestet**
- 🐛 **Node-Connections manchmal buggy**
- ⚠️ **Trigger-System unvollständig**

**Was fehlt:**
- Alles

**Empfehlung:** Feature entfernen oder komplett neu bauen.

---

#### **2.19 SystemHealthScreen** 🏥

**Datei:** `/screens/admin/SystemHealthScreen.tsx`  
**Zugriff:** 🔐 **SUPERADMIN**  
**Status:** ✅ **Production Ready** (80% fertig)

**Userflow:**

1. **Superadmin öffnet System-Health**
2. **Dashboard zeigt:**
   - **Edge-Function-Status:**
     - Liste aller Functions
     - Status (Healthy / Error)
     - Response-Time
     - Error-Rate
   - **Database-Health:**
     - Connection-Status
     - Query-Performance
     - Table-Sizes
   - **Storage-Health:**
     - Bucket-Sizes
     - Upload-Errors
   - **Performance-Metrics:**
     - Avg. Page-Load
     - API-Response-Times
     - Error-Rate

**Bekannte Issues:**
- ⚠️ Nicht mit allen Edge Functions getestet
- 🐛 Metrics manchmal nicht aktuell

**Was fehlt:**
- Real-time-Updates
- Alerting (Email bei Errors)

---

#### **2.20 EmailTemplatesScreen** 📧

**Datei:** `/screens/admin/EmailTemplatesScreen.tsx`  
**Zugriff:** 🔐 **HR, ADMIN, SUPERADMIN**  
**Status:** 🟠 **25%+** (unreif)

**Was macht dieser Screen?**
Email-Templates für automatische Emails (Onboarding, Leave-Approval, etc.).

**Userflow (geplant):**

1. **Admin öffnet Email-Templates**
2. **Template-Liste**
3. **Template erstellen** mit Rich-Text-Editor
4. **Variable-Placeholders** (z.B. {{user_name}})
5. **Send-Test-Email**
6. **Activate**

**Bekannte Issues:**
- ⚠️ **Resend-Integration nicht vollständig**
- 🐛 **Template-Sending nicht getestet**
- ⚠️ **Feature nicht production-ready**

**Was fehlt:**
- Resend-Integration vollständig
- Template-System testen
- Send-Logic

**Empfehlung:** Feature entfernen oder vollständig implementieren (1-2 Wochen).

---

#### **2.21 EnvironmentVariablesScreen** 🔑

**Datei:** `/screens/admin/EnvironmentVariablesScreen.tsx`  
**Zugriff:** 🔐 **SUPERADMIN**  
**Status:** 🟢 **75%+** (braucht Testing)

**Userflow:**

1. **Superadmin öffnet Environment-Variables**
2. **Var-Liste:**
   - Alle Env-Vars
   - Key-Name
   - Value (verschleiert: •••••)
   - Actions
3. **+ Neue Variable"-Button:**
   - Key-Name
   - Value
   - Save → In Workflow-KV-Store
4. **Edit/Delete**

**Bekannte Issues:**
- ⚠️ Nicht vollständig getestet
- 🐛 Security-Concerns bei Display

**Was fehlt:**
- Encryption
- Audit-Log

---

#### **2.22-2.24 Performance-Review-Screens** 📊

**Dateien:**
- `/screens/admin/PerformanceReviewManagementScreen.tsx`
- `/screens/admin/PerformanceReviewTemplateBuilderScreen.tsx`

**Zugriff:** 🔐 **HR, ADMIN, SUPERADMIN**  
**Status:** 🟠 **25%+** (unreif)

**Was macht dieser Screen?**
Performance-Reviews verwalten und Template-Builder.

**Userflow (geplant):**

1. Admin erstellt Review-Template
2. Admin assigned Reviews an Mitarbeiter
3. Manager füllt Review aus
4. Mitarbeiter sieht Review

**Bekannte Issues:**
- ⚠️ **Feature nicht vollständig implementiert**
- 🐛 **Schema vorhanden aber nicht getestet**
- ⚠️ **Template-Builder unvollständig**

**Was fehlt:**
- Alles

**Empfehlung:** Feature entfernen oder vollständig implementieren (2-3 Wochen).

---

## 🎯 PRODUCTION-READINESS NACH ROLLEN

### **USER-FEATURES:**

| Feature | Status | Userflow | Production-Ready |
|---------|--------|----------|------------------|
| Dashboard | ✅ Production Ready | Komplett | ✅ Ja |
| Kalender | ✅ Production Ready | Komplett | ✅ Ja |
| Zeit & Urlaub | ✅ Production Ready | Komplett | ✅ Ja |
| Learning (Videos) | 🟢 75%+ | Komplett | 🟡 Mit Testing |
| Learning (Quizzes) | 🟡 50%+ | Teilweise | 🟡 Braucht Fixes |
| Learning (Tests) | 🟡 50%+ | Teilweise | 🟡 Braucht Fixes |
| Benefits | ✅ Production Ready | Komplett | ✅ Ja |
| Dokumente | ✅ Production Ready | Komplett | ✅ Ja |
| Meine Daten | ✅ Production Ready | Komplett | ✅ Ja |
| Avatar | 🟢 75%+ | Komplett | 🟡 Mit Testing |
| Achievements | 🟢 75%+ | Komplett | 🟡 Mit Testing |
| Organigram | ✅ Production Ready | Komplett | ✅ Ja |
| Chat | 🟡 50%+ | Teilweise | 🔴 Nein |
| Tasks | 🟡 50%+ | Teilweise | 🔴 Nein |
| Field | 🟠 25%+ | Minimal | 🔴 Nein |
| Performance Review | 🟠 25%+ | Minimal | 🔴 Nein |

### **ADMIN-FEATURES:**

| Feature | Status | Userflow | Production-Ready |
|---------|--------|----------|------------------|
| Team-Verwaltung | ✅ Production Ready | Komplett | ✅ Ja |
| Mitarbeiter-Details | ✅ Production Ready | Komplett | ✅ Ja |
| Mitarbeiter anlegen | ✅ Production Ready | Komplett | ✅ Ja |
| Firmen-Einstellungen | ✅ Production Ready | Komplett | ✅ Ja |
| Learning-Management | 🟢 75%+ | Komplett | 🟡 Mit Testing |
| Benefits-Management | ✅ Production Ready | Komplett | ✅ Ja |
| Announcements | ✅ Production Ready | Komplett | ✅ Ja |
| Organigram-Editor | ✅ Production Ready | Komplett | 🟡 Mit Bugs |
| Schichtplanung | 🟢 75%+ | Komplett | 🟡 Braucht Testing |
| Fahrzeuge | ✅ Production Ready | Komplett | ✅ Ja |
| IT-Equipment | 🟡 50%+ | Teilweise | 🟡 Basic funktioniert |
| Avatar-Admin | 🟢 75%+ | Komplett | 🟡 Mit Testing |
| Test-Builder | 🟡 50%+ | Teilweise | 🔴 Nein |
| Automation | 🟢 75%+ | Komplett | 🟡 Mit Testing |
| Workflows | 🟡 50%+ | Teilweise | 🔴 Nein |
| System-Health | ✅ Production Ready | Komplett | ✅ Ja |
| Email-Templates | 🟠 25%+ | Minimal | 🔴 Nein |
| Env-Variables | 🟢 75%+ | Komplett | 🟡 Mit Testing |
| Performance-Review-Management | 🟠 25%+ | Minimal | 🔴 Nein |

---

## 📊 ZUSAMMENFASSUNG FÜR ENTWICKLER

### **WAS FUNKTIONIERT GUT:**

**USER-FEATURES (12/17 = 71%):**
1. ✅ Dashboard
2. ✅ Kalender
3. ✅ Zeit & Urlaub
4. ✅ Benefits
5. ✅ Dokumente
6. ✅ Meine Daten
7. ✅ Organigram
8. 🟡 Learning (Videos/Quizzes/Tests brauchen Fixes)
9. 🟡 Avatar
10. 🟡 Achievements
11. ❌ Chat (unreif)
12. ❌ Tasks (unreif)

**ADMIN-FEATURES (12/19 = 63%):**
1. ✅ Team-Verwaltung
2. ✅ Mitarbeiter-Details
3. ✅ Mitarbeiter anlegen
4. ✅ Firmen-Einstellungen
5. ✅ Benefits-Management
6. ✅ Announcements
7. ✅ Fahrzeuge
8. ✅ System-Health
9. 🟡 Learning-Management (komplex, braucht Testing)
10. 🟡 Organigram-Editor (Trackpad-Bug)
11. 🟡 Schichtplanung (viele Fixes, braucht Testing)
12. 🟡 IT-Equipment (Basic)
13. ❌ Test-Builder (zu komplex)
14. ❌ Workflows (unreif)
15. ❌ Email-Templates (unreif)
16. ❌ Performance-Review (unreif)

### **WAS MUSS DER ENTWICKLER WISSEN:**

**CRITICAL (🔴 Blocker):**
1. **Keine Tests** - Alles nur manuell getestet
2. **Chat unreif** - Disablen oder 2-3 Wochen Arbeit
3. **Tasks unreif** - Disablen oder 1-2 Wochen Arbeit
4. **Workflows unreif** - Disablen oder komplett neu
5. **Test-Builder unreif** - Vereinfachen oder neu bauen

**MAJOR (🟡 Braucht Arbeit):**
1. **Learning-System** - Video-Linking-Bugs, organization_id NULL
2. **Schichtplanung** - Desktop-Optimierung, Testing
3. **Organigram** - Trackpad-Bug, Performance-Testing
4. **Mobile** - Viele Admin-Screens nicht responsive
5. **Backend** - Nur 3/14 Edge Functions deployed

**MINOR (🟢 Polishing):**
1. **Avatar/Achievements** - Testing mit echten Usern
2. **IT-Equipment** - Feature erweitern
3. **Automation** - Testing
4. **Error-Handling** - Verbessern

### **EMPFOHLENER PLAN FÜR DEV:**

**PHASE 1: AUFRÄUMEN (1-2 Wochen)**
1. ❌ Chat disablen (oder komplett neu 2-3 Wochen)
2. ❌ Tasks disablen (oder vollständig implementieren 1-2 Wochen)
3. ❌ Workflows disablen (oder komplett neu 3-4 Wochen)
4. ❌ Field-Screen entfernen (unklar was es machen soll)
5. ❌ Performance-Review entfernen (unreif)
6. ❌ Email-Templates entfernen (unreif)
7. ✅ Test-Builder vereinfachen oder disablen

**PHASE 2: BUGS FIXEN (1-2 Wochen)**
1. 🐛 Learning-Video-Linking
2. 🐛 organization_id NULL
3. 🐛 Schichtplanung Desktop-Optimierung
4. 🐛 Organigram Trackpad-Bug
5. 🐛 Quiz-Submit-Bug
6. 🐛 Achievement-Unlock-Logic

**PHASE 3: MOBILE-OPTIMIERUNG (1-2 Wochen)**
1. 📱 Admin-Screens responsive machen
2. 📱 Touch-Controls verbessern
3. 📱 Navigation optimieren

**PHASE 4: PWA-SETUP (1 Woche)**
1. 📱 Service-Worker
2. 📱 Manifest
3. 📱 Capacitor-Integration
4. 📱 Icons & Splash-Screens

**PHASE 5: TESTING (1-2 Wochen)**
1. ✅ Alle User-Screens manuell testen
2. ✅ Alle Admin-Screens testen
3. ✅ Edge-Cases finden
4. ✅ Bugs dokumentieren & fixen

**TOTAL: 5-9 Wochen bis Production-Launch**

**REALISTISCHER ZEITPLAN:**
- 🏃 **Aggressiv:** 5-6 Wochen
- 🚶 **Sorgfältig:** 7-9 Wochen
- 🧘 **Mit Backend-Migration:** 10-12 Wochen

---

**Erstellt:** 8. Dezember 2025  
**Für:** PWA-Entwickler-Übergabe  
**Nächster Schritt:** Entscheidung: Welche Features disablen/entfernen?

