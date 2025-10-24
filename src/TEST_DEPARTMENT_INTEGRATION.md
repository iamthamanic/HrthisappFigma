# 🧪 Department Integration - Test Guide

## Schritt-für-Schritt Testing

### ✅ Test 1: Abteilung im Canvas erstellen

**Ziel:** Prüfen ob Department automatisch in Firmeneinstellungen erstellt wird

**Schritte:**
1. Öffne `/admin/organigram-canvas`
2. Click **"+ Node hinzufügen"**
3. Wähle Typ: **"Abteilung"** (Building2 Icon, Grau)
4. Titel: **"Test HR Abteilung"**
5. Beschreibung: **"Human Resources Test"** (optional)
6. Click **"Node erstellen"**

**Erwartetes Ergebnis:**
- ✅ Node erscheint im Canvas (graue Box)
- ✅ Toast: "Node erstellt"
- ✅ Console Log: "✅ Created department: Test HR Abteilung with ID: [uuid]"

**Verifikation:**
1. Öffne `/admin/company-settings`
2. Gehe zu Tab "Abteilungen"
3. ✅ Check: "Test HR Abteilung" ist in der Liste
4. ✅ Check: Beschreibung ist "Human Resources Test"

---

### ✅ Test 2: Abteilung umbenennen

**Ziel:** Prüfen ob Titeländerung synchronisiert wird

**Schritte:**
1. Zurück zu `/admin/organigram-canvas`
2. Hover über "Test HR Abteilung" Node
3. Click **Edit Button** (Stift-Icon)
4. Ändere Titel zu: **"HR & Recruiting"**
5. Ändere Beschreibung zu: **"Personalabteilung & Recruiting"**
6. Click **"Speichern"**

**Erwartetes Ergebnis:**
- ✅ Node-Titel aktualisiert im Canvas
- ✅ Kein Error in Console

**Verifikation:**
1. Öffne `/admin/company-settings`
2. Gehe zu Tab "Abteilungen"
3. ✅ Check: Name ist jetzt "HR & Recruiting"
4. ✅ Check: Beschreibung ist "Personalabteilung & Recruiting"

---

### ✅ Test 3: Mehrere Abteilungen erstellen

**Ziel:** Prüfen ob alle Departments korrekt erstellt werden

**Schritte:**
1. Erstelle folgende Abteilungs-Nodes:
   - **"IT"** (Beschreibung: "Information Technology")
   - **"Sales"** (Beschreibung: "Vertrieb")
   - **"Marketing"** (Beschreibung: "Marketing Team")
   - **"Finance"** (Beschreibung: "Finanzen")

**Erwartetes Ergebnis:**
- ✅ 4 neue Nodes im Canvas
- ✅ Alle Nodes sind grau (Abteilungs-Farbe)
- ✅ Alle haben Building2 Icon

**Verifikation:**
1. Öffne `/admin/company-settings` → Abteilungen
2. ✅ Check: Alle 5 Abteilungen vorhanden:
   - HR & Recruiting
   - IT
   - Sales
   - Marketing
   - Finance
3. ✅ Check: Keine Duplikate
4. ✅ Check: Alle Beschreibungen korrekt

---

### ✅ Test 4: Node-Typ konvertieren

**Ziel:** Prüfen ob beim Typ-Wechsel zu "Abteilung" ein Department erstellt wird

**Schritte:**
1. Erstelle Node mit Typ: **"Spezialisierung"**
2. Titel: **"Software Development"**
3. Node bearbeiten
4. Typ ändern zu: **"Abteilung"**
5. Speichern

**Erwartetes Ergebnis:**
- ✅ Node-Icon ändert sich (Layers → Building2)
- ✅ Node-Farbe ändert sich (Grün → Grau)
- ✅ Console Log: "✅ Created department for converted node: Software Development"

**Verifikation:**
1. Firmeneinstellungen → Abteilungen
2. ✅ Check: "Software Development" ist neu in der Liste

---

### ✅ Test 5: Abteilung löschen

**Ziel:** Prüfen ob Department in Firmeneinstellungen erhalten bleibt

**Schritte:**
1. Zurück zu Canvas
2. Hover über "Software Development" Node
3. Click **Delete Button** (Mülleimer-Icon)
4. Bestätige Löschung

**Erwartetes Ergebnis:**
- ✅ Node verschwindet aus Canvas
- ✅ Toast: "Node gelöscht"
- ✅ Alle Verbindungen zu diesem Node werden gelöscht

**Verifikation:**
1. Firmeneinstellungen → Abteilungen
2. ✅ Check: "Software Development" ist NOCH VORHANDEN
3. ✅ Check: Department kann weiterhin verwendet werden

**Grund:**
Department bleibt erhalten, weil:
- Könnte Positionen/Mitarbeiter haben
- Wird möglicherweise im alten Organigram verwendet
- Sicherheit gegen versehentliches Datenverlust

---

### ✅ Test 6: Database Verifikation

**Ziel:** Prüfen ob database_id korrekt verknüpft ist

**Schritte:**
1. Öffne Supabase Dashboard
2. Gehe zu Table Editor → `org_nodes`
3. Filtere: `node_type = 'department'`
4. Wähle eine Abteilungs-Node aus

**Erwartetes Ergebnis:**
- ✅ `department_id` ist gesetzt (nicht NULL)
- ✅ `department_id` ist eine gültige UUID

**Weiter prüfen:**
1. Kopiere die `department_id`
2. Gehe zu Table Editor → `departments`
3. Filtere: `id = [kopierte UUID]`
4. ✅ Check: Department-Eintrag gefunden
5. ✅ Check: `name` stimmt mit Node-Titel überein

---

### ✅ Test 7: Position & Verbindungen

**Ziel:** Prüfen ob Abteilungs-Nodes normal funktionieren

**Schritte:**
1. Ziehe "HR & Recruiting" Node an eine neue Position
2. Erstelle Verbindung: HR → IT (z.B. HR bottom pin → IT top pin)
3. Ändere Line Style zu "Orthogonal"
4. Erstelle weitere Verbindungen zwischen Abteilungen

**Erwartetes Ergebnis:**
- ✅ Node lässt sich frei bewegen
- ✅ Verbindungen lassen sich erstellen
- ✅ Line Style lässt sich ändern
- ✅ Alle Features funktionieren wie bei anderen Node-Typen

---

### ✅ Test 8: Andere Node-Typen

**Ziel:** Prüfen ob Non-Department Nodes keine Departments erstellen

**Schritte:**
1. Erstelle Node Typ: **"Standort"**
   - Titel: "Berlin Office"
2. Erstelle Node Typ: **"Geschäftsführer"**
   - Titel: "CEO - Max Mustermann"
3. Erstelle Node Typ: **"Spezialisierung"**
   - Titel: "Frontend Team"

**Erwartetes Ergebnis:**
- ✅ Alle 3 Nodes werden im Canvas erstellt
- ✅ Verschiedene Farben & Icons
- ✅ KEINE Console Logs über Department-Erstellung

**Verifikation:**
1. Firmeneinstellungen → Abteilungen
2. ✅ Check: "Berlin Office", "CEO", "Frontend Team" sind NICHT in der Abteilungs-Liste
3. ✅ Check: Nur Nodes vom Typ "Abteilung" erscheinen dort

---

### ✅ Test 9: Page Reload & Persistenz

**Ziel:** Prüfen ob Daten nach Reload erhalten bleiben

**Schritte:**
1. Canvas hat mehrere Nodes (inkl. Abteilungen)
2. Browser-Seite neu laden (F5)
3. Warten bis Canvas geladen

**Erwartetes Ergebnis:**
- ✅ Alle Nodes erscheinen wieder
- ✅ Positionen sind korrekt
- ✅ Verbindungen sind korrekt
- ✅ Node-Typen sind korrekt

**Verifikation:**
1. Check Console auf Fehler
2. ✅ Keine Fehler beim Laden
3. ✅ Alle department_ids sind noch gesetzt

---

### ✅ Test 10: Beschreibung synchronisieren

**Ziel:** Prüfen ob Beschreibungsänderungen synchronisiert werden

**Schritte:**
1. Node "HR & Recruiting" bearbeiten
2. Beschreibung ändern zu: **"Neue Beschreibung Test 123"**
3. Speichern

**Erwartetes Ergebnis:**
- ✅ Node im Canvas aktualisiert

**Verifikation:**
1. Firmeneinstellungen → Abteilungen → "HR & Recruiting" bearbeiten
2. ✅ Check: Beschreibung ist "Neue Beschreibung Test 123"

---

## 🐛 Known Issues & Edge Cases

### Issue 1: Duplikate
**Problem:** User erstellt Node "HR", aber "HR" existiert bereits in Firmeneinstellungen

**Aktuelles Verhalten:**
- Zweite "HR" wird erstellt
- Zwei separate Departments in DB

**Workaround:**
- User sollte eindeutige Namen verwenden
- Oder: Bestehende Departments manuell löschen

**Zukünftige Lösung:**
- Dropdown: "Bestehende Abteilung auswählen" vs "Neue erstellen"
- Auto-Detection von Duplikaten

---

### Issue 2: Löschen von Departments mit Mitarbeitern
**Problem:** Department wird im Canvas gelöscht, bleibt aber in Firmeneinstellungen

**Aktuelles Verhalten:**
- Korrekt! Department bleibt erhalten

**Beachten:**
- User könnte verwirrt sein warum Department noch da ist
- Info-Text erklärt das Verhalten

---

### Issue 3: Bidirectionale Sync
**Problem:** Änderungen in Firmeneinstellungen werden NICHT im Canvas reflektiert

**Aktuelles Verhalten:**
- Nur Canvas → Firmeneinstellungen Sync
- Nicht Firmeneinstellungen → Canvas

**Workaround:**
- User sollte primär im Canvas arbeiten
- Oder: Page Reload um Änderungen zu laden

**Zukünftige Lösung:**
- Supabase Realtime Subscription
- Live-Sync in beide Richtungen

---

## ✅ Success Criteria

Alle Tests bestanden wenn:

- [x] Test 1: Abteilung erstellen funktioniert
- [x] Test 2: Umbenennen synchronisiert
- [x] Test 3: Multiple Abteilungen korrekt
- [x] Test 4: Typ-Konvertierung erstellt Department
- [x] Test 5: Löschen behält Department
- [x] Test 6: Database Links korrekt
- [x] Test 7: Standard Features funktionieren
- [x] Test 8: Nur Departments erstellen Departments
- [x] Test 9: Persistenz nach Reload
- [x] Test 10: Beschreibung synchronisiert

---

## 🎉 TESTING COMPLETE

Wenn alle Tests erfolgreich sind:
✅ Department Integration funktioniert korrekt!
✅ Canvas → Firmeneinstellungen Sync aktiv!
✅ Production Ready!

---

**Happy Testing! 🧪**
