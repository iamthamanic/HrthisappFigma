-- =====================================================================================
-- BROWO KOORDINATOR v4.12.26 - WIKI RAG MULTI-SELECT
-- =====================================================================================
-- Erstellt: 2025-11-03
-- Beschreibung: Ändert RAG Access Control von Single-Select zu Multi-Select.
--               Ein Artikel kann jetzt von mehreren RAG-Systemen gleichzeitig genutzt werden.
-- =====================================================================================

-- =====================================================================================
-- 1. DROP OLD ENUM COLUMN & CREATE ARRAY COLUMN
-- =====================================================================================

-- Drop old single-select column
ALTER TABLE wiki_articles_browoko 
DROP COLUMN IF EXISTS rag_access_type;

-- Add new multi-select array column (default: nur INTERN_WIKI)
ALTER TABLE wiki_articles_browoko 
ADD COLUMN rag_access_types TEXT[] DEFAULT ARRAY['INTERN_WIKI']::TEXT[] NOT NULL;

-- Constraint: mindestens 1 RAG-Typ muss gewählt sein
ALTER TABLE wiki_articles_browoko
ADD CONSTRAINT rag_access_types_not_empty 
CHECK (array_length(rag_access_types, 1) > 0);

-- Constraint: nur erlaubte Werte
ALTER TABLE wiki_articles_browoko
ADD CONSTRAINT rag_access_types_valid_values
CHECK (
  rag_access_types <@ ARRAY['INTERN_WIKI', 'WEBSITE_RAG', 'HOTLINE_RAG']::TEXT[]
);

-- =====================================================================================
-- 2. UPDATE INDEXES
-- =====================================================================================

-- Drop old index
DROP INDEX IF EXISTS idx_wiki_articles_browoko_rag_type;

-- New GIN index for array queries (z.B. WHERE 'WEBSITE_RAG' = ANY(rag_access_types))
CREATE INDEX idx_wiki_articles_browoko_rag_types 
ON wiki_articles_browoko USING GIN(rag_access_types);

-- Index for external RAG last access tracking (unchanged)
-- Already exists from migration 073

-- =====================================================================================
-- 3. UPDATE ANALYTICS VIEW
-- =====================================================================================

DROP VIEW IF EXISTS wiki_rag_analytics;

CREATE OR REPLACE VIEW wiki_rag_analytics AS
SELECT 
  unnest(rag_access_types) as rag_access_type,
  COUNT(*) as article_count,
  COUNT(CASE WHEN last_accessed_at IS NOT NULL THEN 1 END) as accessed_count,
  MAX(last_accessed_at) as last_access,
  SUM(rag_access_count) as total_accesses,
  AVG(rag_access_count) as avg_accesses_per_article
FROM wiki_articles_browoko
GROUP BY unnest(rag_access_types);

-- =====================================================================================
-- 4. EXAMPLE QUERIES
-- =====================================================================================

/*
MULTI-SELECT RAG ACCESS CONTROL SYSTEM:

1. CREATE ARTICLE WITH MULTIPLE RAG TYPES:
   INSERT INTO wiki_articles_browoko (
     title, 
     content_html, 
     content_text, 
     rag_access_types,
     ...
   )
   VALUES (
     'Artikel', 
     '<p>Content</p>', 
     'Content', 
     ARRAY['INTERN_WIKI', 'WEBSITE_RAG']::TEXT[],
     ...
   );

2. UPDATE RAG ACCESS TYPES (add HOTLINE_RAG):
   UPDATE wiki_articles_browoko 
   SET rag_access_types = ARRAY['INTERN_WIKI', 'WEBSITE_RAG', 'HOTLINE_RAG']::TEXT[]
   WHERE id = 'article-uuid';

3. CHECK IF ARTICLE IS ACCESSIBLE BY WEBSITE RAG:
   SELECT * FROM wiki_articles_browoko 
   WHERE 'WEBSITE_RAG' = ANY(rag_access_types)
   AND is_published = true;

4. CHECK IF ARTICLE IS ACCESSIBLE BY MULTIPLE RAGS:
   SELECT * FROM wiki_articles_browoko 
   WHERE rag_access_types && ARRAY['WEBSITE_RAG', 'HOTLINE_RAG']::TEXT[];

5. TRACK EXTERNAL ACCESS (for AI agents):
   -- When WEBSITE_RAG or HOTLINE_RAG accesses article
   UPDATE wiki_articles_browoko 
   SET 
     last_accessed_at = NOW(),
     rag_access_count = rag_access_count + 1
   WHERE id = 'article-uuid' 
   AND (
     'WEBSITE_RAG' = ANY(rag_access_types) OR
     'HOTLINE_RAG' = ANY(rag_access_types)
   );

6. GET ARTICLES WITH SPECIFIC RAG TYPE:
   -- Articles accessible by Website RAG
   SELECT * FROM wiki_articles_browoko 
   WHERE 'WEBSITE_RAG' = ANY(rag_access_types);

   -- Articles with ONLY intern access
   SELECT * FROM wiki_articles_browoko 
   WHERE rag_access_types = ARRAY['INTERN_WIKI']::TEXT[];

7. ANALYTICS:
   SELECT * FROM wiki_rag_analytics;
   
   -- Output shows each RAG type separately:
   -- INTERN_WIKI  | 5  | 0  | NULL | 0  | 0
   -- WEBSITE_RAG  | 2  | 1  | ...  | 42 | 21
   -- HOTLINE_RAG  | 1  | 0  | NULL | 0  | 0

8. FIND ARTICLES WITH MULTIPLE RAG ACCESS:
   SELECT title, rag_access_types
   FROM wiki_articles_browoko
   WHERE array_length(rag_access_types, 1) > 1;

9. COUNT ARTICLES BY NUMBER OF RAG TYPES:
   SELECT 
     array_length(rag_access_types, 1) as rag_count,
     COUNT(*) as article_count
   FROM wiki_articles_browoko
   GROUP BY array_length(rag_access_types, 1)
   ORDER BY rag_count;
*/

-- =====================================================================================
-- 5. MIGRATION COMPLETE
-- =====================================================================================

-- Set all existing articles to INTERN_WIKI (already default)
-- No action needed, default value handles this

COMMENT ON COLUMN wiki_articles_browoko.rag_access_types IS 
'Multi-Select RAG Access Control: INTERN_WIKI, WEBSITE_RAG, HOTLINE_RAG. Ein Artikel kann von mehreren RAG-Systemen gleichzeitig genutzt werden.';
