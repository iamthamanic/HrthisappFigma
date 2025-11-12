# 📋 Schichtplanung - Benutzeranleitung

## ✅ So weist du Mitarbeitern Schichten zu:

### **1. Mitarbeiter auswählen**
1. Gehe zur **Schichtplanung** 
2. Nutze die **Filter** (oben rechts):
   - **Team:** z.B. "Team Vertrieb"
   - **Standort:** z.B. "Berlin Mitte"
   - **Abteilung:** z.B. "Verkauf"
   - **Spezialisierung:** z.B. "Baustelle"
3. Die **Mitarbeiterliste** wird automatisch gefiltert

### **2. Schicht erstellen**
1. **Klicke auf einen Mitarbeiter** in der Liste (rechts)
2. Es öffnet sich der **"Schicht erstellen"** Dialog
3. Wähle aus:
   - **Wochentag:** z.B. "Montag, 3. Nov"
   - **Von:** z.B. "08:00"
   - **Bis:** z.B. "17:00"
   - **Standort** (optional)
   - **Abteilung** (optional)
   - **Spezialisierung** (optional - nutzt Standard wenn leer)
   - **Notizen** (optional): z.B. "Vertretung für Max"
4. Klicke auf **"Schicht erstellen"**
5. ✅ Die Schicht erscheint sofort im Kalender!

### **3. Kalenderwoche navigieren**
- **KW ändern:** Nutze `←` / `→` Buttons oben im Kalender
- **Zu heute:** Klicke auf "Heute" Button
- **Mini-Kalender:** Klicke auf ein Datum links

### **4. Schichten filtern (KW-Ansicht)**
Unten im Kalender kannst du die **Ansicht** filtern:
- **Nach Standort:** Zeigt nur Schichten eines Standorts
- **Nach Abteilung:** Zeigt nur Schichten einer Abteilung  
- **Nach Spezialisierung:** Zeigt nur Schichten mit einer Spezialisierung

**Beispiel:**
1. Wähle "Nach Standort" → "Berlin Mitte"
2. Du siehst nur Schichten am Standort "Berlin Mitte"

---

## 📊 Farben & Status

### **Mitarbeiterkarte:**
- 🟦 **Blauer Rand (Hover):** Klickbar zum Erstellen
- 🏷️ **"Geplant" Badge:** Mitarbeiter hat bereits eine Schicht diese Woche

### **Kalender:**
- 🟦 **Blaue Zeile:** Heute
- ⚪ **Graue Zeile:** Vergangene Tage
- 🟩 **Bunte Blöcke:** Schichten (Farbe = Spezialisierung)

---

## 🔧 Tipps & Tricks

### **Schnelle Planung:**
1. Filter Team → "Team Vertrieb"
2. Klicke Mitarbeiter 1 → Montag 8-17 Uhr → Speichern
3. Klicke Mitarbeiter 2 → Dienstag 8-17 Uhr → Speichern
4. etc.

### **Wochen-Übersicht:**
- Nutze die **"X Schichten"** Badge (unten im Filter)
- Zeigt Anzahl der geplanten Schichten

### **Mitarbeiter-Status:**
- **"X eingeplant"** (oben rechts in Mitarbeiterliste)
- Zeigt wie viele Mitarbeiter bereits Schichten haben

---

## ⚠️ Wichtige Hinweise

### **Schichten bearbeiten:**
- Aktuell noch nicht implementiert
- Coming soon: Klick auf Schicht-Block → Edit-Dialog

### **Schichten löschen:**
- Aktuell noch nicht implementiert
- Coming soon: Klick auf Schicht-Block → Delete-Button

### **Zeitraum:**
- Schichten werden **pro Woche** geladen
- Wechsle die KW um andere Wochen zu planen

---

## 🎯 Workflow-Beispiel

**Szenario:** Du planst die KW 45 für Team "Baustelle"

1. **Filter setzen:**
   - Team: "Baustelle"
   - Spezialisierung: "Baustelle"

2. **Schichten erstellen:**
   - Max Müller → Montag 6:00-14:00 → Standort "Berlin Nord"
   - Anna Schmidt → Montag 14:00-22:00 → Standort "Berlin Nord"
   - Tom Weber → Dienstag 6:00-14:00 → Standort "Hamburg"

3. **Übersicht filtern:**
   - Filter: "Nach Standort" → "Berlin Nord"
   - Zeigt nur Schichten in Berlin Nord

4. **Nächste Woche planen:**
   - Klicke `→` (nächste Woche)
   - Wiederhole Schritte 2-3

---

## 📞 Support

Bei Fragen oder Problemen:
- Check die Console (F12) für Fehlermeldungen
- Toast-Notifications zeigen Erfolg/Fehler
- Lade die Seite neu wenn Daten fehlen

**Version:** v4.12.0
**Stand:** 31. Oktober 2025
