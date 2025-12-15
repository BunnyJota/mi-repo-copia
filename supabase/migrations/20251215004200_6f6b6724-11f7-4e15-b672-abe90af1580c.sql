-- Add foreign key relationship between appointments and staff_profiles
-- We need to link appointments.staff_user_id to staff_profiles.user_id

-- First, let's create a proper foreign key constraint
-- Since staff_user_id references a user_id in staff_profiles, we need to create an index first
CREATE INDEX IF NOT EXISTS idx_staff_profiles_user_id ON public.staff_profiles(user_id);

-- Note: We cannot directly create a FK from appointments.staff_user_id to staff_profiles.user_id
-- because user_id in staff_profiles is not unique (a user could have multiple profiles theoretically)
-- Instead, we'll ensure the queries work by matching on user_id properly

-- Add an index for better query performance on appointments.staff_user_id
CREATE INDEX IF NOT EXISTS idx_appointments_staff_user_id ON public.appointments(staff_user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_barbershop_start ON public.appointments(barbershop_id, start_at);