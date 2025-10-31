-- =====================================================
-- MIGRATION 068: TASKS MANAGEMENT SYSTEM
-- =====================================================
-- Creates complete task management system with assignments, comments, and attachments
-- Author: BrowoKoordinator Team
-- Date: 2025-10-30
-- Version: 1.0.0

-- =====================================================
-- 1. ENUMS
-- =====================================================

-- Task Status Enum
DO $$ BEGIN
    CREATE TYPE task_status AS ENUM (
        'TODO',
        'IN_PROGRESS',
        'REVIEW',
        'DONE',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Task Priority Enum
DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM (
        'LOW',
        'MEDIUM',
        'HIGH',
        'URGENT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. TASKS TABLE (Main table)
-- =====================================================

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core Fields
    title TEXT NOT NULL,
    description TEXT,
    
    -- Status & Priority
    status task_status NOT NULL DEFAULT 'TODO',
    priority task_priority NOT NULL DEFAULT 'MEDIUM',
    
    -- Dates
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Ownership & Organization
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for tasks table
CREATE INDEX IF NOT EXISTS idx_tasks_organization ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_team ON tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- =====================================================
-- 3. TASK_ASSIGNMENTS TABLE (Many-to-Many)
-- =====================================================

CREATE TABLE IF NOT EXISTS task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Assignment
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Meta
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: One user per task (no duplicates)
    UNIQUE(task_id, user_id)
);

-- Indexes for task_assignments
CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user ON task_assignments(user_id);

-- =====================================================
-- 4. TASK_COMMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Comment
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for task_comments
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created ON task_comments(created_at);

-- =====================================================
-- 5. TASK_ATTACHMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Attachment
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    
    -- Meta
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for task_attachments
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON task_attachments(uploaded_by);

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6.1 TASKS POLICIES
-- =====================================================

-- Users can view tasks in their organization or assigned to them
CREATE POLICY "Users can view tasks in their organization"
    ON tasks FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
        OR
        id IN (
            SELECT task_id FROM task_assignments WHERE user_id = auth.uid()
        )
    );

-- Users can create tasks in their organization
CREATE POLICY "Users can create tasks"
    ON tasks FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Users can update tasks they created, are assigned to, or are admin
CREATE POLICY "Users can update their tasks"
    ON tasks FOR UPDATE
    USING (
        created_by = auth.uid()
        OR
        id IN (
            SELECT task_id FROM task_assignments WHERE user_id = auth.uid()
        )
        OR
        auth.uid() IN (
            SELECT id FROM users 
            WHERE organization_id = tasks.organization_id 
            AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
        )
    );

-- Users can delete tasks they created or are admin
CREATE POLICY "Users can delete their tasks"
    ON tasks FOR DELETE
    USING (
        created_by = auth.uid()
        OR
        auth.uid() IN (
            SELECT id FROM users 
            WHERE organization_id = tasks.organization_id 
            AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
        )
    );

-- =====================================================
-- 6.2 TASK_ASSIGNMENTS POLICIES
-- =====================================================

-- Users can view assignments for tasks they can see
CREATE POLICY "Users can view task assignments"
    ON task_assignments FOR SELECT
    USING (
        task_id IN (
            SELECT id FROM tasks WHERE 
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Task creators and admins can assign users
CREATE POLICY "Task creators can assign users"
    ON task_assignments FOR INSERT
    WITH CHECK (
        task_id IN (
            SELECT id FROM tasks WHERE created_by = auth.uid()
        )
        OR
        auth.uid() IN (
            SELECT u.id FROM users u
            JOIN tasks t ON t.organization_id = u.organization_id
            WHERE t.id = task_id AND u.role IN ('ADMIN', 'SUPERADMIN', 'HR')
        )
    );

-- Task creators and admins can remove assignments
CREATE POLICY "Task creators can remove assignments"
    ON task_assignments FOR DELETE
    USING (
        task_id IN (
            SELECT id FROM tasks WHERE created_by = auth.uid()
        )
        OR
        auth.uid() IN (
            SELECT u.id FROM users u
            JOIN tasks t ON t.organization_id = u.organization_id
            WHERE t.id = task_id AND u.role IN ('ADMIN', 'SUPERADMIN', 'HR')
        )
    );

-- =====================================================
-- 6.3 TASK_COMMENTS POLICIES
-- =====================================================

-- Users can view comments for tasks they can see
CREATE POLICY "Users can view task comments"
    ON task_comments FOR SELECT
    USING (
        task_id IN (
            SELECT id FROM tasks WHERE 
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
            OR
            id IN (
                SELECT task_id FROM task_assignments WHERE user_id = auth.uid()
            )
        )
    );

-- Users can add comments to tasks they can see
CREATE POLICY "Users can add task comments"
    ON task_comments FOR INSERT
    WITH CHECK (
        task_id IN (
            SELECT id FROM tasks WHERE 
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
            OR
            id IN (
                SELECT task_id FROM task_assignments WHERE user_id = auth.uid()
            )
        )
    );

-- Users can update their own comments
CREATE POLICY "Users can update their comments"
    ON task_comments FOR UPDATE
    USING (user_id = auth.uid());

-- Users can delete their own comments or admins can delete any
CREATE POLICY "Users can delete their comments"
    ON task_comments FOR DELETE
    USING (
        user_id = auth.uid()
        OR
        auth.uid() IN (
            SELECT u.id FROM users u
            JOIN tasks t ON t.organization_id = u.organization_id
            WHERE t.id = task_id AND u.role IN ('ADMIN', 'SUPERADMIN', 'HR')
        )
    );

-- =====================================================
-- 6.4 TASK_ATTACHMENTS POLICIES
-- =====================================================

-- Users can view attachments for tasks they can see
CREATE POLICY "Users can view task attachments"
    ON task_attachments FOR SELECT
    USING (
        task_id IN (
            SELECT id FROM tasks WHERE 
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
            OR
            id IN (
                SELECT task_id FROM task_assignments WHERE user_id = auth.uid()
            )
        )
    );

-- Task creators and assignees can add attachments
CREATE POLICY "Users can add task attachments"
    ON task_attachments FOR INSERT
    WITH CHECK (
        task_id IN (
            SELECT id FROM tasks WHERE created_by = auth.uid()
        )
        OR
        task_id IN (
            SELECT task_id FROM task_assignments WHERE user_id = auth.uid()
        )
    );

-- Uploader and admins can delete attachments
CREATE POLICY "Users can delete their attachments"
    ON task_attachments FOR DELETE
    USING (
        uploaded_by = auth.uid()
        OR
        auth.uid() IN (
            SELECT u.id FROM users u
            JOIN tasks t ON t.organization_id = u.organization_id
            WHERE t.id = task_id AND u.role IN ('ADMIN', 'SUPERADMIN', 'HR')
        )
    );

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Update tasks.updated_at on UPDATE
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON tasks;
CREATE TRIGGER trigger_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_tasks_updated_at();

-- Update task_comments.updated_at on UPDATE
DROP TRIGGER IF EXISTS trigger_task_comments_updated_at ON task_comments;
CREATE TRIGGER trigger_task_comments_updated_at
    BEFORE UPDATE ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_tasks_updated_at();

-- =====================================================
-- 8. GRANTS
-- =====================================================

-- Grant access to authenticated users
GRANT ALL ON tasks TO authenticated;
GRANT ALL ON task_assignments TO authenticated;
GRANT ALL ON task_comments TO authenticated;
GRANT ALL ON task_attachments TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add comment
COMMENT ON TABLE tasks IS 'Task management system - main tasks table';
COMMENT ON TABLE task_assignments IS 'Task assignments - many-to-many relationship between tasks and users';
COMMENT ON TABLE task_comments IS 'Comments on tasks';
COMMENT ON TABLE task_attachments IS 'File attachments for tasks';
