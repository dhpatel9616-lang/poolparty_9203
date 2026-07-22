-- Delta update: approval system, groups table, creator_follows
-- Idempotent migration

-- Add status column to pools if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pools' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.pools ADD COLUMN status TEXT DEFAULT 'pending_approval';
  END IF;
END $$;

-- Add group_ids to pools for multi-group support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pools' AND column_name = 'group_ids'
  ) THEN
    ALTER TABLE public.pools ADD COLUMN group_ids TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Create groups table if not exists
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
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending_approval',
  member_count INTEGER DEFAULT 1,
  active_pool_count INTEGER DEFAULT 0,
  total_pool_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create group_members table if not exists
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  wins INTEGER DEFAULT 0,
  trust_score NUMERIC DEFAULT 50,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create creator_follows table if not exists
CREATE TABLE IF NOT EXISTS public.creator_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, creator_id)
);

-- Add approval_status to groups if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE public.groups ADD COLUMN approval_status TEXT DEFAULT 'pending_approval';
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_follows ENABLE ROW LEVEL SECURITY;

-- RLS policies for groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'groups_select_policy'
  ) THEN
    CREATE POLICY groups_select_policy ON public.groups FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'groups_insert_policy'
  ) THEN
    CREATE POLICY groups_insert_policy ON public.groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'groups_update_policy'
  ) THEN
    CREATE POLICY groups_update_policy ON public.groups FOR UPDATE USING (auth.uid() = creator_id);
  END IF;
END $$;

-- RLS policies for group_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'group_members' AND policyname = 'group_members_select_policy'
  ) THEN
    CREATE POLICY group_members_select_policy ON public.group_members FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'group_members' AND policyname = 'group_members_insert_policy'
  ) THEN
    CREATE POLICY group_members_insert_policy ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- RLS policies for creator_follows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'creator_follows' AND policyname = 'creator_follows_select_policy'
  ) THEN
    CREATE POLICY creator_follows_select_policy ON public.creator_follows FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'creator_follows' AND policyname = 'creator_follows_insert_policy'
  ) THEN
    CREATE POLICY creator_follows_insert_policy ON public.creator_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'creator_follows' AND policyname = 'creator_follows_delete_policy'
  ) THEN
    CREATE POLICY creator_follows_delete_policy ON public.creator_follows FOR DELETE USING (auth.uid() = follower_id);
  END IF;
END $$;
