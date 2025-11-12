/**
 * Wiki RAG Access Control System
 * Version: v4.12.25
 * 
 * Adds RAG (Retrieval-Augmented Generation) access control for wiki articles:
 * - INTERN_WIKI: Internal Browo Koordinator access (default)
 * - WEBSITE_RAG: Website AI agents access (future)
 * - HOTLINE_RAG: Hotline AI agents access (future)
 * 
 * Tracks last access time for external RAG systems.
 */

-- =====================================================================================
-- 1. CREATE RAG ACCESS TYPE ENUM
-- =====================================================================================

DO $$ BEGIN
  CREATE TYPE rag_access_type AS ENUM (
    'INTERN_WIKI',
    'WEBSITE_RAG',
    'HOTLINE_RAG'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE rag_access_type IS 'RAG access control types:
- INTERN_WIKI: Internal Browo Koordinator wiki access (default)
- WEBSITE_RAG: Website AI agents can access this article
- HOTLINE_RAG: Hotline AI agents can access this article';

-- =====================================================================================
-- 2. ADD RAG COLUMNS TO wiki_articles_browoko
-- =====================================================================================

-- Add rag_access_type column (default: INTERN_WIKI)
ALTER TABLE wiki_articles_browoko 
ADD COLUMN IF NOT EXISTS rag_access_type rag_access_type DEFAULT 'INTERN_WIKI' NOT NULL;

-- Add last_accessed_at for external RAG tracking
ALTER TABLE wiki_articles_browoko 
ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz;

-- Add access_count for analytics
ALTER TABLE wiki_articles_browoko 
ADD COLUMN IF NOT EXISTS rag_access_count integer DEFAULT 0 NOT NULL;

-- =====================================================================================
-- 3. CREATE INDEXES FOR RAG ACCESS
-- =====================================================================================

-- Index for filtering by RAG type
CREATE INDEX IF NOT EXISTS idx_wiki_articles_browoko_rag_type 
ON wiki_articles_browoko(rag_access_type);

-- Index for external RAG last access tracking
CREATE INDEX IF NOT EXISTS idx_wiki_articles_browoko_last_accessed 
ON wiki_articles_browoko(last_accessed_at DESC) 
WHERE rag_access_type IN ('WEBSITE_RAG', 'HOTLINE_RAG');

-- =====================================================================================
-- 4. CREATE FUNCTION TO UPDATE RAG ACCESS TIMESTAMP
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_rag_access_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update for external RAG types
  IF NEW.rag_access_type IN ('WEBSITE_RAG', 'HOTLINE_RAG') THEN
    NEW.last_accessed_at := NOW();
    NEW.rag_access_count := NEW.rag_access_count + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_rag_access_timestamp() IS 
'Automatically updates last_accessed_at and access_count when external RAG systems access articles';

-- =====================================================================================
-- 5. CREATE VIEW FOR RAG ANALYTICS
-- =====================================================================================

CREATE OR REPLACE VIEW wiki_rag_analytics AS
SELECT 
  rag_access_type,
  COUNT(*) as article_count,
  COUNT(CASE WHEN last_accessed_at IS NOT NULL THEN 1 END) as accessed_count,
  MAX(last_accessed_at) as last_access,
  SUM(rag_access_count) as total_accesses,
  AVG(rag_access_count) as avg_accesses_per_article
FROM wiki_articles_browoko
GROUP BY rag_access_type;

COMMENT ON VIEW wiki_rag_analytics IS 
'Analytics view for RAG access patterns across different access types';

-- =====================================================================================
-- 6. GRANT PERMISSIONS
-- =====================================================================================

-- Allow authenticated users to read RAG settings
GRANT SELECT ON wiki_rag_analytics TO authenticated;

-- =====================================================================================
-- USAGE NOTES
-- =====================================================================================

/*
RAG ACCESS CONTROL SYSTEM:

1. CREATE ARTICLE WITH RAG TYPE:
   INSERT INTO wiki_articles_browoko (title, content_html, content_text, rag_access_type, ...)
   VALUES ('Article', '<p>Content</p>', 'Content', 'INTERN_WIKI', ...);

2. UPDATE RAG ACCESS TYPE:
   UPDATE wiki_articles_browoko 
   SET rag_access_type = 'WEBSITE_RAG'
   WHERE id = 'article-uuid';

3. TRACK EXTERNAL ACCESS (for AI agents):
   -- When external RAG system accesses article
   UPDATE wiki_articles_browoko 
   SET 
     last_accessed_at = NOW(),
     rag_access_count = rag_access_count + 1
   WHERE id = 'article-uuid' 
   AND rag_access_type IN ('WEBSITE_RAG', 'HOTLINE_RAG');

4. QUERY ARTICLES BY RAG TYPE:
   -- Get all articles accessible by Website RAG
   SELECT * FROM wiki_articles_browoko 
   WHERE rag_access_type = 'WEBSITE_RAG'
   AND is_published = true;

5. ANALYTICS:
   SELECT * FROM wiki_rag_analytics;

6. FIND STALE EXTERNAL ARTICLES (not accessed in 30 days):
   SELECT title, last_accessed_at, rag_access_count
   FROM wiki_articles_browoko
   WHERE rag_access_type IN ('WEBSITE_RAG', 'HOTLINE_RAG')
   AND (last_accessed_at IS NULL OR last_accessed_at < NOW() - INTERVAL '30 days');

API ENDPOINT STRUCTURE (Future):
- POST /api/rag/website/search - Website AI agent searches articles
- POST /api/rag/hotline/search - Hotline AI agent searches articles
- GET /api/rag/website/article/:id - Website AI retrieves article
- GET /api/rag/hotline/article/:id - Hotline AI retrieves article
*/

-- =====================================================================================
-- DEPLOYMENT VERIFICATION
-- =====================================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Wiki RAG Access Control System installed successfully!';
  RAISE NOTICE '📊 RAG Types: INTERN_WIKI (default), WEBSITE_RAG, HOTLINE_RAG';
  RAISE NOTICE '🔍 View analytics: SELECT * FROM wiki_rag_analytics;';
END $$;
