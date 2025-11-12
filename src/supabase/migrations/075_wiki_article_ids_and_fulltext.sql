-- =====================================================
-- WIKI ARTICLE IDS & FULL-TEXT SEARCH
-- Version: v4.12.32
-- =====================================================
-- Implements:
-- 1. Unique Article IDs (WA-01, WA-02, ...)
-- 2. PostgreSQL Full-Text Search (wie im Lernen-Teil)
-- 3. Auto-Increment für Article IDs
-- =====================================================

-- =====================================================
-- 1. ADD ARTICLE_ID COLUMN
-- =====================================================

-- Add article_id column (unique identifier like WA-01)
ALTER TABLE wiki_articles_browoko 
ADD COLUMN IF NOT EXISTS article_id TEXT UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_wiki_articles_article_id 
ON wiki_articles_browoko(article_id);

-- =====================================================
-- 2. AUTO-GENERATE ARTICLE IDS FOR EXISTING ARTICLES
-- =====================================================

-- Function to generate next article ID
CREATE OR REPLACE FUNCTION generate_wiki_article_id()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  new_id TEXT;
BEGIN
  -- Get the highest number from existing article_ids
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(article_id FROM 'WA-(\d+)')
      AS INTEGER
    )
  ), 0) + 1
  INTO next_number
  FROM wiki_articles_browoko
  WHERE article_id IS NOT NULL;
  
  -- Generate new ID with zero-padding (WA-01, WA-02, ...)
  new_id := 'WA-' || LPAD(next_number::TEXT, 2, '0');
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Backfill existing articles with article_ids
DO $$
DECLARE
  article_record RECORD;
  next_num INTEGER := 1;
BEGIN
  FOR article_record IN 
    SELECT id 
    FROM wiki_articles_browoko 
    WHERE article_id IS NULL
    ORDER BY created_at ASC
  LOOP
    UPDATE wiki_articles_browoko
    SET article_id = 'WA-' || LPAD(next_num::TEXT, 2, '0')
    WHERE id = article_record.id;
    
    next_num := next_num + 1;
  END LOOP;
END $$;

-- =====================================================
-- 3. TRIGGER: AUTO-GENERATE ARTICLE_ID ON INSERT
-- =====================================================

CREATE OR REPLACE FUNCTION set_wiki_article_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set if article_id is NULL
  IF NEW.article_id IS NULL THEN
    NEW.article_id := generate_wiki_article_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_set_wiki_article_id ON wiki_articles_browoko;

-- Create trigger
CREATE TRIGGER trigger_set_wiki_article_id
  BEFORE INSERT ON wiki_articles_browoko
  FOR EACH ROW
  EXECUTE FUNCTION set_wiki_article_id();

-- =====================================================
-- 4. FULL-TEXT SEARCH SETUP (wie beim Lernen-Teil)
-- =====================================================

-- Add tsvector column for full-text search
ALTER TABLE wiki_articles_browoko 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_wiki_articles_search_vector 
ON wiki_articles_browoko USING GIN(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_wiki_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Combine title (weighted 4x) and content_text for search
  -- Title matches are more important (Google-like behavior)
  NEW.search_vector := 
    setweight(to_tsvector('german', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('german', COALESCE(NEW.content_text, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_wiki_search_vector ON wiki_articles_browoko;

-- Create trigger to auto-update search_vector on INSERT/UPDATE
CREATE TRIGGER trigger_update_wiki_search_vector
  BEFORE INSERT OR UPDATE OF title, content_text
  ON wiki_articles_browoko
  FOR EACH ROW
  EXECUTE FUNCTION update_wiki_search_vector();

-- Backfill search_vector for existing articles
UPDATE wiki_articles_browoko
SET search_vector = 
  setweight(to_tsvector('german', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('german', COALESCE(content_text, '')), 'B')
WHERE search_vector IS NULL;

-- =====================================================
-- 5. FULL-TEXT SEARCH FUNCTION (optimized)
-- =====================================================

-- Drop old function if exists
DROP FUNCTION IF EXISTS search_wiki_articles(TEXT);

-- Create new optimized search function
CREATE OR REPLACE FUNCTION search_wiki_articles(search_query TEXT)
RETURNS TABLE (
  id UUID,
  article_id TEXT,
  title TEXT,
  content_html TEXT,
  content_text TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  organization_id UUID,
  view_count INTEGER,
  is_published BOOLEAN,
  rag_access_types TEXT[],
  last_accessed_at TIMESTAMPTZ,
  rag_access_count INTEGER,
  rank REAL,
  title_snippet TEXT,
  content_snippet TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
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
    wa.last_accessed_at,
    wa.rag_access_count,
    -- Ranking with title weighted 4x (Google-like)
    ts_rank(wa.search_vector, plainto_tsquery('german', search_query))::REAL AS rank,
    -- Highlighted snippets
    ts_headline(
      'german',
      wa.title,
      plainto_tsquery('german', search_query),
      'MaxWords=15, MinWords=5, ShortWord=3, HighlightAll=FALSE, MaxFragments=1, StartSel=<mark>, StopSel=</mark>'
    ) AS title_snippet,
    ts_headline(
      'german',
      wa.content_text,
      plainto_tsquery('german', search_query),
      'MaxWords=50, MinWords=20, ShortWord=3, HighlightAll=FALSE, MaxFragments=3, StartSel=<mark>, StopSel=</mark>'
    ) AS content_snippet
  FROM wiki_articles_browoko wa
  WHERE 
    wa.is_published = TRUE
    AND wa.search_vector @@ plainto_tsquery('german', search_query)
  ORDER BY rank DESC, wa.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_wiki_articles(TEXT) TO authenticated;

-- =====================================================
-- 6. UPDATE VIEW TO INCLUDE ARTICLE_ID
-- =====================================================

-- Drop existing view
DROP VIEW IF EXISTS wiki_articles_with_assignments_browoko;

-- Recreate view with article_id
CREATE OR REPLACE VIEW wiki_articles_with_assignments_browoko AS
SELECT 
  wa.id,
  wa.article_id, -- NEW!
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
  wa.last_accessed_at,
  wa.rag_access_count,
  -- Creator info
  u.first_name || ' ' || u.last_name AS creator_name,
  u.email AS creator_email,
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
LEFT JOIN users u ON wa.created_by = u.id;

-- Grant select permission
GRANT SELECT ON wiki_articles_with_assignments_browoko TO authenticated;

-- =====================================================
-- 7. COMMENTS & DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN wiki_articles_browoko.article_id IS 
'Unique readable article ID (WA-01, WA-02, ...). Auto-generated on insert.';

COMMENT ON COLUMN wiki_articles_browoko.search_vector IS 
'Full-text search vector (German). Auto-updated on title/content changes. Title weighted 4x.';

COMMENT ON FUNCTION generate_wiki_article_id() IS 
'Generates next sequential wiki article ID (WA-01, WA-02, ...).';

COMMENT ON FUNCTION search_wiki_articles(TEXT) IS 
'Full-text search for wiki articles with:
- German language support
- Relevance ranking (title weighted 4x)
- Highlighted snippets with <mark> tags
- Returns only published articles
- Sorted by relevance (Google-like)';

COMMENT ON FUNCTION update_wiki_search_vector() IS 
'Trigger function to auto-update search_vector on INSERT/UPDATE.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Wiki Article IDs & Full-Text Search Migration Complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '1. ✅ Article IDs (WA-01, WA-02, ...) - Auto-generated';
  RAISE NOTICE '2. ✅ Full-Text Search (PostgreSQL tsvector)';
  RAISE NOTICE '3. ✅ German language support';
  RAISE NOTICE '4. ✅ Relevance ranking (title weighted 4x)';
  RAISE NOTICE '5. ✅ Highlighted snippets (<mark> tags)';
  RAISE NOTICE '6. ✅ Auto-updates on INSERT/UPDATE';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage:';
  RAISE NOTICE '  SELECT * FROM search_wiki_articles(''Kundenservice'');';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Update Frontend to use article_id & search function';
END $$;
