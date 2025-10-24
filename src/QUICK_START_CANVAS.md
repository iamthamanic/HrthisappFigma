# 🚀 Canvas Organigram - Quick Start Guide

## ⚡ 3-STEP SETUP

### 1️⃣ Migration ausführen (1 Minute)
```bash
# In Supabase Dashboard → SQL Editor:
# Kopiere & führe aus: /supabase/migrations/031_canva_style_organigram.sql
```

### 2️⃣ Canvas öffnen (5 Sekunden)
```
URL: /admin/organigram-canvas
Oder: Organigram → Button "Canvas Editor (NEU)"
```

### 3️⃣ Ersten Node erstellen (30 Sekunden)
```
1. Click "+ Node hinzufügen"
2. Wähle Typ → Titel eingeben
3. Erstellen → Fertig! 🎉

💡 Bei Typ "Abteilung": Wird automatisch auch in Firmeneinstellungen erstellt!
```

---

## 🎨 NODE TYPES

| Typ | Icon | Farbe | Use Case | Integration |
|-----|------|-------|----------|-------------|
| 📍 **Standort** | MapPin | Blau | Büros, Geschäftsstellen | - |
| 👔 **Geschäftsführer** | UserCog | Lila | CEO, Management | - |
| 🏢 **Abteilung** | Building2 | Grau | HR, IT, Sales, etc. | ✅ **Auto-sync mit Firmeneinstellungen** |
| 📑 **Spezialisierung** | Layers | Grün | Teams, Fachbereiche | - |

---

## 🎮 CONTROLS

### Node Actions
```
Bewegen:     Click & Drag Node
Bearbeiten:  Hover → Edit Button (Stift)
Löschen:     Hover → Delete Button (Mülleimer)
```

### Connection Actions
```
Erstellen:   Hover → Pin Point → Drag zu anderem Pin
Löschen:     Click Linie → Delete Button
Disconnect:  Click auf verbundenen Pin
Stil ändern: Click Linie → "Curved" oder "Ortho" Button
```

### Canvas Navigation
```
Zoom In:     + Button (oben links)
Zoom Out:    - Button (oben links)
Reset:       ⛶ Button (oben links)
Pan:         Click & Drag leeren Canvas
```

---

## 🔗 PIN POINTS SYSTEM

### Positionen (4 pro Node)
```
        ⬆️ top
         |
left ⬅️  NODE  ➡️ right
         |
      ⬇️ bottom
```

### States
- **Grau** → Nicht verbunden
- **Grün** → Verbunden
- **Blau** → Während Drag

### Sichtbarkeit
- ✅ Nur bei **Node-Hover** sichtbar
- ✅ Immer interaktiv wenn verbunden

---

## 💾 AUTO-SAVE

Folgendes wird automatisch gespeichert:
- ✅ Node Position (beim Verschieben)
- ✅ Node Creation/Edit/Delete
- ✅ Connections Creation/Delete
- ✅ Line Style Changes

**Keine manuelle Speicherung nötig!** 🎉

---

## 〰️ LINIEN-STILE

### Curved (Bezier) - Default
```
   ╭─────╮
  ╭╯     ╰╮
 ╭╯       ╰╮
```
**Wie in Figma/Canva**

### Orthogonal
```
   ┌─────┐
   │     │
   └─────┘
```
**Rechtwinklig wie Flowcharts**

**Umschalten**: Click auf Linie → Button

---

## 🐛 TROUBLESHOOTING

### Tables not found?
```sql
-- Run Migration:
/supabase/migrations/031_canva_style_organigram.sql
```

### Pin Points nicht sichtbar?
```
Lösung: Hover über Node!
(Nur bei Hover sichtbar wie gewünscht)
```

### Verbindung erstellen klappt nicht?
```
1. Von Pin ZIEHEN (nicht clicken)
2. Auf anderes Pin LOSLASSEN
3. Grüne Pins = Verbunden
```

### Zoom funktioniert nicht?
```
1. Click + Button (oben links)
2. Oder: Scroll auf leerem Canvas (falls implementiert)
3. Reset: ⛶ Button
```

---

## 📖 FULL DOCUMENTATION

Für Details siehe:
- `/CANVA_ORGANIGRAM_SYSTEM.md` - Komplette Doku
- `/IMPLEMENTATION_SUMMARY_CANVAS.md` - Implementation Overview

---

## ✨ SHORTCUTS SUMMARY

| Action | Method |
|--------|--------|
| Node bewegen | Click & Drag |
| Node bearbeiten | Hover → Stift-Icon |
| Node löschen | Hover → Mülleimer-Icon |
| Connection erstellen | Drag Pin → Pin |
| Connection löschen | Click Linie → Delete |
| Line Style ändern | Click Linie → Toggle |
| Zoom In | + Button |
| Zoom Out | - Button |
| Reset View | ⛶ Button |
| Pan Canvas | Drag leerer Canvas |

---

## 🎯 EXAMPLE WORKFLOW

### Organigram für Firma erstellen:

```
1. CEO Node:
   - Click "+ Node hinzufügen"
   - Typ: "Geschäftsführer"
   - Titel: "CEO - Max Mustermann"
   - Erstellen

2. HR Abteilung:
   - Click "+ Node hinzufügen"  
   - Typ: "Abteilung"
   - Titel: "Human Resources"
   - Erstellen
   - Node verschieben unter CEO

3. Verbindung CEO → HR:
   - Hover über CEO Node
   - Drag von bottom Pin
   - Drop auf HR top Pin
   - ✅ Verbindung erstellt

4. IT Abteilung hinzufügen:
   - Wiederholen wie bei HR
   - Neben HR positionieren
   - Mit CEO verbinden

5. Standort hinzufügen:
   - Typ: "Standort"
   - Titel: "Hauptsitz Berlin"
   - Mit HR verbinden (Location Pin)
```

**Fertig in unter 5 Minuten!** ⚡

---

## 🎉 YOU'RE READY!

Das war's! Jetzt kannst du dein Organigram erstellen! 🚀

Bei Fragen → Siehe `/CANVA_ORGANIGRAM_SYSTEM.md`

**Viel Erfolg!** ✨
