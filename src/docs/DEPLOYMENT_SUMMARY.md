# 🚀 Deployment Summary - Factorial-Style Time Tracking

## ✅ Was du deployen musst

### **1️⃣ SQL Migration** 
📁 `/supabase/migrations/080_time_tracking.sql`

**Was wird gemacht:**
- Erweitert die Tabelle `time_records_f659121d` um:
  - `work_type` (office/field/extern)
  - `status` (running/completed)
  - `location_id` (optional)
  - `updated_at` (timestamp)
- Erstellt Indexes für Performance
- Erstellt RLS Policies
- Erstellt Trigger für `updated_at`

**Wie deployen:**
- **Automatisch**: Migration wird beim nächsten Supabase-Sync automatisch ausgeführt
- **Manuell**: Supabase Dashboard → SQL Editor → Code einfügen → Run

---

### **2️⃣ Edge Function Update**
📁 `/supabase/functions/BrowoKoordinator-Zeiterfassung/index.ts`

**Was wurde hinzugefügt:**
Neue Routes zur bestehenden Edge Function:

- `GET /time-records/current-status` - Aktuellen Stempel-Status abrufen
- `POST /time-records/clock-in` - Einstempeln (Factorial-Style)
- `POST /time-records/clock-out` - Ausstempeln (Factorial-Style)
- `GET /time-records` - Zeitaufzeichnungen mit Filter (today/week/month)

**Wie deployen:**
Die Edge Function `BrowoKoordinator-Zeiterfassung` ist bereits deployed. 

**KEIN neues Deployment nötig**, wenn du das Supabase Dashboard nutzt und die Function automatisch synchronisiert wird.

**Falls manuell deployen nötig:**
1. Supabase Dashboard → Edge Functions
2. `BrowoKoordinator-Zeiterfassung` auswählen
3. Code aktualisieren (kompletten Inhalt von `/supabase/functions/BrowoKoordinator-Zeiterfassung/index.ts` kopieren)
4. Deploy klicken

---

### **3️⃣ Frontend**
Die Frontend-Dateien sind bereits erstellt und einsatzbereit:

**Neue Dateien:**
- `/components/BrowoKo_TimeClockCard.tsx` ✅
- `/components/BrowoKo_TimeRecordsList.tsx` ✅
- `/hooks/BrowoKo_useTimeClock.tsx` ✅

**Aktualisierte Dateien:**
- `/screens/FieldScreen.tsx` ✅
- `/components/icons/BrowoKoIcons.tsx` ✅ (Square Icon hinzugefügt)

**Wie deployen:**
```bash
# Lokal testen
npm run dev

# Build erstellen
npm run build

# Deployen (je nach Hosting)
# z.B. Vercel, Netlify, etc.
```

---

## 🔄 Deployment-Reihenfolge

### **Schritt 1: SQL Migration**
```sql
-- Im Supabase Dashboard → SQL Editor ausführen:
-- Datei: /supabase/migrations/080_time_tracking.sql
```

**Verifizieren:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'time_records_f659121d'
AND column_name IN ('work_type', 'status', 'location_id', 'updated_at');
```
Erwartetes Ergebnis: 4 Zeilen

---

### **Schritt 2: Edge Function (falls nötig)**
Falls die Edge Function nicht automatisch synchronisiert wird:

1. Supabase Dashboard → Edge Functions
2. `BrowoKoordinator-Zeiterfassung` öffnen
3. Code aktualisieren
4. Deploy klicken

**Verifizieren:**
```bash
curl -X GET \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/time-records/current-status \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```
Erwartetes Ergebnis: `{"is_clocked_in":false,"current_record":null}`

---

### **Schritt 3: Frontend**
```bash
npm run build
# Dann deployen auf deinem Hosting-Provider
```

**Verifizieren:**
1. App öffnen unter `/arbeit`
2. Office Tab → TimeClockCard sichtbar?
3. Einstempeln → Funktioniert?
4. Ausstempeln → Eintrag in Liste?

---

## 🧪 Quick Test nach Deployment

### **Test 1: Einstempeln**
1. Gehe zu `/arbeit`
2. Klicke Office Tab
3. Klicke "Einstempeln"
4. ✅ Button wird rot "Ausstempeln"
5. ✅ Timer zeigt "0h 0m"

### **Test 2: Ausstempeln**
1. Warte 1 Minute
2. ✅ Timer zeigt "0h 1m"
3. Klicke "Ausstempeln"
4. ✅ Button wird grün "Einstempeln"
5. ✅ Eintrag erscheint in Liste

### **Test 3: Filter**
1. Klicke "Diese Woche"
2. ✅ Eintrag noch sichtbar
3. Klicke "Dieser Monat"
4. ✅ Eintrag noch sichtbar

---

## 📊 API Endpoints

Alle Endpoints nutzen die bestehende Edge Function `BrowoKoordinator-Zeiterfassung`:

### **Base URL:**
```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung
```

### **Neue Endpoints:**

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/time-records/current-status` | GET | Aktuellen Status abrufen |
| `/time-records/clock-in` | POST | Einstempeln |
| `/time-records/clock-out` | POST | Ausstempeln |
| `/time-records` | GET | Zeitaufzeichnungen (mit `?filter=today/week/month`) |

### **Alte Endpoints (bleiben erhalten):**

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/sessions/clock-in` | POST | Session-basiertes Einstempeln |
| `/sessions/clock-out` | POST | Session-basiertes Ausstempeln |
| `/sessions/active` | GET | Aktive Session |
| `/stats` | GET | Statistiken |
| ... | ... | ... (alle anderen bleiben) |

**Wichtig**: Die alten Session-basierten Endpoints (`/sessions/*`) funktionieren weiterhin parallel zu den neuen Factorial-Style Endpoints (`/time-records/*`).

---

## 🎯 Zusammenfassung

### **Was wird verwendet:**

| Komponente | Tabelle/System |
|-----------|----------------|
| **Factorial-Style Zeiterfassung** | `time_records_f659121d` (erweitert) |
| **Session-basierte Zeiterfassung** | `work_sessions` + `work_periods` (unverändert) |

### **Beide Systeme laufen parallel!**

- **FieldScreen** (`/arbeit`) → Nutzt **Factorial-Style** (`time_records_f659121d`)
- **Andere Zeiterfassungs-Features** → Nutzen weiterhin **Session-System** (`work_sessions`)

---

## ❓ FAQ

### **Muss ich die Edge Function neu deployen?**
**Nein**, wenn du Supabase's Auto-Deployment nutzt. Die Function wird automatisch aktualisiert.

**Ja**, wenn du manuell über das Dashboard deployest.

### **Überschreibt das Factorial-System das alte Session-System?**
**Nein**! Beide Systeme laufen **parallel**. Das alte System bleibt unverändert.

### **Welche Tabelle wird für Factorial verwendet?**
`time_records_f659121d` (wird durch Migration 080 erweitert)

### **Kann ich beide Systeme gleichzeitig nutzen?**
**Ja**, aber nicht empfohlen. Entscheide dich für eines:
- **Factorial-Style** (einfacher, Office/Field/Extern)
- **Session-System** (komplexer, mit Breaks und Approval-Workflow)

---

## ✅ Deployment Checklist

- [ ] SQL Migration ausgeführt (`080_time_tracking.sql`)
- [ ] Migration verifiziert (4 neue Spalten)
- [ ] Edge Function aktualisiert (falls nötig)
- [ ] API-Test erfolgreich (`/time-records/current-status`)
- [ ] Frontend deployed
- [ ] E2E-Test erfolgreich (Einstempeln → Ausstempeln)
- [ ] Dokumentation geteilt (User Guide, Admin Guide)

---

**Du bist bereit! 🚀**

Bei Problemen: Check die Logs im Supabase Dashboard → Edge Functions → BrowoKoordinator-Zeiterfassung
