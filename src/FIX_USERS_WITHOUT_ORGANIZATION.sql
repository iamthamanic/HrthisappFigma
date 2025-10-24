DO $$
DECLARE
  default_org_id UUID;
  users_updated INTEGER := 0;
  user_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Suche nach Standard-Organisation...';
  
  BEGIN
    SELECT id INTO default_org_id
    FROM public.organizations
    WHERE is_default = TRUE
    LIMIT 1;
    
    IF default_org_id IS NULL THEN
      SELECT id INTO default_org_id
      FROM public.organizations
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;
    
    IF default_org_id IS NULL THEN
      RAISE EXCEPTION 'Keine Organisation gefunden! Erstelle zuerst eine Organisation.';
    END IF;
    
    RAISE NOTICE 'Standard-Organisation gefunden: %', default_org_id;
  EXCEPTION 
    WHEN undefined_column THEN
      SELECT id INTO default_org_id
      FROM public.organizations
      ORDER BY created_at ASC
      LIMIT 1;
      
      IF default_org_id IS NULL THEN
        RAISE EXCEPTION 'Keine Organisation gefunden! Erstelle zuerst eine Organisation.';
      END IF;
      
      RAISE NOTICE 'Erste Organisation gefunden: %', default_org_id;
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Suche nach Benutzern ohne Organization...';
  
  SELECT COUNT(*) INTO users_updated
  FROM public.users
  WHERE organization_id IS NULL;
  
  RAISE NOTICE 'Gefunden: % Benutzer ohne Organization', users_updated;
  RAISE NOTICE '';
  
  IF users_updated > 0 THEN
    RAISE NOTICE 'Update wird durchgefuehrt...';
    
    UPDATE public.users
    SET organization_id = default_org_id,
        updated_at = NOW()
    WHERE organization_id IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'ERFOLGREICH AKTUALISIERT!';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE '% Benutzer wurden der Standard-Organisation zugewiesen!', users_updated;
    RAISE NOTICE '';
    RAISE NOTICE 'Betroffene Benutzer:';
    
    FOR user_record IN (
      SELECT email, first_name, last_name, employee_number
      FROM public.users
      WHERE organization_id = default_org_id
      ORDER BY created_at
    ) LOOP
      RAISE NOTICE '  %  % (%, %)', user_record.first_name, user_record.last_name, user_record.email, user_record.employee_number;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Alle Benutzer sind jetzt korrekt zugewiesen!';
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE 'Alle Benutzer haben bereits eine Organization zugewiesen!';
    RAISE NOTICE 'Nichts zu tun.';
    RAISE NOTICE '';
  END IF;
  
END $$;
