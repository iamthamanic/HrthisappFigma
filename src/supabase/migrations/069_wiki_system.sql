-- =====================================================================================
-- BROWO KOORDINATOR v4.12.17 - WIKI SYSTEM
-- =====================================================================================
-- Erstellt: 2025-11-03
-- Beschreibung: Komplettes Wiki-System für Lernverwaltung mit Rich Text, 
--               Multi-Filter (Abteilung, Standort, Spezialisierung) und Datei-Attachments
-- =====================================================================================

-- =====================================================================================
-- 1. HAUPTTABELLE: Wiki Artikel
-- =====================================================================================

CREATE TABLE IF NOT EXISTS wiki_articles_browoko (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_html TEXT NOT NULL, -- Rich Text HTML Content
  content_text TEXT NOT NULL, -- Plain Text für Volltextsuche
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Metadata
  view_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  
  CONSTRAINT wiki_articles_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  CONSTRAINT wiki_articles_content_not_empty CHECK (LENGTH(TRIM(content_html)) > 0)
);

-- Index für Volltextsuche
CREATE INDEX IF NOT EXISTS idx_wiki_articles_search 
  ON wiki_articles_browoko USING gin(to_tsvector('german', title || ' ' || content_text));

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_wiki_articles_organization 
  ON wiki_articles_browoko(organization_id);
CREATE INDEX IF NOT EXISTS idx_wiki_articles_created_by 
  ON wiki_articles_browoko(created_by);
CREATE INDEX IF NOT EXISTS idx_wiki_articles_created_at 
  ON wiki_articles_browoko(created_at DESC);

-- =====================================================================================
-- 2. JUNCTION TABLES: Multi-Zuweisung
-- =====================================================================================

-- Abteilungen
CREATE TABLE IF NOT EXISTS wiki_article_departments_browoko (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES wiki_articles_browoko(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(article_id, department_id)
);

CREATE INDEX IF NOT EXISTS idx_wiki_article_departments_article 
  ON wiki_article_departments_browoko(article_id);
CREATE INDEX IF NOT EXISTS idx_wiki_article_departments_department 
  ON wiki_article_departments_browoko(department_id);

-- Standorte
CREATE TABLE IF NOT EXISTS wiki_article_locations_browoko (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES wiki_articles_browoko(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(article_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_wiki_article_locations_article 
  ON wiki_article_locations_browoko(article_id);
CREATE INDEX IF NOT EXISTS idx_wiki_article_locations_location 
  ON wiki_article_locations_browoko(location_id);

-- Spezialisierungen (als Text, da keine separate Tabelle existiert)
CREATE TABLE IF NOT EXISTS wiki_article_specializations_browoko (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES wiki_articles_browoko(id) ON DELETE CASCADE,
  specialization TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(article_id, specialization),
  CONSTRAINT wiki_article_spec_not_empty CHECK (LENGTH(TRIM(specialization)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_wiki_article_specializations_article 
  ON wiki_article_specializations_browoko(article_id);
CREATE INDEX IF NOT EXISTS idx_wiki_article_specializations_spec 
  ON wiki_article_specializations_browoko(specialization);

-- =====================================================================================
-- 3. DATEI-ATTACHMENTS
-- =====================================================================================

CREATE TABLE IF NOT EXISTS wiki_article_attachments_browoko (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES wiki_articles_browoko(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf', 'txt', 'image', etc.
  file_size BIGINT, -- in bytes
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT wiki_attachments_filename_not_empty CHECK (LENGTH(TRIM(file_name)) > 0),
  CONSTRAINT wiki_attachments_url_not_empty CHECK (LENGTH(TRIM(file_url)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_wiki_article_attachments_article 
  ON wiki_article_attachments_browoko(article_id);

-- =====================================================================================
-- 4. STORAGE BUCKET für Wiki Attachments
-- =====================================================================================

-- Bucket erstellen (idempotent)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('wiki-attachments-browoko', 'wiki-attachments-browoko', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- =====================================================================================
-- 5. RLS POLICIES
-- =====================================================================================

-- Enable RLS
ALTER TABLE wiki_articles_browoko ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_article_departments_browoko ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_article_locations_browoko ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_article_specializations_browoko ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_article_attachments_browoko ENABLE ROW LEVEL SECURITY;

-- Wiki Articles Policies
DROP POLICY IF EXISTS wiki_articles_select_policy ON wiki_articles_browoko;
CREATE POLICY wiki_articles_select_policy ON wiki_articles_browoko
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS wiki_articles_insert_policy ON wiki_articles_browoko;
CREATE POLICY wiki_articles_insert_policy ON wiki_articles_browoko
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('SUPERADMIN', 'ADMIN', 'HR')
    )
  );

DROP POLICY IF EXISTS wiki_articles_update_policy ON wiki_articles_browoko;
CREATE POLICY wiki_articles_update_policy ON wiki_articles_browoko
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('SUPERADMIN', 'ADMIN', 'HR')
    )
  );

DROP POLICY IF EXISTS wiki_articles_delete_policy ON wiki_articles_browoko;
CREATE POLICY wiki_articles_delete_policy ON wiki_articles_browoko
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('SUPERADMIN', 'ADMIN', 'HR')
    )
  );

-- Junction Tables Policies (simplified - inherit from main article)
DROP POLICY IF EXISTS wiki_depts_all_policy ON wiki_article_departments_browoko;
CREATE POLICY wiki_depts_all_policy ON wiki_article_departments_browoko
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM wiki_articles_browoko
      WHERE id = article_id
      AND organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS wiki_locs_all_policy ON wiki_article_locations_browoko;
CREATE POLICY wiki_locs_all_policy ON wiki_article_locations_browoko
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM wiki_articles_browoko
      WHERE id = article_id
      AND organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS wiki_specs_all_policy ON wiki_article_specializations_browoko;
CREATE POLICY wiki_specs_all_policy ON wiki_article_specializations_browoko
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM wiki_articles_browoko
      WHERE id = article_id
      AND organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS wiki_attachments_all_policy ON wiki_article_attachments_browoko;
CREATE POLICY wiki_attachments_all_policy ON wiki_article_attachments_browoko
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM wiki_articles_browoko
      WHERE id = article_id
      AND organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Storage Policies
DROP POLICY IF EXISTS wiki_storage_select_policy ON storage.objects;
CREATE POLICY wiki_storage_select_policy ON storage.objects
  FOR SELECT
  USING (bucket_id = 'wiki-attachments-browoko' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS wiki_storage_insert_policy ON storage.objects;
CREATE POLICY wiki_storage_insert_policy ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'wiki-attachments-browoko'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('SUPERADMIN', 'ADMIN', 'HR')
    )
  );

DROP POLICY IF EXISTS wiki_storage_delete_policy ON storage.objects;
CREATE POLICY wiki_storage_delete_policy ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'wiki-attachments-browoko'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('SUPERADMIN', 'ADMIN', 'HR')
    )
  );

-- =====================================================================================
-- 6. TRIGGER: Auto-Update updated_at
-- =====================================================================================

DROP TRIGGER IF EXISTS update_wiki_articles_updated_at ON wiki_articles_browoko;
CREATE TRIGGER update_wiki_articles_updated_at
  BEFORE UPDATE ON wiki_articles_browoko
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================================
-- 7. HELPER VIEWS für einfachere Queries
-- =====================================================================================

-- View: Wiki Artikel mit allen Zuweisungen
CREATE OR REPLACE VIEW wiki_articles_with_assignments_browoko AS
SELECT 
  wa.id,
  wa.title,
  wa.content_html,
  wa.content_text,
  wa.created_by,
  wa.created_at,
  wa.updated_at,
  wa.organization_id,
  wa.view_count,
  wa.is_published,
  (u.first_name || ' ' || u.last_name) as creator_name,
  u.email as creator_email,
  
  -- Aggregierte Abteilungen
  COALESCE(
    (SELECT json_agg(json_build_object('id', d.id, 'name', d.name))
     FROM wiki_article_departments_browoko wad
     JOIN departments d ON d.id = wad.department_id
     WHERE wad.article_id = wa.id),
    '[]'::json
  ) as departments,
  
  -- Aggregierte Standorte
  COALESCE(
    (SELECT json_agg(json_build_object('id', l.id, 'name', l.name))
     FROM wiki_article_locations_browoko wal
     JOIN locations l ON l.id = wal.location_id
     WHERE wal.article_id = wa.id),
    '[]'::json
  ) as locations,
  
  -- Aggregierte Spezialisierungen
  COALESCE(
    (SELECT json_agg(specialization)
     FROM wiki_article_specializations_browoko was
     WHERE was.article_id = wa.id),
    '[]'::json
  ) as specializations,
  
  -- Aggregierte Attachments
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', waa.id,
      'file_name', waa.file_name,
      'file_url', waa.file_url,
      'file_type', waa.file_type,
      'file_size', waa.file_size,
      'uploaded_at', waa.uploaded_at
    ))
     FROM wiki_article_attachments_browoko waa
     WHERE waa.article_id = wa.id),
    '[]'::json
  ) as attachments

FROM wiki_articles_browoko wa
LEFT JOIN users u ON u.id = wa.created_by;

-- =====================================================================================
-- 8. HELPER FUNCTIONS: Full-Text Search
-- =====================================================================================

CREATE OR REPLACE FUNCTION search_wiki_articles(search_query TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content_text TEXT,
  rank REAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wa.id,
    wa.title,
    wa.content_text,
    ts_rank(
      to_tsvector('german', wa.title || ' ' || wa.content_text),
      plainto_tsquery('german', search_query)
    ) as rank
  FROM wiki_articles_browoko wa
  WHERE 
    to_tsvector('german', wa.title || ' ' || wa.content_text) @@ plainto_tsquery('german', search_query)
    AND wa.organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ORDER BY rank DESC
  LIMIT 100;
END;
$$;

-- =====================================================================================
-- MIGRATION COMPLETE
-- =====================================================================================

COMMENT ON TABLE wiki_articles_browoko IS 'v4.12.17 - Wiki-Artikel mit Rich Text Content';
COMMENT ON TABLE wiki_article_departments_browoko IS 'v4.12.17 - Wiki-Artikel Abteilungs-Zuweisungen';
COMMENT ON TABLE wiki_article_locations_browoko IS 'v4.12.17 - Wiki-Artikel Standort-Zuweisungen';
COMMENT ON TABLE wiki_article_specializations_browoko IS 'v4.12.17 - Wiki-Artikel Spezialisierungs-Zuweisungen';
COMMENT ON TABLE wiki_article_attachments_browoko IS 'v4.12.17 - Wiki-Artikel Datei-Anhänge';
