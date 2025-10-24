# Dashboard Announcements System 📢

## Version 3.5.0 - Feature Complete

Das **Dashboard-Mitteilungen-System** ermöglicht HR/Admin/Superadmin die Verwaltung von Rich-Content-Mitteilungen, die auf dem Dashboard aller Mitarbeiter angezeigt werden.

---

## 🎯 Features im Überblick

### ✅ Für Admins (HR/ADMIN/SUPERADMIN)

#### **Admin → Dashboard-Mitteilungen**
- **Alle Mitteilungen verwalten**: Übersicht aller erstellten Mitteilungen
- **Erstellen**: Neue Mitteilungen mit Rich Content erstellen
- **Bearbeiten**: Bestehende Mitteilungen bearbeiten
- **Push to Live**: Mitteilung sofort live schalten
- **Remove from Live**: Live-Mitteilung entfernen
- **Löschen**: Mitteilungen permanent löschen

#### **3 Buttons beim Erstellen**
1. **Abbrechen**: Verwerfen
2. **Erstellen**: Nur speichern, nicht live
3. **Push to Live**: Sofort live schalten und auf Dashboard anzeigen

### ✅ Für alle Mitarbeiter

#### **Dashboard → Mitteilungen**
- **Live-Mitteilung sichtbar**: Unterhalb des Organigrams
- **Rich Content**: Text, Links, Bilder, Schulungsvideos, Benefits
- **Automatische Updates**: Wenn Admin neue Mitteilung live schaltet
- **Interaktiv**: Klickbare Links, eingebettete Videos/Benefits

---

## 📋 Rich Content Editor

### Verfügbare Content-Blöcke

#### **1. Text Block** 📝
- Einfacher Text oder mehrzeiliger Text
- Unterstützt Zeilenumbrüche
- Beispiel: "Willkommen im neuen Büro! Ab nächster Woche..."

#### **2. Link Block** 🔗
- **Link-Text**: Anzeigetext (z.B. "Klicke hier")
- **URL**: Ziel-URL (https://...)
- Öffnet sich in neuem Tab
- Beispiel: "Weitere Infos zur Umstellung"

#### **3. Bild Block** 🖼️
- **Bild-URL**: Direktlink zum Bild
- **Alt-Text**: Beschreibung (optional, für Accessibility)
- **Live-Vorschau**: Bild wird im Editor angezeigt
- Responsive: Passt sich an Bildschirmgröße an

#### **4. Schulungsvideo Block** 🎥
- **Dropdown**: Aus allen verfügbaren Schulungsvideos wählen
- **Klick-Aktion**: Leitet direkt zum Video weiter
- Zeigt Video-Titel als Button
- Nur Videos aus dem Lernzentrum verfügbar

#### **5. Benefit Block** 🎁
- **Dropdown**: Aus allen verfügbaren Benefits wählen
- **Klick-Aktion**: Leitet zur Benefits-Seite weiter
- Zeigt Benefit-Titel als Button
- Nur erstellte Benefits verfügbar

### Content Editor Funktionen
- **Block hinzufügen**: Dropdown + "Hinzufügen" Button
- **Reihenfolge ändern**: ⬆️ ⬇️ Buttons zum Verschieben
- **Block entfernen**: ❌ Button zum Löschen
- **Drag & Drop**: (geplant für zukünftige Version)

---

## 🔧 Technische Details

### Datenbank: `dashboard_announcements`

```sql
CREATE TABLE dashboard_announcements (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL, -- Rich content blocks
  is_live BOOLEAN DEFAULT false,
  pushed_live_at TIMESTAMPTZ,
  removed_from_live_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NOT NULL, -- Wer hat erstellt
  updated_by UUID,
  live_history JSONB DEFAULT '[]' -- Audit trail
);
```

### Content Format (JSONB)

```json
{
  "blocks": [
    {
      "type": "text",
      "content": "Willkommen im neuen Büro!"
    },
    {
      "type": "link",
      "text": "Mehr Infos hier",
      "url": "https://example.com"
    },
    {
      "type": "image",
      "url": "https://example.com/image.jpg",
      "alt": "Neues Büro"
    },
    {
      "type": "video",
      "videoId": "uuid-of-video"
    },
    {
      "type": "benefit",
      "benefitId": "uuid-of-benefit"
    }
  ]
}
```

### Automatische Trigger

#### **1. Nur EINE Live-Mitteilung**
```sql
-- Unique Index verhindert mehrere Live-Mitteilungen
CREATE UNIQUE INDEX idx_one_live_announcement_per_org 
  ON dashboard_announcements(organization_id) 
  WHERE is_live = true;
```

#### **2. Auto-Unpublish bei Push to Live**
- Wenn neue Mitteilung live geht → alte wird automatisch entfernt
- Trigger: `ensure_one_live_announcement()`

#### **3. Live History Tracking**
- Jeder Push/Remove wird automatisch geloggt
- Speichert: Aktion, Timestamp, User-ID
- Trigger: `track_announcement_live_history()`

---

## 🎨 UI/UX Design

### Dashboard-Anzeige

#### **Live-Mitteilung Card**
```
┌─────────────────────────────────────────────────┐
│ 📢 [Icon]                                    [X]│
│                                                  │
│ Wichtige Ankündigung: Neues Büro        [Aktuell]│
│ Von Max Mustermann • vor 2 Stunden              │
│                                                  │
│ Ab nächster Woche ziehen wir um...              │
│                                                  │
│ [🔗 Weitere Infos]                              │
│ [🎥 Schulungsvideo ansehen]                     │
│ [🎁 Benefit ansehen]                            │
└─────────────────────────────────────────────────┘
```

**Position**: Direkt unter Organigram-Card auf Dashboard

**Styling**:
- Gradient Background: `from-blue-50 to-indigo-50`
- Border: `border-blue-200`
- Badge: "Aktuell" in grün
- Icons: Farbcodiert nach Block-Typ

### Admin-Bereich

#### **Mitteilungen-Liste**
```
┌─────────────────────────────────────────────────┐
│ Wichtige Ankündigung              [Live Badge]  │
│ Von Max Mustermann • vor 2 Stunden             │
│ Live seit vor 1 Stunde                         │
│                                                  │
│ 5 Inhaltsblöcke                                 │
│                                                  │
│ [Remove from Live] [✏️ Edit] [🗑️ Delete]       │
└─────────────────────────────────────────────────┘
```

#### **Erstellen/Bearbeiten Dialog**
- **Max-Width**: 4xl (sehr breit für Content Editor)
- **Max-Height**: 90vh mit Scroll
- **Content Editor**: Visuelles Drag & Drop Interface
- **3 Buttons**: Abbrechen, Erstellen, Push to Live

---

## 📊 Business Logic

### Push to Live Flow

```
1. Admin klickt "Push to Live"
   ↓
2. Backend-Trigger prüft: Gibt es bereits eine Live-Mitteilung?
   ↓ JA
3. Alte Mitteilung wird automatisch entfernt
   - is_live = false
   - removed_from_live_at = now()
   - Live History: "removed_from_live"
   ↓
4. Neue Mitteilung wird live geschaltet
   - is_live = true
   - pushed_live_at = now()
   - Live History: "pushed_live"
   ↓
5. Frontend aktualisiert
   - Dashboard zeigt neue Mitteilung
   - Admin-Liste aktualisiert Badges
```

### Permissions (RLS)

#### **Read (SELECT)**
- ✅ Alle User in ihrer Organization können Live-Mitteilungen sehen
- ✅ Admins können alle Mitteilungen sehen

#### **Create/Update/Delete**
- ✅ Nur HR/ADMIN/SUPERADMIN
- ❌ Normale User und TEAMLEAD: Kein Zugriff

---

## 🔒 Sicherheit

### Input Sanitization
- **Titel**: Sanitized via `sanitize.text()`
- **URLs**: Validiert via `sanitize.url()`
- **Content**: JSON-validiert vor Speicherung

### XSS Protection
- Alle User-Inputs werden escaped
- Bilder: CSP-Header begrenzt erlaubte Domains
- Links: `rel="noopener noreferrer"` für externe Links

### SQL Injection
- ✅ Supabase Client verwendet Prepared Statements
- ✅ Keine String-Interpolation in Queries

---

## 🚀 Verwendung

### Als Admin

#### **1. Neue Mitteilung erstellen**
```typescript
1. Admin → Dashboard-Mitteilungen
2. Klick "Neue Mitteilung"
3. Titel eingeben
4. Content-Blöcke hinzufügen:
   - Text-Block: "Wichtige Info..."
   - Link-Block: URL + Text
   - Bild-Block: Image URL
   - Video: Aus Dropdown wählen
   - Benefit: Aus Dropdown wählen
5. Entscheidung:
   - "Erstellen": Nur speichern
   - "Push to Live": Sofort live
```

#### **2. Bestehende Mitteilung bearbeiten**
```typescript
1. Klick ✏️ Edit bei Mitteilung
2. Änderungen vornehmen
3. "Speichern"
→ Wenn Mitteilung live ist, bleiben Änderungen live
```

#### **3. Push to Live**
```typescript
1. Klick "Push to Live" bei gespeicherter Mitteilung
→ Mitteilung wird sofort live
→ Alte Live-Mitteilung wird automatisch entfernt
```

#### **4. Remove from Live**
```typescript
1. Klick "Remove from Live" bei Live-Mitteilung
→ Mitteilung wird vom Dashboard entfernt
→ Keine neue Mitteilung wird angezeigt
```

### Als Mitarbeiter

#### **Dashboard ansehen**
```typescript
1. Dashboard öffnen
2. Unter Organigram erscheint Live-Mitteilung
3. Interaktive Elemente:
   - Links: Klick öffnet in neuem Tab
   - Videos: Klick leitet zu Schulungsvideo weiter
   - Benefits: Klick öffnet Benefits-Seite
```

---

## 📝 Beispiel-Mitteilung

### Admin erstellt:

**Titel**: "Neue Homeoffice-Regelung ab 1. Februar"

**Content-Blöcke**:
1. **Text**: "Ab dem 1. Februar gilt eine neue Homeoffice-Regelung für alle Mitarbeiter."
2. **Link**: 
   - Text: "Vollständige Regelung hier lesen"
   - URL: "https://intranet.firma.de/homeoffice-policy"
3. **Image**:
   - URL: "https://firma.de/images/homeoffice.jpg"
   - Alt: "Homeoffice Arbeitsplatz"
4. **Video**: "Homeoffice Best Practices" (aus Schulungsvideos)
5. **Benefit**: "Homeoffice-Equipment-Zuschuss" (aus Benefits)

### Mitarbeiter sehen:

```
📢 Neue Homeoffice-Regelung ab 1. Februar        [Aktuell]
Von HR Team • vor 10 Minuten

Ab dem 1. Februar gilt eine neue Homeoffice-Regelung 
für alle Mitarbeiter.

🔗 Vollständige Regelung hier lesen

[Bild: Homeoffice Arbeitsplatz]

🎥 Schulungsvideo ansehen
→ "Homeoffice Best Practices"

🎁 Benefit ansehen
→ "Homeoffice-Equipment-Zuschuss"
```

---

## 🔄 Migration

### Installation

#### **1. Datenbank Migration**
```bash
# In Supabase SQL Editor ausführen:
/supabase/migrations/047_dashboard_announcements.sql
```

**Was wird erstellt?**
- ✅ Tabelle `dashboard_announcements`
- ✅ Indexes für Performance
- ✅ Unique Constraint (nur 1 Live-Mitteilung)
- ✅ Trigger: Auto-unpublish bei Push
- ✅ Trigger: Live History Tracking
- ✅ RLS Policies

#### **2. Frontend Deployment**
```bash
# Automatisch in v3.5.0 enthalten
```

**Neue Dateien**:
- ✅ `/services/HRTHIS_announcementService.ts`
- ✅ `/components/AnnouncementContentEditor.tsx`
- ✅ `/components/HRTHIS_DashboardAnnouncementCard.tsx`
- ✅ `/screens/admin/DashboardAnnouncementsScreen.tsx`
- ✅ Services Index updated
- ✅ App.tsx Route hinzugefügt
- ✅ AdminLayout Navigation updated
- ✅ DashboardScreen Anzeige added

---

## 🐛 Troubleshooting

### Problem: "Mitteilung wird nicht angezeigt"

**Lösung**:
1. Prüfe: Ist Mitteilung live?
   - Admin → Dashboard-Mitteilungen
   - Badge "Live" muss sichtbar sein
2. Prüfe Browser Console auf Fehler
3. Refresh Dashboard (F5)

### Problem: "Push to Live funktioniert nicht"

**Lösung**:
1. Prüfe Permissions:
   - Nur HR/ADMIN/SUPERADMIN können pushen
2. Prüfe Browser Console:
   - Fehlermeldungen?
3. Prüfe Supabase Logs:
   - Trigger-Fehler?

### Problem: "Content-Blöcke können nicht hinzugefügt werden"

**Lösung**:
1. Videos nicht verfügbar?
   - Erstelle zuerst Videos im Lernzentrum
2. Benefits nicht verfügbar?
   - Erstelle zuerst Benefits im Benefits-Bereich
3. Browser-Kompatibilität?
   - Chrome/Edge empfohlen

---

## 🎓 Best Practices

### Mitteilungen schreiben

#### **DO ✅**
- **Kurz und prägnant**: Maximal 3-4 Sätze pro Text-Block
- **Call-to-Action**: Nutze Links/Videos für Details
- **Visuelle Elemente**: 1-2 Bilder pro Mitteilung
- **Relevanz**: Nur wichtige Infos live schalten
- **Timing**: Mitteilungen zu Bürozeiten pushen

#### **DON'T ❌**
- **Zu viele Blöcke**: Max. 5-6 Blöcke pro Mitteilung
- **Zu lange Texte**: Nutze Links für lange Infos
- **Zu viele Bilder**: Lädt Dashboard langsamer
- **Spam**: Nicht mehrmals täglich pushen
- **Ungetestet**: Erst speichern, dann live schalten

### Content-Organisation

#### **Empfohlene Struktur**:
```
1. Text: Kurze Zusammenfassung (2-3 Sätze)
2. Link: Detaillierte Infos
3. Image: Visuelles Element (optional)
4. Video: Schulung/Tutorial (optional)
5. Benefit: Relevanter Benefit (optional)
```

---

## 📈 Metrics & Analytics

### Tracking (zukünftig)

**Geplante Features**:
- 📊 Impressions: Wie oft wurde Mitteilung gesehen
- 👁️ Read Status: Wer hat Mitteilung gelesen
- 🔗 Click Tracking: Welche Links wurden geklickt
- 📹 Video Views: Welche Videos wurden angeschaut
- ⏱️ Time on Page: Wie lange war Mitteilung live

---

## 🚀 Nächste Schritte

### Erweiterungen (Roadmap)

#### **v3.6: Erweiterte Features**
- [ ] Scheduled Publishing: Mitteilungen planen
- [ ] A/B Testing: Zwei Versionen testen
- [ ] Target Groups: Nur für bestimmte Teams
- [ ] Reactions: Emoji-Reaktionen von Mitarbeitern
- [ ] Comments: Kommentarfunktion

#### **v3.7: Analytics**
- [ ] Impression Tracking
- [ ] Click Analytics
- [ ] Engagement Metrics
- [ ] Dashboard für Admin

#### **v3.8: Rich Editor**
- [ ] WYSIWYG Editor
- [ ] Markdown Support
- [ ] Formatting (Bold, Italic, etc.)
- [ ] Drag & Drop File Upload

---

## ✅ Checkliste

### Setup-Checkliste für neue Installation

- [ ] Migration 047 in Supabase ausgeführt
- [ ] Frontend deployed (v3.5.0)
- [ ] Admin kann Admin-Bereich öffnen
- [ ] Admin kann Mitteilung erstellen
- [ ] Content Editor funktioniert
- [ ] Push to Live funktioniert
- [ ] Dashboard zeigt Mitteilung an
- [ ] Remove from Live funktioniert
- [ ] Links/Videos/Benefits klickbar

### Test-Checkliste

- [ ] Mitteilung mit allen Block-Typen erstellt
- [ ] "Erstellen" speichert ohne Live
- [ ] "Push to Live" schaltet sofort live
- [ ] Alte Mitteilung wird automatisch ersetzt
- [ ] "Remove from Live" entfernt von Dashboard
- [ ] Bearbeiten funktioniert
- [ ] Löschen funktioniert
- [ ] Permissions: Normale User sehen nur Live
- [ ] Permissions: Nur HR/Admin können verwalten

---

## 🎉 Feature Complete!

**v3.5.0 Dashboard Announcements System** ist vollständig implementiert und einsatzbereit! 📢

**Hauptfeatures**:
✅ Rich Content Editor (Text, Links, Bilder, Videos, Benefits)  
✅ Push to Live / Remove from Live  
✅ Nur EINE Live-Mitteilung gleichzeitig  
✅ Dashboard-Anzeige unter Organigram  
✅ Admin-Verwaltung  
✅ Audit Trail (Live History)  
✅ RLS Security  
✅ Responsive Design  

**Happy Announcing! 🚀**
