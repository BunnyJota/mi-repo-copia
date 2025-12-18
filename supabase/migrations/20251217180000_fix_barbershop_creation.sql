-- Function to create barbershop during registration (bypasses RLS)
-- This allows creating a barbershop even if email confirmation is required
CREATE OR REPLACE FUNCTION public.create_barbershop_for_user(
  _user_id UUID,
  _barbershop_name TEXT,
  _barbershop_slug TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _barbershop_id UUID;
  _trial_ends_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Create the barbershop
  INSERT INTO public.barbershops (name, slug)
  VALUES (_barbershop_name, _barbershop_slug)
  RETURNING id INTO _barbershop_id;

  -- Update the user's profile with barbershop_id
  UPDATE public.profiles
  SET barbershop_id = _barbershop_id
  WHERE user_id = _user_id;

  -- Assign owner role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'owner')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create default availability rules (Mon-Sat 10:00-20:00)
  INSERT INTO public.availability_rules (barbershop_id, day_of_week, open_time, close_time, is_enabled)
  VALUES
    (_barbershop_id, 1, '10:00:00', '20:00:00', true), -- Monday
    (_barbershop_id, 2, '10:00:00', '20:00:00', true), -- Tuesday
    (_barbershop_id, 3, '10:00:00', '20:00:00', true), -- Wednesday
    (_barbershop_id, 4, '10:00:00', '20:00:00', true), -- Thursday
    (_barbershop_id, 5, '10:00:00', '20:00:00', true), -- Friday
    (_barbershop_id, 6, '10:00:00', '20:00:00', true); -- Saturday

  -- Create subscription with 30-day trial
  _trial_ends_at := now() + INTERVAL '30 days';
  INSERT INTO public.subscriptions (barbershop_id, status, trial_ends_at)
  VALUES (_barbershop_id, 'trial', _trial_ends_at);

  RETURN _barbershop_id;
END;
$$;
