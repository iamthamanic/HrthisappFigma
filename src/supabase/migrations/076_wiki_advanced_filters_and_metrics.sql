-- =====================================================
-- WIKI ADVANCED FILTERS & METRICS
-- Version: v4.12.33
-- =====================================================
-- Implements:
-- 1. Tracking: last_edited, last_viewed (user + timestamp)
-- 2. Metriken: character_count, storage_size (bytes)
-- 3. Filter-Support: RAG types, Zeichen, Speicher, Zeit
-- 4. Auto-Updates via Triggers
-- =====================================================

-- =====================================================
-- 1. ADD NEW COLUMNS
-- =====================================================

-- Tracking columns
ALTER TABLE wiki_articles_browoko 
ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_viewed_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Note: last_viewed_at already exists (we use last_accessed_at)
-- Rename for consistency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wiki_articles_browoko' 
    AND column_name = 'last_viewed_at'
  ) THEN
    -- Rename last_accessed_at to last_viewed_at
    ALTER TABLE wiki_articles_browoko 
    RENAME COLUMN last_accessed_at TO last_viewed_at;
  END IF;
END $$;

-- Metrics columns
ALTER TABLE wiki_articles_browoko 
ADD COLUMN IF NOT EXISTS character_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_size INTEGER DEFAULT 0; -- in bytes

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_wiki_articles_last_edited_at 
ON wiki_articles_browoko(last_edited_at DESC);

CREATE INDEX IF NOT EXISTS idx_wiki_articles_last_viewed_at 
ON wiki_articles_browoko(last_viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_wiki_articles_character_count 
ON wiki_articles_browoko(character_count);

CREATE INDEX IF NOT EXISTS idx_wiki_articles_storage_size 
ON wiki_articles_browoko(storage_size);

CREATE INDEX IF NOT EXISTS idx_wiki_articles_rag_access_types 
ON wiki_articles_browoko USING GIN(rag_access_types);

-- =====================================================
-- 3. FUNCTION: CALCULATE METRICS
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_wiki_article_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate character count (from content_text)
  NEW.character_count := LENGTH(COALESCE(NEW.content_text, ''));
  
  -- Calculate storage size (approximate)
  -- HTML content + text content + title + metadata
  NEW.storage_size := 
    LENGTH(COALESCE(NEW.content_html, '')) +
    LENGTH(COALESCE(NEW.content_text, '')) +
    LENGTH(COALESCE(NEW.title, '')) +
    100; -- Metadata overhead (approximate)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. TRIGGER: AUTO-UPDATE METRICS
-- =====================================================

DROP TRIGGER IF EXISTS trigger_calculate_wiki_metrics ON wiki_articles_browoko;

CREATE TRIGGER trigger_calculate_wiki_metrics
  BEFORE INSERT OR UPDATE OF title, content_html, content_text
  ON wiki_articles_browoko
  FOR EACH ROW
  EXECUTE FUNCTION calculate_wiki_article_metrics();

-- =====================================================
-- 5. FUNCTION: UPDATE LAST_EDITED
-- =====================================================

CREATE OR REPLACE FUNCTION update_wiki_last_edited()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if content actually changed
  IF (OLD.title IS DISTINCT FROM NEW.title) OR
     (OLD.content_html IS DISTINCT FROM NEW.content_html) OR
     (OLD.content_text IS DISTINCT FROM NEW.content_text) THEN
    NEW.last_edited_at := NOW();
    -- Note: last_edited_by should be set by application
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGER: AUTO-UPDATE LAST_EDITED
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_wiki_last_edited ON wiki_articles_browoko;

CREATE TRIGGER trigger_update_wiki_last_edited
  BEFORE UPDATE OF title, content_html, content_text
  ON wiki_articles_browoko
  FOR EACH ROW
  EXECUTE FUNCTION update_wiki_last_edited();

-- =====================================================
-- 7. BACKFILL EXISTING ARTICLES
-- =====================================================

-- Update metrics for existing articles
UPDATE wiki_articles_browoko
SET 
  character_count = LENGTH(COALESCE(content_text, '')),
  storage_size = 
    LENGTH(COALESCE(content_html, '')) +
    LENGTH(COALESCE(content_text, '')) +
    LENGTH(COALESCE(title, '')) +
    100,
  last_edited_at = COALESCE(updated_at, created_at),
  last_edited_by = created_by
WHERE character_count IS NULL OR character_count = 0;

-- =====================================================
-- 8. UPDATE VIEW WITH NEW COLUMNS
-- =====================================================

DROP VIEW IF EXISTS wiki_articles_with_assignments_browoko;

CREATE OR REPLACE VIEW wiki_articles_with_assignments_browoko AS
SELECT 
  wa.id,
  wa.article_id,
  wa.title,
  wa.content_html,
  wa.content_text,
  wa.created_by,
  wa.created_at,
  wa.updated_at,
  wa.organization_id,
  wa.view_count,
  wa.is_published,
  wa.rag_access_types,
  wa.last_viewed_at,
  wa.rag_access_count,
  -- NEW COLUMNS
  wa.last_edited_by,
  wa.last_edited_at,
  wa.last_viewed_by,
  wa.character_count,
  wa.storage_size,
  -- Creator info
  creator.first_name || ' ' || creator.last_name AS creator_name,
  creator.email AS creator_email,
  -- Last editor info
  editor.first_name || ' ' || editor.last_name AS last_editor_name,
  editor.email AS last_editor_email,
  -- Last viewer info
  viewer.first_name || ' ' || viewer.last_name AS last_viewer_name,
  viewer.email AS last_viewer_email,
  -- Departments (array of objects)
  COALESCE(
    (
      SELECT json_agg(json_build_object('id', d.id, 'name', d.name))
      FROM departments d
      INNER JOIN wiki_article_departments_browoko wad ON d.id = wad.department_id
      WHERE wad.article_id = wa.id
    ),
    '[]'::json
  ) AS departments,
  -- Locations (array of objects)
  COALESCE(
    (
      SELECT json_agg(json_build_object('id', l.id, 'name', l.name))
      FROM locations l
      INNER JOIN wiki_article_locations_browoko wal ON l.id = wal.location_id
      WHERE wal.article_id = wa.id
    ),
    '[]'::json
  ) AS locations,
  -- Specializations (array of strings)
  COALESCE(
    (
      SELECT json_agg(was.specialization)
      FROM wiki_article_specializations_browoko was
      WHERE was.article_id = wa.id
    ),
    '[]'::json
  ) AS specializations,
  -- Attachments
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', att.id,
          'file_name', att.file_name,
          'file_url', att.file_url,
          'file_type', att.file_type,
          'file_size', att.file_size,
          'uploaded_at', att.uploaded_at
        )
      )
      FROM wiki_article_attachments_browoko att
      WHERE att.article_id = wa.id
    ),
    '[]'::json
  ) AS attachments
FROM wiki_articles_browoko wa
LEFT JOIN users creator ON wa.created_by = creator.id
LEFT JOIN users editor ON wa.last_edited_by = editor.id
LEFT JOIN users viewer ON wa.last_viewed_by = viewer.id;

-- Grant permissions
GRANT SELECT ON wiki_articles_with_assignments_browoko TO authenticated;

-- =====================================================
-- 9. FUNCTION: FORMAT STORAGE SIZE
-- =====================================================

CREATE OR REPLACE FUNCTION format_storage_size(bytes INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF bytes < 1024 THEN
    RETURN bytes || ' B';
  ELSIF bytes < 1048576 THEN
    RETURN ROUND(bytes / 1024.0, 1) || ' KB';
  ELSIF bytes < 1073741824 THEN
    RETURN ROUND(bytes / 1048576.0, 1) || ' MB';
  ELSE
    RETURN ROUND(bytes / 1073741824.0, 1) || ' GB';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

GRANT EXECUTE ON FUNCTION format_storage_size(INTEGER) TO authenticated;

-- =====================================================
-- 10. FUNCTION: ADVANCED FILTER SUPPORT
-- =====================================================

-- This function will be called from the application
-- but we create a helper for complex queries
CREATE OR REPLACE FUNCTION get_wiki_articles_filtered(
  p_rag_types TEXT[] DEFAULT NULL,
  p_min_characters INTEGER DEFAULT NULL,
  p_max_characters INTEGER DEFAULT NULL,
  p_min_storage INTEGER DEFAULT NULL,
  p_max_storage INTEGER DEFAULT NULL,
  p_edited_after TIMESTAMPTZ DEFAULT NULL,
  p_viewed_after TIMESTAMPTZ DEFAULT NULL,
  p_created_after TIMESTAMPTZ DEFAULT NULL
)
RETURNS SETOF wiki_articles_with_assignments_browoko AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM wiki_articles_with_assignments_browoko
  WHERE 
    is_published = TRUE
    -- RAG Type filter (any match)
    AND (
      p_rag_types IS NULL OR
      rag_access_types && p_rag_types
    )
    -- Character count filters
    AND (p_min_characters IS NULL OR character_count >= p_min_characters)
    AND (p_max_characters IS NULL OR character_count <= p_max_characters)
    -- Storage size filters
    AND (p_min_storage IS NULL OR storage_size >= p_min_storage)
    AND (p_max_storage IS NULL OR storage_size <= p_max_storage)
    -- Time filters
    AND (p_edited_after IS NULL OR last_edited_at >= p_edited_after)
    AND (p_viewed_after IS NULL OR last_viewed_at >= p_viewed_after)
    AND (p_created_after IS NULL OR created_at >= p_created_after)
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_wiki_articles_filtered(TEXT[], INTEGER, INTEGER, INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- =====================================================
-- 11. COMMENTS & DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN wiki_articles_browoko.last_edited_by IS 
'User who last edited the article (title or content)';

COMMENT ON COLUMN wiki_articles_browoko.last_edited_at IS 
'Timestamp when article was last edited (auto-updated)';

COMMENT ON COLUMN wiki_articles_browoko.last_viewed_by IS 
'User who last viewed the article';

COMMENT ON COLUMN wiki_articles_browoko.last_viewed_at IS 
'Timestamp when article was last viewed';

COMMENT ON COLUMN wiki_articles_browoko.character_count IS 
'Number of characters in content_text (auto-calculated)';

COMMENT ON COLUMN wiki_articles_browoko.storage_size IS 
'Approximate storage size in bytes (auto-calculated)';

COMMENT ON FUNCTION calculate_wiki_article_metrics() IS 
'Trigger function to auto-calculate character_count and storage_size';

COMMENT ON FUNCTION update_wiki_last_edited() IS 
'Trigger function to auto-update last_edited_at when content changes';

COMMENT ON FUNCTION format_storage_size(INTEGER) IS 
'Formats bytes into human-readable format (B, KB, MB, GB)';

COMMENT ON FUNCTION get_wiki_articles_filtered(TEXT[], INTEGER, INTEGER, INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ) IS 
'Advanced filtering for wiki articles with RAG types, metrics, and time-based filters';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Wiki Advanced Filters & Metrics Migration Complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'New Features:';
  RAISE NOTICE '1. ✅ Tracking: last_edited_by, last_edited_at';
  RAISE NOTICE '2. ✅ Tracking: last_viewed_by, last_viewed_at';
  RAISE NOTICE '3. ✅ Metrics: character_count (auto-calculated)';
  RAISE NOTICE '4. ✅ Metrics: storage_size (auto-calculated)';
  RAISE NOTICE '5. ✅ Filters: RAG types (multi-select)';
  RAISE NOTICE '6. ✅ Filters: Character count range';
  RAISE NOTICE '7. ✅ Filters: Storage size range';
  RAISE NOTICE '8. ✅ Filters: Time-based (edited, viewed, created)';
  RAISE NOTICE '9. ✅ Auto-updates via triggers';
  RAISE NOTICE '10. ✅ Performance indexes';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage:';
  RAISE NOTICE '  SELECT * FROM get_wiki_articles_filtered(';
  RAISE NOTICE '    p_rag_types := ARRAY[''INTERN_WIKI'', ''WEBSITE_RAG''],';
  RAISE NOTICE '    p_min_characters := 100,';
  RAISE NOTICE '    p_max_characters := 5000';
  RAISE NOTICE '  );';
  RAISE NOTICE '';
  RAISE NOTICE 'Helper Function:';
  RAISE NOTICE '  SELECT format_storage_size(12345); -- Returns "12.1 KB"';
END $$;
