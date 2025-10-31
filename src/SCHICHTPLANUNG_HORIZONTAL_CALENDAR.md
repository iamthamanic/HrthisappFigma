# ✅ SCHICHTPLANUNG - Horizontale Wochenansicht

## 🎨 Was wurde geändert?

Die Schichtplanung hat jetzt eine **horizontale Wochenansicht** wie im Screenshot:

### **Vorher (Vertikal):**
```
┌──────────────┐
│  Zeit  │ Mo  │
│  7:00  │ [█] │
│  8:00  │ [█] │
│  9:00  │     │
│ 10:00  │     │
│ 11:00  │ [█] │
└──────────────┘
```

### **Nachher (Horizontal):**
```
┌────────────────────────────────────────────────────┐
│                   KW 47  ← →                       │
├────────────────────────────────────────────────────┤
│       │ 7:00 │ 8:00 │ 9:00 │ 10:00 │ 11:00 │ ... │
├───────┼──────┴──────┴──────┴───────┴───────┴─────┤
│ Mo    │ [████ MÜLLER, ANNA 8:00-12:00 ████]      │
│ 16.01 │                                            │
├───────┼────────────────────────────────────────────┤
│ Di    │     [███ SCHMIDT, TOM 9:00-13:00 ███]    │
│ 17.01 │                                            │
└───────┴────────────────────────────────────────────┘
```

---

## 📝 Neue Komponente: `BrowoKo_WeeklyShiftCalendar`

### **Features:**

1. **KW Header mit Navigation:**
   - ← KW 47 →
   - "Heute" Button springt zur aktuellen Woche

2. **Wochentage vertikal:**
   - Montag bis Sonntag
   - Mit Datum (z.B. "16. Jan")
   - Visuelle Markierung:
     - 🔵 Heute = Blauer Hintergrund
     - ⚪ Vergangene Tage = Grauer Hintergrund
     - ⚪ Zukünftige Tage = Weißer Hintergrund

3. **Zeit horizontal:**
   - Stunden von 7:00 bis 19:00
   - Grid-Lines jede Stunde
   - Schichten positionieren sich automatisch

4. **Schicht-Blöcke:**
   - Profilbild + Name
   - Start-/Endzeit
   - Farbcodierung nach Spezialisierung
   - Hover-Tooltip mit Details
   - Badge mit Spezialisierung (bei Hover)

---

## 🎨 Farbcodierung (Spezialisierungen)

| Spezialisierung | Farbe | Hex |
|-----------------|-------|-----|
| Baustelle | 🟠 Orange | #FB923C |
| BACKSTUBE | 🟠 Orange (dunkler) | #F97316 |
| GEMÜSE | 🟣 Lila | #C084FC |
| SCHUMIBÄCKER ZONE | 🟡 Gelb | #FACC15 |
| NETZWERKRAUM-APPLE | 🔵 Blau | #60A5FA |
| Andere | Hash-basiert | #F472B6, #818CF8, ... |

**Farben wurden von Tailwind-Klassen auf Hex-Werte umgestellt**, damit sie inline als `backgroundColor` verwendet werden können.

---

## 📂 Geänderte Dateien

### **1. Neue Komponente erstellt:**
```
/components/BrowoKo_WeeklyShiftCalendar.tsx
```

**Verantwortlich für:**
- Horizontale Wochenansicht
- KW Navigation
- Zeitliche Positionierung der Schichten
- Hover-Tooltips

---

### **2. Angepasste Komponente:**
```
/components/BrowoKo_ShiftPlanningTab.tsx
```

**Änderungen:**
- Import: `BrowoKo_ShiftTimeline` → `BrowoKo_WeeklyShiftCalendar`
- Farbfunktion: Tailwind-Klassen → Hex-Farben
- Interface: `avatar_url` → `profile_picture`
- Timeline-Rendering komplett ersetzt

---

## 🧮 Berechnung der Schicht-Positionen

### **Position (links):**
```typescript
const calculatePosition = (startTime: string): number => {
  const startMinutes = timeToMinutes(startTime);
  const timelineStartMinutes = START_HOUR * 60; // 7:00 = 420 min
  const timelineWidthMinutes = (END_HOUR - START_HOUR) * 60; // 12 Stunden
  return ((startMinutes - timelineStartMinutes) / timelineWidthMinutes) * 100;
};
```

**Beispiel:**
- Schicht: 9:00-13:00
- Start: 9:00 = 540 min
- Timeline Start: 7:00 = 420 min
- Offset: 540 - 420 = 120 min
- Position: (120 / 720) * 100 = **16.67%** von links

---

### **Breite:**
```typescript
const calculateWidth = (startTime: string, endTime: string): number => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const durationMinutes = endMinutes - startMinutes;
  const timelineWidthMinutes = (END_HOUR - START_HOUR) * 60;
  return (durationMinutes / timelineWidthMinutes) * 100;
};
```

**Beispiel:**
- Schicht: 9:00-13:00
- Duration: 4 Stunden = 240 min
- Timeline Breite: 12 Stunden = 720 min
- Breite: (240 / 720) * 100 = **33.33%**

---

## 🎯 Schicht-Block Struktur

```tsx
<div style={{ left: '16.67%', width: '33.33%' }}>
  <div style={{ backgroundColor: '#FB923C' }}>
    <Avatar>
      <AvatarImage src={user.profile_picture} />
      <AvatarFallback>MA</AvatarFallback>
    </Avatar>
    
    <div>
      <div>MÜLLER, ANNA</div>
      <div>09:00-13:00</div>
    </div>
    
    <Badge>Baustelle</Badge>
  </div>
</div>
```

---

## ✨ Visuelle Highlights

### **1. Heute-Markierung:**
```tsx
className={isToday ? 'bg-blue-50' : isPast ? 'bg-gray-50' : 'bg-white'}
```

### **2. Hover-Effekt:**
```tsx
className="group cursor-pointer hover:z-20"
```
- Schicht hebt sich beim Hover
- Tooltip erscheint
- Badge wird sichtbar

### **3. Grid-Lines:**
```tsx
{Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
  <div
    className="absolute border-r border-gray-200"
    style={{ left: `${(i / (END_HOUR - START_HOUR)) * 100}%` }}
  />
))}
```

---

## 🧪 Testen

### **In der App:**
```
1. Öffne: Field Verwaltung
2. Klicke: Einsatzplanung
3. Wechsel zu: Schichtplanung Tab
```

### **Was du sehen solltest:**

✅ **Header:**
- KW 47 mit ← → Buttons
- "Heute" Button

✅ **Wochentage:**
- Montag, Dienstag, ... Sonntag
- Mit Datum (16. Jan, 17. Jan, ...)

✅ **Zeitleiste:**
- Stunden: 7:00, 8:00, 9:00, ..., 19:00
- Grid-Lines alle Stunde

✅ **Schichten:**
- Farbige Balken horizontal
- Profilbild + Name
- Start/End-Zeit
- Hover → Tooltip + Badge

✅ **Legende:**
- Heute (blau)
- Vergangene Tage (grau)
- Zukünftige Tage (weiß)

---

## 📋 Vorher/Nachher Vergleich

### **Vorher (BrowoKo_ShiftTimeline):**
- ❌ Zeit vertikal (7:00 oben → 19:00 unten)
- ❌ Tage horizontal (Mo | Di | Mi | ...)
- ❌ Schichten als vertikale Blöcke
- ❌ Schwierig mehrere Schichten pro Tag zu sehen

### **Nachher (BrowoKo_WeeklyShiftCalendar):**
- ✅ Zeit horizontal (7:00 links → 19:00 rechts)
- ✅ Tage vertikal (Montag ↓ Dienstag ↓ ...)
- ✅ Schichten als horizontale Balken
- ✅ Mehrere Schichten pro Tag stapeln sich vertikal
- ✅ KW Header mit Navigation
- ✅ Heute-Markierung
- ✅ Hover-Tooltips

---

## 🚀 Nächste Schritte (Optional)

### **1. Drag & Drop hinzufügen:**
- User aus Sidebar auf Timeline ziehen
- Schichten per Drag verschieben
- Schichten per Drag verlängern/verkürzen

### **2. Schicht-Editing:**
- Klick auf Schicht → Edit Dialog
- Doppelklick auf Timeline → Create Dialog
- Rechtsklick → Kontextmenü (Bearbeiten, Löschen, Kopieren)

### **3. Erweiterte Ansichten:**
- Monatsansicht
- Tagesansicht (nur 1 Tag mit Stunden)
- 2-Wochen-Ansicht

### **4. Konflikt-Erkennung:**
- Überlappende Schichten markieren
- Warnung bei zu vielen Stunden
- Pause-Regeln checken

### **5. Export:**
- PDF Export der Woche
- iCal Export
- Excel Export

---

## 🎉 Status

✅ **Horizontale Wochenansicht implementiert!**

**Die Schichtplanung sieht jetzt aus wie im Screenshot:**
- KW oben mit Navigation
- Wochentage vertikal
- Zeit horizontal
- Schichten als farbige Balken

**Bereit zum Testen in der App!** 🚀
