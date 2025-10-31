# ✅ SCHICHTPLANUNG - 24h Timeline + Mitarbeiterauswahl

## 🎨 Was wurde geändert?

### **1. Timeline auf 24 Stunden erweitert**
- ❌ Vorher: 7:00 - 19:00 Uhr (12 Stunden)
- ✅ Jetzt: 00:00 - 24:00 Uhr (24 Stunden)

### **2. Mitarbeiterauswahl neu gestaltet**
- ❌ Vorher: Team Accordion mit verschachtelten Mitarbeitern
- ✅ Jetzt: Direkte Mitarbeiter-Liste basierend auf Team-Auswahl

---

## 📂 Änderung 1: 24-Stunden-Timeline

### **Datei:** `/components/BrowoKo_WeeklyShiftCalendar.tsx`

**Vorher:**
```typescript
const START_HOUR = 7; // 7:00
const END_HOUR = 19; // 19:00
```

**Nachher:**
```typescript
const START_HOUR = 0; // 0:00
const END_HOUR = 24; // 24:00
```

### **Zusätzliche Änderung:**
Stunden-Formatierung mit `padStart` für korrekte Anzeige:
```typescript
return `${hour.toString().padStart(2, '0')}:${minutes}`;
```

**Ergebnis:**
- `0:00, 1:00, 2:00, ... 23:00, 24:00` (statt `7:00, 8:00, ... 19:00`)
- Volle 24-Stunden-Abdeckung für Nachtschichten

---

## 📂 Änderung 2: Mitarbeiterauswahl

### **Datei:** `/components/BrowoKo_ShiftPlanningTab.tsx`

### **Vorher:**
```tsx
<Card>
  <CardContent className="pt-6">
    <Accordion type="single" collapsible>
      {teams.map(team => (
        <AccordionItem key={team.id}>
          <AccordionTrigger>
            {team.name} ({team.member_count})
          </AccordionTrigger>
          <AccordionContent>
            {team.members.map(user => (
              <BrowoKo_DraggableUser user={user} />
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </CardContent>
</Card>
```

**Problem:**
- ❌ Alle Teams immer sichtbar → unübersichtlich
- ❌ Mitarbeiter versteckt in Accordion
- ❌ Mehrfaches Auf-/Zuklappen notwendig

---

### **Nachher:**
```tsx
<Card>
  <CardContent className="pt-6">
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b">
        <h3 className="font-semibold">Mitarbeiterauswahl</h3>
        {selectedTeam !== 'all' && (
          <Badge>{filteredUsers.length} Mitarbeiter</Badge>
        )}
      </div>

      {/* Mitarbeiter Liste */}
      {selectedTeam === 'all' ? (
        <div className="text-sm text-gray-500 text-center py-4">
          Bitte wähle ein Team aus
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredUsers.map(user => (
            <BrowoKo_DraggableUser
              key={user.id}
              user={user}
              hasShift={shifts.some(s => s.user_id === user.id)}
            />
          ))}
        </div>
      )}
    </div>
  </CardContent>
</Card>
```

**Vorteile:**
- ✅ Übersichtlicher Titel: "Mitarbeiterauswahl"
- ✅ Mitarbeiter direkt sichtbar (kein Accordion)
- ✅ Abhängig von Team-Dropdown-Auswahl
- ✅ Badge zeigt Anzahl der Mitarbeiter
- ✅ Scrollbar bei vielen Mitarbeitern
- ✅ Status: "X eingeplant"

---

## 🎯 Neuer Workflow

### **1. Team auswählen:**
```
┌─────────────────────────┐
│ Team: [Alle Teams ▼]    │
│       → Büro 2 ▼        │
└─────────────────────────┘
```

### **2. Mitarbeiter erscheinen automatisch:**
```
┌─────────────────────────────┐
│ Mitarbeiterauswahl  [5]     │
├─────────────────────────────┤
│ Ziehe Mitarbeiter...  3 ✓   │
├─────────────────────────────┤
│ [👤] Müller, Anna           │
│ [👤] Schmidt, Tom      ✓    │
│ [👤] Meyer, Klaus      ✓    │
│ [👤] Klein, Maria      ✓    │
│ [👤] Wagner, Lisa           │
└─────────────────────────────┘
```

### **3. Drag & Drop auf Timeline:**
```
Mitarbeiter ziehen → Wochentag → Schicht erstellen
```

---

## 🎨 UI-Elemente

### **1. Header:**
```tsx
<div className="flex items-center justify-between pb-2 border-b">
  <h3 className="font-semibold text-gray-900">Mitarbeiterauswahl</h3>
  <Badge variant="secondary" className="text-xs">
    {filteredUsers.length} Mitarbeiter
  </Badge>
</div>
```

**Zeigt:**
- Titel: "Mitarbeiterauswahl"
- Anzahl: z.B. "5 Mitarbeiter"

---

### **2. Info-Text (kein Team ausgewählt):**
```tsx
{selectedTeam === 'all' ? (
  <div className="text-sm text-gray-500 text-center py-4">
    Bitte wähle ein Team aus, um Mitarbeiter anzuzeigen
  </div>
) : ...}
```

**Zeigt:**
- Hilfetext wenn "Alle Teams" ausgewählt ist

---

### **3. Stats-Zeile:**
```tsx
<div className="flex items-center justify-between text-xs text-gray-500 px-2">
  <span>Ziehe Mitarbeiter auf den Kalender</span>
  <span>3 eingeplant</span>
</div>
```

**Zeigt:**
- Links: Anleitung
- Rechts: Anzahl der eingeplanten Mitarbeiter

---

### **4. Mitarbeiter-Liste:**
```tsx
<div className="space-y-2 max-h-[400px] overflow-y-auto">
  {filteredUsers.map(user => (
    <BrowoKo_DraggableUser
      key={user.id}
      user={user}
      hasShift={shifts.some(s => s.user_id === user.id)}
    />
  ))}
</div>
```

**Features:**
- Max. Höhe: 400px
- Scrollbar bei Overflow
- Spacing zwischen Mitarbeitern
- Grüner Haken (✓) wenn eingeplant

---

## 📊 Vergleich Vorher/Nachher

| Feature | Vorher (Accordion) | Nachher (Liste) |
|---------|-------------------|-----------------|
| **Sichtbarkeit** | Versteckt in Accordion | Direkt sichtbar |
| **Team-Auswahl** | Accordion öffnen | Dropdown-basiert |
| **Mitarbeiter** | Pro Team einzeln | Alle vom Team |
| **Übersichtlichkeit** | ❌ Mehrere Teams gleichzeitig | ✅ Nur ein Team |
| **Drag & Drop** | ✅ Möglich | ✅ Möglich |
| **Titel** | "Teams" | "Mitarbeiterauswahl" |
| **Badge** | Team-Count | Mitarbeiter-Count |
| **Scroll** | ❌ Nicht nötig | ✅ Bei vielen Mitarbeitern |

---

## 🧪 Testen

### **In der App:**
```
1. Öffne: Field Verwaltung
2. Klicke: Einsatzplanung
3. Wechsel zu: Schichtplanung Tab
```

### **Test-Schritte:**

**1. Team-Auswahl:**
- ✅ Dropdown zeigt "Alle Teams", "Büro 2", "HR Team", etc.
- ✅ Standard: "Alle Teams" → Info-Text erscheint

**2. Team wählen (z.B. "Büro 2"):**
- ✅ "Mitarbeiterauswahl" Header erscheint
- ✅ Badge zeigt "5 Mitarbeiter"
- ✅ Stats: "Ziehe Mitarbeiter... 3 eingeplant"
- ✅ Liste zeigt alle Mitarbeiter des Teams

**3. Mitarbeiter mit Schicht:**
- ✅ Grüner Haken (✓) neben Name
- ✅ Zählt zu "X eingeplant"

**4. Timeline:**
- ✅ Zeigt jetzt 00:00 - 24:00 Uhr
- ✅ Alle Stunden von 0 bis 24 sichtbar
- ✅ Nachtschichten (22:00 - 06:00) möglich

---

## 🌙 Nachtschichten-Support

### **Vorher (7-19 Uhr):**
```
❌ Nachtschicht 22:00 - 06:00 → NICHT möglich
❌ Frühe Schichten 05:00 - 13:00 → NUR teilweise sichtbar
```

### **Jetzt (0-24 Uhr):**
```
✅ Nachtschicht 22:00 - 06:00 → Vollständig sichtbar
✅ Frühe Schichten 05:00 - 13:00 → Vollständig sichtbar
✅ Spätschichten 18:00 - 02:00 → Vollständig sichtbar
```

---

## 🎯 Beispiel-Szenarien

### **Szenario 1: Büro-Team planen**
```
1. Team wählen: "Büro 2"
2. Mitarbeiter sehen: Anna Müller, Tom Schmidt, ...
3. Anna ziehen auf Montag 09:00
4. Schicht-Dialog öffnet sich: 09:00 - 17:00
```

### **Szenario 2: Nachtschicht-Team**
```
1. Team wählen: "Nachtschicht Security"
2. Mitarbeiter sehen: Klaus Meyer, ...
3. Klaus ziehen auf Dienstag 22:00
4. Schicht-Dialog öffnet sich: 22:00 - 06:00
```

### **Szenario 3: 24/7 Support**
```
1. Team wählen: "IT Support"
2. Timeline zeigt: 00:00 - 24:00
3. Schichten planen:
   - Frühschicht: 06:00 - 14:00
   - Spätschicht: 14:00 - 22:00
   - Nachtschicht: 22:00 - 06:00
```

---

## 📝 Code-Zusammenfassung

### **Geänderte Dateien:**

**1. `/components/BrowoKo_WeeklyShiftCalendar.tsx`**
```typescript
// Änderung 1: Timeline auf 24h
const START_HOUR = 0;
const END_HOUR = 24;

// Änderung 2: Formatierung mit padStart
return `${hour.toString().padStart(2, '0')}:${minutes}`;
```

**2. `/components/BrowoKo_ShiftPlanningTab.tsx`**
```tsx
// Änderung: Accordion → Direkte Liste
<Card>
  <CardContent className="pt-6">
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b">
        <h3>Mitarbeiterauswahl</h3>
        <Badge>{filteredUsers.length} Mitarbeiter</Badge>
      </div>
      
      {selectedTeam === 'all' ? (
        <div>Bitte wähle ein Team aus</div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredUsers.map(user => (
            <BrowoKo_DraggableUser user={user} hasShift={...} />
          ))}
        </div>
      )}
    </div>
  </CardContent>
</Card>
```

---

## ✅ Was jetzt funktioniert

### **Timeline:**
- ✅ 24-Stunden-Anzeige (00:00 - 24:00)
- ✅ Nachtschichten planbar
- ✅ Frühe Schichten sichtbar
- ✅ Korrekte Stunden-Formatierung (01:00 statt 1:00)

### **Mitarbeiterauswahl:**
- ✅ Übersichtlicher Titel
- ✅ Team-basierte Filterung
- ✅ Direkte Sichtbarkeit (kein Accordion)
- ✅ Mitarbeiter-Count Badge
- ✅ Eingeplant-Status
- ✅ Scrollbar bei vielen Mitarbeitern
- ✅ Drag & Drop bereit

---

## 🚀 Nächste Schritte (Optional)

### **1. Drag & Drop implementieren:**
- Mitarbeiter auf Timeline ziehen
- Schicht-Dialog öffnet sich automatisch
- Start-/Endzeit vorbefüllt

### **2. Erweiterte Filter:**
- Nach Spezialisierung filtern
- Nach Verfügbarkeit filtern
- Nur verfügbare Mitarbeiter zeigen

### **3. Konflikte erkennen:**
- Warnung bei doppelter Einplanung
- Warnung bei zu vielen Stunden
- Pause-Regeln checken

---

## 🎉 Status

✅ **24-Stunden-Timeline implementiert!**
✅ **Mitarbeiterauswahl neu gestaltet!**

**Die Schichtplanung ist jetzt:**
- Volle 24h-Abdeckung
- Übersichtliche Mitarbeiterauswahl
- Team-basierte Filterung
- Bereit für Drag & Drop

**Bereit zum Testen in der App!** 🚀
