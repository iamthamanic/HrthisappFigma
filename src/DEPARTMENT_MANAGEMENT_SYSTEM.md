# Abteilungsverwaltungs-System (Department Management)

## Übersicht
Das Abteilungsverwaltungs-System ermöglicht es Administratoren, Abteilungen zentral zu verwalten und Mitarbeitern zuzuweisen.

## Features

### ✅ Zentrale Abteilungsverwaltung
- **Standort**: Firmeneinstellungen → Abteilungen
- Abteilungen anlegen, bearbeiten und löschen
- Name und Beschreibung für jede Abteilung
- Soft-Delete (is_active Flag)

### ✅ Abteilungsauswahl bei Mitarbeitern
- **Beim Anlegen**: Dropdown mit allen aktiven Abteilungen
- **Bei Bearbeitung**: Dropdown in den Arbeitsinformationen
- **In der Übersicht**: Abteilung wird bei jedem Mitarbeiter angezeigt

## Technische Details

### Datenbank
- **Tabelle**: `departments`
- **Felder**:
  - `id` (UUID, Primary Key)
  - `organization_id` (UUID, Foreign Key)
  - `name` (TEXT, NOT NULL)
  - `description` (TEXT, nullable)
  - `is_active` (BOOLEAN, default: true)
  - `created_at` (TIMESTAMPTZ)
  - `updated_at` (TIMESTAMPTZ)

### Migration
```sql
-- Migration 024: Add departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies
- **SELECT**: Alle Benutzer können Abteilungen ihrer Organisation sehen
- **INSERT/UPDATE/DELETE**: Nur Admins und Superadmins

## Verwendung

### 1. Abteilungen anlegen (Admin)
1. Gehe zu **Admin → Firmeneinstellungen**
2. Scrolle zu **Abteilungen**
3. Klicke auf **"Abteilung hinzufügen"**
4. Gib Name und optionale Beschreibung ein
5. Speichern

### 2. Mitarbeiter einer Abteilung zuweisen
**Beim Anlegen:**
1. Gehe zu **Admin → Team Management**
2. Klicke auf **"Mitarbeiter hinzufügen"**
3. Wähle in den Arbeitsdaten die Abteilung aus dem Dropdown

**Bei bestehenden Mitarbeitern:**
1. Öffne die Mitarbeiterdetails
2. Klicke auf **"Bearbeiten"**
3. Im Tab "Mitarbeiterdaten" → Arbeitsinformationen
4. Wähle die Abteilung aus dem Dropdown

### 3. Abteilungen bearbeiten
1. Gehe zu **Admin → Firmeneinstellungen → Abteilungen**
2. Klicke auf das **Stift-Icon** bei der Abteilung
3. Bearbeite Name/Beschreibung
4. Speichern

### 4. Abteilungen löschen
1. Gehe zu **Admin → Firmeneinstellungen → Abteilungen**
2. Klicke auf das **Papierkorb-Icon**
3. Bestätige die Löschung

⚠️ **Hinweis**: Mitarbeiter behalten ihre Abteilungszuordnung auch nach dem Löschen. Die Abteilung wird einfach nicht mehr in der Liste angezeigt.

## Code-Struktur

### Frontend Components
- **CompanySettingsScreen.tsx**: Abteilungsverwaltung (CRUD)
- **AddEmployeeScreen.tsx**: Abteilungsauswahl beim Anlegen
- **TeamMemberDetailsScreen.tsx**: Abteilungsauswahl bei Bearbeitung
- **TeamManagementScreen.tsx**: Anzeige der Abteilung in der Übersicht

### State Management
- **adminStore.ts**:
  - `departments: Department[]` - State für alle Abteilungen
  - `loadDepartments()` - Lädt alle aktiven Abteilungen
  - `createDepartment()` - Erstellt neue Abteilung
  - `updateDepartment()` - Aktualisiert Abteilung
  - `deleteDepartment()` - Soft-Delete einer Abteilung

### Types
- **database.ts**: `Department` Interface mit allen Feldern

## Migration durchführen

### Supabase SQL Editor
1. Öffne den **SQL Editor** in Supabase
2. Kopiere den Inhalt von `/supabase/migrations/024_add_departments.sql`
3. Führe das SQL aus
4. Überprüfe, dass die Tabelle erstellt wurde

### Verifizierung
```sql
-- Überprüfe, ob die Tabelle existiert
SELECT * FROM departments LIMIT 5;

-- Überprüfe RLS Policies
SELECT * FROM pg_policies WHERE tablename = 'departments';
```

## Best Practices

### Naming Convention
- **Abteilungsnamen**: Kurz und prägnant (z.B. "IT", "Marketing", "Vertrieb")
- **Beschreibung**: Optional, für zusätzliche Informationen

### Organisation
- Erstelle Abteilungen **vor** dem Anlegen von Mitarbeitern
- Halte die Anzahl der Abteilungen überschaubar
- Nutze aussagekräftige Namen

### Wartung
- Überprüfe regelmäßig, ob alle Abteilungen noch aktuell sind
- Lösche ungenutzte Abteilungen
- Behalte die Beschreibungen aktuell

## Troubleshooting

### Problem: Keine Abteilungen sichtbar
**Lösung**: 
1. Überprüfe, ob Migration 024 ausgeführt wurde
2. Stelle sicher, dass du als Admin angemeldet bist
3. Prüfe Browser-Konsole auf Fehler

### Problem: Kann keine Abteilung erstellen
**Lösung**:
1. Überprüfe RLS Policies in Supabase
2. Stelle sicher, dass eine Standard-Organisation existiert
3. Prüfe, ob du die Rolle ADMIN oder SUPERADMIN hast

### Problem: Abteilung erscheint nicht bei Mitarbeiter
**Lösung**:
1. Stelle sicher, dass `is_active = true`
2. Überprüfe, ob die Abteilung zur selben Organisation gehört
3. Lade die Seite neu

## Future Enhancements

### Mögliche Erweiterungen
- [ ] Abteilungsleiter zuweisen
- [ ] Hierarchie-System (Unter-Abteilungen)
- [ ] Abteilungs-spezifische Berechtigungen
- [ ] Abteilungs-Dashboard mit Statistiken
- [ ] Budget-Tracking pro Abteilung
- [ ] Team-Kommunikation innerhalb Abteilungen

## Zusammenfassung

Das Abteilungsverwaltungs-System bietet eine zentrale, benutzerfreundliche Lösung für die Verwaltung von Firmen-Abteilungen. Durch die Integration mit dem Mitarbeiter-Management-System können Abteilungen einfach zugewiesen und verwaltet werden. Die Implementierung folgt Best Practices mit Soft-Delete, RLS-Sicherheit und einer klaren Code-Struktur.
