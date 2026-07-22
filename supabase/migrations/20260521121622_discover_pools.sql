-- ============================================================
-- PoolParty Discover Pools Migration
-- 20260521121622_discover_pools.sql
-- ============================================================

-- ============================================================
-- SECTION 1: TYPES
-- ============================================================

DROP TYPE IF EXISTS public.template_status CASCADE;
CREATE TYPE public.template_status AS ENUM ('draft', 'active', 'archived');

DROP TYPE IF EXISTS public.pool_type_enum CASCADE;
CREATE TYPE public.pool_type_enum AS ENUM ('prediction', 'challenge', 'agreement', 'group_pool', 'fantasy', 'bracket');

DROP TYPE IF EXISTS public.share_method_enum CASCADE;
CREATE TYPE public.share_method_enum AS ENUM ('sms', 'whatsapp', 'qr_code', 'copy_link', 'group', 'contact');

-- ============================================================
-- SECTION 2: CORE TABLES
-- ============================================================

-- Pool Template Categories
CREATE TABLE IF NOT EXISTS public.pool_template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎯',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Verified Resolution Sources
CREATE TABLE IF NOT EXISTS public.verified_resolution_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT,
  description TEXT,
  source_type TEXT NOT NULL DEFAULT 'official',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pool Templates
CREATE TABLE IF NOT EXISTS public.pool_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  category_id UUID REFERENCES public.pool_template_categories(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  resolution_source_id UUID REFERENCES public.verified_resolution_sources(id) ON DELETE SET NULL,
  cover_image TEXT,
  icon TEXT DEFAULT '🎯',
  pool_type public.pool_type_enum NOT NULL DEFAULT 'prediction',
  default_options JSONB DEFAULT '[]'::jsonb,
  resolution_rules TEXT,
  default_expiration TEXT DEFAULT '7 days',
  difficulty_score INT DEFAULT 1 CHECK (difficulty_score >= 1 AND difficulty_score <= 5),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_official BOOLEAN NOT NULL DEFAULT false,
  status public.template_status NOT NULL DEFAULT 'active',
  launch_count INT NOT NULL DEFAULT 0,
  participant_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pool Template Tags
CREATE TABLE IF NOT EXISTS public.pool_template_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.pool_templates(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pool Template Clones
CREATE TABLE IF NOT EXISTS public.pool_template_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.pool_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  pool_id UUID,
  title TEXT,
  custom_rules TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pool Template Views
CREATE TABLE IF NOT EXISTS public.pool_template_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.pool_templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pool Template Analytics
CREATE TABLE IF NOT EXISTS public.pool_template_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.pool_templates(id) ON DELETE CASCADE UNIQUE,
  views INT NOT NULL DEFAULT 0,
  clones INT NOT NULL DEFAULT 0,
  launches INT NOT NULL DEFAULT 0,
  invites INT NOT NULL DEFAULT 0,
  joins INT NOT NULL DEFAULT 0,
  completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  viral_coefficient NUMERIC(5,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pool Template Shares
CREATE TABLE IF NOT EXISTS public.pool_template_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.pool_templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  share_method public.share_method_enum NOT NULL DEFAULT 'copy_link',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Pool Recommendations
CREATE TABLE IF NOT EXISTS public.ai_pool_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.pool_templates(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  reason TEXT,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SECTION 3: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_pool_templates_category ON public.pool_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_pool_templates_status ON public.pool_templates(status);
CREATE INDEX IF NOT EXISTS idx_pool_templates_featured ON public.pool_templates(is_featured);
CREATE INDEX IF NOT EXISTS idx_pool_templates_official ON public.pool_templates(is_official);
CREATE INDEX IF NOT EXISTS idx_pool_templates_launch_count ON public.pool_templates(launch_count DESC);
CREATE INDEX IF NOT EXISTS idx_pool_template_tags_template ON public.pool_template_tags(template_id);
CREATE INDEX IF NOT EXISTS idx_pool_template_clones_user ON public.pool_template_clones(user_id);
CREATE INDEX IF NOT EXISTS idx_pool_template_clones_template ON public.pool_template_clones(template_id);
CREATE INDEX IF NOT EXISTS idx_pool_template_views_template ON public.pool_template_views(template_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON public.ai_pool_recommendations(user_id);

-- ============================================================
-- SECTION 4: FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_template_view(p_template_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.pool_template_views (template_id, user_id)
  VALUES (p_template_id, p_user_id);

  INSERT INTO public.pool_template_analytics (template_id, views)
  VALUES (p_template_id, 1)
  ON CONFLICT (template_id)
  DO UPDATE SET views = public.pool_template_analytics.views + 1, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_template_clone(p_template_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.pool_templates
  SET launch_count = launch_count + 1, updated_at = now()
  WHERE id = p_template_id;

  INSERT INTO public.pool_template_analytics (template_id, clones, launches)
  VALUES (p_template_id, 1, 1)
  ON CONFLICT (template_id)
  DO UPDATE SET
    clones = public.pool_template_analytics.clones + 1,
    launches = public.pool_template_analytics.launches + 1,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM auth.users au
  WHERE au.id = auth.uid()
  AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
)
$$;

-- ============================================================
-- SECTION 5: ENABLE RLS
-- ============================================================

ALTER TABLE public.pool_template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_resolution_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_template_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_template_clones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_template_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_template_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_template_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_pool_recommendations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECTION 6: RLS POLICIES
-- ============================================================

-- Categories: public read, admin write
DROP POLICY IF EXISTS "public_read_categories" ON public.pool_template_categories;
CREATE POLICY "public_read_categories" ON public.pool_template_categories
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "admin_manage_categories" ON public.pool_template_categories;
CREATE POLICY "admin_manage_categories" ON public.pool_template_categories
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- Resolution Sources: public read, admin write
DROP POLICY IF EXISTS "public_read_resolution_sources" ON public.verified_resolution_sources;
CREATE POLICY "public_read_resolution_sources" ON public.verified_resolution_sources
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "admin_manage_resolution_sources" ON public.verified_resolution_sources;
CREATE POLICY "admin_manage_resolution_sources" ON public.verified_resolution_sources
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- Templates: public read active, admin manage all
DROP POLICY IF EXISTS "public_read_active_templates" ON public.pool_templates;
CREATE POLICY "public_read_active_templates" ON public.pool_templates
FOR SELECT TO public USING (status = 'active');

DROP POLICY IF EXISTS "admin_manage_templates" ON public.pool_templates;
CREATE POLICY "admin_manage_templates" ON public.pool_templates
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- Tags: public read
DROP POLICY IF EXISTS "public_read_tags" ON public.pool_template_tags;
CREATE POLICY "public_read_tags" ON public.pool_template_tags
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "admin_manage_tags" ON public.pool_template_tags;
CREATE POLICY "admin_manage_tags" ON public.pool_template_tags
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- Clones: users manage own
DROP POLICY IF EXISTS "users_manage_own_clones" ON public.pool_template_clones;
CREATE POLICY "users_manage_own_clones" ON public.pool_template_clones
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_view_all_clones" ON public.pool_template_clones;
CREATE POLICY "admin_view_all_clones" ON public.pool_template_clones
FOR SELECT TO authenticated USING (public.is_admin_user());

-- Views: users insert own
DROP POLICY IF EXISTS "users_insert_views" ON public.pool_template_views;
CREATE POLICY "users_insert_views" ON public.pool_template_views
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_views" ON public.pool_template_views;
CREATE POLICY "admin_read_views" ON public.pool_template_views
FOR SELECT TO authenticated USING (public.is_admin_user());

-- Analytics: public read
DROP POLICY IF EXISTS "public_read_analytics" ON public.pool_template_analytics;
CREATE POLICY "public_read_analytics" ON public.pool_template_analytics
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "admin_manage_analytics" ON public.pool_template_analytics;
CREATE POLICY "admin_manage_analytics" ON public.pool_template_analytics
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- Shares: users manage own
DROP POLICY IF EXISTS "users_manage_own_shares" ON public.pool_template_shares;
CREATE POLICY "users_manage_own_shares" ON public.pool_template_shares
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "public_insert_shares" ON public.pool_template_shares;
CREATE POLICY "public_insert_shares" ON public.pool_template_shares
FOR INSERT TO public WITH CHECK (true);

-- AI Recommendations: users read own
DROP POLICY IF EXISTS "users_read_own_recommendations" ON public.ai_pool_recommendations;
CREATE POLICY "users_read_own_recommendations" ON public.ai_pool_recommendations
FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_recommendations" ON public.ai_pool_recommendations;
CREATE POLICY "admin_manage_recommendations" ON public.ai_pool_recommendations
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- ============================================================
-- SECTION 7: MOCK DATA
-- ============================================================

DO $$
DECLARE
  cat_sports UUID;
  cat_politics UUID;
  cat_crypto UUID;
  cat_stocks UUID;
  cat_entertainment UUID;
  cat_tv UUID;
  cat_challenges UUID;
  cat_fantasy UUID;
  cat_office UUID;
  cat_neighborhood UUID;
  cat_friends UUID;
  cat_custom UUID;
  src_nfl UUID;
  src_nba UUID;
  src_stocks UUID;
  src_crypto UUID;
  t1 UUID;
  t2 UUID;
  t3 UUID;
  t4 UUID;
  t5 UUID;
  t6 UUID;
  t7 UUID;
  t8 UUID;
BEGIN
  -- Categories
  INSERT INTO public.pool_template_categories (id, name, icon, sort_order) VALUES
    (gen_random_uuid(), 'Sports', '🏆', 1),
    (gen_random_uuid(), 'Politics', '🗳️', 2),
    (gen_random_uuid(), 'Crypto', '₿', 3),
    (gen_random_uuid(), 'Stocks', '📈', 4),
    (gen_random_uuid(), 'Entertainment', '🎬', 5),
    (gen_random_uuid(), 'TV Shows', '📺', 6),
    (gen_random_uuid(), 'Personal Challenges', '💪', 7),
    (gen_random_uuid(), 'Fantasy Sports', '🏅', 8),
    (gen_random_uuid(), 'Office Pools', '🏢', 9),
    (gen_random_uuid(), 'Neighborhood Pools', '🏘️', 10),
    (gen_random_uuid(), 'Friends & Family', '👨‍👩‍👧', 11),
    (gen_random_uuid(), 'Custom', '✨', 12)
  ON CONFLICT (id) DO NOTHING;

  SELECT id INTO cat_sports FROM public.pool_template_categories WHERE name = 'Sports' LIMIT 1;
  SELECT id INTO cat_crypto FROM public.pool_template_categories WHERE name = 'Crypto' LIMIT 1;
  SELECT id INTO cat_stocks FROM public.pool_template_categories WHERE name = 'Stocks' LIMIT 1;
  SELECT id INTO cat_entertainment FROM public.pool_template_categories WHERE name = 'Entertainment' LIMIT 1;
  SELECT id INTO cat_tv FROM public.pool_template_categories WHERE name = 'TV Shows' LIMIT 1;
  SELECT id INTO cat_challenges FROM public.pool_template_categories WHERE name = 'Personal Challenges' LIMIT 1;
  SELECT id INTO cat_fantasy FROM public.pool_template_categories WHERE name = 'Fantasy Sports' LIMIT 1;
  SELECT id INTO cat_office FROM public.pool_template_categories WHERE name = 'Office Pools' LIMIT 1;

  -- Verified Resolution Sources
  INSERT INTO public.verified_resolution_sources (id, name, url, description, source_type) VALUES
    (gen_random_uuid(), 'Official NFL Stats', 'https://www.nfl.com/stats', 'Official NFL game statistics and outcomes', 'official'),
    (gen_random_uuid(), 'Official NBA Stats', 'https://www.nba.com/stats', 'Official NBA game statistics and outcomes', 'official'),
    (gen_random_uuid(), 'Market Close Price', 'https://finance.yahoo.com', 'Official stock market closing prices', 'financial'),
    (gen_random_uuid(), 'Exchange Reference Price', 'https://coinmarketcap.com', 'Crypto exchange reference prices', 'financial')
  ON CONFLICT (id) DO NOTHING;

  SELECT id INTO src_nfl FROM public.verified_resolution_sources WHERE name = 'Official NFL Stats' LIMIT 1;
  SELECT id INTO src_nba FROM public.verified_resolution_sources WHERE name = 'Official NBA Stats' LIMIT 1;
  SELECT id INTO src_stocks FROM public.verified_resolution_sources WHERE name = 'Market Close Price' LIMIT 1;
  SELECT id INTO src_crypto FROM public.verified_resolution_sources WHERE name = 'Exchange Reference Price' LIMIT 1;

  -- Templates
  t1 := gen_random_uuid();
  t2 := gen_random_uuid();
  t3 := gen_random_uuid();
  t4 := gen_random_uuid();
  t5 := gen_random_uuid();
  t6 := gen_random_uuid();
  t7 := gen_random_uuid();
  t8 := gen_random_uuid();

  INSERT INTO public.pool_templates (id, title, subtitle, description, category_id, resolution_source_id, cover_image, icon, pool_type, default_options, resolution_rules, default_expiration, difficulty_score, is_featured, is_official, status, launch_count, participant_count) VALUES
    (t1, 'NFL Weekly Picks', 'Pick the winner of every NFL game this week', 'Classic NFL weekly prediction pool. Pick winners for all games and compete with friends for bragging rights.', cat_sports, src_nfl, 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800', '🏈', 'prediction', '["Home Team", "Away Team"]'::jsonb, 'Winner determined by official NFL game results', '7 days', 2, true, true, 'active', 4821, 32400),
    (t2, 'Super Bowl Champion', 'Who will win the Super Bowl?', 'The ultimate NFL prediction pool. Pick the Super Bowl champion before the season ends.', cat_sports, src_nfl, 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800', '🏆', 'prediction', '[]'::jsonb, 'Winner is the team that wins Super Bowl as reported by NFL.com', '180 days', 3, true, true, 'active', 3102, 18900),
    (t3, 'Bitcoin Price Prediction', 'Will BTC hit $100K this month?', 'Predict whether Bitcoin will reach a target price by the end of the month.', cat_crypto, src_crypto, 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800', '₿', 'prediction', '["Yes, it will hit $100K", "No, it will not"]'::jsonb, 'Resolved using CoinMarketCap closing price on expiration date', '30 days', 2, true, false, 'active', 2478, 14200),
    (t4, 'March Madness Bracket', 'Fill out your NCAA bracket', 'Complete bracket challenge for March Madness. Pick winners through all rounds.', cat_sports, src_nba, 'https://images.unsplash.com/photo-1546519638405-a9f9e8d5e7e5?w=800', '🏀', 'bracket', '[]'::jsonb, 'Results from official NCAA tournament bracket', '21 days', 4, true, true, 'active', 1987, 11600),
    (t5, 'Office Fantasy Draft', 'Annual office fantasy sports league', 'Classic office fantasy sports pool. Draft your team and compete all season.', cat_office, NULL, 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800', '🏢', 'fantasy', '[]'::jsonb, 'Points based on real player performance stats', '90 days', 3, false, false, 'active', 1543, 8900),
    (t6, 'Stock Market Challenge', 'Pick the best performing stock this quarter', 'Each player picks a stock. Highest return at quarter end wins.', cat_stocks, src_stocks, 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800', '📈', 'challenge', '[]'::jsonb, 'Resolved using Yahoo Finance closing price on last trading day of quarter', '90 days', 3, false, true, 'active', 1201, 7100),
    (t7, 'Reality TV Finale', 'Who will win the season finale?', 'Predict the winner of your favorite reality TV show before the finale airs.', cat_tv, NULL, 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800', '📺', 'prediction', '[]'::jsonb, 'Winner determined by official show announcement', '14 days', 1, false, false, 'active', 987, 5400),
    (t8, '30-Day Fitness Challenge', 'Who can hit their fitness goal first?', 'Group accountability challenge. Set your fitness goal and track progress together.', cat_challenges, NULL, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', '💪', 'challenge', '[]'::jsonb, 'Self-reported with group verification', '30 days', 2, false, false, 'active', 612, 2800)
  ON CONFLICT (id) DO NOTHING;

  -- Analytics for templates
  INSERT INTO public.pool_template_analytics (template_id, views, clones, launches, invites, joins, completion_rate, viral_coefficient) VALUES
    (t1, 24105, 4821, 4821, 28926, 32400, 87.5, 2.4),
    (t2, 15510, 3102, 3102, 18612, 18900, 91.2, 2.1),
    (t3, 12390, 2478, 2478, 14868, 14200, 78.3, 1.9),
    (t4, 9935, 1987, 1987, 11922, 11600, 83.7, 2.0),
    (t5, 7715, 1543, 1543, 9258, 8900, 76.4, 1.8),
    (t6, 6005, 1201, 1201, 7206, 7100, 82.1, 1.7),
    (t7, 4935, 987, 987, 5922, 5400, 71.8, 1.6),
    (t8, 3060, 612, 612, 3672, 2800, 68.5, 1.5)
  ON CONFLICT (template_id) DO NOTHING;

  -- Tags
  INSERT INTO public.pool_template_tags (template_id, tag) VALUES
    (t1, 'nfl'), (t1, 'football'), (t1, 'weekly'), (t1, 'sports'),
    (t2, 'nfl'), (t2, 'superbowl'), (t2, 'season'),
    (t3, 'bitcoin'), (t3, 'crypto'), (t3, 'btc'), (t3, 'prediction'),
    (t4, 'ncaa'), (t4, 'basketball'), (t4, 'bracket'), (t4, 'march-madness'),
    (t5, 'fantasy'), (t5, 'office'), (t5, 'season-long'),
    (t6, 'stocks'), (t6, 'investing'), (t6, 'quarterly'),
    (t7, 'tv'), (t7, 'reality'), (t7, 'entertainment'),
    (t8, 'fitness'), (t8, 'challenge'), (t8, 'accountability')
  ON CONFLICT (id) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;
