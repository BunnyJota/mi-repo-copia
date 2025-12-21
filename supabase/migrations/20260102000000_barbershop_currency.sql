-- Add currency to barbershops (default USD)
ALTER TABLE public.barbershops
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

-- Backfill existing rows if null
UPDATE public.barbershops
SET currency = 'USD'
WHERE currency IS NULL;
