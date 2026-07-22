-- PoolParty: Payment Methods & Settlement Notification System
-- Adds payment_methods to user_profiles and winner_payment_methods to settlement_items

-- Add payment_methods column to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]'::jsonb;

-- Add winner_payment_methods snapshot to settlement_items (captured at resolution time)
ALTER TABLE public.settlement_items
ADD COLUMN IF NOT EXISTS winner_payment_methods JSONB DEFAULT '[]'::jsonb;

-- Add pool_title for display convenience
ALTER TABLE public.settlement_items
ADD COLUMN IF NOT EXISTS pool_title TEXT DEFAULT '';

-- Add payer_name and receiver_name for display convenience
ALTER TABLE public.settlement_items
ADD COLUMN IF NOT EXISTS payer_name TEXT DEFAULT '';

ALTER TABLE public.settlement_items
ADD COLUMN IF NOT EXISTS receiver_name TEXT DEFAULT '';
