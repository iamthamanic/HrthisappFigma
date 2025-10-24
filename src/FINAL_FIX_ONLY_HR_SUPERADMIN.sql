-- =====================================================
-- FIX: Nur HR und SUPERADMIN automatisch zu Teams
-- ADMIN wird NICHT automatisch hinzugefügt
-- =====================================================

-- Drop old trigger and function
DROP TRIGGER IF EXISTS auto_add_admins_to_team ON teams;
DROP FUNCTION IF EXISTS auto_add_admins_to_new_team();

-- Create new function: Only add HR and SUPERADMIN (not ADMIN)
CREATE OR REPLACE FUNCTION auto_add_hr_superadmin_to_new_team()
RETURNS TRIGGER AS $$
BEGIN
  -- Add all HR and SUPERADMIN users as TEAMLEAD (not ADMIN)
  INSERT INTO team_members (team_id, user_id, role)
  SELECT 
    NEW.id,
    u.id,
    'TEAMLEAD'
  FROM users u
  WHERE u.role IN ('HR', 'SUPERADMIN')  -- Only HR and SUPERADMIN, not ADMIN
  ON CONFLICT (team_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER auto_add_hr_superadmin_to_team
  AFTER INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_hr_superadmin_to_new_team();

-- =====================================================
-- WICHTIG: Bestehende Teams aktualisieren
-- =====================================================

-- Funktion um alle HR/SUPERADMIN zu allen bestehenden Teams hinzuzufügen
DO $$
DECLARE
  team_record RECORD;
  user_record RECORD;
BEGIN
  -- Für jedes Team
  FOR team_record IN SELECT id FROM teams LOOP
    -- Füge alle HR/SUPERADMIN hinzu (aber nicht ADMIN)
    FOR user_record IN SELECT id FROM users WHERE role IN ('HR', 'SUPERADMIN') LOOP
      INSERT INTO team_members (team_id, user_id, role)
      VALUES (team_record.id, user_record.id, 'TEAMLEAD')
      ON CONFLICT (team_id, user_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- =====================================================
-- ERFOLG!
-- =====================================================
-- ✅ Trigger erstellt: auto_add_hr_superadmin_to_team
-- ✅ Nur HR und SUPERADMIN werden automatisch hinzugefügt
-- ✅ ADMIN kann manuell ausgewählt werden
-- ✅ Bestehende Teams wurden aktualisiert
-- =====================================================
