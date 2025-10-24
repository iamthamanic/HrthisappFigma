-- ============================================
-- HRthis: Add is_default Column to Organizations
-- For Single-Tenant mode: marks the default organization
-- ============================================

-- Add is_default column
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_is_default ON organizations(is_default);

-- Create unique constraint: only one organization can be default
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_single_default 
ON organizations(is_default) 
WHERE is_default = TRUE;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ MIGRATION 020: ADD IS_DEFAULT COLUMN';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Added to organizations table:';
  RAISE NOTICE '  ✅ is_default BOOLEAN column';
  RAISE NOTICE '  ✅ Index for faster lookups';
  RAISE NOTICE '  ✅ Unique constraint (only one default org)';
  RAISE NOTICE '';
  RAISE NOTICE 'Perfect for Single-Tenant setups! 🎉';
  RAISE NOTICE '';
END $$;

COMMENT ON COLUMN organizations.is_default IS 
'Marks the default organization for single-tenant deployments. 
Only one organization can have is_default = TRUE.';
