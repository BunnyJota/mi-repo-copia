-- Function to assign role to a user in the same barbershop (bypasses RLS)
-- This allows owners/managers to assign roles to staff members
CREATE OR REPLACE FUNCTION public.assign_role_to_user(
  _target_user_id UUID,
  _role app_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_user_id UUID;
  _caller_barbershop_id UUID;
  _target_barbershop_id UUID;
BEGIN
  -- Get the authenticated user (caller)
  _caller_user_id := auth.uid();
  
  IF _caller_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get caller's barbershop_id
  SELECT barbershop_id INTO _caller_barbershop_id
  FROM public.profiles
  WHERE user_id = _caller_user_id;

  IF _caller_barbershop_id IS NULL THEN
    RAISE EXCEPTION 'Caller must belong to a barbershop';
  END IF;

  -- Get target user's barbershop_id
  SELECT barbershop_id INTO _target_barbershop_id
  FROM public.profiles
  WHERE user_id = _target_user_id;

  IF _target_barbershop_id IS NULL THEN
    RAISE EXCEPTION 'Target user must belong to a barbershop';
  END IF;

  -- Verify both users belong to the same barbershop
  IF _caller_barbershop_id != _target_barbershop_id THEN
    RAISE EXCEPTION 'Users must belong to the same barbershop';
  END IF;

  -- Verify caller has permission (owner or manager)
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _caller_user_id
      AND role IN ('owner', 'manager', 'super_admin')
    )
  ) THEN
    RAISE EXCEPTION 'Only owners, managers, or super admins can assign roles';
  END IF;

  -- Assign the role (with conflict handling)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN TRUE;
END;
$$;
