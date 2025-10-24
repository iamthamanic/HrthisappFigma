# SQL Migrations

## How to Run

1. Supabase Dashboard → SQL Editor
2. New Query
3. Copy SQL file content
4. Paste & Run

## Migrations

```
001_initial_schema.sql
002_storage_setup.sql
003_auto_user_profile_v3.sql
004_disable_email_confirmation.sql
005_fix_rls_infinite_recursion.sql
006_fix_rls_recursion_FINAL.sql
007_DISABLE_RLS_users.sql
008_rewards_system.sql
009_quiz_content.sql
010_achievements_system.sql
011_avatar_emoji_fields.sql
012_activity_feed.sql
013_fix_achievements_schema.sql
014_COMPLETE_ACHIEVEMENTS_SETUP.sql
015_add_profile_picture.sql
016_multitenancy_organizations.sql
017_remove_demo_quizzes.sql
018_COMPLETE_MISSING_TABLES.sql
019_auto_assign_default_org.sql
020_add_is_default_to_orgs.sql
021_ensure_profile_picture_column.sql
022_add_locations.sql
023_remove_profile_picture_index.sql
024_add_departments.sql
026_user_notes.sql
027_saved_searches.sql
028_add_hr_teamlead_roles.sql
029_add_break_fields.sql
030_departments_organigram_hierarchy.sql
031_canva_style_organigram.sql ← Canvas Editor
999_COMPLETE_SETUP_V4.sql ← Full Setup
```

## Canvas Organigram Error Fix

**Error:** `Could not find the table 'public.org_nodes'`

**Fix:**
1. Open `/supabase/migrations/031_canva_style_organigram.sql`
2. Copy complete SQL code
3. Run in Supabase SQL Editor
4. Reload page
