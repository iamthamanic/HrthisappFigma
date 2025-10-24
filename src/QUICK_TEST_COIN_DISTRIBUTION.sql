-- ============================================
-- QUICK TEST: Coin Distribution (v3.9.2)
-- ============================================
-- Test Script für Coin Distribution Feature
-- ============================================

-- ============================================
-- TEST 1: Show All Users in Organization
-- ============================================

SELECT 
  id,
  name,
  email,
  role,
  organization_id,
  created_at
FROM users
WHERE organization_id IS NOT NULL
ORDER BY name;

-- Expected: Shows all users that can receive coins

-- ============================================
-- TEST 2: Check Coin Transactions Table
-- ============================================

SELECT 
  id,
  user_id,
  amount,
  type,
  description,
  transaction_type,
  created_by,
  created_at
FROM coin_transactions
ORDER BY created_at DESC
LIMIT 20;

-- Expected: Shows recent coin transactions

-- ============================================
-- TEST 3: Calculate Current Balances
-- ============================================

SELECT 
  u.id as user_id,
  u.name,
  u.email,
  COALESCE(SUM(
    CASE 
      WHEN ct.type = 'EARNED' THEN ct.amount
      WHEN ct.type = 'SPENT' THEN -ABS(ct.amount)
      ELSE 0
    END
  ), 0) as current_balance,
  COUNT(ct.id) as total_transactions
FROM users u
LEFT JOIN coin_transactions ct ON ct.user_id = u.id
WHERE u.organization_id IS NOT NULL
GROUP BY u.id, u.name, u.email
ORDER BY current_balance DESC;

-- Expected: Shows each user's current coin balance

-- ============================================
-- TEST 4: Show Admin Granted Coins
-- ============================================

SELECT 
  ct.id,
  u.name as recipient_name,
  u.email as recipient_email,
  ct.amount,
  ct.description as reason,
  admin.name as distributed_by,
  ct.created_at
FROM coin_transactions ct
JOIN users u ON u.id = ct.user_id
LEFT JOIN users admin ON admin.id = ct.created_by
WHERE ct.transaction_type = 'ADMIN_GRANT'
ORDER BY ct.created_at DESC
LIMIT 20;

-- Expected: Shows coins distributed by admins

-- ============================================
-- TEST 5: Simulate Single User Distribution
-- ============================================

-- ONLY RUN THIS IF YOU WANT TO TEST MANUALLY
-- Replace USER_ID and ADMIN_ID with real values

/*
INSERT INTO coin_transactions (
  user_id,
  amount,
  type,
  description,
  transaction_type,
  created_by
) VALUES (
  'USER_ID_HERE',  -- Replace with real user ID
  100,
  'EARNED',
  'Test: Manual coin distribution',
  'ADMIN_GRANT',
  'ADMIN_ID_HERE'  -- Replace with admin user ID
) RETURNING *;
*/

-- ============================================
-- TEST 6: Simulate All Users Distribution
-- ============================================

-- ONLY RUN THIS IF YOU WANT TO TEST MANUALLY
-- Replace ADMIN_ID and ORG_ID with real values

/*
WITH target_users AS (
  SELECT id FROM users 
  WHERE organization_id = 'ORG_ID_HERE'
)
INSERT INTO coin_transactions (
  user_id,
  amount,
  type,
  description,
  transaction_type,
  created_by
)
SELECT 
  id as user_id,
  50 as amount,
  'EARNED' as type,
  'Test: Bulk coin distribution' as description,
  'ADMIN_GRANT' as transaction_type,
  'ADMIN_ID_HERE' as created_by
FROM target_users
RETURNING *;
*/

-- ============================================
-- TEST 7: Distribution Statistics
-- ============================================

SELECT 
  transaction_type,
  COUNT(*) as transaction_count,
  SUM(amount) as total_coins_distributed,
  AVG(amount) as avg_coins_per_transaction,
  MIN(amount) as min_amount,
  MAX(amount) as max_amount,
  MIN(created_at) as first_distribution,
  MAX(created_at) as last_distribution
FROM coin_transactions
WHERE transaction_type = 'ADMIN_GRANT'
GROUP BY transaction_type;

-- Expected: Shows admin distribution statistics

-- ============================================
-- TEST 8: Top Recipients of Admin Coins
-- ============================================

SELECT 
  u.name,
  u.email,
  COUNT(ct.id) as times_received,
  SUM(ct.amount) as total_coins_received,
  MAX(ct.created_at) as last_received
FROM coin_transactions ct
JOIN users u ON u.id = ct.user_id
WHERE ct.transaction_type = 'ADMIN_GRANT'
GROUP BY u.id, u.name, u.email
ORDER BY total_coins_received DESC
LIMIT 10;

-- Expected: Shows users who received most admin coins

-- ============================================
-- TEST 9: Distribution Reasons Analysis
-- ============================================

SELECT 
  description as reason,
  COUNT(*) as times_used,
  SUM(amount) as total_coins,
  MAX(created_at) as last_used
FROM coin_transactions
WHERE transaction_type = 'ADMIN_GRANT'
GROUP BY description
ORDER BY times_used DESC
LIMIT 10;

-- Expected: Shows most common distribution reasons

-- ============================================
-- TEST 10: Verify RLS Access
-- ============================================

-- Check if current user is admin
SELECT 
  id,
  email,
  role,
  CASE 
    WHEN role IN ('ADMIN', 'HR', 'SUPERADMIN') THEN '✅ Can distribute coins'
    ELSE '❌ Cannot distribute coins'
  END as distribution_access
FROM users
WHERE id = auth.uid();

-- Expected: Shows your role and access level

-- ============================================
-- SUCCESS INDICATORS
-- ============================================

DO $$
DECLARE
  v_user_count INTEGER;
  v_transaction_count INTEGER;
  v_admin_grants INTEGER;
BEGIN
  -- Count users
  SELECT COUNT(*) INTO v_user_count 
  FROM users 
  WHERE organization_id IS NOT NULL;
  
  -- Count all transactions
  SELECT COUNT(*) INTO v_transaction_count 
  FROM coin_transactions;
  
  -- Count admin grants
  SELECT COUNT(*) INTO v_admin_grants 
  FROM coin_transactions 
  WHERE transaction_type = 'ADMIN_GRANT';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🧪 COIN DISTRIBUTION TEST RESULTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '👥 Total Users: %', v_user_count;
  RAISE NOTICE '💰 Total Transactions: %', v_transaction_count;
  RAISE NOTICE '🎁 Admin Distributions: %', v_admin_grants;
  RAISE NOTICE '';
  
  IF v_user_count > 0 THEN
    RAISE NOTICE '✅ Users exist - ready for distribution!';
  ELSE
    RAISE NOTICE '⚠️  No users found!';
  END IF;
  
  IF v_admin_grants > 0 THEN
    RAISE NOTICE '✅ Admin distributions detected!';
  ELSE
    RAISE NOTICE 'ℹ️  No admin distributions yet';
    RAISE NOTICE '   Test by using the "Coins verteilen" button';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TEST COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 NEXT: Navigate to /benefits → Verwaltung Tab';
  RAISE NOTICE '💰 Click "Coins verteilen" button';
  RAISE NOTICE '🎯 Test Single User distribution';
  RAISE NOTICE '🎯 Test All Users distribution';
  RAISE NOTICE '';
END $$;
