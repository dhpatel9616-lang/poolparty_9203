-- Migration: Delta fixes for PoolParty
-- Adds dispute-evidence storage bucket setup, missing columns, and RLS fixes
-- Timestamp: 20260528203700

-- ============================================================
-- 1. Add missing columns to existing tables (idempotent)
-- ============================================================

-- groups table uses "approval_status" column (already exists).
-- Add additional governance columns if missing.
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add status column to pools if missing (pools already has status='open' default)
ALTER TABLE public.pools
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

ALTER TABLE public.pools
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE public.pools
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.pools
ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'yes_no';

ALTER TABLE public.pools
ADD COLUMN IF NOT EXISTS stake_note_extra TEXT;

ALTER TABLE public.pools
ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT false;

ALTER TABLE public.pools
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'group';

-- Add dispute_status alias columns to disputes if missing
-- (disputes already has dispute_status as enum, title, description, against_user_id)
-- No additional columns needed.

-- Add comment column alias to dispute_comments if missing
-- (dispute_comments uses "content" for the comment text and "author_id" for the user)
-- No additional columns needed.

-- ============================================================
-- 2. dispute_appeals table already exists — skip CREATE.
--    Only ensure RLS is enabled and policies are correct.
-- ============================================================

ALTER TABLE public.dispute_appeals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_dispute_appeals" ON public.dispute_appeals;
CREATE POLICY "users_manage_own_dispute_appeals"
ON public.dispute_appeals
FOR ALL
TO authenticated
USING (appellant_id = auth.uid())
WITH CHECK (appellant_id = auth.uid());

-- ============================================================
-- 3. Fix RLS policies for disputes
-- ============================================================
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_own_disputes" ON public.disputes;
CREATE POLICY "users_view_own_disputes"
ON public.disputes
FOR SELECT
TO authenticated
USING (opened_by = auth.uid() OR against_user_id = auth.uid());

DROP POLICY IF EXISTS "users_create_disputes" ON public.disputes;
CREATE POLICY "users_create_disputes"
ON public.disputes
FOR INSERT
TO authenticated
WITH CHECK (opened_by = auth.uid());

DROP POLICY IF EXISTS "users_update_own_disputes" ON public.disputes;
CREATE POLICY "users_update_own_disputes"
ON public.disputes
FOR UPDATE
TO authenticated
USING (opened_by = auth.uid())
WITH CHECK (opened_by = auth.uid());

-- ============================================================
-- 4. Fix RLS for dispute_evidence
--    Table uses "submitted_by" (confirmed from schema)
-- ============================================================
ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_upload_dispute_evidence" ON public.dispute_evidence;
CREATE POLICY "users_upload_dispute_evidence"
ON public.dispute_evidence
FOR INSERT
TO authenticated
WITH CHECK (submitted_by = auth.uid());

DROP POLICY IF EXISTS "users_view_dispute_evidence" ON public.dispute_evidence;
CREATE POLICY "users_view_dispute_evidence"
ON public.dispute_evidence
FOR SELECT
TO authenticated
USING (
  submitted_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.disputes d
    WHERE d.id = dispute_id
    AND (d.opened_by = auth.uid() OR d.against_user_id = auth.uid())
  )
);

-- ============================================================
-- 5. Fix RLS for dispute_comments
--    Table uses "author_id" (not "user_id") — confirmed from schema
-- ============================================================
ALTER TABLE public.dispute_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_dispute_comments" ON public.dispute_comments;
CREATE POLICY "users_manage_dispute_comments"
ON public.dispute_comments
FOR ALL
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "dispute_participants_view_comments" ON public.dispute_comments;
CREATE POLICY "dispute_participants_view_comments"
ON public.dispute_comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.disputes d
    WHERE d.id = dispute_id
    AND (d.opened_by = auth.uid() OR d.against_user_id = auth.uid())
  )
);

-- ============================================================
-- 6. Fix RLS for groups
--    Table uses "approval_status" column (not "status")
-- ============================================================
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_create_groups" ON public.groups;
CREATE POLICY "users_create_groups"
ON public.groups
FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "users_view_own_groups" ON public.groups;
CREATE POLICY "users_view_own_groups"
ON public.groups
FOR SELECT
TO authenticated
USING (
  creator_id = auth.uid()
  OR approval_status = 'approved'
  OR EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = id AND gm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "creators_update_own_groups" ON public.groups;
CREATE POLICY "creators_update_own_groups"
ON public.groups
FOR UPDATE
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

-- ============================================================
-- 7. Fix RLS for pools
--    Table uses "status" column with values like 'open','active', etc.
-- ============================================================
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_create_pools" ON public.pools;
CREATE POLICY "users_create_pools"
ON public.pools
FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "users_view_pools" ON public.pools;
CREATE POLICY "users_view_pools"
ON public.pools
FOR SELECT
TO authenticated
USING (
  creator_id = auth.uid()
  OR status = 'approved'
  OR status = 'open'
  OR status = 'active'
);

DROP POLICY IF EXISTS "creators_update_own_pools" ON public.pools;
CREATE POLICY "creators_update_own_pools"
ON public.pools
FOR UPDATE
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

-- ============================================================
-- 8. Storage bucket for dispute evidence (via SQL)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dispute-evidence',
  'dispute-evidence',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "authenticated_upload_dispute_evidence" ON storage.objects;
CREATE POLICY "authenticated_upload_dispute_evidence"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dispute-evidence' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "dispute_participants_view_evidence" ON storage.objects;
CREATE POLICY "dispute_participants_view_evidence"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'dispute-evidence' AND auth.uid() IS NOT NULL);

-- ============================================================
-- 9. Notifications table RLS
-- ============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_own_notifications" ON public.notifications;
CREATE POLICY "users_view_own_notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 10. Contact submissions RLS
-- ============================================================
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_submit_contact" ON public.contact_submissions;
CREATE POLICY "anyone_can_submit_contact"
ON public.contact_submissions
FOR INSERT
TO public
WITH CHECK (true);

-- ============================================================
-- 11. Problem reports RLS
-- ============================================================
ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_submit_report" ON public.problem_reports;
CREATE POLICY "anyone_can_submit_report"
ON public.problem_reports
FOR INSERT
TO public
WITH CHECK (true);

-- ============================================================
-- 12. CMS pages public read
-- ============================================================
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_cms_pages" ON public.cms_pages;
CREATE POLICY "public_read_cms_pages"
ON public.cms_pages
FOR SELECT
TO public
USING (true);
