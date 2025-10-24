# 🏖️ Urlaub/Abwesenheit System - Quick Start Guide

## ✅ Was ist implementiert?

Das komplette **Backend & Dialog-System** für Urlaubsverwaltung ist fertig!

### Phase 1: ✅ Datenbank erweitert
- Migration 036 erstellt neue Felder (Halbtage, Krankschreibungen, Stornierungen)
- TypeScript Types aktualisiert
- Neue Indizes für Performance

### Phase 2: ✅ Business Logic Hooks
- `useBusinessDays` - Werktage-Berechnung (Mo-Fr, ohne Wochenenden/Feiertage)
- `useGermanHolidays` - Deutsche Feiertage (alle 16 Bundesländer)
- `useVacationCarryover` - Urlaubsübertrag bis 31. März
- `useLeaveManagement` - Kern-Logik (Erstellen, Genehmigen, Ablehnen)
- `useLeaveReminders` - Reminder-System (3 Tage vor Urlaubsstart)

### Phase 3: ✅ UI Dialog
- `RequestLeaveDialog` - Komplettes Modal zum Antrag stellen
- Integration in `CalendarScreen` (Button öffnet Dialog)
- Alle Validierungen implementiert

---

## 🚀 So testest du das System:

### 1. Migration ausführen

**In Supabase SQL Editor:**

```sql
-- Kopiere den Inhalt aus:
/supabase/migrations/036_extend_leave_requests.sql
```

### 2. Dialog testen

1. Gehe zu **Zeit & Urlaub → Kalender Tab**
2. Klicke auf **"Urlaub/Abwesenheit"** Button (oben rechts)
3. Dialog öffnet sich ✅

**Als Normal-User:**
- Mitarbeiter-Dropdown: NICHT sichtbar (kann nur für sich selbst Antrag stellen)

**Als Admin/HR/TeamLead:**
- Mitarbeiter-Dropdown: SICHTBAR (kann für andere Anträge stellen)

### 3. Antrag erstellen

1. **Typ auswählen:**
   - 🏖️ Urlaub (Vacation)
   - ❤️ Krankmeldung (Sick)

2. **Datum wählen:**
   - Startdatum: z.B. nächste Woche Montag
   - Enddatum: z.B. nächste Woche Freitag

3. **Automatische Berechnung:**
   - System zeigt: "5 Arbeitstage (Wochenenden ausgeschlossen)"
   - Bei Urlaub: Zeigt verfügbare Tage an

4. **Halbtag (optional):**
   - NUR wenn Start == End Datum
   - Toggle wird sichtbar

5. **Krankschreibung (nur bei Krankmeldung):**
   - Upload-Feld erscheint
   - PDF/JPG/PNG möglich

6. **Kommentar (optional):**
   - Textfeld für Notizen

7. **"Antrag einreichen"** klicken

### 4. Was passiert dann?

**Automatisch:**
- ✅ Status: PENDING
- ✅ Werktage werden berechnet (ohne Wochenenden/Feiertage)
- ✅ Urlaubskontingent wird geprüft (bei Vacation)
- ✅ Überschneidungen werden geprüft
- ✅ Notification an ADMIN/HR/TEAMLEAD: "Neuer Antrag"
- ✅ Toast: "Antrag erfolgreich eingereicht"

**In Datenbank:**
```sql
-- Neuer Eintrag in leave_requests:
user_id: <user-id>
start_date: '2025-01-13'
end_date: '2025-01-17'
type: 'VACATION'
status: 'PENDING'
total_days: 5
is_half_day: false
federal_state: 'NW'
created_by: <user-id>
```

---

## 📊 Wo werden Anträge angezeigt?

### Aktuell:
1. **Meine Daten → Logs Tab**
   - User sieht eigene Anträge
   - Anzeige: Typ, Datum, Status, Kommentar

2. **Admin → Mitarbeiterinformationen → Logs Tab**
   - Admin sieht alle Anträge eines Users
   - Statistiken: Urlaubstage, Krankheitstage

### TODO (Phase 4):
3. **Kalender als farbige Blöcke**
   - Grün: APPROVED Urlaub
   - Gelb: PENDING Antrag
   - Rot: Krankmeldung
   - Orange: Team-Abwesenheiten

4. **Admin Genehmigung Interface**
   - Liste aller PENDING Anträge
   - Approve/Reject Buttons
   - Filter nach Status

---

## 🧪 Test-Szenarien

### Szenario 1: Normaler Urlaubsantrag
```
User: Mitarbeiter
Typ: Urlaub
Start: 20.01.2025 (Mo)
Ende: 24.01.2025 (Fr)
Erwartung: 5 Arbeitstage, Status PENDING
```

### Szenario 2: Halbtag
```
User: Mitarbeiter
Typ: Urlaub
Start: 20.01.2025
Ende: 20.01.2025
Halbtag: JA
Erwartung: 0.5 Tage, Toggle sichtbar
```

### Szenario 3: Krankmeldung mit Attest
```
User: Mitarbeiter
Typ: Krankmeldung
Start: 15.01.2025
Ende: 17.01.2025
File: krankschreibung.pdf
Erwartung: 3 Tage, Datei wird hochgeladen
```

### Szenario 4: Kontingent überschritten
```
User: Hat 5 Urlaubstage übrig
Antrag: 10 Tage
Erwartung: Roter Alert "Nicht genügend Urlaubstage", Button disabled
```

### Szenario 5: Überschneidung
```
User: Hat bereits Antrag 20.-24.01.
Neuer Antrag: 22.-26.01.
Erwartung: Fehler "Überschneidung mit bestehendem Antrag"
```

### Szenario 6: Wochenende/Feiertag
```
Start: 18.01.2025 (Sa)
Ende: 20.01.2025 (Mo)
Erwartung: Nur 1 Arbeitstag (Montag), Samstag/Sonntag ausgeschlossen
```

---

## 🔍 Debug-Möglichkeiten

### Console Logs überprüfen:
```js
// In useLeaveManagement Hook:
console.log('Creating leave request:', input);
console.log('Business days calculated:', businessDays);
console.log('Quota check:', quota);
```

### Datenbank überprüfen:
```sql
-- Alle Anträge sehen:
SELECT * FROM leave_requests ORDER BY created_at DESC LIMIT 10;

-- Anträge eines Users:
SELECT * FROM leave_requests WHERE user_id = '<user-id>';

-- Pending Anträge:
SELECT * FROM leave_requests WHERE status = 'PENDING';

-- Notifications prüfen:
SELECT * FROM notifications WHERE type = 'leave' ORDER BY created_at DESC;
```

### Quota überprüfen:
```sql
-- User's Urlaubstage:
SELECT first_name, last_name, vacation_days FROM users WHERE id = '<user-id>';

-- Verbrauchte Tage:
SELECT 
  SUM(total_days) as used_days 
FROM leave_requests 
WHERE user_id = '<user-id>' 
  AND type = 'VACATION' 
  AND status = 'APPROVED';
```

---

## ⚠️ Bekannte Einschränkungen (aktuell)

1. **Kein Admin Approval UI** - Anträge können noch nicht genehmigt werden (nur API vorhanden)
2. **Kein Kalender-Display** - Anträge werden noch nicht im Kalender angezeigt
3. **Kein TeamLead-Filter** - TeamLead sieht alle Anträge, nicht nur Team
4. **Kein Export** - CSV/PDF noch nicht implementiert
5. **Kein 6-Wochen-Warning** - Bei langer Krankheit noch keine Warnung

---

## 📝 Nächste Schritte

### Phase 4A: Kalender Visualisierung
- Farbige Blöcke im Kalender
- Click → Detail-Ansicht
- Filter: Persönlich vs Team

### Phase 4B: Admin Approval Interface
- Liste aller PENDING Anträge
- Approve/Reject Buttons
- Rejection Reason Dialog

### Phase 4C: Erweiterte Features
- 6-Wochen Krankheits-Warnung
- Backup-Benachrichtigungen
- Export-Funktionen
- TeamLead Team-Filter

---

## 🆘 Troubleshooting

### "Fehler beim Laden der Urlaubsanträge"
→ Migration 036 ausführen

### "useLeaveManagement is not defined"
→ Browser Refresh (Hot Module Reload Issue)

### "Cannot read property 'vacation_days' of null"
→ User-Profil laden (useAuthStore.profile)

### Notification erscheint nicht
→ Check `notifications` Tabelle in DB
→ NotificationCenter Component überprüfen

### Business Days falsch berechnet
→ Check Bundesland (federalState)
→ Feiertage für Bundesland überprüfen

---

## 📚 Weitere Dokumentation

- **Vollständige Doku:** `/LEAVE_MANAGEMENT_SYSTEM.md`
- **Hooks Doku:** `/hooks/README.md`
- **Migration SQL:** `/supabase/migrations/036_extend_leave_requests.sql`

---

**Status:** ✅ Ready to test!
**Nächste TODO:** Kalender-Blöcke & Admin Approval UI
