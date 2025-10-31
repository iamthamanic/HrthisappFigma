-- ============================================================================
-- 💬 CHAT SYSTEM - TABELLEN & POLICIES VERIFIZIEREN
-- ============================================================================
-- Diese Abfrage prüft, ob alle Tabellen und Policies existieren
-- ============================================================================

-- 1. Alle Chat-Tabellen auflisten
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE tablename LIKE 'browoko_%'
  AND schemaname = 'public'
ORDER BY tablename;

-- 2. RLS Status prüfen
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename LIKE 'browoko_%'
  AND schemaname = 'public'
ORDER BY tablename;

-- 3. Alle Policies für Chat-Tabellen
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename LIKE 'browoko_%'
ORDER BY tablename, policyname;

-- 4. Prüfe ob die spezifischen Chat-Tabellen existieren
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'browoko_conversations') 
    THEN '✅ browoko_conversations existiert'
    ELSE '❌ browoko_conversations FEHLT'
  END AS conversations_check,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'browoko_user_presence') 
    THEN '✅ browoko_user_presence existiert'
    ELSE '❌ browoko_user_presence FEHLT'
  END AS presence_check,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'browoko_knowledge_pages') 
    THEN '✅ browoko_knowledge_pages existiert'
    ELSE '❌ browoko_knowledge_pages FEHLT'
  END AS knowledge_check,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'browoko_feedback') 
    THEN '✅ browoko_feedback existiert'
    ELSE '❌ browoko_feedback FEHLT'
  END AS feedback_check;

-- 5. Zähle Policies pro Tabelle
SELECT 
  tablename,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE tablename LIKE 'browoko_%'
GROUP BY tablename
ORDER BY tablename;

-- 6. Prüfe ob "authenticated" Policies existieren
SELECT 
  tablename,
  policyname,
  cmd AS operation,
  qual AS using_clause
FROM pg_policies
WHERE tablename IN (
  'browoko_conversations',
  'browoko_user_presence', 
  'browoko_knowledge_pages',
  'browoko_feedback'
)
AND policyname LIKE '%access%'
ORDER BY tablename;
