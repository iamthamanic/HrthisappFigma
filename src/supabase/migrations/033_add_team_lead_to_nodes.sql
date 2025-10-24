-- =====================================================
-- Migration: Add Team Lead to Org Nodes
-- =====================================================
-- Adds team_lead_id field for Department and Specialization nodes
-- Only users with role 'TEAMLEAD' can be assigned as team leads
-- =====================================================

-- Add team lead column to org_nodes table
ALTER TABLE org_nodes
ADD COLUMN IF NOT EXISTS team_lead_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_org_nodes_team_lead 
ON org_nodes(team_lead_id);

-- Add comment
COMMENT ON COLUMN org_nodes.team_lead_id IS 'Team Lead for Department/Specialization nodes (TEAMLEAD role required)';

-- =====================================================
-- Migration Complete
-- =====================================================
-- Run this migration in Supabase SQL Editor to add
-- team lead support to organigram nodes.
-- =====================================================
