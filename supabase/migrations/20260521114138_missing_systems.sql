-- ============================================================
-- PoolParty Missing Systems Migration
-- 20260521114138_missing_systems.sql
-- ============================================================

-- ============================================================
-- SECTION 1: ENUMS / TYPES
-- ============================================================

DROP TYPE IF EXISTS public.reputation_level CASCADE;
CREATE TYPE public.reputation_level AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend');

DROP TYPE IF EXISTS public.dispute_status CASCADE;
CREATE TYPE public.dispute_status AS ENUM ('open', 'under_review', 'resolved', 'appealed', 'closed');

DROP TYPE IF EXISTS public.dispute_resolution CASCADE;
CREATE TYPE public.dispute_resolution AS ENUM ('upheld', 'dismissed', 'split', 'escalated');

DROP TYPE IF EXISTS public.season_status CASCADE;
CREATE TYPE public.season_status AS ENUM ('upcoming', 'active', 'ended');

DROP TYPE IF EXISTS public.trust_rel_type CASCADE;
CREATE TYPE public.trust_rel_type AS ENUM ('endorsed', 'flagged', 'neutral', 'blocked');

DROP TYPE IF EXISTS public.audit_action CASCADE;
CREATE TYPE public.audit_action AS ENUM (
  'invite_sent', 'invite_accepted', 'invite_rejected',
  'otp_requested', 'otp_verified', 'otp_failed',
  'login', 'logout', 'signup',
  'pool_created', 'pool_joined', 'pool_resolved',
  'dispute_opened', 'dispute_resolved',
  'rate_limit_hit', 'abuse_flag'
);

-- ============================================================
-- SECTION 2: CORE TABLES (no foreign keys to new tables)
-- ============================================================

-- user_profiles (base table - may already exist, safe with IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SECTION 3: REPUTATION ENGINE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.accountability_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  accountability_score NUMERIC(5,2) NOT NULL DEFAULT 50.0,
  response_rate NUMERIC(5,2) NOT NULL DEFAULT 100.0,
  ghost_rate NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  would_participate_again_pct NUMERIC(5,2) NOT NULL DEFAULT 100.0,
  reputation_level public.reputation_level NOT NULL DEFAULT 'bronze',
  total_contracts INTEGER NOT NULL DEFAULT 0,
  completed_contracts INTEGER NOT NULL DEFAULT 0,
  disputed_contracts INTEGER NOT NULL DEFAULT 0,
  on_time_settlements INTEGER NOT NULL DEFAULT 0,
  late_settlements INTEGER NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_accountability_user UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.social_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  endorsed_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  note TEXT,
  weight NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_endorsement UNIQUE (endorser_id, endorsed_id, category),
  CONSTRAINT no_self_endorse CHECK (endorser_id <> endorsed_id)
);

CREATE TABLE IF NOT EXISTS public.reliability_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_description TEXT,
  score_delta NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  score_after NUMERIC(5,2) NOT NULL DEFAULT 50.0,
  reference_id UUID,
  reference_type TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.would_participate_again (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  rated_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  pool_id UUID,
  rating BOOLEAN NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_wpa_rating UNIQUE (rater_id, rated_id, pool_id),
  CONSTRAINT no_self_rate CHECK (rater_id <> rated_id)
);

-- ============================================================
-- SECTION 4: TRUST GRAPH SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trust_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  relationship_type public.trust_rel_type NOT NULL DEFAULT 'neutral',
  trust_score NUMERIC(5,2) NOT NULL DEFAULT 50.0,
  interaction_count INTEGER NOT NULL DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_trust_rel UNIQUE (from_user_id, to_user_id),
  CONSTRAINT no_self_trust CHECK (from_user_id <> to_user_id)
);

CREATE TABLE IF NOT EXISTS public.trust_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  edge_weight NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  edge_type TEXT NOT NULL DEFAULT 'co_pool',
  shared_pools INTEGER NOT NULL DEFAULT 0,
  shared_wins INTEGER NOT NULL DEFAULT 0,
  cluster_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_graph_edge UNIQUE (from_user_id, to_user_id, edge_type)
);

CREATE TABLE IF NOT EXISTS public.trust_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_name TEXT NOT NULL,
  cluster_key TEXT NOT NULL UNIQUE,
  member_count INTEGER NOT NULL DEFAULT 0,
  avg_trust_score NUMERIC(5,2) NOT NULL DEFAULT 50.0,
  cohesion_score NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trust_cluster_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES public.trust_clusters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  centrality_score NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_cluster_member UNIQUE (cluster_id, user_id)
);

-- ============================================================
-- SECTION 5: DISPUTE PLATFORM
-- ============================================================

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID,
  contract_id UUID,
  opened_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  against_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  moderator_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  dispute_status public.dispute_status NOT NULL DEFAULT 'open',
  resolution public.dispute_resolution,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  appeal_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dispute_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_moderator_note BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dispute_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  vote_for_opener BOOLEAN NOT NULL,
  trust_weight NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_dispute_vote UNIQUE (dispute_id, voter_id)
);

CREATE TABLE IF NOT EXISTS public.dispute_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  appellant_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  appeal_reason TEXT NOT NULL,
  new_evidence TEXT,
  appeal_status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SECTION 6: SEASONS ENGINE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_name TEXT NOT NULL,
  season_number INTEGER NOT NULL,
  season_status public.season_status NOT NULL DEFAULT 'upcoming',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_season_number UNIQUE (season_number)
);

CREATE TABLE IF NOT EXISTS public.seasonal_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  rank_position INTEGER,
  season_points INTEGER NOT NULL DEFAULT 0,
  pools_won INTEGER NOT NULL DEFAULT 0,
  pools_entered INTEGER NOT NULL DEFAULT 0,
  total_wagered NUMERIC(12,2) NOT NULL DEFAULT 0.0,
  total_won NUMERIC(12,2) NOT NULL DEFAULT 0.0,
  streak_best INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_seasonal_ranking UNIQUE (season_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.seasonal_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key TEXT NOT NULL UNIQUE,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT NOT NULL DEFAULT '🏅',
  badge_tier TEXT NOT NULL DEFAULT 'common',
  season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL,
  criteria JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.seasonal_badges(id) ON DELETE CASCADE,
  season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id, season_id)
);

CREATE TABLE IF NOT EXISTS public.trophies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trophy_key TEXT NOT NULL UNIQUE,
  trophy_name TEXT NOT NULL,
  trophy_description TEXT,
  trophy_icon TEXT NOT NULL DEFAULT '🏆',
  rarity TEXT NOT NULL DEFAULT 'common',
  season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_trophies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  trophy_id UUID NOT NULL REFERENCES public.trophies(id) ON DELETE CASCADE,
  season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_trophy UNIQUE (user_id, trophy_id, season_id)
);

-- ============================================================
-- SECTION 7: CREATOR PLATFORM
-- ============================================================

CREATE TABLE IF NOT EXISTS public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  tagline TEXT,
  cover_image_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  follower_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  public_pool_count INTEGER NOT NULL DEFAULT 0,
  total_participants INTEGER NOT NULL DEFAULT 0,
  creator_score NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  social_links JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_creator_user UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.creator_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_creator_follow UNIQUE (follower_id, creator_id)
);

CREATE TABLE IF NOT EXISTS public.creator_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  period_date DATE NOT NULL,
  new_followers INTEGER NOT NULL DEFAULT 0,
  pool_views INTEGER NOT NULL DEFAULT 0,
  pool_joins INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  revenue NUMERIC(12,2) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_creator_analytics UNIQUE (creator_id, period_date)
);

-- ============================================================
-- SECTION 8: SECURITY / AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  action public.audit_action NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  severity TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action_type TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour'),
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invite_abuse_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  invite_code TEXT,
  ip_address INET,
  phone TEXT,
  abuse_type TEXT NOT NULL,
  flagged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.otp_throttle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  ip_address INET,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_otp_phone UNIQUE (phone)
);

-- ============================================================
-- SECTION 9: ANALYTICS EXPANSION
-- ============================================================

CREATE TABLE IF NOT EXISTS public.retention_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_week DATE NOT NULL,
  cohort_size INTEGER NOT NULL DEFAULT 0,
  d1_retained INTEGER NOT NULL DEFAULT 0,
  d7_retained INTEGER NOT NULL DEFAULT 0,
  d30_retained INTEGER NOT NULL DEFAULT 0,
  d60_retained INTEGER NOT NULL DEFAULT 0,
  d90_retained INTEGER NOT NULL DEFAULT 0,
  d1_rate NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN cohort_size > 0 THEN ROUND((d1_retained::NUMERIC / cohort_size) * 100, 2) ELSE 0 END
  ) STORED,
  d7_rate NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN cohort_size > 0 THEN ROUND((d7_retained::NUMERIC / cohort_size) * 100, 2) ELSE 0 END
  ) STORED,
  d30_rate NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN cohort_size > 0 THEN ROUND((d30_retained::NUMERIC / cohort_size) * 100, 2) ELSE 0 END
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_cohort_week UNIQUE (cohort_week)
);

CREATE TABLE IF NOT EXISTS public.viral_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_date DATE NOT NULL,
  new_signups INTEGER NOT NULL DEFAULT 0,
  invite_signups INTEGER NOT NULL DEFAULT 0,
  organic_signups INTEGER NOT NULL DEFAULT 0,
  invites_sent INTEGER NOT NULL DEFAULT 0,
  invites_accepted INTEGER NOT NULL DEFAULT 0,
  viral_coefficient NUMERIC(5,3) NOT NULL DEFAULT 0.0,
  k_factor NUMERIC(5,3) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_viral_period UNIQUE (period_date)
);

CREATE TABLE IF NOT EXISTS public.engagement_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  period_date DATE NOT NULL,
  login_count INTEGER NOT NULL DEFAULT 0,
  pool_actions INTEGER NOT NULL DEFAULT 0,
  social_actions INTEGER NOT NULL DEFAULT 0,
  engagement_score NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  churn_risk NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  churn_predicted BOOLEAN NOT NULL DEFAULT false,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_engagement_user_period UNIQUE (user_id, period_date)
);

CREATE TABLE IF NOT EXISTS public.trust_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_date DATE NOT NULL,
  avg_trust_score NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  trust_score_p25 NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  trust_score_p75 NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  new_endorsements INTEGER NOT NULL DEFAULT 0,
  new_disputes INTEGER NOT NULL DEFAULT 0,
  resolved_disputes INTEGER NOT NULL DEFAULT 0,
  trust_violations INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_trust_analytics_period UNIQUE (period_date)
);

-- ============================================================
-- SECTION 10: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_accountability_user ON public.accountability_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_endorsed ON public.social_endorsements(endorsed_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_endorser ON public.social_endorsements(endorser_id);
CREATE INDEX IF NOT EXISTS idx_reliability_user ON public.reliability_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reliability_occurred ON public.reliability_history(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_wpa_rated ON public.would_participate_again(rated_id);
CREATE INDEX IF NOT EXISTS idx_trust_rel_from ON public.trust_relationships(from_user_id);
CREATE INDEX IF NOT EXISTS idx_trust_rel_to ON public.trust_relationships(to_user_id);
CREATE INDEX IF NOT EXISTS idx_trust_edges_from ON public.trust_graph_edges(from_user_id);
CREATE INDEX IF NOT EXISTS idx_trust_edges_cluster ON public.trust_graph_edges(cluster_id);
CREATE INDEX IF NOT EXISTS idx_disputes_opened_by ON public.disputes(opened_by);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(dispute_status);
CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute ON public.dispute_evidence(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_comments_dispute ON public.dispute_comments(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_votes_dispute ON public.dispute_votes(dispute_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_rankings_season ON public.seasonal_rankings(season_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_rankings_points ON public.seasonal_rankings(season_id, season_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trophies_user ON public.user_trophies(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_user ON public.creator_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_follows_creator ON public.creator_follows(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_analytics_creator ON public.creator_analytics(creator_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON public.rate_limit_log(identifier, action_type);
CREATE INDEX IF NOT EXISTS idx_otp_throttle_phone ON public.otp_throttle(phone);
CREATE INDEX IF NOT EXISTS idx_engagement_user ON public.engagement_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_churn ON public.engagement_scores(churn_predicted, period_date DESC);
CREATE INDEX IF NOT EXISTS idx_retention_cohort_week ON public.retention_cohorts(cohort_week DESC);
CREATE INDEX IF NOT EXISTS idx_viral_period ON public.viral_metrics(period_date DESC);

-- ============================================================
-- SECTION 11: FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_accountability(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_disputed INTEGER;
  v_on_time INTEGER;
  v_endorsements INTEGER;
  v_wpa_yes INTEGER;
  v_wpa_total INTEGER;
  v_score NUMERIC;
  v_ghost NUMERIC;
  v_wpa_pct NUMERIC;
  v_level public.reputation_level;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE event_type = 'contract_completed'),
    COUNT(*) FILTER (WHERE event_type = 'dispute_opened'),
    COUNT(*) FILTER (WHERE event_type = 'on_time_settlement')
  INTO v_total, v_completed, v_disputed, v_on_time
  FROM public.reliability_history
  WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_endorsements
  FROM public.social_endorsements WHERE endorsed_id = p_user_id;

  SELECT
    COUNT(*) FILTER (WHERE rating = true),
    COUNT(*)
  INTO v_wpa_yes, v_wpa_total
  FROM public.would_participate_again WHERE rated_id = p_user_id;

  v_score := LEAST(100, GREATEST(0,
    50.0
    + (COALESCE(v_completed, 0) * 2.0)
    - (COALESCE(v_disputed, 0) * 5.0)
    + (COALESCE(v_on_time, 0) * 1.5)
    + (COALESCE(v_endorsements, 0) * 0.5)
  ));

  v_ghost := CASE WHEN v_total > 0 THEN ROUND((v_disputed::NUMERIC / v_total) * 100, 2) ELSE 0 END;
  v_wpa_pct := CASE WHEN v_wpa_total > 0 THEN ROUND((v_wpa_yes::NUMERIC / v_wpa_total) * 100, 2) ELSE 100 END;

  v_level := CASE
    WHEN v_score >= 95 THEN 'legend'::public.reputation_level
    WHEN v_score >= 85 THEN 'diamond'::public.reputation_level
    WHEN v_score >= 75 THEN 'platinum'::public.reputation_level
    WHEN v_score >= 60 THEN 'gold'::public.reputation_level
    WHEN v_score >= 40 THEN 'silver'::public.reputation_level
    ELSE 'bronze'::public.reputation_level
  END;

  INSERT INTO public.accountability_scores (
    user_id, accountability_score, ghost_rate, would_participate_again_pct,
    reputation_level, total_contracts, completed_contracts, disputed_contracts, on_time_settlements
  ) VALUES (
    p_user_id, v_score, v_ghost, v_wpa_pct,
    v_level, COALESCE(v_total, 0), COALESCE(v_completed, 0), COALESCE(v_disputed, 0), COALESCE(v_on_time, 0)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    accountability_score = EXCLUDED.accountability_score,
    ghost_rate = EXCLUDED.ghost_rate,
    would_participate_again_pct = EXCLUDED.would_participate_again_pct,
    reputation_level = EXCLUDED.reputation_level,
    total_contracts = EXCLUDED.total_contracts,
    completed_contracts = EXCLUDED.completed_contracts,
    disputed_contracts = EXCLUDED.disputed_contracts,
    on_time_settlements = EXCLUDED.on_time_settlements,
    calculated_at = now(),
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

CREATE OR REPLACE FUNCTION public.prevent_self_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_user_id UUID;
BEGIN
  SELECT user_id INTO v_creator_user_id
  FROM public.creator_profiles
  WHERE id = NEW.creator_id
  LIMIT 1;

  IF NEW.follower_id = v_creator_user_id THEN
    RAISE EXCEPTION 'Users cannot follow themselves';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_creator_follower_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.creator_profiles
    SET follower_count = follower_count + 1, updated_at = now()
    WHERE id = NEW.creator_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.creator_profiles
    SET follower_count = GREATEST(0, follower_count - 1), updated_at = now()
    WHERE id = OLD.creator_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================
-- SECTION 12: ENABLE RLS
-- ============================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accountability_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reliability_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.would_participate_again ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_cluster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trophies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trophies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_abuse_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_throttle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viral_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECTION 13: RLS POLICIES
-- ============================================================

-- user_profiles
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles" ON public.user_profiles
FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_view_all_profiles" ON public.user_profiles;
CREATE POLICY "users_view_all_profiles" ON public.user_profiles
FOR SELECT TO authenticated USING (true);

-- accountability_scores (public read, own write)
DROP POLICY IF EXISTS "public_read_accountability" ON public.accountability_scores;
CREATE POLICY "public_read_accountability" ON public.accountability_scores
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "system_write_accountability" ON public.accountability_scores;
CREATE POLICY "system_write_accountability" ON public.accountability_scores
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- social_endorsements
DROP POLICY IF EXISTS "public_read_endorsements" ON public.social_endorsements;
CREATE POLICY "public_read_endorsements" ON public.social_endorsements
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_manage_own_endorsements" ON public.social_endorsements;
CREATE POLICY "users_manage_own_endorsements" ON public.social_endorsements
FOR ALL TO authenticated USING (endorser_id = auth.uid()) WITH CHECK (endorser_id = auth.uid());

-- reliability_history
DROP POLICY IF EXISTS "public_read_reliability" ON public.reliability_history;
CREATE POLICY "public_read_reliability" ON public.reliability_history
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_insert_own_reliability" ON public.reliability_history;
CREATE POLICY "users_insert_own_reliability" ON public.reliability_history
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- would_participate_again
DROP POLICY IF EXISTS "public_read_wpa" ON public.would_participate_again;
CREATE POLICY "public_read_wpa" ON public.would_participate_again
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_manage_own_wpa" ON public.would_participate_again;
CREATE POLICY "users_manage_own_wpa" ON public.would_participate_again
FOR ALL TO authenticated USING (rater_id = auth.uid()) WITH CHECK (rater_id = auth.uid());

-- trust_relationships
DROP POLICY IF EXISTS "users_manage_own_trust_rel" ON public.trust_relationships;
CREATE POLICY "users_manage_own_trust_rel" ON public.trust_relationships
FOR ALL TO authenticated USING (from_user_id = auth.uid()) WITH CHECK (from_user_id = auth.uid());

DROP POLICY IF EXISTS "users_view_trust_rel" ON public.trust_relationships;
CREATE POLICY "users_view_trust_rel" ON public.trust_relationships
FOR SELECT TO authenticated USING (to_user_id = auth.uid());

-- trust_graph_edges
DROP POLICY IF EXISTS "public_read_trust_edges" ON public.trust_graph_edges;
CREATE POLICY "public_read_trust_edges" ON public.trust_graph_edges
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_manage_own_trust_edges" ON public.trust_graph_edges;
CREATE POLICY "users_manage_own_trust_edges" ON public.trust_graph_edges
FOR ALL TO authenticated USING (from_user_id = auth.uid()) WITH CHECK (from_user_id = auth.uid());

-- trust_clusters
DROP POLICY IF EXISTS "public_read_clusters" ON public.trust_clusters;
CREATE POLICY "public_read_clusters" ON public.trust_clusters
FOR SELECT TO authenticated USING (true);

-- trust_cluster_members
DROP POLICY IF EXISTS "public_read_cluster_members" ON public.trust_cluster_members;
CREATE POLICY "public_read_cluster_members" ON public.trust_cluster_members
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_manage_own_cluster_membership" ON public.trust_cluster_members;
CREATE POLICY "users_manage_own_cluster_membership" ON public.trust_cluster_members
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- disputes
DROP POLICY IF EXISTS "users_view_own_disputes" ON public.disputes;
CREATE POLICY "users_view_own_disputes" ON public.disputes
FOR SELECT TO authenticated USING (opened_by = auth.uid() OR against_user_id = auth.uid() OR moderator_id = auth.uid());

DROP POLICY IF EXISTS "users_open_disputes" ON public.disputes;
CREATE POLICY "users_open_disputes" ON public.disputes
FOR INSERT TO authenticated WITH CHECK (opened_by = auth.uid());

DROP POLICY IF EXISTS "users_update_own_disputes" ON public.disputes;
CREATE POLICY "users_update_own_disputes" ON public.disputes
FOR UPDATE TO authenticated USING (opened_by = auth.uid() OR moderator_id = auth.uid()) WITH CHECK (opened_by = auth.uid() OR moderator_id = auth.uid());

-- dispute_evidence
DROP POLICY IF EXISTS "users_view_dispute_evidence" ON public.dispute_evidence;
CREATE POLICY "users_view_dispute_evidence" ON public.dispute_evidence
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_submit_evidence" ON public.dispute_evidence;
CREATE POLICY "users_submit_evidence" ON public.dispute_evidence
FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid());

-- dispute_comments
DROP POLICY IF EXISTS "public_read_dispute_comments" ON public.dispute_comments;
CREATE POLICY "public_read_dispute_comments" ON public.dispute_comments
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_manage_own_dispute_comments" ON public.dispute_comments;
CREATE POLICY "users_manage_own_dispute_comments" ON public.dispute_comments
FOR ALL TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

-- dispute_votes
DROP POLICY IF EXISTS "public_read_dispute_votes" ON public.dispute_votes;
CREATE POLICY "public_read_dispute_votes" ON public.dispute_votes
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_manage_own_votes" ON public.dispute_votes;
CREATE POLICY "users_manage_own_votes" ON public.dispute_votes
FOR ALL TO authenticated USING (voter_id = auth.uid()) WITH CHECK (voter_id = auth.uid());

-- dispute_appeals
DROP POLICY IF EXISTS "users_view_own_appeals" ON public.dispute_appeals;
CREATE POLICY "users_view_own_appeals" ON public.dispute_appeals
FOR SELECT TO authenticated USING (appellant_id = auth.uid() OR reviewed_by = auth.uid());

DROP POLICY IF EXISTS "users_submit_appeals" ON public.dispute_appeals;
CREATE POLICY "users_submit_appeals" ON public.dispute_appeals
FOR INSERT TO authenticated WITH CHECK (appellant_id = auth.uid());

-- seasons
DROP POLICY IF EXISTS "public_read_seasons" ON public.seasons;
CREATE POLICY "public_read_seasons" ON public.seasons
FOR SELECT TO public USING (true);

-- seasonal_rankings
DROP POLICY IF EXISTS "public_read_seasonal_rankings" ON public.seasonal_rankings;
CREATE POLICY "public_read_seasonal_rankings" ON public.seasonal_rankings
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_manage_own_rankings" ON public.seasonal_rankings;
CREATE POLICY "users_manage_own_rankings" ON public.seasonal_rankings
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- seasonal_badges
DROP POLICY IF EXISTS "public_read_seasonal_badges" ON public.seasonal_badges;
CREATE POLICY "public_read_seasonal_badges" ON public.seasonal_badges
FOR SELECT TO public USING (true);

-- user_badges
DROP POLICY IF EXISTS "public_read_user_badges" ON public.user_badges;
CREATE POLICY "public_read_user_badges" ON public.user_badges
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_manage_own_badges" ON public.user_badges;
CREATE POLICY "users_manage_own_badges" ON public.user_badges
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- trophies
DROP POLICY IF EXISTS "public_read_trophies" ON public.trophies;
CREATE POLICY "public_read_trophies" ON public.trophies
FOR SELECT TO public USING (true);

-- user_trophies
DROP POLICY IF EXISTS "public_read_user_trophies" ON public.user_trophies;
CREATE POLICY "public_read_user_trophies" ON public.user_trophies
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_manage_own_trophies" ON public.user_trophies;
CREATE POLICY "users_manage_own_trophies" ON public.user_trophies
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- creator_profiles
DROP POLICY IF EXISTS "public_read_creator_profiles" ON public.creator_profiles;
CREATE POLICY "public_read_creator_profiles" ON public.creator_profiles
FOR SELECT TO authenticated USING (is_public = true OR user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_creator_profile" ON public.creator_profiles;
CREATE POLICY "users_manage_own_creator_profile" ON public.creator_profiles
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- creator_follows
DROP POLICY IF EXISTS "public_read_creator_follows" ON public.creator_follows;
CREATE POLICY "public_read_creator_follows" ON public.creator_follows
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_manage_own_follows" ON public.creator_follows;
CREATE POLICY "users_manage_own_follows" ON public.creator_follows
FOR ALL TO authenticated USING (follower_id = auth.uid()) WITH CHECK (follower_id = auth.uid());

-- creator_analytics
DROP POLICY IF EXISTS "creators_view_own_analytics" ON public.creator_analytics;
CREATE POLICY "creators_view_own_analytics" ON public.creator_analytics
FOR SELECT TO authenticated USING (
  creator_id IN (SELECT id FROM public.creator_profiles WHERE user_id = auth.uid())
);

-- audit_logs
DROP POLICY IF EXISTS "users_view_own_audit_logs" ON public.audit_logs;
CREATE POLICY "users_view_own_audit_logs" ON public.audit_logs
FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin_user());

DROP POLICY IF EXISTS "users_insert_audit_logs" ON public.audit_logs;
CREATE POLICY "users_insert_audit_logs" ON public.audit_logs
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- rate_limit_log
DROP POLICY IF EXISTS "admin_manage_rate_limits" ON public.rate_limit_log;
CREATE POLICY "admin_manage_rate_limits" ON public.rate_limit_log
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- invite_abuse_flags
DROP POLICY IF EXISTS "admin_manage_abuse_flags" ON public.invite_abuse_flags;
CREATE POLICY "admin_manage_abuse_flags" ON public.invite_abuse_flags
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- otp_throttle
DROP POLICY IF EXISTS "service_manage_otp_throttle" ON public.otp_throttle;
CREATE POLICY "service_manage_otp_throttle" ON public.otp_throttle
FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- retention_cohorts
DROP POLICY IF EXISTS "admin_read_retention" ON public.retention_cohorts;
CREATE POLICY "admin_read_retention" ON public.retention_cohorts
FOR SELECT TO authenticated USING (public.is_admin_user());

-- viral_metrics
DROP POLICY IF EXISTS "admin_read_viral" ON public.viral_metrics;
CREATE POLICY "admin_read_viral" ON public.viral_metrics
FOR SELECT TO authenticated USING (public.is_admin_user());

-- engagement_scores
DROP POLICY IF EXISTS "users_view_own_engagement" ON public.engagement_scores;
CREATE POLICY "users_view_own_engagement" ON public.engagement_scores
FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin_user());

-- trust_analytics
DROP POLICY IF EXISTS "admin_read_trust_analytics" ON public.trust_analytics;
CREATE POLICY "admin_read_trust_analytics" ON public.trust_analytics
FOR SELECT TO authenticated USING (public.is_admin_user());

-- ============================================================
-- SECTION 14: TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_creator_follow_insert ON public.creator_follows;
CREATE TRIGGER on_creator_follow_insert
  AFTER INSERT ON public.creator_follows
  FOR EACH ROW EXECUTE FUNCTION public.update_creator_follower_count();

DROP TRIGGER IF EXISTS on_creator_follow_delete ON public.creator_follows;
CREATE TRIGGER on_creator_follow_delete
  AFTER DELETE ON public.creator_follows
  FOR EACH ROW EXECUTE FUNCTION public.update_creator_follower_count();

DROP TRIGGER IF EXISTS on_creator_follow_no_self ON public.creator_follows;
CREATE TRIGGER on_creator_follow_no_self
  BEFORE INSERT ON public.creator_follows
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_follow();

-- ============================================================
-- SECTION 15: SEED DATA
-- ============================================================

DO $$
DECLARE
  v_season_id UUID := gen_random_uuid();
  v_badge1_id UUID := gen_random_uuid();
  v_badge2_id UUID := gen_random_uuid();
  v_trophy1_id UUID := gen_random_uuid();
  v_cluster1_id UUID := gen_random_uuid();
BEGIN
  -- Seasons
  INSERT INTO public.seasons (id, season_name, season_number, season_status, starts_at, ends_at, description)
  VALUES
    (v_season_id, 'Season 1: Genesis', 1, 'active', now() - interval '30 days', now() + interval '60 days', 'The inaugural PoolParty season'),
    (gen_random_uuid(), 'Season 2: Rivalry', 2, 'upcoming', now() + interval '61 days', now() + interval '150 days', 'Compete for glory in Season 2')
  ON CONFLICT (season_number) DO NOTHING;

  -- Seasonal Badges
  INSERT INTO public.seasonal_badges (id, badge_key, badge_name, badge_description, badge_icon, badge_tier, season_id)
  VALUES
    (v_badge1_id, 'season1_winner', 'Season Champion', 'Won the most pools in Season 1', '🏆', 'legendary', v_season_id),
    (v_badge2_id, 'season1_streak', 'Hot Streak', 'Won 5 pools in a row during Season 1', '🔥', 'rare', v_season_id),
    (gen_random_uuid(), 'trustworthy', 'Trustworthy', 'Maintained 90%+ accountability score', '🛡️', 'uncommon', NULL),
    (gen_random_uuid(), 'social_butterfly', 'Social Butterfly', 'Endorsed by 10+ users', '🦋', 'common', NULL),
    (gen_random_uuid(), 'dispute_free', 'Clean Record', 'Zero disputes in a season', '✨', 'uncommon', v_season_id)
  ON CONFLICT (badge_key) DO NOTHING;

  -- Trophies
  INSERT INTO public.trophies (id, trophy_key, trophy_name, trophy_description, trophy_icon, rarity, season_id)
  VALUES
    (v_trophy1_id, 'season1_mvp', 'Season 1 MVP', 'Most Valuable Player of Season 1', '🥇', 'legendary', v_season_id),
    (gen_random_uuid(), 'first_win', 'First Blood', 'Won your first pool', '🎯', 'common', NULL),
    (gen_random_uuid(), 'centurion', 'Centurion', 'Participated in 100 pools', '💯', 'rare', NULL),
    (gen_random_uuid(), 'trust_legend', 'Trust Legend', 'Reached Legend reputation level', '⭐', 'legendary', NULL)
  ON CONFLICT (trophy_key) DO NOTHING;

  -- Trust Cluster
  INSERT INTO public.trust_clusters (id, cluster_name, cluster_key, member_count, avg_trust_score, cohesion_score)
  VALUES
    (v_cluster1_id, 'Core Community', 'core_community', 0, 75.0, 0.8),
    (gen_random_uuid(), 'Sports Bettors', 'sports_bettors', 0, 68.0, 0.65),
    (gen_random_uuid(), 'Finance Pool', 'finance_pool', 0, 82.0, 0.9)
  ON CONFLICT (cluster_key) DO NOTHING;

  -- Viral metrics seed
  INSERT INTO public.viral_metrics (period_date, new_signups, invite_signups, organic_signups, invites_sent, invites_accepted, viral_coefficient, k_factor)
  VALUES
    (CURRENT_DATE - 6, 45, 28, 17, 120, 28, 0.62, 0.93),
    (CURRENT_DATE - 5, 52, 31, 21, 145, 31, 0.60, 0.89),
    (CURRENT_DATE - 4, 38, 22, 16, 98, 22, 0.58, 0.85),
    (CURRENT_DATE - 3, 61, 40, 21, 167, 40, 0.66, 0.98),
    (CURRENT_DATE - 2, 55, 35, 20, 152, 35, 0.64, 0.95),
    (CURRENT_DATE - 1, 70, 48, 22, 190, 48, 0.69, 1.02),
    (CURRENT_DATE, 42, 27, 15, 110, 27, 0.64, 0.95)
  ON CONFLICT (period_date) DO NOTHING;

  -- Retention cohorts seed
  INSERT INTO public.retention_cohorts (cohort_week, cohort_size, d1_retained, d7_retained, d30_retained, d60_retained, d90_retained)
  VALUES
    (CURRENT_DATE - 90, 200, 160, 120, 80, 60, 45),
    (CURRENT_DATE - 83, 185, 148, 111, 74, 55, 40),
    (CURRENT_DATE - 76, 220, 176, 132, 88, 66, 0),
    (CURRENT_DATE - 69, 195, 156, 117, 78, 0, 0),
    (CURRENT_DATE - 62, 240, 192, 144, 96, 0, 0),
    (CURRENT_DATE - 55, 210, 168, 126, 0, 0, 0),
    (CURRENT_DATE - 48, 255, 204, 153, 0, 0, 0),
    (CURRENT_DATE - 41, 230, 184, 0, 0, 0, 0),
    (CURRENT_DATE - 34, 270, 216, 0, 0, 0, 0),
    (CURRENT_DATE - 27, 245, 0, 0, 0, 0, 0)
  ON CONFLICT (cohort_week) DO NOTHING;

  -- Trust analytics seed
  INSERT INTO public.trust_analytics (period_date, avg_trust_score, trust_score_p25, trust_score_p75, new_endorsements, new_disputes, resolved_disputes, trust_violations)
  VALUES
    (CURRENT_DATE - 6, 72.4, 58.0, 86.0, 34, 3, 2, 1),
    (CURRENT_DATE - 5, 73.1, 59.0, 87.0, 41, 2, 3, 0),
    (CURRENT_DATE - 4, 71.8, 57.0, 85.0, 28, 4, 2, 2),
    (CURRENT_DATE - 3, 74.2, 60.0, 88.0, 52, 1, 4, 0),
    (CURRENT_DATE - 2, 75.0, 61.0, 89.0, 45, 2, 1, 1),
    (CURRENT_DATE - 1, 76.3, 62.0, 90.0, 58, 3, 3, 0),
    (CURRENT_DATE, 75.8, 61.5, 89.5, 37, 2, 2, 1)
  ON CONFLICT (period_date) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seed data error: %', SQLERRM;
END $$;
