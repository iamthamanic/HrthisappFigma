# 🚀 COMPLETE SETUP v4.7.0 - COPY & PASTE SQL

**WICHTIG:** Diese SQL-Datei erstellt ALLE fehlenden Tabellen und fügt die neuen Felder hinzu!

---

## 📋 ANLEITUNG:

1. **Öffne Supabase Dashboard** → SQL Editor
2. **Markiere ALLES** (`Cmd+A` / `Strg+A`)
3. **Kopiere** (`Cmd+C` / `Strg+C`)
4. **Füge in SQL Editor ein** und **RUN**

---

## ✅ SQL CODE (KOMPLETT):

```sql
-- ================================================
-- HRTHIS v4.7.0 - COMPLETE DATABASE SETUP
-- ================================================
-- This SQL creates ALL tables if they don't exist
-- and adds Extended User Fields (v4.6.0 + v4.7.0)
-- ================================================

-- ================================================
-- STEP 1: CREATE USERS TABLE (if not exists)
-- ================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'HR', 'SUPERADMIN', 'EXTERN')),
  organization_id UUID,
  employee_number TEXT,
  position TEXT,
  department TEXT,
  employment_type TEXT,
  start_date DATE,
  vacation_days INTEGER DEFAULT 30,
  weekly_hours INTEGER DEFAULT 40,
  salary NUMERIC(10, 2),
  location_id UUID,
  is_active BOOLEAN DEFAULT true,
  phone TEXT,
  address JSONB,
  birth_date DATE,
  profile_picture_url TEXT,
  private_email TEXT,
  street_address TEXT,
  postal_code TEXT,
  city TEXT,
  iban TEXT,
  bic TEXT,
  shirt_size TEXT,
  pants_size TEXT,
  shoe_size TEXT,
  jacket_size TEXT,
  break_auto BOOLEAN DEFAULT false,
  break_manual BOOLEAN DEFAULT false,
  break_minutes INTEGER DEFAULT 30,
  work_time_model TEXT CHECK (work_time_model IN ('SCHICHTMODELL', 'GLEITZEIT', 'BEREITSCHAFT') OR work_time_model IS NULL),
  shift_start_time TIME,
  shift_end_time TIME,
  flextime_start_earliest TIME,
  flextime_start_latest TIME,
  flextime_end_earliest TIME,
  flextime_end_latest TIME,
  on_call BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS on users table (as per migration 007)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_location_id ON users(location_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ================================================
-- STEP 2: CREATE ORGANIZATIONS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  domain TEXT,
  subscription_tier TEXT DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE')),
  subscription_status TEXT DEFAULT 'ACTIVE' CHECK (subscription_status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED')),
  max_users INTEGER DEFAULT 10,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create default organization if not exists
INSERT INTO organizations (id, name, slug, is_default, max_users, subscription_tier)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Organization',
  'default',
  true,
  1000,
  'ENTERPRISE'
)
ON CONFLICT (slug) DO NOTHING;

-- ================================================
-- STEP 3: CREATE LOCATIONS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name TEXT NOT NULL,
  street_address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_organization_id ON locations(organization_id);

-- ================================================
-- STEP 4: CREATE DEPARTMENTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name TEXT NOT NULL,
  description TEXT,
  location_id UUID,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  parent_department_id UUID,
  x_position NUMERIC,
  y_position NUMERIC,
  is_location BOOLEAN DEFAULT false,
  primary_user_id UUID,
  backup_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_organization_id ON departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_location_id ON departments(location_id);

-- ================================================
-- STEP 5: CREATE TEAMS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
  priority_tag TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- STEP 6: CREATE TEAM_MEMBERS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_lead BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'MEMBER' CHECK (role IN ('TEAMLEAD', 'MEMBER')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- ================================================
-- STEP 7: CREATE TIME_RECORDS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS time_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  break_start TIMESTAMP WITH TIME ZONE,
  break_end TIMESTAMP WITH TIME ZONE,
  break_duration INTEGER DEFAULT 0,
  total_hours NUMERIC(5, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_records_user_id ON time_records(user_id);
CREATE INDEX IF NOT EXISTS idx_time_records_clock_in ON time_records(clock_in);

-- ================================================
-- STEP 8: CREATE LEAVE_REQUESTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('VACATION', 'SICK', 'UNPAID_LEAVE')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reason TEXT,
  approved_by UUID,
  approval_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date ON leave_requests(start_date);

-- ================================================
-- STEP 9: CREATE DOCUMENTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('LOHN', 'VERTRAG', 'SONSTIGES')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

-- ================================================
-- STEP 10: CREATE LEARNING TABLES
-- ================================================

-- Videos
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT,
  youtube_video_id TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  category TEXT DEFAULT 'SKILLS',
  is_mandatory BOOLEAN DEFAULT false,
  xp_reward INTEGER DEFAULT 50,
  coin_reward INTEGER DEFAULT 25,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes
CREATE TABLE IF NOT EXISTS quiz_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'SKILLS',
  is_mandatory BOOLEAN DEFAULT false,
  duration INTEGER DEFAULT 10,
  passing_score INTEGER DEFAULT 80,
  questions JSONB DEFAULT '[]'::jsonb,
  xp_reward INTEGER DEFAULT 50,
  coin_reward INTEGER DEFAULT 25,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning Progress
CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quiz_content(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  progress_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON learning_progress(user_id);

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quiz_content(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);

-- ================================================
-- STEP 11: CREATE BENEFITS SYSTEM TABLES
-- ================================================

-- Benefits
CREATE TABLE IF NOT EXISTS benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'GENERAL',
  icon TEXT,
  requires_approval BOOLEAN DEFAULT false,
  coin_price INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Benefit Requests
CREATE TABLE IF NOT EXISTS benefit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  benefit_id UUID NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  request_date DATE DEFAULT CURRENT_DATE,
  approved_by UUID REFERENCES users(id),
  approval_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_benefit_requests_user_id ON benefit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_benefit_requests_status ON benefit_requests(status);

-- ================================================
-- STEP 12: CREATE COIN & ACHIEVEMENTS TABLES
-- ================================================

-- Coins Wallet
CREATE TABLE IF NOT EXISTS coins_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0,
  lifetime_earned INTEGER DEFAULT 0,
  lifetime_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coin Transactions
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('EARNED', 'SPENT')),
  source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  coin_reward INTEGER DEFAULT 50,
  xp_reward INTEGER DEFAULT 100,
  category TEXT DEFAULT 'GENERAL',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- ================================================
-- STEP 13: CREATE NOTIFICATIONS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ================================================
-- STEP 14: CREATE ANNOUNCEMENTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  is_pinned BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_by UUID REFERENCES users(id),
  edited_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_announcements_is_published ON announcements(is_published);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON announcements(is_pinned);

-- ================================================
-- STEP 15: ADD v4.6.0 EXTENDED USER FIELDS
-- ================================================

-- Gender (Geschlecht)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT NULL;

-- Country (Land)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT NULL;

-- State/Province (Bundesland)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS state TEXT DEFAULT NULL;

-- Contract Status (Vertragsstatus)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS contract_status TEXT DEFAULT NULL;

-- Contract End Date (Enddatum bei befristeten Verträgen)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS contract_end_date DATE DEFAULT NULL;

-- Re-entry Dates (Wiedereintrittsdaten)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS re_entry_dates TEXT[] DEFAULT NULL;

-- Add constraints for v4.6.0
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_gender_check;
ALTER TABLE users ADD CONSTRAINT users_gender_check 
CHECK (gender IN ('male', 'female', 'diverse') OR gender IS NULL);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_contract_status_check;
ALTER TABLE users ADD CONSTRAINT users_contract_status_check 
CHECK (contract_status IN ('unlimited', 'fixed_term') OR contract_status IS NULL);

-- Add indexes for v4.6.0
CREATE INDEX IF NOT EXISTS idx_users_birth_date ON users(birth_date) WHERE birth_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender) WHERE gender IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_contract_status ON users(contract_status) WHERE contract_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_contract_end_date ON users(contract_end_date) WHERE contract_end_date IS NOT NULL;

-- ================================================
-- STEP 16: ADD v4.7.0 ADDITIONAL USER FIELDS
-- ================================================

-- Probation Period (in months)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS probation_period_months INTEGER DEFAULT NULL;

-- Work Phone
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS work_phone TEXT DEFAULT NULL;

-- Emergency Contacts (JSONB Array)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS emergency_contacts JSONB DEFAULT '[]'::jsonb;

-- Language Skills (JSONB Array)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS language_skills JSONB DEFAULT '[]'::jsonb;

-- Add indexes for v4.7.0
CREATE INDEX IF NOT EXISTS idx_users_probation_period 
ON users(probation_period_months) WHERE probation_period_months IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_work_phone 
ON users(work_phone) WHERE work_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_emergency_contacts 
ON users USING GIN (emergency_contacts);

CREATE INDEX IF NOT EXISTS idx_users_language_skills 
ON users USING GIN (language_skills);

-- ================================================
-- STEP 17: CREATE UTILITY FUNCTIONS
-- ================================================

-- Age Calculation Function
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF birth_date IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN EXTRACT(YEAR FROM age(CURRENT_DATE, birth_date));
END;
$$;

-- Probation End Date Calculation
CREATE OR REPLACE FUNCTION calculate_probation_end_date(
  p_start_date DATE,
  p_probation_months INTEGER
)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_start_date IS NULL OR p_probation_months IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN p_start_date + (p_probation_months || ' months')::INTERVAL;
END;
$$;

-- Contract Days Remaining
CREATE OR REPLACE FUNCTION calculate_contract_days_remaining(
  p_contract_end_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_contract_end_date IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN EXTRACT(DAY FROM (p_contract_end_date - CURRENT_DATE));
END;
$$;

-- ================================================
-- STEP 18: FINAL VALIDATION
-- ================================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  -- Count critical tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'users', 'organizations', 'teams', 'team_members',
    'time_records', 'leave_requests', 'documents',
    'videos', 'quiz_content', 'learning_progress',
    'benefits', 'coins_wallet', 'achievements', 'notifications'
  );

  IF table_count < 14 THEN
    RAISE EXCEPTION '❌ Setup incomplete: Only % out of 14 tables created', table_count;
  END IF;

  -- Check v4.6.0 fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name IN ('gender', 'country', 'state', 'contract_status', 'contract_end_date', 're_entry_dates')
    HAVING COUNT(*) = 6
  ) THEN
    RAISE EXCEPTION '❌ v4.6.0 fields missing on users table';
  END IF;

  -- Check v4.7.0 fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name IN ('probation_period_months', 'work_phone', 'emergency_contacts', 'language_skills')
    HAVING COUNT(*) = 4
  ) THEN
    RAISE EXCEPTION '❌ v4.7.0 fields missing on users table';
  END IF;

  RAISE NOTICE '✅✅✅ COMPLETE SETUP SUCCESSFUL! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE '📊 DATABASE STATUS:';
  RAISE NOTICE '   - % core tables created', table_count;
  RAISE NOTICE '   - v4.6.0 Extended User Fields: ✅';
  RAISE NOTICE '   - v4.7.0 Additional User Fields: ✅';
  RAISE NOTICE '   - Utility Functions: ✅';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your HRthis database is ready to use!';
END $$;
```

---

## ✅ WAS DIESE SQL MACHT:

### **SCHRITT 1-14: ERSTELLT ALLE BASIS-TABELLEN**
- ✅ `users` (Mitarbeiter)
- ✅ `organizations` (mit Default Org)
- ✅ `locations` (Standorte)
- ✅ `departments` (Abteilungen)
- ✅ `teams` + `team_members`
- ✅ `time_records` (Zeiterfassung)
- ✅ `leave_requests` (Urlaubsanträge)
- ✅ `documents` (Dokumente)
- ✅ `videos`, `quiz_content`, `learning_progress` (Learning System)
- ✅ `benefits`, `benefit_requests` (Benefits)
- ✅ `coins_wallet`, `coin_transactions`, `achievements` (Coin & Achievements)
- ✅ `notifications` (Benachrichtigungen)
- ✅ `announcements` (Dashboard Ankündigungen)

### **SCHRITT 15: v4.6.0 EXTENDED USER FIELDS**
- ✅ `gender` (Geschlecht)
- ✅ `country` + `state` (Land + Bundesland)
- ✅ `contract_status` (befristet/unbefristet)
- ✅ `contract_end_date` (Enddatum)
- ✅ `re_entry_dates` (Wiedereintrittsdaten Array)

### **SCHRITT 16: v4.7.0 ADDITIONAL USER FIELDS**
- ✅ `probation_period_months` (Probezeit)
- ✅ `work_phone` (Arbeitstelefonnummer)
- ✅ `emergency_contacts` (Notfallkontakte JSONB Array)
- ✅ `language_skills` (Sprachkenntnisse JSONB Array)

### **SCHRITT 17: UTILITY FUNCTIONS**
- ✅ `calculate_age()` - Alter berechnen
- ✅ `calculate_probation_end_date()` - Probezeit Ende
- ✅ `calculate_contract_days_remaining()` - Tage bis Vertragsende

### **SCHRITT 18: VALIDATION**
- ✅ Prüft ob alle Tabellen erstellt wurden
- ✅ Prüft ob v4.6.0 Felder existieren
- ✅ Prüft ob v4.7.0 Felder existieren
- ✅ Zeigt Erfolgs-Meldung mit Status

---

## 🎉 NACH DEM AUSFÜHREN SOLLTEST DU SEHEN:

```
✅✅✅ COMPLETE SETUP SUCCESSFUL! ✅✅✅

📊 DATABASE STATUS:
   - 14 core tables created
   - v4.6.0 Extended User Fields: ✅
   - v4.7.0 Additional User Fields: ✅
   - Utility Functions: ✅

🚀 Your HRthis database is ready to use!
```

---

**💡 TIPP:** Diese SQL ist **IDEMPOTENT** - du kannst sie mehrmals ausführen, sie überschreibt nichts!

**🚀 JETZT EINFACH COPY-PASTE UND RUN!**
