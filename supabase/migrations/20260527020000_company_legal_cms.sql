-- PoolParty Company / Legal / CMS Migration
-- Tables: cms_pages, cms_page_versions, legal_documents, legal_acceptances,
--         faq_categories, faqs, contact_submissions, problem_reports, release_notes

-- ─── ENUM TYPES ──────────────────────────────────────────────────────────────

DROP TYPE IF EXISTS public.cms_page_status CASCADE;
CREATE TYPE public.cms_page_status AS ENUM ('draft', 'published', 'archived');

DROP TYPE IF EXISTS public.legal_doc_status CASCADE;
CREATE TYPE public.legal_doc_status AS ENUM ('draft', 'published', 'archived');

DROP TYPE IF EXISTS public.legal_doc_type CASCADE;
CREATE TYPE public.legal_doc_type AS ENUM ('terms', 'privacy');

DROP TYPE IF EXISTS public.contact_status CASCADE;
CREATE TYPE public.contact_status AS ENUM ('new', 'open', 'in_progress', 'resolved', 'closed');

DROP TYPE IF EXISTS public.report_status CASCADE;
CREATE TYPE public.report_status AS ENUM ('new', 'in_review', 'action_taken', 'no_action_needed', 'closed');

DROP TYPE IF EXISTS public.release_note_status CASCADE;
CREATE TYPE public.release_note_status AS ENUM ('draft', 'published');

DROP TYPE IF EXISTS public.faq_status CASCADE;
CREATE TYPE public.faq_status AS ENUM ('active', 'inactive');

-- ─── TABLES ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  body TEXT DEFAULT '',
  meta_description TEXT DEFAULT '',
  status public.cms_page_status DEFAULT 'draft'::public.cms_page_status,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  published_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.cms_page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  version INTEGER NOT NULL,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type public.legal_doc_type NOT NULL,
  version_number TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  effective_date DATE,
  requires_reacceptance BOOLEAN DEFAULT false,
  status public.legal_doc_status DEFAULT 'draft'::public.legal_doc_status,
  published_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  document_type public.legal_doc_type NOT NULL,
  version_number TEXT NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.faq_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  status public.faq_status DEFAULT 'active'::public.faq_status,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.faq_categories(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  status public.faq_status DEFAULT 'active'::public.faq_status,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  screenshot_url TEXT,
  status public.contact_status DEFAULT 'new'::public.contact_status,
  assigned_admin_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.problem_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  related_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  related_group_id UUID,
  related_pool_id UUID,
  related_contract_id UUID,
  description TEXT NOT NULL,
  screenshot_url TEXT,
  status public.report_status DEFAULT 'new'::public.report_status,
  admin_notes TEXT DEFAULT '',
  action_taken TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.release_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  release_date DATE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  bug_fixes TEXT DEFAULT '',
  new_features TEXT DEFAULT '',
  improvements TEXT DEFAULT '',
  status public.release_note_status DEFAULT 'draft'::public.release_note_status,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  published_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON public.cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_status ON public.cms_pages(status);
CREATE INDEX IF NOT EXISTS idx_cms_page_versions_page_id ON public.cms_page_versions(page_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON public.legal_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_status ON public.legal_documents(status);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user_id ON public.legal_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_type ON public.legal_acceptances(document_type);
CREATE INDEX IF NOT EXISTS idx_faqs_category_id ON public.faqs(category_id);
CREATE INDEX IF NOT EXISTS idx_faqs_featured ON public.faqs(featured);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_problem_reports_status ON public.problem_reports(status);
CREATE INDEX IF NOT EXISTS idx_problem_reports_type ON public.problem_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_release_notes_status ON public.release_notes(status);

-- ─── ENABLE RLS ──────────────────────────────────────────────────────────────

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_notes ENABLE ROW LEVEL SECURITY;

-- ─── RLS POLICIES ────────────────────────────────────────────────────────────

-- cms_pages: public read published, authenticated write
DROP POLICY IF EXISTS "public_read_published_cms_pages" ON public.cms_pages;
CREATE POLICY "public_read_published_cms_pages" ON public.cms_pages
FOR SELECT TO public USING (status = 'published'::public.cms_page_status);

DROP POLICY IF EXISTS "authenticated_manage_cms_pages" ON public.cms_pages;
CREATE POLICY "authenticated_manage_cms_pages" ON public.cms_pages
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- cms_page_versions: authenticated read/write
DROP POLICY IF EXISTS "authenticated_manage_cms_page_versions" ON public.cms_page_versions;
CREATE POLICY "authenticated_manage_cms_page_versions" ON public.cms_page_versions
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- legal_documents: public read published
DROP POLICY IF EXISTS "public_read_published_legal_documents" ON public.legal_documents;
CREATE POLICY "public_read_published_legal_documents" ON public.legal_documents
FOR SELECT TO public USING (status = 'published'::public.legal_doc_status);

DROP POLICY IF EXISTS "authenticated_manage_legal_documents" ON public.legal_documents;
CREATE POLICY "authenticated_manage_legal_documents" ON public.legal_documents
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- legal_acceptances: users manage own
DROP POLICY IF EXISTS "users_manage_own_legal_acceptances" ON public.legal_acceptances;
CREATE POLICY "users_manage_own_legal_acceptances" ON public.legal_acceptances
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- faq_categories: public read active
DROP POLICY IF EXISTS "public_read_active_faq_categories" ON public.faq_categories;
CREATE POLICY "public_read_active_faq_categories" ON public.faq_categories
FOR SELECT TO public USING (status = 'active'::public.faq_status);

DROP POLICY IF EXISTS "authenticated_manage_faq_categories" ON public.faq_categories;
CREATE POLICY "authenticated_manage_faq_categories" ON public.faq_categories
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- faqs: public read active
DROP POLICY IF EXISTS "public_read_active_faqs" ON public.faqs;
CREATE POLICY "public_read_active_faqs" ON public.faqs
FOR SELECT TO public USING (status = 'active'::public.faq_status);

DROP POLICY IF EXISTS "authenticated_manage_faqs" ON public.faqs;
CREATE POLICY "authenticated_manage_faqs" ON public.faqs
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- contact_submissions: users insert own, authenticated read all
DROP POLICY IF EXISTS "users_insert_contact_submissions" ON public.contact_submissions;
CREATE POLICY "users_insert_contact_submissions" ON public.contact_submissions
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_contact_submissions" ON public.contact_submissions;
CREATE POLICY "authenticated_read_contact_submissions" ON public.contact_submissions
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_update_contact_submissions" ON public.contact_submissions;
CREATE POLICY "authenticated_update_contact_submissions" ON public.contact_submissions
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- problem_reports: users insert own, authenticated read all
DROP POLICY IF EXISTS "users_insert_problem_reports" ON public.problem_reports;
CREATE POLICY "users_insert_problem_reports" ON public.problem_reports
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_problem_reports" ON public.problem_reports;
CREATE POLICY "authenticated_read_problem_reports" ON public.problem_reports
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_update_problem_reports" ON public.problem_reports;
CREATE POLICY "authenticated_update_problem_reports" ON public.problem_reports
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- release_notes: public read published
DROP POLICY IF EXISTS "public_read_published_release_notes" ON public.release_notes;
CREATE POLICY "public_read_published_release_notes" ON public.release_notes
FOR SELECT TO public USING (status = 'published'::public.release_note_status);

DROP POLICY IF EXISTS "authenticated_manage_release_notes" ON public.release_notes;
CREATE POLICY "authenticated_manage_release_notes" ON public.release_notes
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── SEED DATA ───────────────────────────────────────────────────────────────

-- FAQ Categories
INSERT INTO public.faq_categories (id, name, sort_order, status) VALUES
  (gen_random_uuid(), 'Getting Started', 1, 'active'::public.faq_status),
  (gen_random_uuid(), 'Groups', 2, 'active'::public.faq_status),
  (gen_random_uuid(), 'Pools', 3, 'active'::public.faq_status),
  (gen_random_uuid(), 'Trust Score', 4, 'active'::public.faq_status),
  (gen_random_uuid(), 'Disputes', 5, 'active'::public.faq_status),
  (gen_random_uuid(), 'Privacy', 6, 'active'::public.faq_status),
  (gen_random_uuid(), 'Account', 7, 'active'::public.faq_status),
  (gen_random_uuid(), 'Safety', 8, 'active'::public.faq_status)
ON CONFLICT DO NOTHING;

-- Seed FAQs
DO $$
DECLARE
  cat_getting_started UUID;
  cat_pools UUID;
  cat_trust UUID;
  cat_disputes UUID;
  cat_account UUID;
BEGIN
  SELECT id INTO cat_getting_started FROM public.faq_categories WHERE name = 'Getting Started' LIMIT 1;
  SELECT id INTO cat_pools FROM public.faq_categories WHERE name = 'Pools' LIMIT 1;
  SELECT id INTO cat_trust FROM public.faq_categories WHERE name = 'Trust Score' LIMIT 1;
  SELECT id INTO cat_disputes FROM public.faq_categories WHERE name = 'Disputes' LIMIT 1;
  SELECT id INTO cat_account FROM public.faq_categories WHERE name = 'Account' LIMIT 1;

  IF cat_getting_started IS NOT NULL THEN
    INSERT INTO public.faqs (category_id, question, answer, sort_order, featured, status) VALUES
      (cat_getting_started, 'What is PoolParty?', 'PoolParty is a private group prediction and agreement-tracking app where users create pools, make picks, track outcomes, and build reputation.', 1, true, 'active'::public.faq_status),
      (cat_getting_started, 'Is PoolParty a gambling app?', 'No. PoolParty does not operate as a sportsbook, casino, gambling platform, exchange, payment processor, escrow service, or financial platform.', 2, true, 'active'::public.faq_status),
      (cat_getting_started, 'Does PoolParty handle payments?', 'No. PoolParty does not hold, transfer, process, or guarantee money between users.', 3, false, 'active'::public.faq_status)
    ON CONFLICT DO NOTHING;
  END IF;

  IF cat_pools IS NOT NULL THEN
    INSERT INTO public.faqs (category_id, question, answer, sort_order, featured, status) VALUES
      (cat_pools, 'What is a pool?', 'A pool is a prediction topic with possible outcomes, rules, deadlines, and participants.', 1, false, 'active'::public.faq_status),
      (cat_pools, 'What happens when I lock in an entry?', 'Your selection becomes final for that pool unless the pool rules allow edits.', 2, false, 'active'::public.faq_status),
      (cat_pools, 'How is a pool resolved?', 'Pools may be resolved by a group admin, pool creator, approved data source, or PoolParty admin review depending on the pool settings.', 3, false, 'active'::public.faq_status)
    ON CONFLICT DO NOTHING;
  END IF;

  IF cat_trust IS NOT NULL THEN
    INSERT INTO public.faqs (category_id, question, answer, sort_order, featured, status) VALUES
      (cat_trust, 'What is a trust score?', 'A trust score is a reputation indicator based on user activity, pool history, reliability, disputes, and platform behavior.', 1, true, 'active'::public.faq_status)
    ON CONFLICT DO NOTHING;
  END IF;

  IF cat_disputes IS NOT NULL THEN
    INSERT INTO public.faqs (category_id, question, answer, sort_order, featured, status) VALUES
      (cat_disputes, 'Can I dispute an outcome?', 'Yes. Users may open a dispute when they believe an outcome or action was incorrect.', 1, false, 'active'::public.faq_status)
    ON CONFLICT DO NOTHING;
  END IF;

  IF cat_account IS NOT NULL THEN
    INSERT INTO public.faqs (category_id, question, answer, sort_order, featured, status) VALUES
      (cat_account, 'Can I delete my account?', 'Yes. Users can request account deletion from Settings.', 1, false, 'active'::public.faq_status),
      (cat_account, 'Can I report another user?', 'Yes. Users can report suspicious, abusive, or misleading behavior through Report a Problem or user profile reporting tools.', 2, false, 'active'::public.faq_status),
      (cat_account, 'Who can see my profile?', 'Visibility depends on app settings, group membership, and privacy controls.', 3, false, 'active'::public.faq_status)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Seed CMS Pages (static content)
INSERT INTO public.cms_pages (title, slug, body, meta_description, status, version) VALUES
  ('About PoolParty', 'about', 'PoolParty is a private group prediction and agreement-tracking app built for friends, communities, teams, and groups that want to make predictions, track outcomes, and build trust through reputation.', 'Learn about PoolParty, our mission, and core principles.', 'published'::public.cms_page_status, 1),
  ('How PoolParty Works', 'how-it-works', 'PoolParty is designed around private groups, prediction pools, locked picks, outcomes, and trust scores.', 'Learn how PoolParty works step by step.', 'published'::public.cms_page_status, 1),
  ('Safety & Trust Center', 'safety', 'PoolParty is built around trust, transparency, and responsible participation.', 'Learn about PoolParty safety features and trust scores.', 'published'::public.cms_page_status, 1),
  ('Community Guidelines', 'community-guidelines', 'PoolParty is for friendly, private, and transparent prediction-based engagement.', 'PoolParty community guidelines and rules.', 'published'::public.cms_page_status, 1)
ON CONFLICT (slug) DO NOTHING;

-- Seed Legal Documents
INSERT INTO public.legal_documents (document_type, version_number, title, body, effective_date, requires_reacceptance, status) VALUES
  ('terms'::public.legal_doc_type, '1.0', 'Terms of Service', 'Welcome to PoolParty. These Terms of Service govern your access to and use of the PoolParty application.', CURRENT_DATE, false, 'published'::public.legal_doc_status),
  ('privacy'::public.legal_doc_type, '1.0', 'Privacy Policy', 'PoolParty respects user privacy. This Privacy Policy explains what information we collect, how we use it, and the choices users have.', CURRENT_DATE, false, 'published'::public.legal_doc_status)
ON CONFLICT DO NOTHING;

-- Seed Release Notes
INSERT INTO public.release_notes (version, release_date, title, description, new_features, improvements, status) VALUES
  ('1.0.0', CURRENT_DATE, 'Initial Release', 'PoolParty is live! Create private prediction pools with friends.', 'Private groups, prediction pools, trust scores, dispute center', 'Performance optimizations and UI polish', 'published'::public.release_note_status)
ON CONFLICT DO NOTHING;
