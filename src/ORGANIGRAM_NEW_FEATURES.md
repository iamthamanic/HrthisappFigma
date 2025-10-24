# Organigram Neue Features

## ✅ Implementierte Features (06.10.2025)

### 1. 🎯 **Canva-Style Trackpad-Gesten**

Das Organigram unterstützt jetzt **zwei Arten von Trackpad-Zoom** wie in Canva:

#### **Pinch Zoom** (2-Finger Pinch)
- Zoomt am Cursor-Position (wie eine Lupe)
- Präzise für Detail-Arbeit
- Ctrl/Cmd wird automatisch erkannt

#### **2-Finger Vertical Scroll** (Wischen nach oben/unten)
- Zoomt zentriert auf dem Viewport
- Schnelles Ein-/Auszoomen
- Natürliche Whiteboard-Geste wie in Canva

#### **Reguläres Scrollen**
- 2-Finger horizontal/vertikal ohne Pinch = Panning
- Bewegt den Canvas wie Drag & Drop

### 2. 🔄 **Connection Reconnection System**

Verbindungen können jetzt **individuell umgehängt** werden, ohne alle Verbindungen zu löschen!

#### **Grüne Pin Points**
- Wenn du über eine Verbindung hoverst, erscheinen **2 grüne Pin Points**:
  - **Source Pin** (Anfang der Verbindung)
  - **Target Pin** (Ende der Verbindung)

#### **Verbindung umhängen**
1. **Hover** über eine Verbindung → grüne Pins werden sichtbar
2. **Klicke und ziehe** einen der grünen Pins
3. Die Verbindung wird **grau gefärbt** während du ziehst
4. **Lasse los** auf einem anderen Pin Point → Verbindung wird umgehängt

#### **Vorteile**
- ✅ Mehrere Nodes können mit einem Node verbunden werden
- ✅ Jede Verbindung kann einzeln umgehängt werden
- ✅ Keine Notwendigkeit, alle Verbindungen zu löschen und neu zu erstellen
- ✅ Visuelles Feedback durch graue Färbung

### 3. 👥 **Team Lead Zuweisung**

**Abteilungs-** und **Spezialisierungs-Nodes** können jetzt einen **Team Lead** zugewiesen bekommen!

#### **Verfügbare Rollen**
- Nur Benutzer mit der **TEAMLEAD-Rolle** können als Team Lead zugewiesen werden
- Andere Rollen (HR, ADMIN, etc.) werden nicht angezeigt

#### **Team Lead zuweisen**
1. Klicke auf das **Users-Icon** beim Hover über einen Node
2. Im Dialog erscheint ein neues Feld: **"Team Lead (Abteilungsleiter)"**
3. Dropdown zeigt nur Benutzer mit TEAMLEAD-Rolle
4. Speichern → Team Lead wird zugewiesen

#### **Unterstützte Node-Typen**
- ✅ **Department** (Abteilung)
- ✅ **Specialization** (Spezialisierung)
- ❌ **Location** (hat keine Team Leads)
- ❌ **Executive** (Geschäftsführer sind keine Abteilungen)

## 🗄️ **Datenbank-Migration**

### Migration `033_add_team_lead_to_nodes.sql`

Diese Migration muss im **Supabase SQL Editor** ausgeführt werden:

```sql
-- Fügt team_lead_id Spalte zur org_nodes Tabelle hinzu
ALTER TABLE org_nodes
ADD COLUMN IF NOT EXISTS team_lead_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_org_nodes_team_lead 
ON org_nodes(team_lead_id);
```

**Pfad:** `/supabase/migrations/033_add_team_lead_to_nodes.sql`

## 📝 **Verwendung**

### Canvas Controls (wie in Canva)

```
🖱️  Pan:        Drag auf Canvas
🔍  Zoom:       Cmd/Ctrl + Mausrad ODER 2-Finger Pinch/Wischen
📍  Verbindung: Von Pin Point zu Pin Point ziehen
🔄  Reconnect:  Grünen Pin einer Verbindung zu neuem Ziel ziehen
👥  Mitarbeiter: Hover → Users-Icon klicken
⌨️  Löschen:   Node/Connection auswählen → Delete/Backspace
```

### Team Lead Workflow

1. **Benutzer mit TEAMLEAD-Rolle erstellen**
   - Gehe zu Admin → Team Management
   - Bearbeite einen Benutzer
   - Setze Rolle auf "TEAMLEAD"

2. **Team Lead zuweisen**
   - Öffne Canvas Organigram
   - Hover über Abteilungs- oder Spezialisierungs-Node
   - Klicke auf Users-Icon
   - Wähle Team Lead aus Dropdown

3. **Team Lead ändern/entfernen**
   - Gleicher Dialog
   - Wähle "Kein Team Lead zugewiesen" um zu entfernen

## 🎨 **Visuelle Feedbacks**

### Verbindung erstellen
- **Blaue gestrichelte Linie** folgt dem Cursor

### Verbindung umhängen
- **Graue Verbindung** (50% Opacity) während des Ziehens
- **Grüne Pin Points** beim Hover
- **Größere Pin Points** beim Hover über den Pin

### Status-Anzeige
- **"🔗 Verbindung wird erstellt..."** - Neue Verbindung
- **"🔄 Verbindung wird umgehängt..."** - Reconnection aktiv
- Zeigt an, welcher Pin (Source/Target) bewegt wird

## 🐛 **Bekannte Einschränkungen**

1. **Migration erforderlich**
   - `033_add_team_lead_to_nodes.sql` muss ausgeführt werden
   - Ohne Migration können Team Leads nicht gespeichert werden

2. **TEAMLEAD-Rolle**
   - Keine Benutzer? → Dropdown zeigt Warnung
   - Mindestens ein Benutzer muss TEAMLEAD-Rolle haben

3. **Reconnection**
   - Kann nicht zu gleichem Node reconnected werden
   - Beim Loslassen außerhalb eines Pins wird abgebrochen

## 🚀 **Next Steps**

Empfohlene Erweiterungen:

1. **Keyboard Shortcuts**
   - `R` für Reconnect-Modus
   - `ESC` zum Abbrechen

2. **Multi-Selection**
   - Mehrere Nodes gleichzeitig verschieben
   - Ctrl/Cmd + Click für Multi-Select

3. **Verbindungs-Labels**
   - Text auf Verbindungen anzeigen
   - Beziehungstypen definieren (z.B. "berichtet an")

4. **Undo/Redo**
   - History Stack für Änderungen
   - Ctrl+Z / Ctrl+Shift+Z

5. **Templates**
   - Vordefinierte Organigram-Layouts
   - Standard-Strukturen für verschiedene Firmengrößen

---

**Version:** 1.0.0  
**Datum:** 06.10.2025  
**Status:** ✅ Produktionsbereit
