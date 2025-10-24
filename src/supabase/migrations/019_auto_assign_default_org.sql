-- ============================================
-- HRthis: Auto-Assign Default Organization
-- Updates the handle_new_user function to automatically
-- assign new users to the default organization
-- ============================================

-- Drop old function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================
-- UPDATED FUNCTION with Default Org Assignment
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- Run with creator's privileges (bypasses RLS!)
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  emp_number TEXT;
  emp_count INTEGER;
  default_org_id UUID;
BEGIN
  -- Log start
  RAISE LOG 'handle_new_user: Starting for user %', NEW.email;
  
  -- Get default organization ID
  -- Try to find organization with is_default = TRUE, or just get the first one
  BEGIN
    -- Try with is_default column first (if it exists)
    SELECT id INTO default_org_id
    FROM public.organizations
    WHERE is_default = TRUE
    LIMIT 1;
    
    -- If not found and no error, try to get first organization
    IF default_org_id IS NULL THEN
      SELECT id INTO default_org_id
      FROM public.organizations
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;
    
    IF default_org_id IS NULL THEN
      RAISE WARNING 'No organization found - user will be created without org';
    ELSE
      RAISE LOG 'handle_new_user: Found organization: %', default_org_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If is_default column doesn't exist, just get first org
    BEGIN
      SELECT id INTO default_org_id
      FROM public.organizations
      ORDER BY created_at ASC
      LIMIT 1;
      
      IF default_org_id IS NULL THEN
        RAISE WARNING 'No organization found - user will be created without org';
      ELSE
        RAISE LOG 'handle_new_user: Found organization (fallback): %', default_org_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error finding organization: %', SQLERRM;
      default_org_id := NULL;
    END;
  END;
  
  -- Generate employee number
  BEGIN
    SELECT COUNT(*) INTO emp_count FROM public.users;
    emp_number := 'PN-' || TO_CHAR(CURRENT_DATE, 'YYYY') || LPAD((COALESCE(emp_count, 0) + 1)::TEXT, 4, '0');
    RAISE LOG 'handle_new_user: Generated employee number: %', emp_number;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error generating employee number: %', SQLERRM;
    emp_number := 'PN-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '0001';
  END;
  
  -- Insert user profile with organization_id
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      first_name,
      last_name,
      role,
      employee_number,
      position,
      department,
      start_date,
      vacation_days,
      weekly_hours,
      employment_type,
      is_active,
      organization_id  -- ✅ AUTO-ASSIGN DEFAULT ORG
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), 'Neuer'),
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), 'Mitarbeiter'),
      'EMPLOYEE',
      emp_number,
      NULLIF(NEW.raw_user_meta_data->>'position', ''),
      NULLIF(NEW.raw_user_meta_data->>'department', ''),
      CURRENT_DATE,
      30,
      40,
      'FULL_TIME',
      TRUE,
      default_org_id  -- ✅ ASSIGN TO DEFAULT ORG
    );
    RAISE LOG 'handle_new_user: Created user profile for % with org %', NEW.email, default_org_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
  END;
  
  -- Create avatar
  BEGIN
    INSERT INTO public.user_avatars (
      user_id,
      level,
      total_xp,
      skin_color,
      hair_color,
      background_color
    ) VALUES (
      NEW.id,
      1,
      0,
      '#FDBCB4',
      '#000000',
      '#E3F2FD'
    );
    RAISE LOG 'handle_new_user: Created avatar for %', NEW.email;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating avatar: %', SQLERRM;
    -- Don't fail if avatar creation fails
  END;
  
  -- Create welcome notification
  BEGIN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      read
    ) VALUES (
      NEW.id,
      'Willkommen bei HRthis! 🎉',
      'Dein Account wurde erfolgreich erstellt. Viel Erfolg!',
      'SUCCESS',
      FALSE
    );
    RAISE LOG 'handle_new_user: Created notification for %', NEW.email;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating notification: %', SQLERRM;
    -- Don't fail if notification creation fails
  END;
  
  -- Award welcome coins
  BEGIN
    INSERT INTO public.coin_transactions (
      user_id,
      amount,
      reason,
      type
    ) VALUES (
      NEW.id,
      50,
      'Willkommensbonus',
      'EARNED'
    );
    RAISE LOG 'handle_new_user: Created coin transaction for %', NEW.email;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating coin transaction: %', SQLERRM;
    -- Don't fail if coin creation fails
  END;
  
  RAISE LOG 'handle_new_user: Successfully completed for %', NEW.email;
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- Last resort: log and return
  RAISE WARNING 'CRITICAL ERROR in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ============================================
-- RECREATE TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ MIGRATION 019: DEFAULT ORG AUTO-ASSIGNMENT';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Updated handle_new_user() function to:';
  RAISE NOTICE '  ✅ Automatically find default organization';
  RAISE NOTICE '  ✅ Assign all new users to default org';
  RAISE NOTICE '  ✅ Work even if no default org exists yet';
  RAISE NOTICE '';
  RAISE NOTICE 'All new users will be automatically assigned to';
  RAISE NOTICE 'the organization with is_default = TRUE';
  RAISE NOTICE '';
  RAISE NOTICE 'Perfect for Single-Tenant setups! 🎉';
  RAISE NOTICE '';
END $$;

COMMENT ON FUNCTION public.handle_new_user() IS 
'V4: Auto-creates user profile with automatic default organization assignment.
Perfect for single-tenant deployments where each database belongs to one company.
Uses SECURITY DEFINER to bypass RLS.';
