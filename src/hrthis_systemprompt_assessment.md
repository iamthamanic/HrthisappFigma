# HRthis System-Prompt Assessment & Anpassung

## 1. Projekt-Variablen für HRthis

### Definierte Variablen:
- **{DOMAIN_PREFIX}**: `hr_` (für domänenspezifische Komponenten/Dateien)
- **{IMPORT_ALIAS}**: `./` (relative imports, keine Alias-Konfiguration)
- **{STYLE_SYSTEM}**: Tailwind v4 + CSS-Variablen (`styles/globals.css`)
- **{UI_PRIMITIVES}**: shadcn/ui (`./components/ui/`)
- **{TESTING_POLICY}**: off (manuelle Smoke-Checks)
- **{REVIEW_GATES}**: Nicht definiert (Solo-Entwicklung)
- **{SEC_BASELINE}**: Standard Supabase Security (RLS, Service Role Key protection)
- **{OBS_STACK}**: Console-Logging + Supabase Logs
- **{PERF_BUDGETS}**: Nicht explizit definiert (Standard Web-Budgets gelten)
- **{ROUTING_RULES}**: React Router - Level 1 = Routes, keine Query-Parameter für Tabs
- **{ML_POLICY}**: N/A (keine ML-Komponenten)

### Backend-Spezifika:
- **Architecture**: Single-Tenancy (jede Firma = eigene Supabase DB)
- **Backend**: Supabase Edge Functions (Deno) + Hono Web Server
- **Database**: PostgreSQL via Supabase mit KV-Store Utility
- **Auth**: Supabase Auth (Email/Password, auto-bestätigte E-Mails)
- **Storage**: Supabase Storage (private buckets, signed URLs)

---

## 2. Projektanalyse nach System-Prompt Prinzipien

### ✅ **POSITIV - Folgt Best Practices:**

#### Architektur & Trennung:
- ✅ Saubere Trennung: `/screens` (Pages), `/components` (UI), `/stores` (State), `/utils` (Services)
- ✅ Hexagonal Architecture im Backend: Server (`/supabase/functions/server/`) getrennt von Frontend
- ✅ Keine zyklischen Abhängigkeiten erkennbar
- ✅ Modulare Struktur mit klaren Verantwortlichkeiten

#### Namenskonventionen:
- ✅ Konsistente Screen-Benennung: `*Screen.tsx`
- ✅ Admin-Screens separiert: `/screens/admin/`
- ✅ UI-Komponenten in `/components/ui/` (shadcn)

#### Sicherheit:
- ✅ `SUPABASE_SERVICE_ROLE_KEY` nur im Backend (Edge Functions)
- ✅ Frontend nutzt `publicAnonKey`
- ✅ RLS-Policies in Migrations definiert
- ✅ Protected Routes mit `ProtectedRoute` und `AdminRoute` Components

#### Backend Best Practices:
- ✅ CORS Headers konfiguriert
- ✅ KV-Store Utility für Datenbankzugriff
- ✅ Strukturiertes Logging (`console.log` mit Emoji-Prefixen)
- ✅ Error-Handling in Server-Routen

#### Performance:
- ✅ Lazy Loading für alle Screens (`React.lazy()`)
- ✅ Suspense mit Custom Loading States
- ✅ Code-Splitting durch Route-basiertes Lazy Loading

#### Accessibility & UX:
- ✅ Loading States (Spinner, Skeleton)
- ✅ Keyboard-Shortcuts im Organigram (Delete, F, Cmd+Z)
- ✅ Proper `<Button>` Components mit Variants

---

### ❌ **PROBLEMATISCH - Verstöße gegen Prinzipien:**

#### 1. **Domain-Prefix fehlt komplett** 🚨 KRITISCH
- **Verstoß**: Keine domänenspezifischen Dateien haben ein `hr_` Präfix
- **Beispiele**:
  - `CanvasOrgChart.tsx` sollte `hr_CanvasOrgChart.tsx` sein
  - `OrganigramStore.ts` sollte `hr_organigramStore.ts` sein
  - `AvatarEditor.tsx` sollte `hr_AvatarEditor.tsx` sein
- **Ausnahmen** (korrekt ohne Präfix):
  - `Button.tsx`, `Input.tsx` (generische UI-Primitives)
  - `LoadingState.tsx` (generische Utility)

#### 2. **Dateigröße** 🚨 KRITISCH
- **Verstoß**: Mehrere Dateien > 500 Zeilen (hart-Limit)
- **Beispiele**:
  - `/components/CanvasOrgChart.tsx`: **1032 Zeilen** (Limit: 500)
  - `/screens/admin/OrganigramCanvasScreenV2.tsx`: Vermutlich > 500 Zeilen
  - `/stores/organigramStore.ts`: Muss geprüft werden
- **Lösung**: Splitten in kleinere Module:
  - `CanvasOrgChart.tsx` → `hr_CanvasOrgChart.tsx` (Main), `hr_CanvasOrgChart_Handlers.tsx` (Event Handlers), `hr_CanvasOrgChart_Utils.tsx` (Helpers)

#### 3. **Inkonsistente Error-Handling**
- **Problem**: Console-Logging ist gut, aber keine strukturierten Error-Objekte
- **Beispiel**: `console.log('⚠️ No connection draft - ignoring')` sollte structured error sein
- **Lösung**: Error-Klassen einführen (z.B. `class ConnectionDraftError extends Error`)

#### 4. **Fehlende Input-Validierung**
- **Problem**: Keine sichtbare Zod/Joi-Validierung in Forms
- **Risk**: Unvalidierte User-Inputs können zu Runtime-Errors führen
- **Lösung**: Zod-Schemas für alle Forms (z.B. `CreateNodeDialog`, `EditVideoDialog`)

#### 5. **Keine Performance-Budgets definiert**
- **Problem**: Keine expliziten Limits für Bundle-Size, LCP, CLS
- **Impact**: Kann zu Performance-Regression führen
- **Lösung**: Budgets in `package.json` oder CI definieren

#### 6. **Massive Anzahl .md-Dateien im Root** 🚨 ORGANISATORISCH
- **Problem**: 40+ Markdown-Dateien im Root-Verzeichnis
- **Impact**: Projekt-Übersicht schwierig, Code-Dateien gehen unter
- **Lösung**: `/docs` Ordner erstellen und alle .md-Dateien verschieben (außer README.md)

#### 7. **Fehlende Komponenten-Dokumentation**
- **Problem**: Keine TSDoc/JSDoc für öffentliche APIs
- **Beispiel**: `CanvasOrgChart` Props sind nicht dokumentiert
- **Lösung**: TSDoc für alle exportierten Komponenten/Funktionen

#### 8. **Unklare Migration-Reihenfolge**
- **Problem**: Migrations haben Nummern, aber `/supabase/migrations/README.md` fehlt
- **Impact**: Neuer Entwickler weiß nicht, welche Migrations laufen müssen
- **Lösung**: README mit Migrations-Reihenfolge und Abhängigkeiten

---

## 3. **Aktuelles Problem: Build-Fehler in CanvasOrgChart.tsx**

### Problem-Beschreibung:
Zeile 771-806 in `/components/CanvasOrgChart.tsx` enthält **kaputte Code-Fragmente**:
- Unvollständige JSX-Elemente ohne öffnende Tags
- Orphaned Conditional-Renderings (`{connectionDraft && ...}`)
- Doppelter Kommentar (`{/* ✅ CANVAS VIEWPORT: ... */}` bei Zeile 771 UND 807)

### Root Cause:
Vermutlich wurde ein Debug-Info-Panel gelöscht, aber Teile davon (Zeilen 775-804) blieben zurück.

### Lösung:
Zeilen 772-806 komplett entfernen, sodass Zeile 771 direkt zu Zeile 807 springt.

---

## 4. **Empfohlene Sofortmaßnahmen**

### Prio 1 (Kritisch):
1. ✅ **Build-Fehler fixen** (CanvasOrgChart.tsx Zeilen 772-806 entfernen)
2. **CanvasOrgChart.tsx splitten** (>1000 Zeilen → max 500 Zeilen)
3. **Domain-Prefix einführen** (zumindest für neue Dateien)

### Prio 2 (Wichtig):
4. **Docs-Ordner erstellen** (`mkdir docs && mv *.md docs/` außer README.md)
5. **Zod-Validierung** für Forms hinzufügen
6. **TSDoc** für Top-Level-Komponenten

### Prio 3 (Nice-to-Have):
7. **Performance-Budgets** definieren
8. **Error-Klassen** einführen
9. **Migration-README** schreiben

---

## 5. **Angepasster System-Prompt für HRthis**

```markdown
# System-Prompt: HRthis Development Assistant

## Projekt-Kontext
Du entwickelst **HRthis**, eine Single-Tenancy HR-Plattform mit React, Tailwind v4, Supabase.
Jede Firma hat ihre eigene Supabase-Instanz. Alle Mitarbeiter sind in einer Default-Organisation mit Enterprise-Features.

## Projekt-Variablen
- **Domain-Prefix**: `hr_` (für domänenspezifische Dateien)
- **Imports**: Relative Pfade (`./components/...`)
- **Styling**: Tailwind v4 + CSS-Variablen (`styles/globals.css`)
- **UI-Primitives**: shadcn/ui (`./components/ui/`)
- **Backend**: Supabase Edge Functions (Deno + Hono)
- **Testing**: Manuell (keine automatisierten Tests)
- **Sprache**: **Deutsch** (alle Responses auf Deutsch)

## Architektur-Regeln
1. **Dateigröße**: Max 300 Zeilen (hart: 500 Zeilen) → Bei Überschreitung: Splitten
2. **Domain-Prefix**: Alle HR-spezifischen Dateien mit `hr_` präfixen (z.B. `hr_CanvasOrgChart.tsx`)
3. **Generische UI**: Keine Präfixe für shadcn/ui oder generische Utils
4. **Ordner-Struktur**:
   - `/screens` → Pages/Views
   - `/components` → UI-Komponenten (mit `hr_` Präfix wenn HR-spezifisch)
   - `/stores` → Zustand (mit `hr_` Präfix)
   - `/utils` → Services/Helpers
   - `/supabase/functions/server` → Backend (Deno)

## Sicherheit
- ✅ `SUPABASE_SERVICE_ROLE_KEY` NUR im Backend
- ✅ Frontend nutzt `publicAnonKey`
- ✅ Signed URLs für private Storage-Buckets
- ✅ RLS-Policies in Migrations

## Performance
- ✅ Lazy Loading für alle Screens
- ✅ Code-Splitting durch Routes
- ✅ Suspense mit Loading States

## Code-Qualität
- ✅ TSDoc für exportierte Komponenten/Funktionen
- ✅ Zod-Validierung für Forms
- ✅ Structured Error-Handling (Error-Klassen)
- ✅ Console-Logging mit Emoji-Prefixen (🔗, ⚠️, ✅, ❌)

## Verboten
- ❌ Inline-Styles (außer für dynamische Transformationen)
- ❌ Dateien > 500 Zeilen
- ❌ Service-Role-Key im Frontend
- ❌ Unvalidierte User-Inputs
- ❌ God-Files/God-Klassen

## Bei Änderungen
1. Prüfe Dateigröße (>300 Zeilen → Warnung, >500 Zeilen → Splitten)
2. Prüfe Domain-Prefix (HR-spezifisch → `hr_` Prefix)
3. Prüfe Imports (alle Imports auflösbar?)
4. Prüfe Security (Service-Role-Key Leak?)
5. Kurze Erklärung der Änderung (2-3 Sätze)
```

---

## 6. **Selbst-Assessment: Habe ich bisher korrekt agiert?**

### ✅ Gut gemacht:
- Präzise Problem-Analyse (Build-Fehler in Zeile 810)
- Korrekte Identifikation der kaputten Code-Fragmente
- Versuche, mit `edit_tool` zu arbeiten (statt komplette Datei neu zu schreiben)
- Strukturiertes Debugging mit `file_search` und `view_tool`

### ❌ Verbesserungspotenzial:
- **Domain-Prefix nicht erwähnt**: Hätte früher auf fehlende `hr_` Präfixe hinweisen sollen
- **Dateigröße nicht angesprochen**: CanvasOrgChart.tsx mit 1032 Zeilen ist DOPPELT so groß wie erlaubt
- **Keine proaktive Projekt-Analyse**: Hätte vor dem Fix die gesamte Projekt-Struktur prüfen sollen
- **Sprache**: Antworten sollten komplett auf Deutsch sein (User schreibt Deutsch)

---

## Nächste Schritte:
1. Build-Fehler fixen (CanvasOrgChart.tsx bereinigen)
2. Dateigröße-Problem adressieren (CanvasOrgChart.tsx splitten)
3. Domain-Prefix-Strategie mit User besprechen
4. Docs-Ordner vorschlagen
