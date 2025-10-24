# 🔀 Multi-Connection System - Benutzerhandbuch

## ✅ Was ist neu?

**Ein Pin Point kann jetzt mit mehreren Nodes verbunden werden!**

Beispiel:
- **Geschäftsführer (top)** → **Standort A (top)** ✅
- **Geschäftsführer (top)** → **Standort B (top)** ✅
- **Geschäftsführer (top)** → **Standort C (top)** ✅
- **Geschäftsführer (top)** → **Abteilung X (top)** ✅

---

## 🎯 Wie funktioniert es?

### 1️⃣ **Connection erstellen (wie vorher)**

1. **Hover** über einen Node → **Pin Points** werden sichtbar (oben, rechts, unten, links)
2. **Click & Hold** auf einen Pin Point (z.B. Geschäftsführer → top)
3. **Drag** zur Maus zu einem anderen Node
4. **Drop** auf einen anderen Pin Point (z.B. Standort A → top)
5. **✅ Connection erstellt!**

### 2️⃣ **Weitere Connections vom gleichen Pin Point erstellen**

1. **Hover** wieder über den ersten Node (z.B. Geschäftsführer)
2. **Click & Hold** auf den **gleichen Pin Point** (top)
3. **Drag** zu einem anderen Node
4. **Drop** auf einen anderen Pin Point (z.B. Standort B → top)
5. **✅ Zweite Connection erstellt!**

**Du kannst das beliebig oft wiederholen!** 🎉

### 3️⃣ **Einzelne Connections löschen**

❌ **NICHT:** Auf den Pin Point klicken (macht nichts mehr)

✅ **RICHTIG:** 
1. **Click** auf die **Connection Line** (die Verbindungslinie)
2. Die Line wird **blau highlighted**
3. Ein **Toolbar** erscheint mit Delete-Button
4. **Click** auf **Trash Icon** 🗑️
5. **✅ Nur diese eine Connection wird gelöscht!**

**Oder:** Drücke **Delete** oder **Backspace** wenn die Connection ausgewählt ist

---

## 🎨 Visuelles Feedback

### Pin Point States:

| State | Farbe | Bedeutung |
|-------|-------|-----------|
| **Unconnected** | ⚪ Grau | Noch keine Connection |
| **Connected** | 🟢 Grün | Hat mind. 1 Connection |
| **Hovering** | 🔵 Blau Ring | Bereit für neue Connection |
| **Dragging** | 🔵 Blau (größer) | Connection wird erstellt |

**Wichtig:** Ein **grüner Pin** kann **weitere Connections** haben! Einfach nochmal drauf klicken & draggen.

---

## 📋 Beispiel-Use-Cases

### Use Case 1: **Geschäftsführer → Mehrere Standorte**

```
        [Geschäftsführer]
         /      |      \
        /       |       \
   [Wien]  [Berlin]  [München]
```

**Wie:**
1. Geschäftsführer (top) → Wien (top) ✅
2. Geschäftsführer (top) → Berlin (top) ✅
3. Geschäftsführer (top) → München (top) ✅

---

### Use Case 2: **Standort → Mehrere Abteilungen**

```
          [Standort Wien]
         /      |      \
        /       |       \
   [IT]     [Sales]    [HR]
```

**Wie:**
1. Standort Wien (bottom) ��� IT (top) ✅
2. Standort Wien (bottom) → Sales (top) ✅
3. Standort Wien (bottom) → HR (top) ✅

---

### Use Case 3: **Matrix-Organisation**

```
   [Abteilung A] ──┐
                   ├──> [Team X]
   [Abteilung B] ──┘
```

**Wie:**
1. Abteilung A (right) → Team X (left) ✅
2. Abteilung B (right) → Team X (left) ✅

---

## 🔧 Technische Details

### Was wurde geändert?

1. **✅ Entfernt:** `handlePinDisconnect()` Funktion
   - Vorher: Click auf Pin → **ALLE** Connections weg ❌
   - Jetzt: Click auf Pin → nichts passiert ✅

2. **✅ Verbessert:** ConnectionPoint Component
   - Multi-Connection Support
   - Kein Disconnect bei Pin Click
   - Nur Delete über Connection Line

3. **✅ Dokumentiert:** Alle Components haben jetzt "Multi-Connection" in den Kommentaren

### Was ist gleich geblieben?

- ✅ Drag & Drop zum Erstellen von Connections
- ✅ Connection Reconnection (Lines umhängen)
- ✅ Connection Styling (curved/orthogonal)
- ✅ Delete einzelner Connections über Line Click
- ✅ Keyboard Shortcuts (Delete/Backspace)

---

## 🐛 Troubleshooting

### Problem: "Ich kann keine zweite Connection vom gleichen Pin erstellen"

**Lösung:**
1. Stelle sicher dass der Pin **grün** ist (= connected)
2. **Hover** über den Node (Pins müssen sichtbar sein)
3. **Click & Hold** genau auf dem grünen Pin Point
4. **Drag** zu einem anderen Node

### Problem: "Versehentlich alle Connections gelöscht"

**Das kann nicht mehr passieren!** 🎉
- Pin Clicks löschen keine Connections mehr
- Du kannst nur noch einzelne Connections über die Line löschen

### Problem: "Connection erscheint nicht"

**Mögliche Ursachen:**
1. **Source und Target Node sind gleich** → Nicht erlaubt
2. **Exakt gleiche Connection existiert bereits** → Wird übersprungen
3. **Mouse Up auf Canvas statt Pin** → Connection wird abgebrochen

---

## 🎯 Best Practices

### ✅ DO:

- **Mehrere Connections** vom gleichen Pin Point erstellen
- **Line Click** zum Löschen einzelner Connections
- **Grüne Pins** nochmal verwenden für weitere Connections
- **Unterschiedliche Pins** für bessere Übersicht verwenden

### ❌ DON'T:

- ~~Pin Point klicken zum Löschen~~ (macht nichts mehr)
- ~~Zu viele Connections von einem Pin~~ (theoretisch unbegrenzt, aber unübersichtlich)
- ~~Connection zwischen gleichem Node~~ (nicht erlaubt)

---

## 🚀 Nächste Schritte

Probier's aus! 🎨

1. Öffne `/admin/organigram-canvas`
2. Erstelle ein paar Nodes
3. Verbinde einen Node mit mehreren anderen
4. Lösche einzelne Connections über die Line
5. **Push Live** damit User es sehen können

---

## 📚 Weitere Dokumentation

- [ORGANIGRAM_DRAFT_LIVE_SYSTEM.md](./ORGANIGRAM_DRAFT_LIVE_SYSTEM.md) - Draft/Live System
- [CANVA_ORGANIGRAM_SYSTEM.md](./CANVA_ORGANIGRAM_SYSTEM.md) - Canva-Style System
- [QUICK_START_ORGANIGRAM_V2.md](./QUICK_START_ORGANIGRAM_V2.md) - Quick Start Guide

---

**Version:** 1.0  
**Datum:** 2025-01-06  
**Status:** ✅ Implementiert & Getestet
