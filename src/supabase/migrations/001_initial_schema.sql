-- HRthis Database Schema
-- Complete database structure for HR management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- Users table (extends Supabase Auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'EMPLOYEE' CHECK (role IN ('EMPLOYEE', 'ADMIN', 'SUPERADMIN')),
  employee_number TEXT UNIQUE,
  position TEXT,
  department TEXT,
  employment_type TEXT DEFAULT 'FULL_TIME' CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'MINI_JOB', 'INTERN', 'OTHER')),
  start_date DATE,
  vacation_days INTEGER DEFAULT 30,
  weekly_hours INTEGER DEFAULT 40,
  is_active BOOLEAN DEFAULT true,
  phone TEXT,
  address JSONB,
  birth_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TEAMS
-- ============================================

CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members junction table
CREATE TABLE public.team_members (
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  is_lead BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- ============================================
-- TIME TRACKING
-- ============================================

CREATE TABLE public.time_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_in TIME,
  time_out TIME,
  break_minutes INTEGER DEFAULT 0,
  total_hours DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================
-- LEAVE MANAGEMENT
-- ============================================

CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('VACATION', 'SICK')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  comment TEXT,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DOCUMENTS
-- ============================================

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('LOHN', 'VERTRAG', 'SONSTIGES')),
  file_url TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  assigned_by UUID REFERENCES public.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LEARNING SYSTEM
-- ============================================

-- Video content
CREATE TABLE public.video_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  category TEXT NOT NULL CHECK (category IN ('MANDATORY', 'COMPLIANCE', 'SKILLS', 'ONBOARDING', 'BONUS')),
  is_mandatory BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning progress tracking
CREATE TABLE public.learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.video_content(id) ON DELETE CASCADE,
  watched_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Quiz system
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES public.video_content(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE')),
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0
);

CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- GAMIFICATION SYSTEM
-- ============================================

-- User avatars
CREATE TABLE public.user_avatars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  skin_color TEXT DEFAULT '#FDBCB4',
  hair_color TEXT DEFAULT '#000000',
  background_color TEXT DEFAULT '#E3F2FD',
  accessories JSONB DEFAULT '[]',
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- XP events log
CREATE TABLE public.xp_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  skill_id TEXT,
  xp_amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coin system
CREATE TABLE public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('EARNED', 'SPENT')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  badge_color TEXT,
  xp_reward INTEGER DEFAULT 0,
  coin_reward INTEGER DEFAULT 0,
  requirement_type TEXT NOT NULL,
  requirement_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INFO', 'SUCCESS', 'WARNING', 'ERROR')),
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_employee_number ON public.users(employee_number);
CREATE INDEX idx_time_records_user_date ON public.time_records(user_id, date DESC);
CREATE INDEX idx_leave_requests_user ON public.leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX idx_documents_user ON public.documents(user_id);
CREATE INDEX idx_learning_progress_user ON public.learning_progress(user_id);
CREATE INDEX idx_xp_events_user ON public.xp_events(user_id, created_at DESC);
CREATE INDEX idx_coin_transactions_user ON public.coin_transactions(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_records_updated_at BEFORE UPDATE ON public.time_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_content_updated_at BEFORE UPDATE ON public.video_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_avatars_updated_at BEFORE UPDATE ON public.user_avatars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate total hours
CREATE OR REPLACE FUNCTION calculate_total_hours(
  p_time_in TIME,
  p_time_out TIME,
  p_break_minutes INTEGER
)
RETURNS DECIMAL(4,2) AS $$
DECLARE
  total_minutes INTEGER;
  work_minutes INTEGER;
BEGIN
  IF p_time_in IS NULL OR p_time_out IS NULL THEN
    RETURN NULL;
  END IF;
  
  total_minutes := EXTRACT(EPOCH FROM (p_time_out - p_time_in)) / 60;
  work_minutes := total_minutes - COALESCE(p_break_minutes, 0);
  
  RETURN ROUND((work_minutes::DECIMAL / 60), 2);
END;
$$ LANGUAGE plpgsql;

-- Auto-calculate total hours on time record insert/update
CREATE OR REPLACE FUNCTION update_time_record_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_hours := calculate_total_hours(NEW.time_in, NEW.time_out, NEW.break_minutes);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_time_record_total
  BEFORE INSERT OR UPDATE ON public.time_records
  FOR EACH ROW EXECUTE FUNCTION update_time_record_total();

-- Function to add XP and update level
CREATE OR REPLACE FUNCTION add_user_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_description TEXT,
  p_source TEXT
)
RETURNS void AS $$
DECLARE
  current_xp INTEGER;
  new_xp INTEGER;
  new_level INTEGER;
BEGIN
  -- Get current XP
  SELECT total_xp INTO current_xp FROM public.user_avatars WHERE user_id = p_user_id;
  
  IF current_xp IS NULL THEN
    -- Create avatar if doesn't exist
    INSERT INTO public.user_avatars (user_id, total_xp, level)
    VALUES (p_user_id, p_xp_amount, 1);
    current_xp := 0;
  END IF;
  
  -- Calculate new XP and level
  new_xp := current_xp + p_xp_amount;
  
  -- Simple level formula: level = floor(sqrt(xp / 100)) + 1
  new_level := FLOOR(SQRT(new_xp / 100.0)) + 1;
  
  -- Update avatar
  UPDATE public.user_avatars
  SET total_xp = new_xp, level = new_level
  WHERE user_id = p_user_id;
  
  -- Log XP event
  INSERT INTO public.xp_events (user_id, xp_amount, description, source)
  VALUES (p_user_id, p_xp_amount, p_description, p_source);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );

CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- Time records policies
CREATE POLICY "Users can view own time records" ON public.time_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time records" ON public.time_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time records" ON public.time_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all time records" ON public.time_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- Leave requests policies
CREATE POLICY "Users can view own leave requests" ON public.leave_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own leave requests" ON public.leave_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all leave requests" ON public.leave_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- Documents policies
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all documents" ON public.documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- Video content - everyone can read
CREATE POLICY "Anyone authenticated can view videos" ON public.video_content
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage videos" ON public.video_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- Learning progress policies
CREATE POLICY "Users can manage own learning progress" ON public.learning_progress
  FOR ALL USING (auth.uid() = user_id);

-- Avatar policies
CREATE POLICY "Users can view own avatar" ON public.user_avatars
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own avatar" ON public.user_avatars
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view other avatars" ON public.user_avatars
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, badge_color, xp_reward, coin_reward, requirement_type, requirement_value) VALUES
('Erste Schritte', 'Profil vervollständigt', '🎯', '#3b82f6', 50, 10, 'profile_complete', '{"complete": true}'),
('Lernbeginner', 'Erstes Video abgeschlossen', '📚', '#10b981', 50, 10, 'videos_watched', '{"count": 1}'),
('Fleißiger Lerner', '5 Videos abgeschlossen', '🎓', '#8b5cf6', 100, 25, 'videos_watched', '{"count": 5}'),
('Wissenssammler', '10 Videos abgeschlossen', '🏆', '#f59e0b', 200, 50, 'videos_watched', '{"count": 10}'),
('Pünktlich', '7 Tage hintereinander pünktlich eingecheckt', '⏰', '#ef4444', 150, 30, 'punctual_checkin', '{"days": 7}'),
('Teamplayer', 'Teammitglied geworden', '🤝', '#3b82f6', 75, 15, 'team_join', '{"joined": true}');
