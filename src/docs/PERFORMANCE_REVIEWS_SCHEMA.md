-- ========================================
-- MITARBEITERGESPRÄCHE - DATENBANK SCHEMA
-- ========================================
-- Führe diesen Code im Supabase Dashboard → SQL Editor aus

-- DROP existing tables (if any)
DROP TABLE IF EXISTS performance_review_signatures CASCADE;
DROP TABLE IF EXISTS performance_review_answers CASCADE;
DROP TABLE IF EXISTS performance_reviews CASCADE;
DROP TABLE IF EXISTS performance_review_templates CASCADE;

-- 1. performance_review_templates
CREATE TABLE performance_review_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_performance_review_templates_org ON performance_review_templates(organization_id);
CREATE INDEX idx_performance_review_templates_created_by ON performance_review_templates(created_by);

ALTER TABLE performance_review_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates from their organization"
  ON performance_review_templates
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert templates"
  ON performance_review_templates
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update templates"
  ON performance_review_templates
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete templates"
  ON performance_review_templates
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- 2. performance_reviews
CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  template_snapshot JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED')),
  due_date TIMESTAMPTZ,
  conversation_date TIMESTAMPTZ,
  employee_notes JSONB DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_performance_reviews_org ON performance_reviews(organization_id);
CREATE INDEX idx_performance_reviews_employee ON performance_reviews(employee_id);
CREATE INDEX idx_performance_reviews_manager ON performance_reviews(manager_id);
CREATE INDEX idx_performance_reviews_status ON performance_reviews(status);
CREATE INDEX idx_performance_reviews_due_date ON performance_reviews(due_date);

ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their own reviews"
  ON performance_reviews
  FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Managers can view their team's reviews"
  ON performance_reviews
  FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "Admins can view all reviews in their organization"
  ON performance_reviews
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can insert reviews"
  ON performance_reviews
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Employees can update their own reviews"
  ON performance_reviews
  FOR UPDATE
  USING (employee_id = auth.uid());

CREATE POLICY "Managers can update their team's reviews"
  ON performance_reviews
  FOR UPDATE
  USING (manager_id = auth.uid());

CREATE POLICY "Admins can update all reviews"
  ON performance_reviews
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- 3. performance_review_answers
CREATE TABLE performance_review_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  employee_answer JSONB,
  employee_answered_at TIMESTAMPTZ,
  manager_comment TEXT,
  manager_answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(review_id, question_id)
);

CREATE INDEX idx_performance_review_answers_review ON performance_review_answers(review_id);
CREATE INDEX idx_performance_review_answers_question ON performance_review_answers(question_id);

ALTER TABLE performance_review_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view answers for reviews they can access"
  ON performance_review_answers
  FOR SELECT
  USING (
    review_id IN (
      SELECT id FROM performance_reviews
      WHERE employee_id = auth.uid()
         OR manager_id = auth.uid()
         OR organization_id IN (
           SELECT organization_id FROM users WHERE id = auth.uid()
         )
    )
  );

CREATE POLICY "Users can update answers for reviews they can access"
  ON performance_review_answers
  FOR UPDATE
  USING (
    review_id IN (
      SELECT id FROM performance_reviews
      WHERE employee_id = auth.uid()
         OR manager_id = auth.uid()
         OR organization_id IN (
           SELECT organization_id FROM users WHERE id = auth.uid()
         )
    )
  );

CREATE POLICY "Users can insert answers"
  ON performance_review_answers
  FOR INSERT
  WITH CHECK (
    review_id IN (
      SELECT id FROM performance_reviews
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- 4. performance_review_signatures
CREATE TABLE performance_review_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('employee', 'manager')),
  signature_data TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id, role)
);

CREATE INDEX idx_performance_review_signatures_review ON performance_review_signatures(review_id);
CREATE INDEX idx_performance_review_signatures_user ON performance_review_signatures(user_id);

ALTER TABLE performance_review_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signatures for reviews they can access"
  ON performance_review_signatures
  FOR SELECT
  USING (
    review_id IN (
      SELECT id FROM performance_reviews
      WHERE employee_id = auth.uid()
         OR manager_id = auth.uid()
         OR organization_id IN (
           SELECT organization_id FROM users WHERE id = auth.uid()
         )
    )
  );

CREATE POLICY "Users can insert their own signatures"
  ON performance_review_signatures
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own signatures"
  ON performance_review_signatures
  FOR UPDATE
  USING (user_id = auth.uid());
