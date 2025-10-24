# 🎨 Canva-Style Canvas Organigram - Bedienungsanleitung

## 🚀 Schnellstart

### Trackpad-Gesten (wie Canva Whiteboard)

#### **Zoom mit 2-Finger Wischen** ⬆️⬇️
```
2 Finger nach OBEN wischen    → Zoom IN  (näher ran)
2 Finger nach UNTEN wischen   → Zoom OUT (weiter weg)
```
- Zoomt zentriert auf dem Bildschirm
- Perfekt für schnelles Ein-/Auszoomen
- Wie in Canva's Whiteboard-Modus

#### **Zoom mit Pinch** 🤏
```
2 Finger zusammenziehen  → Zoom OUT
2 Finger auseinander     → Zoom IN
```
- Zoomt am Cursor-Position (Lupe)
- Präzise für Detail-Arbeit

#### **Pan mit 2-Finger Scroll** ↔️↕️
```
2 Finger horizontal/vertikal → Canvas verschieben
```
- Wie reguläres Scrollen
- Alternativ: Canvas mit Maus ziehen

---

## 🔄 Verbindungen umhängen (Reconnection)

### Problem gelöst! ✅
**Vorher:** Verbindung löschen musste → ALLE Verbindungen des Pins gelöscht  
**Jetzt:** Jede Verbindung einzeln umhängen! 🎉

### So geht's:

#### **Schritt 1: Verbindung auswählen**
```
1. Hover über eine Verbindung
2. Verbindung wird BLAU
3. 2 GRÜNE PINS erscheinen (Anfang & Ende)
```

#### **Schritt 2: Pin greifen**
```
1. Klicke auf einen der GRÜNEN PINS
2. Verbindung wird GRAU gefärbt
3. Status: "🔄 Verbindung wird umgehängt..."
```

#### **Schritt 3: Neues Ziel**
```
1. Ziehe zu einem anderen Pin Point
2. Lasse los
3. ✅ Verbindung ist umgehängt!
```

### Beispiel-Workflow

```
Ausgangssituation:
  [Node A] ──→ [Node B]

Ziel:
  [Node A] ──→ [Node C]

Vorgehen:
  1. Hover über die Verbindung A→B
  2. Grüne Pins erscheinen bei A und B
  3. Klicke und ziehe den GRÜNEN PIN bei B
  4. Verbindung wird GRAU
  5. Ziehe zu Node C's Pin Point
  6. Lasse los
  7. ✅ Fertig: [Node A] ──→ [Node C]
```

---

## 👥 Team Lead zuweisen

### Voraussetzung
- Node-Typ: **Abteilung** oder **Spezialisierung**
- Benutzer mit **TEAMLEAD-Rolle** muss existieren

### Workflow

#### **1. Team Lead erstellen**
```
Admin → Team Management → Benutzer bearbeiten
→ Rolle: TEAMLEAD
```

#### **2. Team Lead zuweisen**
```
1. Hover über Abteilungs-Node
2. Klicke auf USERS-Icon 👥
3. Dialog öffnet sich
4. Scrolle zu "Team Lead (Abteilungsleiter)"
5. Wähle aus Dropdown
6. Speichern
```

#### **3. Fehlende Team Leads?**
```
⚠️ Warnung erscheint:
"Keine Benutzer mit TEAMLEAD-Rolle gefunden"

Lösung:
→ Mindestens einen Benutzer mit TEAMLEAD-Rolle erstellen
```

---

## 🎯 Best Practices

### **Mehrere Verbindungen pro Node**
```
✅ RICHTIG:
  [Node A] ──→ [Node B]
  [Node A] ──→ [Node C]
  [Node A] ──→ [Node D]

Alle Verbindungen bleiben erhalten!
Jede kann einzeln umgehängt werden.
```

### **Verbindung korrigieren**
```
FALSCH verbunden:
  [A] ──→ [B]  (sollte zu C gehen)

Korrektur:
  1. Hover über Verbindung
  2. Grünen Pin bei B greifen
  3. Zu C ziehen
  ✅ Fertig!

KEINE Notwendigkeit, Verbindung zu löschen!
```

### **Zoom-Strategie**
```
Übersicht verschaffen:
  → 2-Finger RUNTER wischen (Zoom OUT)
  → Gesamtes Organigram sehen

Detail-Arbeit:
  → 2-Finger Pinch (Zoom IN)
  → Am Cursor zoomen

Navigation:
  → 2-Finger Pan (verschieben)
  → Oder mit Maus ziehen
```

---

## ⌨️ Keyboard Shortcuts

```
ZOOM:
  Cmd/Ctrl + +        → Zoom In
  Cmd/Ctrl + -        → Zoom Out
  Cmd/Ctrl + 0        → Reset Zoom (100%)

LÖSCHEN:
  Delete/Backspace    → Selected Node/Connection löschen

ABBRECHEN:
  ESC                 → Connection Draft abbrechen
  Click außerhalb     → Selection aufheben
```

---

## 🎨 Visuelle Feedbacks

### **Farben**
```
🔵 BLAU         → Verbindung ausgewählt/hover
⚫ GRAU (50%)   → Verbindung wird umgehängt
🟢 GRÜN         → Interaktive Pin Points
🔵 GESTRICHELT  → Neue Verbindung wird erstellt
```

### **Status-Anzeigen (unten rechts)**
```
🔗 Verbindung wird erstellt...
   → Neue Verbindung aktiv

🔄 Verbindung wird umgehängt...
   → Reconnection aktiv
   → Zeigt Source/Target Pin
```

### **Cursor-Änderungen**
```
👆 POINTER      → Clickbare Elemente
✊ GRAB          → Canvas (Pan-Modus)
✋ GRABBING      → Aktives Panning
🎯 CROSSHAIR    → Node verschieben
```

---

## 🐛 Troubleshooting

### **"Team Lead Dropdown ist leer"**
```
Problem: Keine Benutzer mit TEAMLEAD-Rolle

Lösung:
  1. Admin → Team Management
  2. Benutzer bearbeiten
  3. Rolle auf "TEAMLEAD" setzen
  4. Speichern
  5. Zurück zum Organigram
```

### **"Verbindung verschwindet beim Umhängen"**
```
Problem: Zu schnell losgelassen

Lösung:
  1. Grünen Pin FESTHALTEN
  2. Zu Ziel-Pin ziehen
  3. Warten bis Ziel-Pin LEUCHTET
  4. Erst dann loslassen
```

### **"Kann nicht zoomen"**
```
Problem: Trackpad-Gesten nicht erkannt

Lösung:
  1. Verwende Cmd/Ctrl + Mausrad
  2. Oder Zoom-Buttons (oben links)
  3. Oder 2-Finger Pinch (deutlicher)
```

### **"Verbindung wird nicht grau"**
```
Problem: Nicht auf grünen Pin geklickt

Lösung:
  1. ERST über Verbindung hovern
  2. Grüne Pins erscheinen lassen
  3. DANN auf grünen Pin klicken
  4. Nicht auf Verbindung selbst klicken
```

---

## 📊 Vergleich: Vorher vs. Nachher

### **Verbindung ändern**

#### ❌ **Vorher:**
```
1. Verbindung löschen
2. ALLE Verbindungen vom Pin werden gelöscht
3. Alle Verbindungen neu erstellen
4. Umständlich bei vielen Verbindungen
```

#### ✅ **Jetzt:**
```
1. Grünen Pin greifen
2. Umhängen
3. Fertig!
4. Nur diese eine Verbindung betroffen
```

### **Zoomen**

#### ❌ **Vorher:**
```
1. Nur Ctrl + Mausrad
2. Keine Trackpad-Gesten
3. Nicht wie Canva
```

#### ✅ **Jetzt:**
```
1. 2-Finger Pinch (Zoom am Cursor)
2. 2-Finger Wischen (Zoom zentriert)
3. 2-Finger Scroll (Pan)
4. Genau wie Canva Whiteboard!
```

---

## 🎓 Video-Tutorials (Empfohlen)

1. **Canva Whiteboard-Gesten** ansehen
   - Zeigt 2-Finger Wischen zum Zoomen
   - Pinch-Gesten
   - Navigation

2. **Figma Canvas-Controls** ansehen
   - Ähnliches Verhalten
   - Reconnection-Konzept
   - Multi-Connection Handling

---

## 💡 Pro-Tips

### **Schnelle Navigation**
```
1. Zoom OUT (2-Finger runter) → Übersicht
2. Interessanten Bereich finden
3. Pinch Zoom IN am Cursor → Detail
```

### **Saubere Verbindungen**
```
1. Nodes logisch anordnen (Top-Down)
2. Pin Points strategisch wählen:
   - Parent → Bottom Pin
   - Child → Top Pin
3. Bei Bedarf einzeln umhängen
```

### **Team Structure**
```
Geschäftsführer (Executive)
    ↓
Abteilung (Department) + Team Lead
    ↓
Spezialisierung (Specialization) + Team Lead
    ↓
Mitarbeiter (Primary/Backup Users)
```

---

**Happy Organizing! 🎉**

Bei Fragen: Siehe `/ORGANIGRAM_NEW_FEATURES.md` für technische Details.
