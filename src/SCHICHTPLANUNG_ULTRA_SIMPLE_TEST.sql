-- =====================================================
-- ULTRA SIMPLE TEST: Nur der INSERT-Test
-- =====================================================
-- Führe dieses aus, während du eingeloggt bist!
-- =====================================================

-- TEST 1: Bist du eingeloggt?
DO $$
DECLARE
  user_id UUID;
BEGIN
  user_id := auth.uid();
  
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '1️⃣  AUTHENTICATION CHECK';
  RAISE NOTICE '==========================================';
  
  IF user_id IS NULL THEN
    RAISE NOTICE '❌ Du bist NICHT eingeloggt!';
    RAISE NOTICE 'Logge dich in deine App ein und führe das Script erneut aus.';
  ELSE
    RAISE NOTICE '✅ Eingeloggt als: %', user_id;
  END IF;
END $$;

-- TEST 2: Versuch 1 - MIT created_by
DO $$
DECLARE
  user_id UUID;
  test_shift_id UUID;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '⏭️  SKIPPED: Nicht eingeloggt';
    RETURN;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '2️⃣  TEST INSERT (MIT created_by)';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Versuche Schicht zu erstellen...';
  
  BEGIN
    INSERT INTO public.shifts (
      user_id,
      date,
      shift_type,
      start_time,
      end_time,
      created_by
    ) VALUES (
      user_id,
      (CURRENT_DATE + INTERVAL '1 day')::DATE,
      'MORNING',
      '08:00:00',
      '16:00:00',
      user_id
    )
    RETURNING id INTO test_shift_id;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅✅✅ SUCCESS! ✅✅✅';
    RAISE NOTICE 'Shift ID: %', test_shift_id;
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Die Policies funktionieren!';
    RAISE NOTICE '🎉 Das Problem ist im FRONTEND!';
    
    -- Cleanup
    DELETE FROM public.shifts WHERE id = test_shift_id;
    RAISE NOTICE '✅ Cleanup: Test-Schicht gelöscht';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ INSERT FAILED (MIT created_by)';
    RAISE NOTICE 'Error: % (%)', SQLERRM, SQLSTATE;
    RAISE NOTICE '';
    RAISE NOTICE 'Trying WITHOUT created_by...';
  END;
END $$;

-- TEST 3: Versuch 2 - OHNE created_by
DO $$
DECLARE
  user_id UUID;
  test_shift_id UUID;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '3️⃣  TEST INSERT (OHNE created_by)';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Versuche Schicht zu erstellen...';
  
  BEGIN
    INSERT INTO public.shifts (
      user_id,
      date,
      shift_type,
      start_time,
      end_time
    ) VALUES (
      user_id,
      (CURRENT_DATE + INTERVAL '1 day')::DATE,
      'MORNING',
      '08:00:00',
      '16:00:00'
    )
    RETURNING id INTO test_shift_id;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅✅✅ SUCCESS! ✅✅✅';
    RAISE NOTICE 'Shift ID: %', test_shift_id;
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Die Policies funktionieren!';
    RAISE NOTICE '🎉 created_by ist NICHT nötig!';
    
    -- Cleanup
    DELETE FROM public.shifts WHERE id = test_shift_id;
    RAISE NOTICE '✅ Cleanup: Test-Schicht gelöscht';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌❌❌ INSERT FAILED (OHNE created_by) ❌❌❌';
    RAISE NOTICE '';
    RAISE NOTICE 'Error Code: %', SQLSTATE;
    RAISE NOTICE 'Error Message: %', SQLERRM;
    RAISE NOTICE '';
    
    -- Specific error handling
    IF SQLSTATE = '42501' THEN
      RAISE NOTICE '🔧 LÖSUNG 1: RLS deaktivieren';
      RAISE NOTICE '   ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;';
      RAISE NOTICE '';
      
    ELSIF SQLSTATE = '23502' THEN
      RAISE NOTICE '🔧 LÖSUNG 2: Pflichtfeld fehlt';
      RAISE NOTICE 'Fehlende Column: %', SQLERRM;
      RAISE NOTICE '';
      
      IF SQLERRM LIKE '%created_by%' THEN
        RAISE NOTICE 'Mache created_by nullable:';
        RAISE NOTICE '   ALTER TABLE shifts ALTER COLUMN created_by DROP NOT NULL;';
      END IF;
      
    ELSIF SQLSTATE = '23503' THEN
      RAISE NOTICE '🔧 LÖSUNG 3: User existiert nicht';
      RAISE NOTICE 'Check: SELECT id, email FROM users WHERE id = auth.uid();';
      RAISE NOTICE '';
      
    ELSIF SQLSTATE = '22P02' THEN
      RAISE NOTICE '🔧 LÖSUNG 4: Ungültiger shift_type Wert';
      RAISE NOTICE 'MORNING ist nicht erlaubt!';
      RAISE NOTICE '';
      RAISE NOTICE 'Check erlaubte Werte:';
      RAISE NOTICE '   SELECT column_name, data_type';
      RAISE NOTICE '   FROM information_schema.columns';
      RAISE NOTICE '   WHERE table_name = ''shifts'' AND column_name = ''shift_type'';';
      RAISE NOTICE '';
    END IF;
  END;
END $$;

-- TEST 4: Show table structure
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '4️⃣  SHIFTS TABLE STRUCTURE';
  RAISE NOTICE '==========================================';
END $$;

SELECT 
  column_name as "Column",
  data_type as "Type",
  is_nullable as "Nullable",
  column_default as "Default"
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'shifts'
ORDER BY ordinal_position;

-- FINAL SUMMARY
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '📋 ZUSAMMENFASSUNG';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Wenn TEST 2 oder TEST 3 erfolgreich war:';
  RAISE NOTICE '  ✅ Backend funktioniert!';
  RAISE NOTICE '  ✅ Problem ist im Frontend Code!';
  RAISE NOTICE '  ✅ Ich habe bereits den Hook gefixt';
  RAISE NOTICE '  ✅ Versuche erneut, eine Schicht zu erstellen';
  RAISE NOTICE '';
  RAISE NOTICE 'Wenn BEIDE Tests fehlgeschlagen:';
  RAISE NOTICE '  ❌ Problem ist in der Datenbank';
  RAISE NOTICE '  ❌ Siehe Error-Details und Lösungen oben';
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
END $$;
