-- Forzar políticas públicas de booking (anon/auth) tras cambios previos no aplicados

-- APPOINTMENTS: limpiar todas las políticas y recrear las de inserción pública
DROP POLICY IF EXISTS "Public can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public insert appointments (anon)" ON public.appointments;
DROP POLICY IF EXISTS "Public insert appointments (auth)" ON public.appointments;
DROP POLICY IF EXISTS "Barbershop members can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff can view own appointments" ON public.appointments;

CREATE POLICY "Public insert appointments (anon)"
ON public.appointments
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Public insert appointments (auth)"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Barbershop members can manage appointments"
ON public.appointments
FOR ALL
TO public
USING (public.user_belongs_to_barbershop(auth.uid(), barbershop_id));

CREATE POLICY "Staff can view own appointments"
ON public.appointments
FOR SELECT
TO public
USING (auth.uid() = staff_user_id);

-- APPOINTMENT_SERVICES: limpiar duplicados y dejar una sola política de insert
DROP POLICY IF EXISTS "Public can insert appointment services" ON public.appointment_services;
DROP POLICY IF EXISTS "Public can insert appointment services for booking" ON public.appointment_services;
DROP POLICY IF EXISTS "Public can manage appointment services" ON public.appointment_services;
DROP POLICY IF EXISTS "Public can select appointment services" ON public.appointment_services;

CREATE POLICY "Public can insert appointment services"
ON public.appointment_services
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can select appointment services"
ON public.appointment_services
FOR SELECT
TO public
USING (true);
