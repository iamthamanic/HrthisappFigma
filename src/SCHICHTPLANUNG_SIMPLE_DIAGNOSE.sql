-- =====================================================
-- SIMPLE DIAGNOSE: Nur die wichtigsten Checks
-- =====================================================
-- Führe dieses Script aus, während du eingeloggt bist!
-- =====================================================

-- CHECK 1: Bist du eingeloggt?
DO $$
DECLARE
  user_id UUID;
  user_email TEXT;
  user_role TEXT;
BEGIN
  user_id := auth.uid();
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CHECK 1: AUTHENTICATION';
  RAISE NOTICE '========================================';
  
  IF user_id IS NULL THEN
    RAISE NOTICE '❌ PROBLEM: Du bist NICHT eingeloggt!';
    RAISE NOTICE 'Logge dich zuerst in deine App ein!';
  ELSE
    RAISE NOTICE '✅ Eingeloggt als User ID: %', user_id;
    
    SELECT email, role INTO user_email, user_role
    FROM public.users
    WHERE id = user_id;
    
    IF user_email IS NOT NULL THEN
      RAISE NOTICE '   Email: %', user_email;
      RAISE NOTICE '   Role: %', user_role;
    ELSE
      RAISE NOTICE '⚠️  User existiert nicht in users table!';
    END IF;
  END IF;
END $$;

-- CHECK 2: Tabellenstruktur
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CHECK 2: SHIFTS TABLE STRUCTURE';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'shifts'
ORDER BY ordinal_position;

-- CHECK 3: Gibt es created_by?
DO $$
DECLARE
  has_created_by BOOLEAN;
  created_by_nullable TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CHECK 3: CREATED_BY COLUMN';
  RAISE NOTICE '========================================';
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'shifts'
    AND column_name = 'created_by'
  ) INTO has_created_by;
  
  IF has_created_by THEN
    SELECT is_nullable INTO created_by_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'shifts'
    AND column_name = 'created_by';
    
    RAISE NOTICE '✅ created_by column exists';
    RAISE NOTICE '   Nullable: %', created_by_nullable;
    
    IF created_by_nullable = 'NO' THEN
      RAISE NOTICE '';
      RAISE NOTICE '⚠️  PROBLEM: created_by is NOT NULL!';
      RAISE NOTICE 'Du MUSST created_by beim INSERT angeben!';
    END IF;
  ELSE
    RAISE NOTICE '✅ created_by column does NOT exist';
    RAISE NOTICE '   (This is okay)';
  END IF;
END $$;

-- CHECK 4: TEST INSERT (DER WICHTIGSTE TEST!)
DO $$
DECLARE
  user_id UUID;
  test_shift_id UUID;
  error_code TEXT;
  error_message TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CHECK 4: TEST INSERT (WICHTIGSTER TEST!)';
  RAISE NOTICE '========================================';
  
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RAISE NOTICE '⏭️  SKIPPED: Nicht eingeloggt';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Versuche Test-Schicht zu erstellen...';
  
  BEGIN
    -- Version 1: MIT created_by
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
    RAISE NOTICE '';
    RAISE NOTICE 'Test-Schicht erstellt mit ID: %', test_shift_id;
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Die Policies funktionieren!';
    RAISE NOTICE '🎉 Das Problem ist im FRONTEND-CODE!';
    RAISE NOTICE '';
    RAISE NOTICE 'Check deinen Hook: /hooks/BrowoKo_useShiftPlanning.ts';
    RAISE NOTICE 'Zeile 181: .insert([shiftData])';
    
    -- Cleanup
    DELETE FROM public.shifts WHERE id = test_shift_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Test-Schicht gelöscht (cleanup)';
    
  EXCEPTION WHEN OTHERS THEN
    error_code := SQLSTATE;
    error_message := SQLERRM;
    
    RAISE NOTICE '';
    RAISE NOTICE '❌❌❌ INSERT FAILED! ❌❌❌';
    RAISE NOTICE '';
    RAISE NOTICE 'Error Code: %', error_code;
    RAISE NOTICE 'Error Message: %', error_message;
    RAISE NOTICE '';
    
    -- Specific diagnostics
    IF error_code = '42501' THEN
      RAISE NOTICE '🔍 DIAGNOSIS: RLS POLICY VIOLATION';
      RAISE NOTICE '';
      RAISE NOTICE '⚠️  Obwohl die Policies permissive sind,';
      RAISE NOTICE '   wird der INSERT trotzdem blockiert!';
      RAISE NOTICE '';
      RAISE NOTICE '💡 LÖSUNG: RLS temporär deaktivieren';
      RAISE NOTICE '   ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;';
      
    ELSIF error_code = '23502' THEN
      RAISE NOTICE '🔍 DIAGNOSIS: NOT NULL CONSTRAINT';
      RAISE NOTICE '';
      RAISE NOTICE 'Ein Pflichtfeld fehlt!';
      RAISE NOTICE 'Fehlende Column: %', error_message;
      RAISE NOTICE '';
      
      IF error_message LIKE '%shift_type%' THEN
        RAISE NOTICE '💡 LÖSUNG: shift_type muss ein ENUM sein!';
        RAISE NOTICE '   Erlaubte Werte: MORNING, AFTERNOON, NIGHT, etc.';
      ELSIF error_message LIKE '%created_by%' THEN
        RAISE NOTICE '💡 LÖSUNG: created_by Column nullable machen';
        RAISE NOTICE '   ALTER TABLE shifts ALTER COLUMN created_by DROP NOT NULL;';
      END IF;
      
    ELSIF error_code = '23503' THEN
      RAISE NOTICE '🔍 DIAGNOSIS: FOREIGN KEY CONSTRAINT';
      RAISE NOTICE '';
      RAISE NOTICE 'user_id existiert nicht in users table!';
      RAISE NOTICE '';
      RAISE NOTICE '💡 LÖSUNG: Check ob User existiert:';
      RAISE NOTICE '   SELECT id, email FROM users WHERE id = auth.uid();';
      
    ELSIF error_code = '22P02' THEN
      RAISE NOTICE '🔍 DIAGNOSIS: INVALID INPUT (ENUM?)';
      RAISE NOTICE '';
      RAISE NOTICE 'shift_type hat einen ungültigen Wert!';
      RAISE NOTICE '';
      RAISE NOTICE '💡 LÖSUNG: Check erlaubte shift_type Werte:';
      RAISE NOTICE '   SELECT unnest(enum_range(NULL::shift_type_enum));';
      
    ELSE
      RAISE NOTICE '🔍 DIAGNOSIS: UNKNOWN ERROR';
      RAISE NOTICE 'Error Code: %', error_code;
      RAISE NOTICE 'Message: %', error_message;
    END IF;
  END;
END $$;

-- CHECK 5: Shift Type ENUM (falls vorhanden)
DO $$
DECLARE
  enum_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CHECK 5: SHIFT_TYPE ENUM';
  RAISE NOTICE '========================================';
  
  SELECT EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'shift_type_enum'
  ) INTO enum_exists;
  
  IF enum_exists THEN
    RAISE NOTICE '✅ shift_type_enum exists';
    RAISE NOTICE '';
    RAISE NOTICE 'Erlaubte Werte:';
  ELSE
    RAISE NOTICE '⚠️  shift_type_enum does NOT exist';
    RAISE NOTICE '   shift_type ist wahrscheinlich TEXT';
  END IF;
END $$;

-- Show enum values (if exists)
SELECT 
  enumlabel as "Erlaubte shift_type Werte"
FROM pg_enum
WHERE enumtypid = 'shift_type_enum'::regtype::oid
ORDER BY enumsortorder;

-- FINAL SUMMARY
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 ZUSAMMENFASSUNG';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Wenn CHECK 4 (TEST INSERT) erfolgreich war:';
  RAISE NOTICE '  → Problem ist im FRONTEND';
  RAISE NOTICE '  → Fix /hooks/BrowoKo_useShiftPlanning.ts';
  RAISE NOTICE '';
  RAISE NOTICE 'Wenn CHECK 4 (TEST INSERT) fehlgeschlagen:';
  RAISE NOTICE '  → Problem ist in der DATENBANK';
  RAISE NOTICE '  → Siehe Error Details oben';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
