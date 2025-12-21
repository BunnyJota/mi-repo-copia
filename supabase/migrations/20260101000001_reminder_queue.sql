-- Reminder queue for automated appointment reminders

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_type') THEN
    CREATE TYPE public.reminder_type AS ENUM ('24h', '2h');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_status') THEN
    CREATE TYPE public.reminder_status AS ENUM ('pending', 'sent', 'error');
  END IF;
END$$;

-- Table
CREATE TABLE IF NOT EXISTS public.reminder_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  reminder_type reminder_type NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status reminder_status NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (appointment_id, reminder_type)
);

COMMENT ON TABLE public.reminder_queue IS 'Reminders to send for appointments (24h / 2h).';

-- Function: enqueue_due_reminders
-- Inserts pending reminders for appointments happening soon (24h and 2h before start_at).
CREATE OR REPLACE FUNCTION public.enqueue_due_reminders(window_minutes INTEGER DEFAULT 10)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count INTEGER := 0;
BEGIN
  WITH to_enqueue AS (
    SELECT
      a.id AS appointment_id,
      rt.reminder_type,
      a.start_at AS scheduled_for
    FROM public.appointments a
    JOIN public.barbershops b ON b.id = a.barbershop_id
    CROSS JOIN (
      VALUES ('24h'::reminder_type, INTERVAL '24 hours'),
             ('2h'::reminder_type,  INTERVAL '2 hours')
    ) AS rt(reminder_type, delta)
    WHERE a.status NOT IN ('canceled', 'no_show')
      AND a.start_at > now()
      AND now() >= a.start_at - rt.delta
      AND now() <  a.start_at - rt.delta + (window_minutes || ' minutes')::INTERVAL
  )
  INSERT INTO public.reminder_queue (appointment_id, reminder_type, scheduled_for)
  SELECT appointment_id, reminder_type, scheduled_for
  FROM to_enqueue
  ON CONFLICT (appointment_id, reminder_type) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  RETURN COALESCE(inserted_count, 0);
END;
$$;

COMMENT ON FUNCTION public.enqueue_due_reminders IS 'Enqueue reminders due within the current window (default 10 minutes).';

-- pg_cron job to enqueue reminders every 10 minutes
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('enqueue_reminders');
  EXCEPTION
    WHEN undefined_function THEN
      -- pg_cron not installed; ignore
      NULL;
    WHEN OTHERS THEN
      -- job might not exist; ignore
      NULL;
  END;
END$$;

SELECT cron.schedule(
  'enqueue_reminders',
  '*/10 * * * *',
  $$SELECT public.enqueue_due_reminders(10);$$
);
