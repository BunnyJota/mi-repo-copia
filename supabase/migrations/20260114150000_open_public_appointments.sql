-- Política más permisiva para inserts públicos en appointments (rol public)

DROP POLICY IF EXISTS "Public insert appointments (public)" ON public.appointments;

CREATE POLICY "Public insert appointments (public)"
ON public.appointments
FOR INSERT
TO public
WITH CHECK (true);
