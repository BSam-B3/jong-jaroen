-- ============================================================
-- Jong Jaroen (จงเจริญ) - SQL Migration
-- Module 08: KYC & Unified Profile + Skill Tags
-- Module 10: Messages (In-App Chat) + Jobs lat/lng
-- Module 11: Lucky Coupon System (Digital Angpao)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. ALTER TABLE profiles (safe idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bio') THEN
    ALTER TABLE profiles ADD COLUMN bio TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='skills') THEN
    ALTER TABLE profiles ADD COLUMN skills TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='kyc_status') THEN
    ALTER TABLE profiles ADD COLUMN kyc_status TEXT DEFAULT 'none';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_verified') THEN
    ALTER TABLE profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='id_card_url') THEN
    ALTER TABLE profiles ADD COLUMN id_card_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='selfie_with_id_url') THEN
    ALTER TABLE profiles ADD COLUMN selfie_with_id_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bank_account_number') THEN
    ALTER TABLE profiles ADD COLUMN bank_account_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bank_name') THEN
    ALTER TABLE profiles ADD COLUMN bank_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='spending_total') THEN
    ALTER TABLE profiles ADD COLUMN spending_total NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='earning_total') THEN
    ALTER TABLE profiles ADD COLUMN earning_total NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avg_rating') THEN
    ALTER TABLE profiles ADD COLUMN avg_rating NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='total_jobs') THEN
    ALTER TABLE profiles ADD COLUMN total_jobs INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='mode') THEN
    ALTER TABLE profiles ADD COLUMN mode TEXT DEFAULT 'customer';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='lottery_count_this_month') THEN
    ALTER TABLE profiles ADD COLUMN lottery_count_this_month INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'customer';
  END IF;
END $$;

-- 2. ALTER TABLE jobs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='lat') THEN
    ALTER TABLE jobs ADD COLUMN lat DOUBLE PRECISION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='lng') THEN
    ALTER TABLE jobs ADD COLUMN lng DOUBLE PRECISION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='address_label') THEN
    ALTER TABLE jobs ADD COLUMN address_label TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='freelancer_id') THEN
    ALTER TABLE jobs ADD COLUMN freelancer_id UUID REFERENCES profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='base_price') THEN
    ALTER TABLE jobs ADD COLUMN base_price NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='customer_id') THEN
    ALTER TABLE jobs ADD COLUMN customer_id UUID REFERENCES profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='title') THEN
    ALTER TABLE jobs ADD COLUMN title TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='description') THEN
    ALTER TABLE jobs ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='status') THEN
    ALTER TABLE jobs ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='category') THEN
    ALTER TABLE jobs ADD COLUMN category TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='image_urls') THEN
    ALTER TABLE jobs ADD COLUMN image_urls TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- 3. CREATE TABLE messages (Real-time In-App Chat per job)
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES profiles(id),
  content     TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_job_created ON messages(job_id, created_at DESC);

-- 4. CREATE TABLE lucky_coupons (Digital Angpao)
-- One ticket per user per draw_period. Lucky number unique per period.
CREATE TABLE IF NOT EXISTS lucky_coupons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id),
  draw_period   TEXT NOT NULL,
  lucky_number  CHAR(6) NOT NULL,
  earned_as     TEXT NOT NULL CHECK (earned_as IN ('customer','freelancer')),
  milestone_thb NUMERIC NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_coupon_user_period   UNIQUE (user_id, draw_period),
  CONSTRAINT uq_lucky_number_period  UNIQUE (lucky_number, draw_period)
);
CREATE INDEX IF NOT EXISTS idx_coupons_user_period ON lucky_coupons(user_id, draw_period DESC);
CREATE INDEX IF NOT EXISTS idx_coupons_period_active ON lucky_coupons(draw_period, is_active);

-- 5. CREATE TABLE notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id),
  title       TEXT NOT NULL,
  body        TEXT,
  type        TEXT DEFAULT 'info',
  is_read     BOOLEAN DEFAULT FALSE,
  job_id      UUID REFERENCES jobs(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- 6. ROW LEVEL SECURITY
ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop old policies if exist (safe)
DROP POLICY IF EXISTS "messages_job_participants" ON messages;
DROP POLICY IF EXISTS "coupons_own_only" ON lucky_coupons;
DROP POLICY IF EXISTS "coupons_admin_all" ON lucky_coupons;
DROP POLICY IF EXISTS "notifications_own" ON notifications;

-- messages: only customer + freelancer of that job can access
CREATE POLICY "messages_job_participants" ON messages
  FOR ALL USING (
    auth.uid() IN (
      SELECT customer_id FROM jobs WHERE id = job_id
      UNION
      SELECT freelancer_id FROM jobs WHERE id = job_id
    )
  );

-- coupons: user sees own only (last 2 periods shown in app logic)
CREATE POLICY "coupons_own_only" ON lucky_coupons
  FOR SELECT USING (auth.uid() = user_id);

-- Admin sees all coupons
CREATE POLICY "coupons_admin_all" ON lucky_coupons
  FOR ALL USING (auth.jwt()->>'email' = 'surapong3331@gmail.com');

-- notifications: own only
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- 7. Public profile view (hides KYC sensitive data)
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
  SELECT id, full_name, location, bio, skills,
         is_verified, avg_rating, total_jobs, mode, kyc_status
  FROM profiles;
GRANT SELECT ON public_profiles TO anon, authenticated;

-- 8. FUNCTION: generate_lucky_number
CREATE OR REPLACE FUNCTION generate_lucky_number(p_period TEXT)
RETURNS CHAR(6) LANGUAGE plpgsql AS $$
DECLARE
  v_num  CHAR(6);
  v_exists BOOLEAN;
  v_tries  INT := 0;
BEGIN
  LOOP
    v_num := LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM lucky_coupons WHERE lucky_number=v_num AND draw_period=p_period) INTO v_exists;
    EXIT WHEN NOT v_exists;
    v_tries := v_tries + 1;
    IF v_tries > 1000 THEN RAISE EXCEPTION 'Cannot generate unique lucky number'; END IF;
  END LOOP;
  RETURN v_num;
END;
$$;

-- 9. FUNCTION: award_coupon_if_eligible
-- Call after job completion. Returns JSON {awarded, lucky_number, expires_at, period}
CREATE OR REPLACE FUNCTION award_coupon_if_eligible(
  p_user_id UUID, p_role TEXT, p_amount NUMERIC
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_prof     RECORD;
  v_period   TEXT;
  v_expires  TIMESTAMPTZ;
  v_num      CHAR(6);
  v_coupon   RECORD;
  v_total    NUMERIC;
  v_thresh   NUMERIC;
BEGIN
  v_period  := TO_CHAR(NOW() AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM');
  -- Expires last day of month at 16:00 Bangkok
  v_expires := (DATE_TRUNC('month', NOW() AT TIME ZONE 'Asia/Bangkok') + INTERVAL '1 month' - INTERVAL '1 day')::DATE
               + INTERVAL '16 hours' - INTERVAL '7 hours'; -- convert to UTC

  SELECT * INTO v_prof FROM profiles WHERE id = p_user_id;

  IF p_role = 'customer' THEN
    v_total  := COALESCE(v_prof.spending_total, 0) + p_amount;
    v_thresh := 3000;
    UPDATE profiles SET spending_total = v_total WHERE id = p_user_id;
  ELSE
    v_total  := COALESCE(v_prof.earning_total, 0) + p_amount;
    v_thresh := 5000;
    UPDATE profiles SET earning_total = v_total WHERE id = p_user_id;
  END IF;

  IF v_total >= v_thresh THEN
    SELECT * INTO v_coupon FROM lucky_coupons WHERE user_id=p_user_id AND draw_period=v_period;
    IF v_coupon IS NULL THEN
      v_num := generate_lucky_number(v_period);
      INSERT INTO lucky_coupons(user_id,draw_period,lucky_number,earned_as,milestone_thb,expires_at,is_active)
      VALUES (p_user_id,v_period,v_num,p_role,v_total,v_expires,TRUE);
      UPDATE profiles SET lottery_count_this_month = lottery_count_this_month + 1 WHERE id = p_user_id;
      RETURN jsonb_build_object('awarded',TRUE,'lucky_number',v_num,'expires_at',v_expires,'period',v_period);
    END IF;
  END IF;
  RETURN jsonb_build_object('awarded',FALSE);
END;
$$;

-- 10. FUNCTION: auto_hide_expired_coupons (call via cron or pg_cron)
CREATE OR REPLACE FUNCTION auto_hide_expired_coupons()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE lucky_coupons SET is_active=FALSE WHERE expires_at < NOW() AND is_active=TRUE;
END;
$$;
-- pg_cron schedule (uncomment after enabling pg_cron extension):
-- SELECT cron.schedule('hide-expired-coupons','0 * * * *',$$SELECT auto_hide_expired_coupons()$$);

-- 11. GRANT permissions
GRANT ALL ON messages TO authenticated;
GRANT SELECT, INSERT ON lucky_coupons TO authenticated;
GRANT SELECT ON notifications TO authenticated;
GRANT INSERT ON notifications TO authenticated;
GRANT UPDATE (is_read) ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION award_coupon_if_eligible TO authenticated;
GRANT EXECUTE ON FUNCTION generate_lucky_number TO authenticated;

-- ============================================================
-- DONE! Next steps:
-- 1. In Supabase Dashboard > Database > Replication:
--    Enable Realtime for 'messages' and 'notifications' tables
-- 2. In Storage: create bucket 'job-images', set KYC folder private
-- 3. Enable pg_cron extension and add cron job for auto-hide
-- 4. Add GOOGLE_MAPS_API_KEY to Vercel env vars
-- ============================================================
