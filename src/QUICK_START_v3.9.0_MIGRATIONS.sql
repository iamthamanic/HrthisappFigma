-- ============================================
-- QUICK START v3.9.0 - ALL MIGRATIONS
-- ============================================
-- Copy/Paste dieses komplette File in Supabase SQL Editor
-- Führt alle 3 Migrationen aus:
-- - 049: Benefits System
-- - 050: Coin Shop Integration  
-- - 051: Coin Achievements System
-- ============================================

-- ============================================
-- MIGRATION 049: BENEFITS SYSTEM (v3.7.0)
-- ============================================

-- Check if benefits table already exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'benefits') THEN
    RAISE NOTICE '⚠️  Benefits table already exists! Skipping 049...';
  ELSE
    RAISE NOTICE '✅ Creating Benefits System...';
    
    -- Create benefits table
    CREATE TABLE benefits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      short_description TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('Health', 'Mobility', 'Finance', 'Food', 'Learning', 'Lifestyle', 'Work-Life')),
      icon TEXT NOT NULL,
      max_users INTEGER,
      current_users INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      value DECIMAL(10,2),
      eligibility_months INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_by UUID REFERENCES users(id)
    );

    CREATE INDEX idx_benefits_organization ON benefits(organization_id);
    CREATE INDEX idx_benefits_category ON benefits(category);
    CREATE INDEX idx_benefits_is_active ON benefits(is_active);

    -- Create user_benefits table
    CREATE TABLE user_benefits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      benefit_id UUID NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'ACTIVE', 'REJECTED', 'CANCELLED')),
      requested_at TIMESTAMPTZ DEFAULT NOW(),
      approved_at TIMESTAMPTZ,
      approved_by UUID REFERENCES users(id),
      rejection_reason TEXT,
      notes TEXT,
      admin_notes TEXT,
      valid_from DATE,
      valid_until DATE,
      UNIQUE(user_id, benefit_id)
    );

    CREATE INDEX idx_user_benefits_user ON user_benefits(user_id);
    CREATE INDEX idx_user_benefits_benefit ON user_benefits(benefit_id);
    CREATE INDEX idx_user_benefits_status ON user_benefits(status);

    -- Trigger: Update current_users counter
    CREATE OR REPLACE FUNCTION update_benefit_current_users()
    RETURNS TRIGGER AS $func$
    BEGIN
      IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
        UPDATE benefits 
        SET current_users = current_users + 1 
        WHERE id = NEW.benefit_id;
      ELSIF OLD.status = 'APPROVED' AND NEW.status != 'APPROVED' THEN
        UPDATE benefits 
        SET current_users = GREATEST(0, current_users - 1)
        WHERE id = NEW.benefit_id;
      END IF;
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    CREATE TRIGGER trigger_update_benefit_current_users
    AFTER INSERT OR UPDATE OF status ON user_benefits
    FOR EACH ROW
    EXECUTE FUNCTION update_benefit_current_users();

    -- Trigger: Auto-update timestamp
    CREATE OR REPLACE FUNCTION update_benefits_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    CREATE TRIGGER trigger_update_benefits_timestamp
    BEFORE UPDATE ON benefits
    FOR EACH ROW
    EXECUTE FUNCTION update_benefits_updated_at();

    -- RLS Policies
    ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_benefits ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view benefits in their organization"
    ON benefits FOR SELECT
    USING (
      organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
      AND is_active = true
    );

    CREATE POLICY "Only admins can create benefits"
    ON benefits FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND organization_id = benefits.organization_id
        AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
      )
    );

    CREATE POLICY "Only admins can update benefits"
    ON benefits FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND organization_id = benefits.organization_id
        AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
      )
    );

    CREATE POLICY "Only admins can delete benefits"
    ON benefits FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND organization_id = benefits.organization_id
        AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
      )
    );

    CREATE POLICY "Users can view their own benefits"
    ON user_benefits FOR SELECT
    USING (user_id = auth.uid());

    CREATE POLICY "Admins can view all benefits in their org"
    ON user_benefits FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
        AND organization_id IN (
          SELECT organization_id FROM users WHERE id = user_benefits.user_id
        )
      )
    );

    CREATE POLICY "Users can request benefits"
    ON user_benefits FOR INSERT
    WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can cancel their pending benefits"
    ON user_benefits FOR UPDATE
    USING (user_id = auth.uid() AND status = 'PENDING');

    CREATE POLICY "Admins can approve/reject benefits"
    ON user_benefits FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
        AND organization_id IN (
          SELECT organization_id FROM users WHERE id = user_benefits.user_id
        )
      )
    );

    CREATE POLICY "Admins can delete benefits"
    ON user_benefits FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
        AND organization_id IN (
          SELECT organization_id FROM users WHERE id = user_benefits.user_id
        )
      )
    );

    RAISE NOTICE '✅ Migration 049 complete!';
  END IF;
END $$;

-- ============================================
-- MIGRATION 050: COIN SHOP INTEGRATION (v3.8.0)
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'benefits' 
    AND column_name = 'coin_price'
  ) THEN
    RAISE NOTICE '⚠️  Coin Shop columns already exist! Skipping 050...';
  ELSE
    RAISE NOTICE '✅ Adding Coin Shop Integration...';

    -- Add columns to benefits
    ALTER TABLE benefits 
      ADD COLUMN IF NOT EXISTS coin_price INTEGER DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS purchase_type TEXT DEFAULT 'REQUEST_ONLY' 
        CHECK (purchase_type IN ('COINS_ONLY', 'REQUEST_ONLY', 'BOTH')),
      ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS instant_approval BOOLEAN DEFAULT false;

    -- Create coin_benefit_purchases table
    CREATE TABLE IF NOT EXISTS coin_benefit_purchases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      benefit_id UUID NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
      coin_amount INTEGER NOT NULL,
      coin_transaction_id UUID REFERENCES coin_transactions(id) ON DELETE SET NULL,
      user_benefit_id UUID REFERENCES user_benefits(id) ON DELETE CASCADE,
      purchased_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, benefit_id)
    );

    CREATE INDEX IF NOT EXISTS idx_coin_benefit_purchases_user ON coin_benefit_purchases(user_id);
    CREATE INDEX IF NOT EXISTS idx_coin_benefit_purchases_benefit ON coin_benefit_purchases(benefit_id);
    CREATE INDEX IF NOT EXISTS idx_coin_benefit_purchases_purchased_at ON coin_benefit_purchases(purchased_at DESC);

    -- RLS Policies
    ALTER TABLE coin_benefit_purchases ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view own purchases"
    ON coin_benefit_purchases FOR SELECT
    USING (user_id = auth.uid());

    CREATE POLICY "Admins can view all purchases in org"
    ON coin_benefit_purchases FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
        AND organization_id IN (
          SELECT organization_id FROM users WHERE id = coin_benefit_purchases.user_id
        )
      )
    );

    CREATE POLICY "System can create purchases"
    ON coin_benefit_purchases FOR INSERT
    WITH CHECK (true);

    -- Refund function
    CREATE OR REPLACE FUNCTION refund_coins_on_rejection()
    RETURNS TRIGGER AS $func$
    DECLARE
      v_purchase RECORD;
    BEGIN
      IF OLD.status != 'REJECTED' AND NEW.status = 'REJECTED' THEN
        SELECT * INTO v_purchase
        FROM coin_benefit_purchases
        WHERE user_benefit_id = NEW.id;
        
        IF FOUND THEN
          INSERT INTO coin_transactions (
            user_id,
            amount,
            reason,
            type,
            metadata
          ) VALUES (
            NEW.user_id,
            v_purchase.coin_amount,
            'Refund: Benefit abgelehnt - ' || (SELECT title FROM benefits WHERE id = NEW.benefit_id),
            'EARNED',
            jsonb_build_object(
              'refund', true,
              'original_purchase_id', v_purchase.id,
              'benefit_id', NEW.benefit_id
            )
          );
        END IF;
      END IF;
      
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_refund_coins_on_rejection ON user_benefits;
    CREATE TRIGGER trigger_refund_coins_on_rejection
    AFTER UPDATE OF status ON user_benefits
    FOR EACH ROW
    WHEN (NEW.status = 'REJECTED')
    EXECUTE FUNCTION refund_coins_on_rejection();

    RAISE NOTICE '✅ Migration 050 complete!';
  END IF;
END $$;

-- ============================================
-- MIGRATION 051: COIN ACHIEVEMENTS (v3.9.0)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coin_achievements') THEN
    RAISE NOTICE '⚠️  Coin Achievements already exist! Skipping 051...';
  ELSE
    RAISE NOTICE '✅ Creating Coin Achievements System...';

    -- Create coin_achievements table
    CREATE TABLE coin_achievements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'Trophy',
      required_coins INTEGER NOT NULL CHECK (required_coins > 0),
      unlock_type TEXT NOT NULL CHECK (unlock_type IN ('ACCESS', 'PRIVILEGE', 'BENEFIT', 'EVENT')),
      unlock_description TEXT,
      category TEXT NOT NULL DEFAULT 'MILESTONE' CHECK (category IN ('MILESTONE', 'EVENT', 'EXCLUSIVE', 'SEASONAL')),
      badge_color TEXT NOT NULL DEFAULT 'gold',
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_coin_achievements_active ON coin_achievements(is_active);
    CREATE INDEX idx_coin_achievements_required_coins ON coin_achievements(required_coins);
    CREATE INDEX idx_coin_achievements_category ON coin_achievements(category);

    -- Create user_coin_achievements table
    CREATE TABLE user_coin_achievements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      achievement_id UUID NOT NULL REFERENCES coin_achievements(id) ON DELETE CASCADE,
      unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      coins_at_unlock INTEGER NOT NULL,
      is_claimed BOOLEAN NOT NULL DEFAULT false,
      claimed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(user_id, achievement_id)
    );

    CREATE INDEX idx_user_coin_achievements_user ON user_coin_achievements(user_id);
    CREATE INDEX idx_user_coin_achievements_achievement ON user_coin_achievements(achievement_id);
    CREATE INDEX idx_user_coin_achievements_unlocked ON user_coin_achievements(unlocked_at);

    -- RLS Policies
    ALTER TABLE coin_achievements ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_coin_achievements ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Anyone can view active coin achievements"
      ON coin_achievements FOR SELECT
      USING (is_active = true);

    CREATE POLICY "Admin can manage coin achievements"
      ON coin_achievements FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('ADMIN', 'HR', 'SUPERADMIN')
        )
      );

    CREATE POLICY "Users can view own unlocked achievements"
      ON user_coin_achievements FOR SELECT
      USING (user_id = auth.uid());

    CREATE POLICY "System can insert unlocked achievements"
      ON user_coin_achievements FOR INSERT
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can update own achievements"
      ON user_coin_achievements FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- Auto-update timestamp
    CREATE OR REPLACE FUNCTION update_coin_achievements_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    CREATE TRIGGER set_coin_achievements_updated_at
      BEFORE UPDATE ON coin_achievements
      FOR EACH ROW
      EXECUTE FUNCTION update_coin_achievements_updated_at();

    -- Check & unlock function
    CREATE OR REPLACE FUNCTION check_and_unlock_coin_achievements(p_user_id UUID)
    RETURNS TABLE(
      achievement_id UUID,
      title TEXT,
      required_coins INTEGER,
      newly_unlocked BOOLEAN
    ) AS $func$
    DECLARE
      v_current_balance INTEGER;
    BEGIN
      SELECT COALESCE(SUM(
        CASE 
          WHEN type = 'EARNED' THEN amount
          WHEN type = 'SPENT' THEN -ABS(amount)
          ELSE 0
        END
      ), 0)
      INTO v_current_balance
      FROM coin_transactions
      WHERE user_id = p_user_id;

      RETURN QUERY
      WITH eligible_achievements AS (
        SELECT 
          ca.id,
          ca.title,
          ca.required_coins,
          CASE 
            WHEN uca.id IS NULL THEN true
            ELSE false
          END as is_new_unlock
        FROM coin_achievements ca
        LEFT JOIN user_coin_achievements uca 
          ON ca.id = uca.achievement_id AND uca.user_id = p_user_id
        WHERE ca.is_active = true
          AND ca.required_coins <= v_current_balance
          AND uca.id IS NULL
      )
      INSERT INTO user_coin_achievements (user_id, achievement_id, coins_at_unlock)
      SELECT 
        p_user_id,
        ea.id,
        v_current_balance
      FROM eligible_achievements ea
      WHERE ea.is_new_unlock = true
      RETURNING 
        achievement_id,
        (SELECT title FROM coin_achievements WHERE id = achievement_id),
        (SELECT required_coins FROM coin_achievements WHERE id = achievement_id),
        true as newly_unlocked;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Get achievements with progress
    CREATE OR REPLACE FUNCTION get_coin_achievements_with_progress(p_user_id UUID)
    RETURNS TABLE(
      id UUID,
      title TEXT,
      description TEXT,
      icon TEXT,
      required_coins INTEGER,
      unlock_type TEXT,
      unlock_description TEXT,
      category TEXT,
      badge_color TEXT,
      sort_order INTEGER,
      is_unlocked BOOLEAN,
      unlocked_at TIMESTAMPTZ,
      coins_at_unlock INTEGER,
      is_claimed BOOLEAN,
      claimed_at TIMESTAMPTZ,
      current_balance INTEGER,
      progress_percentage INTEGER
    ) AS $func$
    DECLARE
      v_current_balance INTEGER;
    BEGIN
      SELECT COALESCE(SUM(
        CASE 
          WHEN type = 'EARNED' THEN amount
          WHEN type = 'SPENT' THEN -ABS(amount)
          ELSE 0
        END
      ), 0)
      INTO v_current_balance
      FROM coin_transactions
      WHERE user_id = p_user_id;

      RETURN QUERY
      SELECT 
        ca.id,
        ca.title,
        ca.description,
        ca.icon,
        ca.required_coins,
        ca.unlock_type,
        ca.unlock_description,
        ca.category,
        ca.badge_color,
        ca.sort_order,
        CASE WHEN uca.id IS NOT NULL THEN true ELSE false END as is_unlocked,
        uca.unlocked_at,
        uca.coins_at_unlock,
        COALESCE(uca.is_claimed, false) as is_claimed,
        uca.claimed_at,
        v_current_balance as current_balance,
        LEAST(100, (v_current_balance * 100 / ca.required_coins)) as progress_percentage
      FROM coin_achievements ca
      LEFT JOIN user_coin_achievements uca 
        ON ca.id = uca.achievement_id AND uca.user_id = p_user_id
      WHERE ca.is_active = true
      ORDER BY ca.sort_order ASC, ca.required_coins ASC;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;

    -- View with details (FIXED: CONCAT instead of full_name)
    CREATE OR REPLACE VIEW user_coin_achievements_with_details AS
    SELECT 
      uca.id,
      uca.user_id,
      uca.achievement_id,
      ca.title,
      ca.description,
      ca.icon,
      ca.required_coins,
      ca.unlock_type,
      ca.unlock_description,
      ca.category,
      ca.badge_color,
      uca.unlocked_at,
      uca.coins_at_unlock,
      uca.is_claimed,
      uca.claimed_at,
      CONCAT(u.first_name, ' ', u.last_name) as user_name,
      u.email as user_email
    FROM user_coin_achievements uca
    JOIN coin_achievements ca ON uca.achievement_id = ca.id
    JOIN users u ON uca.user_id = u.id
    ORDER BY uca.unlocked_at DESC;

    -- Insert demo achievements
    INSERT INTO coin_achievements (title, description, icon, required_coins, unlock_type, unlock_description, category, badge_color, sort_order)
    VALUES
      ('Coin Starter', 'Erreiche 100 Coins auf deinem Konto', 'Trophy', 100, 'PRIVILEGE', 'Gratulation! Du hast deine ersten 100 Coins gesammelt.', 'MILESTONE', 'bronze', 1),
      ('Coin Sammler', 'Erreiche 500 Coins auf deinem Konto', 'Award', 500, 'PRIVILEGE', 'Toll gemacht! 500 Coins sind eine beachtliche Leistung.', 'MILESTONE', 'silver', 2),
      ('Coin Master', 'Erreiche 1.000 Coins auf deinem Konto', 'Medal', 1000, 'PRIVILEGE', 'Beeindruckend! Du gehörst zur Elite der Coin-Sammler.', 'MILESTONE', 'gold', 3),
      ('Firmenreise Qualifikation', 'Qualifiziere dich für die jährliche Firmenreise', 'Plane', 2500, 'EVENT', 'Du hast dich für die Teilnahme an der Firmenreise qualifiziert! Details folgen per E-Mail.', 'EVENT', 'platinum', 10),
      ('Premium Lunch Club', 'Zugang zum exklusiven Premium Lunch Programm', 'Utensils', 1500, 'ACCESS', 'Erhalte Zugang zu Premium-Restaurants im Lunch-Programm.', 'EXCLUSIVE', 'gold', 11),
      ('Home Office Elite', 'Erweiterte Home Office Ausstattung verfügbar', 'Home', 2000, 'BENEFIT', 'Zugang zu Premium Home Office Equipment und Möbeln.', 'EXCLUSIVE', 'gold', 12),
      ('Coin Legend', 'Erreiche 5.000 Coins - Eine legendäre Leistung!', 'Crown', 5000, 'PRIVILEGE', 'Du bist eine Legende! Nur wenige erreichen dieses Level.', 'MILESTONE', 'platinum', 20)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Migration 051 complete!';
  END IF;
END $$;

-- ============================================
-- FINAL SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '🎉 ALL MIGRATIONS COMPLETE!';
  RAISE NOTICE '✅ Benefits System (v3.7.0)';
  RAISE NOTICE '✅ Coin Shop Integration (v3.8.0)';
  RAISE NOTICE '✅ Coin Achievements System (v3.9.0)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Created:';
  RAISE NOTICE '   - benefits table';
  RAISE NOTICE '   - user_benefits table';
  RAISE NOTICE '   - coin_benefit_purchases table';
  RAISE NOTICE '   - coin_achievements table';
  RAISE NOTICE '   - user_coin_achievements table';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next: Hard Refresh (Cmd/Ctrl + Shift + R) und navigate zu /benefits!';
END $$;
