# Standard-Organigram Template

## Automatische Erstellung

Das System erstellt **automatisch** eine Standard-Struktur wenn noch keine Abteilungen/Positionen existieren:

1. **Abteilung**: "Geschäftsführung" wird automatisch beim ersten Laden erstellt
2. **Position**: "Geschäftsführer/in" wird automatisch als erste Position erstellt

## Manuelle Erstellung (Optional)

Falls Sie das Template manuell erstellen möchten:

```sql
-- 1. Geschäftsführung Abteilung erstellen
INSERT INTO departments (name, description, organization_id, sort_order, is_active)
VALUES (
  'Geschäftsführung',
  'Unternehmensleitung und strategische Führung',
  'YOUR_ORG_ID_HERE',  -- Ersetzen Sie dies mit Ihrer Organization ID
  0,
  true
);

-- 2. CEO Position erstellen (verwenden Sie die Department ID von oben)
INSERT INTO organigram_positions (
  name,
  department_id,
  organization_id,
  sort_order,
  is_active
)
VALUES (
  'Geschäftsführer/in',
  'GESCHÄFTSFUEHRUNG_DEPT_ID_HERE',  -- Ersetzen Sie dies mit der Department ID
  'YOUR_ORG_ID_HERE',  -- Ersetzen Sie dies mit Ihrer Organization ID
  0,
  true
);
```

## Erweiterte Standard-Struktur

Wenn Sie eine umfangreichere Standard-Struktur erstellen möchten:

```sql
-- Weitere Abteilungen
INSERT INTO departments (name, description, organization_id, sort_order, is_active)
VALUES
  ('Vertrieb', 'Kundenakquise und Verkauf', 'YOUR_ORG_ID', 1, true),
  ('Marketing', 'Marketing und Kommunikation', 'YOUR_ORG_ID', 2, true),
  ('Entwicklung', 'Produktentwicklung und IT', 'YOUR_ORG_ID', 3, true),
  ('Buchhaltung', 'Finanzen und Buchhaltung', 'YOUR_ORG_ID', 4, true),
  ('Personal', 'Human Resources', 'YOUR_ORG_ID', 5, true);

-- Beispiel-Positionen für Vertrieb
INSERT INTO organigram_positions (name, department_id, organization_id, sort_order, is_active)
VALUES
  ('Vertriebsleiter/in', 'VERTRIEB_DEPT_ID', 'YOUR_ORG_ID', 0, true),
  ('Senior Sales Manager', 'VERTRIEB_DEPT_ID', 'YOUR_ORG_ID', 1, true),
  ('Sales Representative', 'VERTRIEB_DEPT_ID', 'YOUR_ORG_ID', 2, true);
```

## Hierarchie-Regeln

Das System interpretiert die Hierarchie wie folgt:

1. **CEO-Ebene (Lila)**: Erste Position in der "Geschäftsführung" Abteilung
2. **Teamlead-Ebene (Blau)**: 
   - Weitere Positionen in der "Geschäftsführung" Abteilung
   - Erste Position in jeder anderen Abteilung
3. **Manager-Ebene (Grün)**: Weitere Positionen in anderen Abteilungen

## Tipps

- **Reihenfolge**: Die `sort_order` bestimmt die Anzeige-Reihenfolge
- **Mitarbeiter zuweisen**: In der Listen-Ansicht können Sie Mitarbeiter zu Positionen zuweisen
- **Vertretungen**: Jede Position kann einen Haupt- und einen Vertreter haben
- **Standorte**: Abteilungen können Standorten zugewiesen werden

## Automatisches Reload

Nach dem Hinzufügen von Daten laden Sie die Seite neu, damit die Änderungen im Organigram sichtbar werden.