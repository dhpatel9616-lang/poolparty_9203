-- PoolParty: Core App Tables Migration
-- Creates: notifications, activities, settlement_items, pools, groups, group_members
-- Timestamp: 20260524223758

-- ─── Pools Table ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  group_id UUID,
  status TEXT NOT NULL DEFAULT 'open',
  pool_type TEXT NOT NULL DEFAULT 'prediction',
  icon TEXT DEFAULT '🎯',
  participant_count INTEGER DEFAULT 0,
  entry_deadline TIMESTAMPTZ,
  resolution_deadline TIMESTAMPTZ,
  winning_outcome_id UUID,
  stake_note TEXT,
  rules TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pools_creator_id ON public.pools(creator_id);
CREATE INDEX IF NOT EXISTS idx_pools_status ON public.pools(status);
CREATE INDEX IF NOT EXISTS idx_pools_created_at ON public.pools(created_at DESC);

ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pools_public_read" ON public.pools;
CREATE POLICY "pools_public_read" ON public.pools
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "pools_creator_manage" ON public.pools;
CREATE POLICY "pools_creator_manage" ON public.pools
  FOR ALL TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- ─── Groups Table ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '🏆',
  category TEXT DEFAULT 'Friends',
  max_members INTEGER,
  require_approval BOOLEAN DEFAULT false,
  who_creates_contracts TEXT DEFAULT 'All members',
  who_resolves_contracts TEXT DEFAULT 'Creator',
  who_invites TEXT DEFAULT 'All members',
  creator_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  member_count INTEGER DEFAULT 1,
  active_pool_count INTEGER DEFAULT 0,
  total_pool_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON public.groups(creator_id);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "groups_public_read" ON public.groups;
CREATE POLICY "groups_public_read" ON public.groups
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "groups_creator_manage" ON public.groups;
CREATE POLICY "groups_creator_manage" ON public.groups
  FOR ALL TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- ─── Group Members Table ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  trust_score NUMERIC DEFAULT 50.0,
  joined_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_unique ON public.group_members(group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_members_public_read" ON public.group_members;
CREATE POLICY "group_members_public_read" ON public.group_members
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "group_members_user_manage" ON public.group_members;
CREATE POLICY "group_members_user_manage" ON public.group_members
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── Settlement Items Table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.settlement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID REFERENCES public.pools(id) ON DELETE SET NULL,
  payer_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  amount_note TEXT NOT NULL DEFAULT '',
  return_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid',
  method_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settlement_items_payer_id ON public.settlement_items(payer_id);
CREATE INDEX IF NOT EXISTS idx_settlement_items_receiver_id ON public.settlement_items(receiver_id);
CREATE INDEX IF NOT EXISTS idx_settlement_items_pool_id ON public.settlement_items(pool_id);

ALTER TABLE public.settlement_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settlement_items_party_access" ON public.settlement_items;
CREATE POLICY "settlement_items_party_access" ON public.settlement_items
  FOR ALL TO authenticated
  USING (payer_id = auth.uid() OR receiver_id = auth.uid())
  WITH CHECK (payer_id = auth.uid() OR receiver_id = auth.uid());

-- ─── Activities Table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL,
  actor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  pool_id UUID REFERENCES public.pools(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_actor_id ON public.activities(actor_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(activity_type);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities_public_read" ON public.activities;
CREATE POLICY "activities_public_read" ON public.activities
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "activities_authenticated_insert" ON public.activities;
CREATE POLICY "activities_authenticated_insert" ON public.activities
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- ─── Notifications Table ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_user_access" ON public.notifications;
CREATE POLICY "notifications_user_access" ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── Pool Outcomes Table ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pool_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  weight NUMERIC DEFAULT 0,
  entry_count INTEGER DEFAULT 0,
  total_stake NUMERIC DEFAULT 0,
  percent NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pool_outcomes_pool_id ON public.pool_outcomes(pool_id);

ALTER TABLE public.pool_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pool_outcomes_public_read" ON public.pool_outcomes;
CREATE POLICY "pool_outcomes_public_read" ON public.pool_outcomes
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "pool_outcomes_creator_manage" ON public.pool_outcomes;
CREATE POLICY "pool_outcomes_creator_manage" ON public.pool_outcomes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pools p
      WHERE p.id = pool_id AND p.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pools p
      WHERE p.id = pool_id AND p.creator_id = auth.uid()
    )
  );

-- ─── Pool Entries Table ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pool_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  outcome_id UUID REFERENCES public.pool_outcomes(id) ON DELETE SET NULL,
  stake_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pool_entries_unique ON public.pool_entries(pool_id, user_id);
CREATE INDEX IF NOT EXISTS idx_pool_entries_user_id ON public.pool_entries(user_id);

ALTER TABLE public.pool_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pool_entries_user_access" ON public.pool_entries;
CREATE POLICY "pool_entries_user_access" ON public.pool_entries
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "pool_entries_public_read" ON public.pool_entries;
CREATE POLICY "pool_entries_public_read" ON public.pool_entries
  FOR SELECT TO public USING (true);

-- ─── Trigger: Auto-create user profile on signup ──────────────────────────────

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
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name),
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Trigger: Log activities on pool creation ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_pool_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activities (activity_type, actor_id, pool_id, metadata)
    VALUES (
      'pool_created',
      NEW.creator_id,
      NEW.id,
      jsonb_build_object(
        'actor_name', COALESCE((SELECT full_name FROM public.user_profiles WHERE id = NEW.creator_id LIMIT 1), 'Someone'),
        'description', 'created a new pool: ' || NEW.title,
        'pool_title', NEW.title
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_pool_created ON public.pools;
CREATE TRIGGER on_pool_created
  AFTER INSERT ON public.pools
  FOR EACH ROW EXECUTE FUNCTION public.log_pool_activity();

-- ─── Trigger: Log activities on pool entry ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_pool_entry_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activities (activity_type, actor_id, pool_id, metadata)
    VALUES (
      'pool_joined',
      NEW.user_id,
      NEW.pool_id,
      jsonb_build_object(
        'actor_name', COALESCE((SELECT full_name FROM public.user_profiles WHERE id = NEW.user_id LIMIT 1), 'Someone'),
        'description', 'joined a pool'
      )
    );
    -- Increment participant count
    UPDATE public.pools SET participant_count = participant_count + 1 WHERE id = NEW.pool_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_pool_entry_created ON public.pool_entries;
CREATE TRIGGER on_pool_entry_created
  AFTER INSERT ON public.pool_entries
  FOR EACH ROW EXECUTE FUNCTION public.log_pool_entry_activity();

-- ─── Trigger: Send notification on nudge ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_nudge_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.activity_type = 'nudge_sent' THEN
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    SELECT
      (NEW.metadata->>'to_user_id')::UUID,
      'nudge_sent',
      'Payment Reminder',
      'You have a pending payment. Please settle up!',
      NEW.metadata
    WHERE (NEW.metadata->>'to_user_id') IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_nudge_activity ON public.activities;
CREATE TRIGGER on_nudge_activity
  AFTER INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.create_nudge_notification();
