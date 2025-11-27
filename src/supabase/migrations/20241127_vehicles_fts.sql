-- ============================================
-- Browo Koordinator - Fahrzeuge PostgreSQL Schema
-- Full-Text Search Migration (Production Safe)
-- Version: 2.0.3
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- CLEANUP: Drop only vehicle-specific objects
-- ============================================

-- Drop vehicle-specific functions only
DROP FUNCTION IF EXISTS search_vehicles(TEXT);
DROP FUNCTION IF EXISTS vehicles_fts_update();
DROP FUNCTION IF EXISTS vehicle_documents_fts_update();
DROP FUNCTION IF EXISTS vehicle_maintenances_fts_update();

-- ⚠️ DO NOT DROP update_updated_at_column() - it's shared across the app!

-- Drop tables with CASCADE (this will automatically drop triggers)
DROP TABLE IF EXISTS vehicle_statistics CASCADE;
DROP TABLE IF EXISTS vehicle_maintenances CASCADE;
DROP TABLE IF EXISTS vehicle_documents CASCADE;
DROP TABLE IF EXISTS vehicle_statistics_columns CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- VEHICLES TABLE
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kennzeichen VARCHAR(20) UNIQUE NOT NULL,
  modell VARCHAR(100) NOT NULL,
  typ VARCHAR(50) NOT NULL,
  ladekapazitaet VARCHAR(50),
  standort VARCHAR(100),
  notizen TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  fts_vector TSVECTOR
);

-- VEHICLE DOCUMENTS TABLE
CREATE TABLE vehicle_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by VARCHAR(100),
  fts_vector TSVECTOR
);

-- VEHICLE MAINTENANCES TABLE
CREATE TABLE vehicle_maintenances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  maintenance_date DATE NOT NULL,
  cost DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  fts_vector TSVECTOR
);

-- VEHICLE STATISTICS TABLE
CREATE TABLE vehicle_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  verbrauchskosten DECIMAL(10, 2) DEFAULT 0,
  wartungskosten DECIMAL(10, 2) DEFAULT 0,
  sonstige_kosten DECIMAL(10, 2) DEFAULT 0,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (vehicle_id, month)
);

-- CUSTOM COLUMNS TABLE
CREATE TABLE vehicle_statistics_columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(20) DEFAULT 'currency',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

-- Vehicles indexes
CREATE INDEX vehicles_fts_idx ON vehicles USING GIN (fts_vector);
CREATE INDEX vehicles_kennzeichen_idx ON vehicles (kennzeichen);
CREATE INDEX vehicles_status_idx ON vehicles (status);
CREATE INDEX vehicles_created_at_idx ON vehicles (created_at DESC);
CREATE INDEX vehicles_kennzeichen_trgm_idx ON vehicles USING GIN (kennzeichen gin_trgm_ops);
CREATE INDEX vehicles_modell_trgm_idx ON vehicles USING GIN (modell gin_trgm_ops);

-- Documents indexes
CREATE INDEX vehicle_documents_vehicle_id_idx ON vehicle_documents (vehicle_id);
CREATE INDEX vehicle_documents_fts_idx ON vehicle_documents USING GIN (fts_vector);

-- Maintenances indexes
CREATE INDEX vehicle_maintenances_vehicle_id_idx ON vehicle_maintenances (vehicle_id);
CREATE INDEX vehicle_maintenances_date_idx ON vehicle_maintenances (maintenance_date DESC);
CREATE INDEX vehicle_maintenances_fts_idx ON vehicle_maintenances USING GIN (fts_vector);

-- Statistics indexes
CREATE INDEX vehicle_statistics_vehicle_id_idx ON vehicle_statistics (vehicle_id);
CREATE INDEX vehicle_statistics_month_idx ON vehicle_statistics (month DESC);
CREATE INDEX vehicle_statistics_custom_fields_idx ON vehicle_statistics USING GIN (custom_fields);

-- ============================================
-- 3. CREATE FTS TRIGGER FUNCTIONS
-- ============================================

-- Function: Update FTS vector for vehicles
CREATE FUNCTION vehicles_fts_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fts_vector := 
    setweight(to_tsvector('german', coalesce(NEW.kennzeichen, '')), 'A') ||
    setweight(to_tsvector('german', coalesce(NEW.modell, '')), 'A') ||
    setweight(to_tsvector('german', coalesce(NEW.typ, '')), 'B') ||
    setweight(to_tsvector('german', coalesce(NEW.ladekapazitaet, '')), 'C') ||
    setweight(to_tsvector('german', coalesce(NEW.standort, '')), 'C') ||
    setweight(to_tsvector('german', coalesce(NEW.notizen, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update FTS vector for documents
CREATE FUNCTION vehicle_documents_fts_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fts_vector := to_tsvector('german', coalesce(NEW.name, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update FTS vector for maintenances
CREATE FUNCTION vehicle_maintenances_fts_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fts_vector := 
    setweight(to_tsvector('german', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('german', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. CREATE TRIGGERS
-- ============================================

-- Updated_at triggers (using existing update_updated_at_column function)
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_maintenances_updated_at
  BEFORE UPDATE ON vehicle_maintenances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_statistics_updated_at
  BEFORE UPDATE ON vehicle_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- FTS triggers (using new vehicle-specific functions)
CREATE TRIGGER vehicles_fts_trigger
  BEFORE INSERT OR UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION vehicles_fts_update();

CREATE TRIGGER vehicle_documents_fts_trigger
  BEFORE INSERT OR UPDATE ON vehicle_documents
  FOR EACH ROW
  EXECUTE FUNCTION vehicle_documents_fts_update();

CREATE TRIGGER vehicle_maintenances_fts_trigger
  BEFORE INSERT OR UPDATE ON vehicle_maintenances
  FOR EACH ROW
  EXECUTE FUNCTION vehicle_maintenances_fts_update();

-- ============================================
-- 5. SEARCH HELPER FUNCTION
-- ============================================
CREATE FUNCTION search_vehicles(search_query TEXT)
RETURNS TABLE (
  id UUID,
  kennzeichen VARCHAR(20),
  modell VARCHAR(100),
  typ VARCHAR(50),
  ladekapazitaet VARCHAR(50),
  standort VARCHAR(100),
  notizen TEXT,
  status VARCHAR(20),
  rank REAL,
  match_type VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.kennzeichen,
    v.modell,
    v.typ,
    v.ladekapazitaet,
    v.standort,
    v.notizen,
    v.status,
    ts_rank(v.fts_vector, websearch_to_tsquery('german', search_query)) AS rank,
    'vehicle'::VARCHAR(20) AS match_type
  FROM vehicles v
  WHERE v.fts_vector @@ websearch_to_tsquery('german', search_query)
     OR v.kennzeichen ILIKE '%' || search_query || '%'
     OR v.modell ILIKE '%' || search_query || '%'
  ORDER BY rank DESC, v.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. ADD COMMENTS
-- ============================================
COMMENT ON TABLE vehicles IS 'Fahrzeuge mit Full-Text Search (Trigger-basiert)';
COMMENT ON COLUMN vehicles.fts_vector IS 'FTS vector - automatisch via Trigger aktualisiert';
COMMENT ON FUNCTION search_vehicles IS 'Full-Text Search mit Ranking';

-- ============================================
-- 7. SAMPLE DATA (Optional)
-- ============================================
INSERT INTO vehicles (kennzeichen, modell, typ, ladekapazitaet, standort, notizen)
VALUES 
  ('B-KO-1234', 'Mercedes Sprinter 316 CDI', 'Transporter', '1500 kg', 'Berlin Mitte', 'Hauptfahrzeug für Lieferungen'),
  ('B-KO-5678', 'VW Caddy Maxi', 'Kleintransporter', '800 kg', 'Berlin Kreuzberg', 'Backup-Fahrzeug'),
  ('B-KO-9012', 'Ford Transit Custom', 'Kastenwagen', '1200 kg', 'Berlin Spandau', 'City-Touren')
ON CONFLICT (kennzeichen) DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
DECLARE
  vehicle_count INT;
BEGIN
  SELECT COUNT(*) INTO vehicle_count FROM vehicles;
  
  RAISE NOTICE '✅ Migration erfolgreich abgeschlossen!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Erstellte Tabellen:';
  RAISE NOTICE '  ✓ vehicles (% Einträge)', vehicle_count;
  RAISE NOTICE '  ✓ vehicle_documents';
  RAISE NOTICE '  ✓ vehicle_maintenances';
  RAISE NOTICE '  ✓ vehicle_statistics';
  RAISE NOTICE '  ✓ vehicle_statistics_columns';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 FTS-Trigger aktiviert:';
  RAISE NOTICE '  ✓ vehicles.fts_vector';
  RAISE NOTICE '  ✓ vehicle_documents.fts_vector';
  RAISE NOTICE '  ✓ vehicle_maintenances.fts_vector';
  RAISE NOTICE '';
  RAISE NOTICE '♻️  Wiederverwendet:';
  RAISE NOTICE '  ✓ update_updated_at_column() (shared function)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Bereit für Frontend-Integration!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Test-Query:';
  RAISE NOTICE '   SELECT * FROM search_vehicles(''Sprinter'');';
END $$;
