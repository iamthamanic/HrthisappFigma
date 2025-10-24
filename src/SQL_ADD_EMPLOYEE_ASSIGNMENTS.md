# Migration: Employee Assignments für Organigram Nodes

## Übersicht

Diese Migration fügt Employee-Zuweisungs-Features zum Canvas Organigram hinzu:
- **Primary User** (Hauptverantwortlicher)
- **Backup User** (Standard-Vertretung)
- **Backup Backup User** (Vertretung der Vertretung)
- **Employee IDs** (Alle zugewiesenen Mitarbeiter)

## Migration ausführen

Kopiere und füge diesen SQL-Code in den Supabase SQL Editor ein:

```sql
-- =====================================================
-- Migration: Add Employee Assignments to Org Nodes
-- =====================================================

-- Add employee assignment columns to org_nodes table
ALTER TABLE org_nodes
ADD COLUMN IF NOT EXISTS employee_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS primary_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS backup_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS backup_backup_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_org_nodes_primary_user 
ON org_nodes(primary_user_id);

CREATE INDEX IF NOT EXISTS idx_org_nodes_backup_user 
ON org_nodes(backup_user_id);

CREATE INDEX IF NOT EXISTS idx_org_nodes_backup_backup_user 
ON org_nodes(backup_backup_user_id);

-- Index for array column (GIN index)
CREATE INDEX IF NOT EXISTS idx_org_nodes_employee_ids 
ON org_nodes USING GIN(employee_ids);

-- Add comments
COMMENT ON COLUMN org_nodes.employee_ids IS 'Array of user IDs assigned to this node';
COMMENT ON COLUMN org_nodes.primary_user_id IS 'Primary responsible person (Hauptverantwortlicher)';
COMMENT ON COLUMN org_nodes.backup_user_id IS 'Standard backup/Vertretung';
COMMENT ON COLUMN org_nodes.backup_backup_user_id IS 'Backup of backup/Vertretung der Vertretung';
```

## Verwendung

Nach der Migration kannst du im Canvas Organigram:

1. **Mitarbeiter zuweisen**: Hover über einen Node → Klick auf das **Users-Icon** (👥)
2. **Primary User setzen**: Wähle den Hauptverantwortlichen aus dem Dropdown
3. **Backup User setzen**: Wähle die Standard-Vertretung aus dem Dropdown
4. **Backup Backup User setzen**: Wähle die Vertretung der Vertretung aus dem Dropdown
5. **Alle Mitarbeiter**: Wähle alle Mitarbeiter aus der Checkbox-Liste

### Features

- ✅ **Checkboxen** für Multi-Select der zugewiesenen Mitarbeiter
- ✅ **Badges** zeigen an, welche Mitarbeiter spezielle Rollen haben (Primary, Backup, Backup²)
- ✅ **Mitarbeiter-Anzeige** auf dem Node zeigt die Anzahl zugewiesener Mitarbeiter
- ✅ **Auto-Save** zu Supabase

## Verifizierung

Teste die Migration:

```sql
-- Prüfe die neuen Spalten
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'org_nodes'
AND column_name IN ('employee_ids', 'primary_user_id', 'backup_user_id', 'backup_backup_user_id');

-- Prüfe die Indizes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'org_nodes'
AND indexname LIKE '%employee%' OR indexname LIKE '%user%';
```

## Datenstruktur

```typescript
interface OrgNodeData {
  id: string;
  type: NodeType;
  title: string;
  description?: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  // NEU: Employee Assignments
  employeeIds?: string[];           // Alle zugewiesenen Mitarbeiter
  primaryUserId?: string;            // Hauptverantwortlicher
  backupUserId?: string;             // Standard-Vertretung
  backupBackupUserId?: string;       // Vertretung der Vertretung
}
```

## Rollback (falls nötig)

```sql
-- Entferne die neuen Spalten (ACHTUNG: Datenverlust!)
ALTER TABLE org_nodes
DROP COLUMN IF EXISTS employee_ids,
DROP COLUMN IF EXISTS primary_user_id,
DROP COLUMN IF EXISTS backup_user_id,
DROP COLUMN IF EXISTS backup_backup_user_id;

-- Entferne die Indizes
DROP INDEX IF EXISTS idx_org_nodes_primary_user;
DROP INDEX IF EXISTS idx_org_nodes_backup_user;
DROP INDEX IF EXISTS idx_org_nodes_backup_backup_user;
DROP INDEX IF EXISTS idx_org_nodes_employee_ids;
```

## Nächste Schritte

Nach erfolgreicher Migration:

1. ✅ Öffne das Canvas Organigram
2. ✅ Erstelle oder wähle einen Node (Abteilung, Geschäftsführer, Standort, Spezialisierung)
3. ✅ Klicke auf das Users-Icon beim Hovern
4. ✅ Weise Mitarbeiter zu und setze Primary/Backup-User
5. ✅ Speichern erfolgt automatisch!

---

**Version:** 1.0.0  
**Datum:** 2025-10-06  
**Status:** ✅ Ready for Production
