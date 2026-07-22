-- Settlement Badges Metrics Migration
-- Adds on_time_percentage recalculation on settlement confirmation
-- and a helper view for badge eligibility

-- ─── Update on_time_percentage when a settlement is confirmed ────────────────

CREATE OR REPLACE FUNCTION public.recalculate_on_time_percentage(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total INTEGER;
  v_on_time INTEGER;
  v_pct NUMERIC(5,2);
BEGIN
  -- Count total confirmed settlements for this payer
  SELECT COUNT(*) INTO v_total
  FROM public.settlements
  WHERE payer_id = p_user_id
    AND settlement_status = 'confirmed_received';

  IF v_total = 0 THEN
    RETURN;
  END IF;

  -- Count on-time: confirmed before or on due_date (or no due_date = on time)
  SELECT COUNT(*) INTO v_on_time
  FROM public.settlements s
  LEFT JOIN public.settlement_confirmations sc ON sc.settlement_id = s.id
  WHERE s.payer_id = p_user_id
    AND s.settlement_status = 'confirmed_received'
    AND (s.due_date IS NULL OR sc.payer_confirmed_at <= s.due_date);

  v_pct := ROUND((v_on_time::NUMERIC / v_total::NUMERIC) * 100, 2);

  UPDATE public.user_reputation
  SET on_time_percentage = v_pct,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- ─── Extend the settlement status trigger to recalculate on_time_percentage ──

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

  -- On confirmed_received: boost payer reliability, update totals, recalc on_time
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

    -- Recalculate on_time_percentage for payer
    PERFORM public.recalculate_on_time_percentage(NEW.payer_id);
  END IF;

  -- On overdue: penalize payer
  IF NEW.settlement_status = 'overdue' AND OLD.settlement_status != 'overdue' THEN
    UPDATE public.user_reputation
    SET
      reliability_score = GREATEST(0, reliability_score - 5),
      unpaid_count = unpaid_count + 1,
      trust_score = GREATEST(0, trust_score - 2),
      updated_at = now()
    WHERE user_id = NEW.payer_id;
  END IF;

  RETURN NEW;
END;
$$;

-- ─── Badge eligibility view (read-only, used for admin/analytics) ─────────────

CREATE OR REPLACE VIEW public.settlement_badge_eligibility AS
SELECT
  ur.user_id,
  up.full_name,
  up.username,
  ur.trust_score,
  ur.reliability_score,
  ur.on_time_percentage,
  ur.unpaid_count,
  ur.dispute_count,
  ur.total_paid,
  ur.total_received,
  (ur.total_paid + ur.total_received) AS total_settlements_value,
  -- Badge flags
  CASE WHEN ur.trust_score >= 80 AND ur.unpaid_count = 0
            AND (ur.total_paid + ur.total_received) >= 300 THEN true ELSE false END AS badge_trusted_payer,
  CASE WHEN ur.on_time_percentage >= 90
            AND (ur.total_paid + ur.total_received) >= 300 THEN true ELSE false END AS badge_fast_payer,
  CASE WHEN ur.unpaid_count = 0
            AND (ur.total_paid + ur.total_received) >= 500 THEN true ELSE false END AS badge_100_paid,
  CASE WHEN ur.reliability_score >= 85 AND ur.dispute_count = 0
            AND (ur.total_paid + ur.total_received) >= 500 THEN true ELSE false END AS badge_verified_settler
FROM public.user_reputation ur
LEFT JOIN public.user_profiles up ON up.id = ur.user_id;

-- Grant select on the view to authenticated users
GRANT SELECT ON public.settlement_badge_eligibility TO authenticated;
