-- Migration: Rewards System
-- Erstellt die rewards Tabelle für das Benefits/Prämien-System

-- Create rewards table
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL CHECK (cost > 0),
  icon TEXT DEFAULT '🎁',
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  CONSTRAINT rewards_name_unique UNIQUE (name)
);

-- Enable RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rewards
-- Everyone can read rewards
CREATE POLICY "Anyone can view rewards"
  ON public.rewards
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can create rewards
CREATE POLICY "Admins can create rewards"
  ON public.rewards
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- Only admins can update rewards
CREATE POLICY "Admins can update rewards"
  ON public.rewards
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'SUPERADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- Only admins can delete rewards
CREATE POLICY "Admins can delete rewards"
  ON public.rewards
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rewards_updated_at
  BEFORE UPDATE ON public.rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_rewards_updated_at();

-- Insert some default rewards
INSERT INTO public.rewards (name, description, cost, icon, available) VALUES
  ('Extra Urlaubstag', 'Erhalte einen zusätzlichen Urlaubstag', 500, '🏖️', true),
  ('Home Office Tag', 'Ein zusätzlicher Home Office Tag', 200, '🏠', true),
  ('Teamessen', 'Gemeinsames Essen mit dem Team', 300, '🍕', true),
  ('Gutschein 50€', 'Amazon Gutschein im Wert von 50€', 1000, '🎁', true),
  ('Parkplatz für 1 Monat', 'Reservierter Parkplatz für einen Monat', 800, '🚗', true),
  ('Firmen Event Ticket', 'Ticket für das nächste Firmen-Event', 2000, '🎉', false)
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE public.rewards IS 'Prämien die Mitarbeiter mit Coins einlösen können';
