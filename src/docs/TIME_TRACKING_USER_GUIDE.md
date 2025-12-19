# ⏰ Zeiterfassung - Benutzerhandbuch

## 📖 Übersicht

Die **Zeiterfassung** in Browo Koordinator ermöglicht es dir, deine Arbeitszeiten einfach und schnell zu erfassen - genau wie bei Factorial!

---

## 🚀 Schnellstart

### 1. Zur Arbeit-Seite navigieren

Klicke in der Navigation auf **"Arbeit"** oder gehe zu `/arbeit`.

### 2. Richtigen Tab wählen

Wähle den Tab, der zu deiner aktuellen Arbeit passt:

- **🏢 Office**: Für Büro-Arbeit
- **🌍 Field**: Für Außendienst-Einsätze
- **👥 Extern**: Für externe Projekte

### 3. Einstempeln

Klicke auf den großen grünen Button **"Einstempeln"**.

✅ Der Button wechselt zu **"Ausstempeln"**  
✅ Ein Live-Timer zeigt deine aktuelle Arbeitszeit an  
✅ Du siehst, seit wann du eingecheckt bist  

### 4. Arbeiten 💪

Der Timer läuft im Hintergrund und aktualisiert sich automatisch.

### 5. Ausstempeln

Wenn du Feierabend machst, klicke auf den roten Button **"Ausstempeln"**.

✅ Deine Arbeitszeit wird automatisch berechnet  
✅ Pausen werden automatisch nach Arbeitsrecht hinzugefügt  
✅ Der Eintrag erscheint in deiner Stempelzeiten-Liste  

---

## 📊 Deine Stempelzeiten ansehen

### Filter-Ansichten

Unterhalb der Einstempel-Karte findest du deine Stempelzeiten. Du kannst filtern nach:

- **Heute**: Nur heutige Einträge
- **Diese Woche**: Alle Einträge dieser Woche (Montag-Heute)
- **Dieser Monat**: Alle Einträge des aktuellen Monats

### Zusammenfassung

Oben in der Liste siehst du eine Zusammenfassung:

- **Gesamtzeit**: Alle gearbeiteten Stunden
- **Pausen**: Gesamte Pausenzeit in Minuten
- **Einträge**: Anzahl der Zeiteinträge

### Einträge

Jeder Eintrag zeigt:

- 📅 **Datum**: Wochentag und vollständiges Datum
- ⏰ **Zeiten**: Einstempel- und Ausstempelzeit (z.B. "08:00 - 17:00")
- ☕ **Pause**: Pausendauer in Minuten
- 🏷️ **Typ**: Office, Field oder Extern
- ⏱️ **Gesamt**: Gesamte Arbeitszeit für den Tag

---

## 💡 Tipps & Tricks

### Mehrmals am Tag stempeln

Du kannst mehrmals am Tag ein- und ausstempeln:

1. **Morgens einstempeln**: 08:00
2. **Mittagspause ausstempeln**: 12:00
3. **Nach der Pause wieder einstempeln**: 13:00
4. **Feierabend ausstempeln**: 17:00

Am Ende des Tages siehst du alle Einträge gruppiert.

### Automatische Pausen

Pausen werden automatisch nach Arbeitsrecht berechnet:

- **6+ Stunden**: Automatisch 30 Minuten Pause (je nach Einstellung)
- **9+ Stunden**: Automatisch 45 Minuten Pause (je nach Einstellung)

Die Pause wird beim **Ausstempeln** hinzugefügt.

### Tab wechseln

Du kannst während eines laufenden Stempels **nicht** den Tab wechseln. 

❌ **Falsch**: Einstempeln in "Office", dann Tab zu "Field" wechseln  
✅ **Richtig**: Erst ausstempeln, dann Tab wechseln und neu einstempeln  

---

## ❓ Häufige Fragen (FAQ)

### Ich habe vergessen auszustempeln - was nun?

**Option 1**: Nach 12 Stunden wirst du automatisch ausgestempelt  
**Option 2**: Kontaktiere einen Admin, der kann deine Zeit manuell korrigieren  

### Kann ich meine Zeiten nachträglich bearbeiten?

Nein, normale Mitarbeiter können ihre Zeiten nicht nachträglich ändern.  
Kontaktiere einen Admin oder HR, wenn eine Korrektur nötig ist.

### Wird meine GPS-Position getrackt?

**Nein!** Aktuell wird keine GPS-Position gespeichert (Datenschutz).  
Nur der Work Type (Office/Field/Extern) wird gespeichert.

### Kann ich auch am Wochenende stempeln?

Ja, du kannst an **jedem Tag** stempeln. Die App unterscheidet nicht zwischen Wochentagen und Wochenende.

### Was passiert, wenn ich den Browser schließe?

Dein Stempel läuft weiter! Wenn du die Seite später wieder öffnest, siehst du den aktuellen Status.

### Sehen andere Mitarbeiter meine Stempelzeiten?

**Nein**, nur du und Admins/HR können deine Zeiten sehen.

---

## 🎨 Visuelle Übersicht

### Einstempel-Card

```
┌─────────────────────────────────────┐
│  🏢 Office                    Aktiv │  ← Status-Banner
├─────────────────────────────────────┤
│  ⏰ Du bist eingecheckt              │
│     seit 08:30 Uhr                  │
│                                     │
│     🟠 2h 15m                       │  ← Live-Timer
│                                     │
│  Mittwoch, 18. Dezember 2024       │
│                                     │
│  ┌───────────────────────────────┐ │
│  │    🔴 AUSSTEMPELN             │ │  ← Action Button
│  └───────────────────────────────┘ │
│                                     │
│  ℹ️ Vergiss nicht auszustempeln!   │
└─────────────────────────────────────┘
```

### Stempelzeiten-Liste

```
┌─────────────────────────────────────┐
│  📊 Meine Stempelzeiten             │
│  [Heute] [Diese Woche] [Dieser...   │  ← Filter
├─────────────────────────────────────┤
│  40.5h        30 Min      5         │  ← Zusammenfassung
│  Gesamtzeit   Pausen     Einträge   │
├─────────────────────────────────────┤
│  📅 Montag, 18. Dezember 2024       │
│  Gesamt: 8h 30m  ☕ 30 Min Pause    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ⏰ 08:00 - 12:00 (4h)       │   │  ← Einzelner Eintrag
│  │ ☕ 0 Min  🏢 Office          │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ ⏰ 13:00 - 17:30 (4.5h)     │   │
│  │ ☕ 30 Min  🏢 Office         │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## 🆘 Support

Bei Problemen oder Fragen:

1. **Admin kontaktieren**: Für Zeitkorrekturen
2. **HR kontaktieren**: Für Einstellungen (Pausen, Sollstunden)
3. **Bug melden**: Wenn etwas nicht funktioniert

---

**Viel Erfolg mit der Zeiterfassung! ⏰**
