-- =============================================
-- PERFORMANCE REVIEWS SCHEMA
-- =============================================
-- SQL für Mitarbeitergespräche Feature
-- Bitte im Supabase SQL Editor ausführen!
-- =============================================

-- 1. Templates Table
CREATE TABLE IF NOT EXISTS performance_review_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index für schnelles Filtern nach Organisation
CREATE INDEX IF NOT EXISTS idx_performance_review_templates_org 
  ON performance_review_templates(organization_id);

-- Index für Suche nach Ersteller
CREATE INDEX IF NOT EXISTS idx_performance_review_templates_created_by 
  ON performance_review_templates(created_by);

-- 2. Performance Reviews Table
CREATE TABLE IF NOT EXISTS performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  template_snapshot JSONB NOT NULL, -- Snapshot der Fragen zum Zeitpunkt des Versendens
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED')),
  due_date TIMESTAMPTZ,
  conversation_date TIMESTAMPTZ,
  employee_notes JSONB DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indizes für Performance Reviews
CREATE INDEX IF NOT EXISTS idx_performance_reviews_org 
  ON performance_reviews(organization_id);

CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee 
  ON performance_reviews(employee_id);

CREATE INDEX IF NOT EXISTS idx_performance_reviews_manager 
  ON performance_reviews(manager_id);

CREATE INDEX IF NOT EXISTS idx_performance_reviews_status 
  ON performance_reviews(status);

-- 3. Performance Review Answers Table
CREATE TABLE IF NOT EXISTS performance_review_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL, -- ID aus dem template_snapshot
  employee_answer JSONB, -- Kann String, Number, Boolean, Array sein
  employee_answered_at TIMESTAMPTZ,
  manager_comment TEXT,
  manager_answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(review_id, question_id) -- Eine Antwort pro Frage
);

-- Index für schnelles Laden aller Antworten eines Reviews
CREATE INDEX IF NOT EXISTS idx_performance_review_answers_review 
  ON performance_review_answers(review_id);

-- 4. Performance Review Signatures Table
CREATE TABLE IF NOT EXISTS performance_review_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('employee', 'manager')),
  signature_data TEXT NOT NULL, -- Base64 Canvas Data
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(review_id, role) -- Eine Unterschrift pro Rolle
);

-- Index für Signatures
CREATE INDEX IF NOT EXISTS idx_performance_review_signatures_review 
  ON performance_review_signatures(review_id);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE performance_review_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_review_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_review_signatures ENABLE ROW LEVEL SECURITY;

-- Templates: Jeder in der Organisation kann Templates sehen
CREATE POLICY "Users can view templates in their organization"
  ON performance_review_templates
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Templates: Nur Admins/Berechtigte können Templates erstellen/bearbeiten
CREATE POLICY "Admins can manage templates"
  ON performance_review_templates
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Reviews: Mitarbeiter können ihre eigenen Reviews sehen
CREATE POLICY "Users can view their own reviews"
  ON performance_reviews
  FOR SELECT
  USING (
    employee_id = auth.uid()
    OR manager_id = auth.uid()
    OR created_by = auth.uid()
  );

-- Reviews: Admins/Manager können Reviews erstellen/bearbeiten
CREATE POLICY "Managers can manage reviews"
  ON performance_reviews
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Answers: User können ihre eigenen Antworten sehen/bearbeiten
CREATE POLICY "Users can manage their review answers"
  ON performance_review_answers
  FOR ALL
  USING (
    review_id IN (
      SELECT id FROM performance_reviews 
      WHERE employee_id = auth.uid() OR manager_id = auth.uid()
    )
  );

-- Signatures: User können ihre eigenen Unterschriften verwalten
CREATE POLICY "Users can manage their signatures"
  ON performance_review_signatures
  FOR ALL
  USING (
    review_id IN (
      SELECT id FROM performance_reviews 
      WHERE employee_id = auth.uid() OR manager_id = auth.uid()
    )
  );

-- =============================================
-- DONE!
-- =============================================
-- Die Tabellen sind jetzt bereit für die Edge Function
-- "BrowoKoordinator-Mitarbeitergespraeche"
-- =============================================
