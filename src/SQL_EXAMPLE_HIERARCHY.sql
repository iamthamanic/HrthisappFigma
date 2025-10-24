-- =====================================================
-- EXAMPLE DEPARTMENT HIERARCHY SETUP
-- =====================================================
-- This creates a sample hierarchy for testing the drag & drop organigram
-- Run this AFTER running SQL_DRAGGABLE_ORGANIGRAM.sql
-- =====================================================

-- Step 1: Get your organization_id
-- Replace 'YOUR_ORGANIZATION_NAME' with your actual organization name
DO $$ 
DECLARE
  org_id UUID;
  gf_id UUID;
  berlin_id UUID;
  muenchen_id UUID;
BEGIN
  -- Get organization ID
  SELECT id INTO org_id FROM organizations WHERE name = 'YOUR_ORGANIZATION_NAME' LIMIT 1;
  
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organization not found! Please replace YOUR_ORGANIZATION_NAME with your actual organization name';
  END IF;

  RAISE NOTICE 'Found organization: %', org_id;

  -- Step 2: Update existing "Geschäftsführung" department as ROOT
  UPDATE departments 
  SET 
    parent_department_id = NULL,
    x_position = 500,
    y_position = 50,
    is_location = false
  WHERE 
    organization_id = org_id 
    AND name = 'Geschäftsführung'
  RETURNING id INTO gf_id;

  RAISE NOTICE 'Updated Geschäftsführung as ROOT: %', gf_id;

  -- Step 3: Create or update "Berlin" location
  INSERT INTO departments (
    name,
    description,
    organization_id,
    parent_department_id,
    x_position,
    y_position,
    is_location,
    sort_order,
    is_active
  ) VALUES (
    'Berlin',
    'Standort Berlin',
    org_id,
    gf_id,
    300,
    250,
    true,
    1,
    true
  )
  ON CONFLICT (organization_id, name) 
  DO UPDATE SET
    parent_department_id = gf_id,
    x_position = 300,
    y_position = 250,
    is_location = true
  RETURNING id INTO berlin_id;

  RAISE NOTICE 'Created/Updated Berlin location: %', berlin_id;

  -- Step 4: Create or update "München" location
  INSERT INTO departments (
    name,
    description,
    organization_id,
    parent_department_id,
    x_position,
    y_position,
    is_location,
    sort_order,
    is_active
  ) VALUES (
    'München',
    'Standort München',
    org_id,
    gf_id,
    700,
    250,
    true,
    2,
    true
  )
  ON CONFLICT (organization_id, name) 
  DO UPDATE SET
    parent_department_id = gf_id,
    x_position = 700,
    y_position = 250,
    is_location = true
  RETURNING id INTO muenchen_id;

  RAISE NOTICE 'Created/Updated München location: %', muenchen_id;

  -- Step 5: Create departments under Berlin
  INSERT INTO departments (name, description, organization_id, parent_department_id, x_position, y_position, is_location, sort_order, is_active)
  VALUES 
    ('HR', 'Human Resources Abteilung', org_id, berlin_id, 200, 450, false, 3, true),
    ('Buchhaltung', 'Finanz- und Buchhaltungsabteilung', org_id, berlin_id, 400, 450, false, 4, true)
  ON CONFLICT (organization_id, name) 
  DO UPDATE SET
    parent_department_id = EXCLUDED.parent_department_id,
    x_position = EXCLUDED.x_position,
    y_position = EXCLUDED.y_position;

  -- Step 6: Create departments under München
  INSERT INTO departments (name, description, organization_id, parent_department_id, x_position, y_position, is_location, sort_order, is_active)
  VALUES 
    ('IT', 'IT und Entwicklungsabteilung', org_id, muenchen_id, 600, 450, false, 5, true),
    ('Marketing', 'Marketing und Vertrieb', org_id, muenchen_id, 800, 450, false, 6, true)
  ON CONFLICT (organization_id, name) 
  DO UPDATE SET
    parent_department_id = EXCLUDED.parent_department_id,
    x_position = EXCLUDED.x_position,
    y_position = EXCLUDED.y_position;

  RAISE NOTICE '✅ Example hierarchy created successfully!';
  RAISE NOTICE '📊 Structure:';
  RAISE NOTICE '   Geschäftsführung (Root)';
  RAISE NOTICE '   ├─ Berlin (Location)';
  RAISE NOTICE '   │  ├─ HR';
  RAISE NOTICE '   │  └─ Buchhaltung';
  RAISE NOTICE '   └─ München (Location)';
  RAISE NOTICE '      ├─ IT';
  RAISE NOTICE '      └─ Marketing';
END $$;
