-- Settlement Optimizer Migration
-- Tables: payment_methods, settlements, settlement_confirmations, settlement_disputes, user_reputation

-- ─── ENUMS ────────────────────────────────────────────────────────────────────

DROP TYPE IF EXISTS public.payment_method_type CASCADE;
CREATE TYPE public.payment_method_type AS ENUM ('zelle', 'venmo', 'cash_app', 'apple_pay', 'paypal', 'other');

DROP TYPE IF EXISTS public.settlement_status CASCADE;
CREATE TYPE public.settlement_status AS ENUM ('pending', 'claimed_paid', 'confirmed_received', 'disputed', 'overdue', 'cancelled');

DROP TYPE IF EXISTS public.dispute_status_type CASCADE;
CREATE TYPE public.dispute_status_type AS ENUM ('open', 'under_review', 'resolved', 'escalated');

DROP TYPE IF EXISTS public.reminder_interval CASCADE;
CREATE TYPE public.reminder_interval AS ENUM ('24h', '72h', '7d', '14d');

-- ─── TABLES ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  method_type public.payment_method_type NOT NULL,
  username TEXT,
  payment_url TEXT,
  qr_code_url TEXT,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID REFERENCES public.pools(id) ON DELETE SET NULL,
  payer_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  settlement_status public.settlement_status DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settlement_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
  payer_confirmed_at TIMESTAMPTZ,
  recipient_confirmed_at TIMESTAMPTZ,
  proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settlement_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  dispute_status public.dispute_status_type DEFAULT 'open',
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_reputation (
  user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  trust_score NUMERIC(5,2) DEFAULT 100.0,
  reliability_score NUMERIC(5,2) DEFAULT 100.0,
  unpaid_count INTEGER DEFAULT 0,
  dispute_count INTEGER DEFAULT 0,
  total_paid NUMERIC(12,2) DEFAULT 0,
  total_received NUMERIC(12,2) DEFAULT 0,
  on_time_percentage NUMERIC(5,2) DEFAULT 100.0,
  pools_won INTEGER DEFAULT 0,
  pools_lost INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settlement_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
  interval_type public.reminder_interval NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  sent_to UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.settlement_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_status public.settlement_status,
  new_status public.settlement_status,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_payer_id ON public.settlements(payer_id);
CREATE INDEX IF NOT EXISTS idx_settlements_recipient_id ON public.settlements(recipient_id);
CREATE INDEX IF NOT EXISTS idx_settlements_pool_id ON public.settlements(pool_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON public.settlements(settlement_status);
CREATE INDEX IF NOT EXISTS idx_settlement_confirmations_settlement_id ON public.settlement_confirmations(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_disputes_settlement_id ON public.settlement_disputes(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_audit_logs_settlement_id ON public.settlement_audit_logs(settlement_id);

-- ─── FUNCTIONS ────────────────────────────────────────────────────────────────

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

-- Upsert user_reputation row when a settlement status changes
CREATE OR REPLACE FUNCTION public.update_reputation_on_settlement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure reputation rows exist for both parties
  INSERT INTO public.user_reputation (user_id)
  VALUES (NEW.payer_id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_reputation (user_id)
  VALUES (NEW.recipient_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- On confirmed_received: boost payer reliability, update totals
  IF NEW.settlement_status = 'confirmed_received' AND OLD.settlement_status != 'confirmed_received' THEN
    UPDATE public.user_reputation
    SET
      reliability_score = LEAST(100, reliability_score + 2),
      trust_score = LEAST(100, trust_score + 1),
      total_paid = total_paid + NEW.amount,
      updated_at = now()
    WHERE user_id = NEW.payer_id;

    UPDATE public.user_reputation
    SET
      total_received = total_received + NEW.amount,
      updated_at = now()
    WHERE user_id = NEW.recipient_id;
  END IF;

  -- On overdue: penalize payer
  IF NEW.settlement_status = 'overdue' AND OLD.settlement_status != 'overdue' THEN
    UPDATE public.user_reputation
    SET
      reliability_score = GREATEST(0, reliability_score - 5),
      unpaid_count = unpaid_count + 1,
      updated_at = now()
    WHERE user_id = NEW.payer_id;
  END IF;

  -- Log the status change
  IF NEW.settlement_status != OLD.settlement_status THEN
    INSERT INTO public.settlement_audit_logs (settlement_id, action, old_status, new_status)
    VALUES (NEW.id, 'status_changed', OLD.settlement_status, NEW.settlement_status);
  END IF;

  RETURN NEW;
END;
$$;

-- On dispute opened: flag account
CREATE OR REPLACE FUNCTION public.update_reputation_on_dispute()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payer_id UUID;
BEGIN
  SELECT payer_id INTO v_payer_id FROM public.settlements WHERE id = NEW.settlement_id LIMIT 1;

  IF v_payer_id IS NOT NULL THEN
    INSERT INTO public.user_reputation (user_id)
    VALUES (v_payer_id)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE public.user_reputation
    SET
      dispute_count = dispute_count + 1,
      trust_score = GREATEST(0, trust_score - 3),
      updated_at = now()
    WHERE user_id = v_payer_id;
  END IF;

  RETURN NEW;
END;
$$;

-- ─── ENABLE RLS ───────────────────────────────────────────────────────────────

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── RLS POLICIES ─────────────────────────────────────────────────────────────

-- payment_methods
DROP POLICY IF EXISTS "users_manage_own_payment_methods" ON public.payment_methods;
CREATE POLICY "users_manage_own_payment_methods"
ON public.payment_methods FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_view_others_payment_methods" ON public.payment_methods;
CREATE POLICY "users_view_others_payment_methods"
ON public.payment_methods FOR SELECT TO authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "admin_all_payment_methods" ON public.payment_methods;
CREATE POLICY "admin_all_payment_methods"
ON public.payment_methods FOR ALL TO authenticated
USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- settlements
DROP POLICY IF EXISTS "users_view_own_settlements" ON public.settlements;
CREATE POLICY "users_view_own_settlements"
ON public.settlements FOR SELECT TO authenticated
USING (payer_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "users_insert_settlements" ON public.settlements;
CREATE POLICY "users_insert_settlements"
ON public.settlements FOR INSERT TO authenticated
WITH CHECK (payer_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_settlements" ON public.settlements;
CREATE POLICY "users_update_own_settlements"
ON public.settlements FOR UPDATE TO authenticated
USING (payer_id = auth.uid() OR recipient_id = auth.uid())
WITH CHECK (payer_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "admin_all_settlements" ON public.settlements;
CREATE POLICY "admin_all_settlements"
ON public.settlements FOR ALL TO authenticated
USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- settlement_confirmations
DROP POLICY IF EXISTS "users_view_own_confirmations" ON public.settlement_confirmations;
CREATE POLICY "users_view_own_confirmations"
ON public.settlement_confirmations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.settlements s
    WHERE s.id = settlement_id
    AND (s.payer_id = auth.uid() OR s.recipient_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "users_manage_own_confirmations" ON public.settlement_confirmations;
CREATE POLICY "users_manage_own_confirmations"
ON public.settlement_confirmations FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.settlements s
    WHERE s.id = settlement_id
    AND (s.payer_id = auth.uid() OR s.recipient_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.settlements s
    WHERE s.id = settlement_id
    AND (s.payer_id = auth.uid() OR s.recipient_id = auth.uid())
  )
);

-- settlement_disputes
DROP POLICY IF EXISTS "users_view_own_disputes" ON public.settlement_disputes;
CREATE POLICY "users_view_own_disputes"
ON public.settlement_disputes FOR SELECT TO authenticated
USING (
  opened_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.settlements s
    WHERE s.id = settlement_id
    AND (s.payer_id = auth.uid() OR s.recipient_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "users_create_disputes" ON public.settlement_disputes;
CREATE POLICY "users_create_disputes"
ON public.settlement_disputes FOR INSERT TO authenticated
WITH CHECK (opened_by = auth.uid());

DROP POLICY IF EXISTS "admin_all_disputes" ON public.settlement_disputes;
CREATE POLICY "admin_all_disputes"
ON public.settlement_disputes FOR ALL TO authenticated
USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- user_reputation
DROP POLICY IF EXISTS "users_view_all_reputation" ON public.user_reputation;
CREATE POLICY "users_view_all_reputation"
ON public.user_reputation FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "system_manage_reputation" ON public.user_reputation;
CREATE POLICY "system_manage_reputation"
ON public.user_reputation FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_admin_user())
WITH CHECK (user_id = auth.uid() OR public.is_admin_user());

-- settlement_reminders
DROP POLICY IF EXISTS "users_view_own_reminders" ON public.settlement_reminders;
CREATE POLICY "users_view_own_reminders"
ON public.settlement_reminders FOR SELECT TO authenticated
USING (sent_to = auth.uid());

-- settlement_audit_logs (immutable - insert only, no update/delete)
DROP POLICY IF EXISTS "users_view_own_audit_logs" ON public.settlement_audit_logs;
CREATE POLICY "users_view_own_audit_logs"
ON public.settlement_audit_logs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.settlements s
    WHERE s.id = settlement_id
    AND (s.payer_id = auth.uid() OR s.recipient_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "admin_view_all_audit_logs" ON public.settlement_audit_logs;
CREATE POLICY "admin_view_all_audit_logs"
ON public.settlement_audit_logs FOR SELECT TO authenticated
USING (public.is_admin_user());

-- ─── TRIGGERS ─────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_settlement_status_change ON public.settlements;
CREATE TRIGGER on_settlement_status_change
AFTER UPDATE ON public.settlements
FOR EACH ROW
EXECUTE FUNCTION public.update_reputation_on_settlement();

DROP TRIGGER IF EXISTS on_dispute_opened ON public.settlement_disputes;
CREATE TRIGGER on_dispute_opened
AFTER INSERT ON public.settlement_disputes
FOR EACH ROW
EXECUTE FUNCTION public.update_reputation_on_dispute();
