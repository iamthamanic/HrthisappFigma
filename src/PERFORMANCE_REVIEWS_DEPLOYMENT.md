# 🚀 Performance Reviews Feature - Deployment Anleitung

## ❌ Aktueller Fehler
```
❌ API Error - Could not parse response
❌ Error loading reviews: Error: HTTP 404
```

## 🔧 Lösung: 1 Schritt erforderlich!

### ✅ Schritt 1: Datenbank-Tabellen erstellen

1. **Öffne Supabase Dashboard** → SQL Editor
2. **Führe folgendes SQL aus:** `/supabase/migrations/performance_reviews_schema.sql`
3. **Verifiziere** dass folgende Tabellen existieren:
   - ✅ `performance_review_templates`
   - ✅ `performance_reviews`
   - ✅ `performance_review_answers`
   - ✅ `performance_review_signatures`

## ✅ Edge Function ist bereits deployed!

Die Performance Review Routes sind bereits im Haupt-Server enthalten:
- **Server:** `make-server-f659121d` (bereits deployed)
- **Routes:** `/performance-reviews/*`
- **Keine separate Edge Function nötig!**

Die Routes sind unter folgender URL erreichbar:
```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-f659121d/performance-reviews/...
```

## 📋 Was das Feature bietet

### Admin-Bereich
- **Templates erstellen**: Drag & Drop Editor mit 7 Frage-Typen
  - Text (kurz/lang)
  - Rating-Skalen (1-5, 1-10, etc.)
  - Ja/Nein
  - Checkboxen
  - Datumseingabe
  - Unterschrift
  
- **Gespräche versenden**: Template an Mitarbeiter senden mit Frist
- **Übersicht**: Alle offenen/abgeschlossenen Gespräche tracken
- **Mitarbeiter-Details**: Tab "Gespräche" zeigt alle Gespräche eines MA

### Mitarbeiter-Bereich
- **Gespräche ausfüllen**: Fragen beantworten, Notizen hinzufügen
- **Status-Tracking**: Offen, In Bearbeitung, Eingereicht, Abgeschlossen
- **Übersicht**: "Meine Gespräche" unter Einstellungen → Mitarbeitergespräche

## 🗺️ Routen-Übersicht

### Admin
- `/admin/performance-reviews` - Management Screen
- `/admin/performance-reviews/template-builder/:id` - Template Builder
- `/admin/team-und-mitarbeiterverwaltung/user/:userId` → Tab "Gespräche"

### Mitarbeiter
- `/settings?tab=performance` - "Meine Gespräche" (in MeineDaten.tsx)
- `/employee-performance-review/:reviewId` - Gespräch ausfüllen (WIP)

## 🔗 API Endpoints (Edge Function)

### Templates
- `GET /templates` - Alle Templates
- `GET /templates/:id` - Einzelnes Template
- `POST /templates` - Template erstellen
- `PUT /templates/:id` - Template bearbeiten
- `DELETE /templates/:id` - Template löschen

### Reviews
- `GET /my-reviews` - Meine Gespräche (als Mitarbeiter)
- `GET /team-reviews?employee_id=xxx` - Team Gespräche (als Manager)
- `GET /:reviewId` - Einzelnes Gespräch mit Antworten
- `POST /send` - Gespräch versenden
- `PUT /:reviewId/answer` - Antwort speichern
- `PUT /:reviewId/manager-comment` - Manager-Kommentar
- `PUT /:reviewId/submit` - Gespräch einreichen
- `PUT /:reviewId/complete` - Gespräch abschließen
- `POST /:reviewId/signature` - Unterschrift speichern
- `POST /:reviewId/add-note` - Notiz hinzufügen

## ✅ Nach Deployment

Nach erfolgreichem Deployment solltest du:

1. ✅ Im Admin Panel den Tab "Mitarbeitergespräche" sehen
2. ✅ Ein Template erstellen können
3. ✅ Ein Gespräch an einen Mitarbeiter versenden können
4. ✅ Als Mitarbeiter das Gespräch in "Meine Daten" → Tab "Gespräche" sehen

## 🐛 Troubleshooting

### "Failed to fetch"
→ Edge Function ist nicht deployed oder falsche URL

### "Unknown error"  
→ Datenbank-Tabellen fehlen → SQL ausführen

### "Not authorized"
→ RLS Policies blockieren → SQL erneut ausführen

### Keine Daten sichtbar
→ Console öffnen und API Response checken
→ Supabase Dashboard → Logs checken

## 💾 Datenmodell

```
performance_review_templates
├── id (UUID)
├── organization_id (UUID) → organizations
├── title (TEXT)
├── description (TEXT)
├── questions (JSONB) [{ id, type, question, ... }]
└── created_by (UUID) → users

performance_reviews
├── id (UUID)
├── organization_id (UUID) → organizations
├── employee_id (UUID) → users
├── manager_id (UUID) → users
├── template_snapshot (JSONB) - Snapshot der Fragen
├── status (ENUM: DRAFT, SENT, IN_PROGRESS, SUBMITTED, COMPLETED)
├── due_date (TIMESTAMPTZ)
├── conversation_date (TIMESTAMPTZ)
└── employee_notes (JSONB) [{ note, created_at }]

performance_review_answers
├── id (UUID)
├── review_id (UUID) → performance_reviews
├── question_id (TEXT)
├── employee_answer (JSONB)
├── employee_answered_at (TIMESTAMPTZ)
├── manager_comment (TEXT)
└── manager_answered_at (TIMESTAMPTZ)

performance_review_signatures
├── id (UUID)
├── review_id (UUID) → performance_reviews
├── user_id (UUID) → users
├── role (ENUM: employee, manager)
├── signature_data (TEXT) - Base64
└── signed_at (TIMESTAMPTZ)
```

## 🎉 Ready!

Nach diesen 2 Schritten sollte das komplette Mitarbeitergespräche-Feature funktionieren!