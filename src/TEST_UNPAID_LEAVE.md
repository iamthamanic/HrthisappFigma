# 🧪 Test-Anleitung: Unbezahlte Abwesenheit

## 📋 **Vor dem Test**

### **1. Migration ausführen**
```bash
1. Öffne: Supabase Dashboard → SQL Editor
2. Kopiere: /QUICK_COPY_UNPAID_LEAVE.sql
3. Führe aus: RUN
4. Erwartete Ausgabe:
   ✅ MIGRATION 037 COMPLETED SUCCESSFULLY
   📊 Leave Types verfügbar: SICK, UNPAID_LEAVE, VACATION
```

### **2. Browser refreshen**
```
Cmd+R (Mac) oder Ctrl+R (Windows)
```

---

## ✅ **TEST 1: Request Leave Dialog**

### **Schritte:**
1. Gehe zu: `/time-and-leave`
2. Klicke: "Urlaub/Abwesenheit" Button (oben rechts)
3. Dialog öffnet sich

### **Erwartetes Ergebnis:**
```
┌─────────────────────────────────────────────┐
│  Art der Abwesenheit                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │    ☂️    │ │    ❤️    │ │    📅    │   │
│  │  Urlaub  │ │ Krank-   │ │ Unbezahlte│  │
│  │          │ │ meldung  │ │Abwesenheit│  │
│  └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────┘
```

### **Zu prüfen:**
- ✅ 3 Buttons in einer Reihe (nicht 2!)
- ✅ Icons: Umbrella, Heart, Calendar
- ✅ Labels: "Urlaub", "Krankmeldung", "Unbezahlte Abwesenheit"
- ✅ Klicken auf jeden Button funktioniert

---

## ✅ **TEST 2: Unbezahlten Urlaub erstellen**

### **Schritte:**
1. Wähle: "Unbezahlte Abwesenheit"
2. Startdatum: Heute + 1 Tag
3. Enddatum: Heute + 3 Tage
4. Kommentar (optional): "Test unbezahlter Urlaub"
5. Klicke: "Antrag stellen"

### **Erwartetes Ergebnis:**
```
✅ Urlaubsantrag wurde eingereicht
```

### **Zu prüfen:**
- ✅ Toast-Nachricht erscheint
- ✅ Dialog schließt sich
- ✅ Keine Fehler in Browser Console (F12)

---

## ✅ **TEST 3: Kalender - Personal View**

### **Schritte:**
1. Gehe zu: `/calendar`
2. Wechsle zu: "Persönlich" Tab
3. Prüfe Legende (oben im Kalender)

### **Erwartetes Legende:**
```
Legende:
🟢 Urlaub genehmigt
🟡 Ausstehend
🔵 Krankmeldung
🟣 Unbezahlte Abwesenheit
🔴 Abgelehnt
```

### **Zu prüfen:**
- ✅ 5 Einträge in der Legende
- ✅ Korrekte Farben (Grün, Gelb, Blau, Lila, Rot)
- ✅ Korrekte Labels

### **Kalender-Tage prüfen:**
1. Suche den Tag mit dem unbezahlten Urlaub
2. Hover über den Tag

### **Erwartetes Tooltip:**
```
📅 Unbezahlte Abwesenheit (pending)
Klicken für Details
```

### **Visuell prüfen:**
- ✅ Tag hat **lila Hintergrund** (bg-purple-100)
- ✅ Badge zeigt "PENDING" in gelb
- ✅ Calendar-Icon (📅) sichtbar

---

## ✅ **TEST 4: Kalender - Team View (als Admin)**

### **Schritte:**
1. Gehe zu: `/calendar`
2. Wechsle zu: "Team" Tab
3. Prüfe Legende

### **Erwartetes Legende:**
```
Legende:
🟢 Urlaub
🔵 Krankmeldung
🟣 Unbezahlte Abwesenheit
```

### **Zu prüfen:**
- ✅ Nur genehmigte Requests sichtbar
- ✅ Unbezahlter Urlaub erscheint NACH Genehmigung

---

## ✅ **TEST 5: Personal Settings - Abwesenheiten**

### **Schritte:**
1. Gehe zu: `/settings`
2. Klicke Tab: "Abwesenheiten"
3. Scrolle zu "Urlaubsanträge"

### **Erwartete Anzeige:**
```
┌────────────────────────────────────────┐
│ 📅 Unbezahlte Abwesenheit   🟡 PENDING │
│ 15.10.2025 - 17.10.2025               │
│ ┌──────────────────────────┐          │
│ │ Kommentar:               │          │
│ │ Test unbezahlter Urlaub  │          │
│ └──────────────────────────┘          │
└────────────────────────────────────────┘
```

### **Zu prüfen:**
- ✅ Icon-Hintergrund: **Lila** (bg-purple-100)
- ✅ Icon-Farbe: **Lila** (text-purple-600)
- ✅ Label: "Unbezahlte Abwesenheit"
- ✅ Badge: "Ausstehend" in gelb

### **Statistik-Karten prüfen:**
```
┌───────────────┐  ┌───────────────┐
│ 🟢 Calendar   │  │ 🔵 Calendar   │
│ Urlaubstage   │  │ Krankheitstage│
│      5        │  │      2        │
└───────────────┘  └───────────────┘
```

### **Zu prüfen:**
- ✅ Urlaubstage-Karte: **Grün** (bg-green-100)
- ✅ Krankheitstage-Karte: **Blau** (bg-blue-100)

---

## ✅ **TEST 6: Genehmigung (als Admin)**

### **Schritte:**
1. Login als ADMIN/HR/TEAMLEAD
2. Gehe zu: `/time-and-leave` → Tab "Anträge"
3. Finde den unbezahlten Urlaubsantrag

### **Erwartete Anzeige:**
```
┌────────────────────────────────────────┐
│ 📅 Unbezahlte Abwesenheit              │
│ Max Mustermann                         │
│ 15.10.2025 - 17.10.2025 (3 Tage)      │
│                                        │
│ [Genehmigen] [Ablehnen]               │
└────────────────────────────────────────┘
```

### **Test A: Genehmigen**
1. Klicke: "Genehmigen"
2. Erwartete Ausgabe: `✅ Urlaubsantrag genehmigt`

### **Zu prüfen nach Genehmigung:**
- ✅ Kalender: Unbezahlter Urlaub erscheint in **Lila**
- ✅ Team-View: Request ist sichtbar
- ✅ Status-Badge: "Genehmigt" in grün

### **Test B: Ablehnen**
1. Klicke: "Ablehnen"
2. Erwartete Ausgabe: `✅ Urlaubsantrag abgelehnt`

### **Zu prüfen nach Ablehnung:**
- ✅ Kalender: Request erscheint in **Rot** (REJECTED)
- ✅ Personal Settings: Badge "Abgelehnt" in rot
- ✅ Team-View: Request verschwindet (nur APPROVED sichtbar)

---

## ✅ **TEST 7: Quota-Check**

### **Schritte:**
1. Gehe zu: `/time-and-leave`
2. Erstelle Urlaub (VACATION) für 5 Tage
3. Prüfe Quota-Anzeige

### **Erwartetes Ergebnis:**
```
Tage: 5 Arbeitstage
Verfügbar: 25 von 30 Tagen
```

### **Jetzt: Unbezahlten Urlaub erstellen**
1. Wähle: "Unbezahlte Abwesenheit"
2. Erstelle für 3 Tage
3. Prüfe Quota-Anzeige

### **Erwartetes Ergebnis:**
```
Tage: 3 Arbeitstage
(KEINE Quota-Anzeige! Unbezahlter Urlaub zählt nicht)
```

### **Zu prüfen:**
- ✅ VACATION: Quota wird angezeigt und reduziert
- ✅ UNPAID_LEAVE: Quota wird NICHT angezeigt
- ✅ Nach Genehmigung: Quota bleibt bei 25 (nicht 22!)

---

## ✅ **TEST 8: Browser Console (Fehlerprüfung)**

### **Schritte:**
1. Drücke: `F12` (Browser DevTools öffnen)
2. Gehe zu: "Console" Tab
3. Führe alle obigen Tests durch

### **Zu prüfen:**
- ✅ KEINE roten Fehler
- ✅ KEINE Warnungen zu `UNPAID_LEAVE`
- ✅ API-Calls erfolgreich (200 OK)

### **Häufige Fehler:**

**Fehler 1: Enum Value nicht gefunden**
```
Error: invalid input value for enum leave_type: "UNPAID_LEAVE"
```
**Lösung:** Migration 037 ausführen!

**Fehler 2: Column nicht gefunden**
```
Error: column "affects_payroll" does not exist
```
**Lösung:** Migration 037 ausführen!

---

## 🎯 **ERFOLGS-KRITERIEN**

### **ALLE Tests müssen GRÜN sein:**
- ✅ Test 1: 3 Buttons im Dialog
- ✅ Test 2: Unbezahlten Urlaub erstellen
- ✅ Test 3: Kalender Personal View (Lila)
- ✅ Test 4: Kalender Team View
- ✅ Test 5: Personal Settings (Lila)
- ✅ Test 6: Genehmigung (Grün/Rot)
- ✅ Test 7: Quota NICHT reduziert
- ✅ Test 8: Keine Console Errors

---

## 🐛 **BEKANNTE PROBLEME**

### **Problem 1: Migration nicht ausgeführt**
**Symptom:** Fehler beim Erstellen von unbezahltem Urlaub
**Lösung:** `/QUICK_COPY_UNPAID_LEAVE.sql` ausführen

### **Problem 2: Alte Daten im Cache**
**Symptom:** Alte Farben/Labels werden angezeigt
**Lösung:** Hard Refresh: `Cmd+Shift+R` (Mac) oder `Ctrl+Shift+R` (Windows)

### **Problem 3: TypeScript-Fehler im Editor**
**Symptom:** Red squiggly unter `'UNPAID_LEAVE'`
**Lösung:** TypeScript-Server neu starten (VS Code: Cmd+Shift+P → "Restart TS Server")

---

## 📸 **SCREENSHOTS (Erwartete Ansichten)**

### **1. Request Leave Dialog**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Art der Abwesenheit                               │
│                                                     │
│  ┌───────────────┐ ┌───────────────┐ ┌──────────┐ │
│  │      ☂️       │ │      ❤️       │ │    📅    │ │
│  │   Urlaub      │ │ Krankmeldung  │ │Unbezahlte│ │
│  │               │ │               │ │Abwesen-  │ │
│  │               │ │               │ │heit      │ │
│  └───────────────┘ └───────────────┘ └──────────┘ │
│                                                     │
│  Startdatum                    Enddatum            │
│  ┌─────────────┐              ┌─────────────┐     │
│  │ 15.10.2025  │              │ 17.10.2025  │     │
│  └─────────────┘              └─────────────┘     │
│                                                     │
│  ℹ️ Tage: 3 Arbeitstage                           │
│                                                     │
│  [Abbrechen]           [Antrag stellen]           │
└─────────────────────────────────────────────────────┘
```

### **2. Kalender - Personal View**
```
Legende: 🟢 Urlaub genehmigt  🟡 Ausstehend  🔵 Krankmeldung  
         🟣 Unbezahlte Abwesenheit  🔴 Abgelehnt

Oktober 2025
┌───┬───┬───┬───┬───┬───┬───┐
│Mo │Di │Mi │Do │Fr │Sa │So │
├───┼───┼───┼───┼───┼───┼───┤
│   │   │ 1 │ 2 │ 3 │ 4 │ 5 │
├───┼───┼───┼───┼───┼───┼───┤
│ 6 │ 7 │ 8 │ 9 │10 │11 │12 │
├───┼───┼───┼───┼───┼───┼───┤
│13 │14 │🟣 │🟣 │🟣 │18 │19 │
│   │   │15 │16 │17 │   │   │
│   │   │UNPAID   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┘
       ↑ Lila = Unbezahlte Abwesenheit
```

### **3. Personal Settings - Abwesenheiten**
```
Urlaubsanträge
┌──────────────────────────────────────────┐
│ 🟣 Unbezahlte Abwesenheit    🟡 PENDING  │
│ 15.10.2025 - 17.10.2025                 │
│ ┌────────────────────────────┐          │
│ │ Kommentar:                 │          │
│ │ Test unbezahlter Urlaub    │          │
│ └────────────────────────────┘          │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ 🟢 Urlaub                   ✅ GENEHMIGT │
│ 20.10.2025 - 24.10.2025                 │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ 🔵 Krankmeldung             ✅ GENEHMIGT │
│ 10.10.2025 - 12.10.2025                 │
└──────────────────────────────────────────┘
```

---

## 📊 **TEST-REPORT TEMPLATE**

```markdown
# Test-Report: Unbezahlte Abwesenheit

**Datum:** [DATUM]
**Tester:** [NAME]
**Browser:** [Chrome/Firefox/Safari]
**Version:** [x.x.x]

## Ergebnisse

| Test | Status | Bemerkungen |
|------|--------|-------------|
| 1. Request Dialog | ✅/❌ | |
| 2. Unbezahlten Urlaub erstellen | ✅/❌ | |
| 3. Kalender Personal View | ✅/❌ | |
| 4. Kalender Team View | ✅/❌ | |
| 5. Personal Settings | ✅/❌ | |
| 6. Genehmigung | ✅/❌ | |
| 7. Quota-Check | ✅/❌ | |
| 8. Console Errors | ✅/❌ | |

## Gesamt-Bewertung
[ ] Alle Tests bestanden ✅
[ ] Fehler gefunden ❌ (Details unten)

## Fehler-Details
[Beschreibung der gefundenen Fehler]

## Screenshots
[Optional: Screenshots anhängen]
```

---

## ✨ **ZUSAMMENFASSUNG**

Nach erfolgreichem Test solltest du haben:
- ✅ 3 Leave-Types funktional (VACATION, SICK, UNPAID_LEAVE)
- ✅ Korrektes Farb-Schema (Grün, Blau, Lila, Rot)
- ✅ Quota-Logic korrekt (UNPAID zählt nicht)
- ✅ Kalender-Anzeige korrekt
- ✅ Genehmigung funktioniert
- ✅ Keine Console-Errors

**Happy Testing! 🎉**
