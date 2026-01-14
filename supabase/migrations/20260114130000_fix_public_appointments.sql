-- Normalizar políticas públicas para citas y servicios de citas
-- Objetivo: permitir inserts públicos (anon) sin bloqueo RLS

-- APPOINTMENTS: limpiar y recrear políticas públicas de insert
DROP POLICY IF EXISTS "Public can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public insert appointments (anon)" ON public.appointments;
DROP POLICY IF EXISTS "Public insert appointments (auth)" ON public.appointments;

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

-- APPOINTMENT_SERVICES: eliminar duplicados y dejar una sola política de insert
DROP POLICY IF EXISTS "Public can insert appointment services" ON public.appointment_services;
DROP POLICY IF EXISTS "Public can insert appointment services for booking" ON public.appointment_services;
DROP POLICY IF EXISTS "Public can manage appointment services" ON public.appointment_services;

CREATE POLICY "Public can insert appointment services"
ON public.appointment_services
FOR INSERT
TO public
WITH CHECK (true);
