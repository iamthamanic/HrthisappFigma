/**
 * Wiki Full-Text Search Migration
 * Version: v4.12.22
 * 
 * Implements Google-like search WITHOUT AI:
 * - PostgreSQL Full-Text Search (tsvector/tsquery)
 * - Relevance Ranking (ts_rank)
 * - Highlighted Snippets (ts_headline)
 * - Multi-field search (title + content)
 */

-- =====================================================================================
-- 1. CREATE FULL-TEXT SEARCH FUNCTION WITH RANKING
-- =====================================================================================

CREATE OR REPLACE FUNCTION search_wiki_articles(search_query TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content_html TEXT,
  content_text TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  organization_id UUID,
  view_count INTEGER,
  is_published BOOLEAN,
  -- Search-specific fields
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
    wa.title,
    wa.content_html,
    wa.content_text,
    wa.created_by,
    wa.created_at,
    wa.updated_at,
    wa.organization_id,
    wa.view_count,
    wa.is_published,
    -- Ranking: Title matches are weighted 4x more than content
    -- This gives Google-like behavior where title matches appear first
    (
      ts_rank(to_tsvector('german', COALESCE(wa.title, '')), plainto_tsquery('german', search_query)) * 4.0 +
      ts_rank(to_tsvector('german', COALESCE(wa.content_text, '')), plainto_tsquery('german', search_query))
    )::REAL AS rank,
    -- Generate highlighted snippet for title (max 100 chars)
    ts_headline(
      'german',
      wa.title,
      plainto_tsquery('german', search_query),
      'MaxWords=15, MinWords=5, ShortWord=3, HighlightAll=FALSE, MaxFragments=1, StartSel=<mark>, StopSel=</mark>'
    ) AS title_snippet,
    -- Generate highlighted snippet for content (max 300 chars)
    ts_headline(
      'german',
      wa.content_text,
      plainto_tsquery('german', search_query),
      'MaxWords=50, MinWords=20, ShortWord=3, HighlightAll=FALSE, MaxFragments=3, StartSel=<mark>, StopSel=</mark>'
    ) AS content_snippet
  FROM wiki_articles_browoko wa
  WHERE 
    wa.is_published = TRUE
    AND (
      -- Search in title OR content
      to_tsvector('german', COALESCE(wa.title, '')) @@ plainto_tsquery('german', search_query)
      OR
      to_tsvector('german', COALESCE(wa.content_text, '')) @@ plainto_tsquery('german', search_query)
    )
  ORDER BY rank DESC, wa.created_at DESC;
END;
$$;

-- =====================================================================================
-- 2. CREATE FULL-TEXT SEARCH INDEXES FOR PERFORMANCE
-- =====================================================================================

-- Index for title search (German language)
CREATE INDEX IF NOT EXISTS idx_wiki_articles_title_fts 
ON wiki_articles_browoko 
USING GIN (to_tsvector('german', COALESCE(title, '')));

-- Index for content search (German language)
CREATE INDEX IF NOT EXISTS idx_wiki_articles_content_fts 
ON wiki_articles_browoko 
USING GIN (to_tsvector('german', COALESCE(content_text, '')));

-- =====================================================================================
-- 3. GRANT PERMISSIONS
-- =====================================================================================

-- Allow authenticated users to search
GRANT EXECUTE ON FUNCTION search_wiki_articles(TEXT) TO authenticated;

-- =====================================================================================
-- 4. COMMENTS FOR DOCUMENTATION
-- =====================================================================================

COMMENT ON FUNCTION search_wiki_articles(TEXT) IS 
'Full-text search for wiki articles with:
- Multi-field search (title + content)
- Relevance ranking (title weighted 4x)
- German language support
- Highlighted snippets with <mark> tags
- Sorted by relevance (Google-like)';

COMMENT ON INDEX idx_wiki_articles_title_fts IS 
'GIN index for full-text search on article titles (German)';

COMMENT ON INDEX idx_wiki_articles_content_fts IS 
'GIN index for full-text search on article content (German)';

-- =====================================================================================
-- USAGE EXAMPLES
-- =====================================================================================

/*
-- Example 1: Basic search
SELECT * FROM search_wiki_articles('Kundenservice');

-- Example 2: Multi-word search (automatically uses German stemming)
SELECT * FROM search_wiki_articles('Einarbeitung neue Mitarbeiter');

-- Example 3: Question-like search (works like Google!)
SELECT * FROM search_wiki_articles('Wie erstelle ich eine Rechnung?');

-- Results are automatically:
- Ranked by relevance (title matches first)
- Highlighted with <mark> tags
- Snippets show context around matches
*/
