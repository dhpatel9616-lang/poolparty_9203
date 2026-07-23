-- ============================================================
-- Auto-maintain pools.participant_count
--
-- Joining a pool inserts a row into pool_entries as the joining
-- user (not the pool creator), but pools RLS only allows the
-- creator to UPDATE a pool row. Without this trigger,
-- participant_count would stay frozen at whatever it started at,
-- regardless of how many people actually join. This trigger runs
-- as SECURITY DEFINER so it can update the count regardless of
-- who triggered the insert/delete.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_pool_participant_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pool_id UUID;
BEGIN
  v_pool_id := COALESCE(NEW.pool_id, OLD.pool_id);

  IF TG_OP = 'INSERT' THEN
    UPDATE public.pools
    SET participant_count = COALESCE(participant_count, 0) + 1
    WHERE id = NEW.pool_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.pools
    SET participant_count = GREATEST(COALESCE(participant_count, 1) - 1, 0)
    WHERE id = OLD.pool_id;
  END IF;

  -- Recompute per-outcome entry_count/total_stake/percent for every outcome
  -- on this pool, so the vote-distribution bars stay accurate.
  WITH totals AS (
    SELECT outcome_id, COUNT(*) AS cnt, COALESCE(SUM(stake_amount), 0) AS stake
    FROM public.pool_entries
    WHERE pool_id = v_pool_id AND outcome_id IS NOT NULL
    GROUP BY outcome_id
  ),
  pool_total AS (
    SELECT COALESCE(SUM(cnt), 0) AS total_entries FROM totals
  )
  UPDATE public.pool_outcomes po
  SET
    entry_count = COALESCE(t.cnt, 0),
    total_stake = COALESCE(t.stake, 0),
    percent = CASE WHEN pt.total_entries > 0 THEN ROUND(COALESCE(t.cnt, 0)::numeric / pt.total_entries * 100, 1) ELSE 0 END
  FROM pool_total pt
  LEFT JOIN totals t ON t.outcome_id = po.id
  WHERE po.pool_id = v_pool_id;

  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  ELSE
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_pool_participant_count ON public.pool_entries;
CREATE TRIGGER trg_update_pool_participant_count
AFTER INSERT OR DELETE ON public.pool_entries
FOR EACH ROW EXECUTE FUNCTION public.update_pool_participant_count();

-- One-time backfill: correct any pools whose participant_count is
-- already out of sync with their real entry count (e.g. pools created
-- before this trigger existed, or where the count was never accurate).
UPDATE public.pools p
SET participant_count = COALESCE(counts.real_count, 0)
FROM (
  SELECT pool_id, COUNT(*) AS real_count
  FROM public.pool_entries
  GROUP BY pool_id
) counts
WHERE p.id = counts.pool_id
  AND p.participant_count IS DISTINCT FROM counts.real_count;

-- Pools with zero real entries (not covered by the join above)
UPDATE public.pools p
SET participant_count = 0
WHERE p.participant_count IS DISTINCT FROM 0
  AND NOT EXISTS (SELECT 1 FROM public.pool_entries e WHERE e.pool_id = p.id);

-- Same backfill for pool_outcomes (entry_count / total_stake / percent)
WITH totals AS (
  SELECT outcome_id, COUNT(*) AS cnt, COALESCE(SUM(stake_amount), 0) AS stake
  FROM public.pool_entries
  WHERE outcome_id IS NOT NULL
  GROUP BY outcome_id
),
pool_totals AS (
  SELECT po.pool_id, COALESCE(SUM(t.cnt), 0) AS total_entries
  FROM public.pool_outcomes po
  LEFT JOIN totals t ON t.outcome_id = po.id
  GROUP BY po.pool_id
)
UPDATE public.pool_outcomes po
SET
  entry_count = COALESCE(t.cnt, 0),
  total_stake = COALESCE(t.stake, 0),
  percent = CASE WHEN pt.total_entries > 0 THEN ROUND(COALESCE(t.cnt, 0)::numeric / pt.total_entries * 100, 1) ELSE 0 END
FROM pool_totals pt
LEFT JOIN totals t ON t.outcome_id = po.id
WHERE po.pool_id = pt.pool_id
  AND (po.entry_count IS DISTINCT FROM COALESCE(t.cnt, 0)
       OR po.total_stake IS DISTINCT FROM COALESCE(t.stake, 0));
