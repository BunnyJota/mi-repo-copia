-- Reforzar políticas para reservas públicas (clientes/citas) con rol anon
-- Permite inserciones anónimas y lectura mínima necesaria para lookup de cliente.

-- CLIENTS: permitir insert y select para buscar por email
DROP POLICY IF EXISTS "Public can insert clients for booking" ON public.clients;
DROP POLICY IF EXISTS "Public can select clients for booking" ON public.clients;

CREATE POLICY "Public can insert clients for booking"
ON public.clients
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Public can select clients for booking"
ON public.clients
FOR SELECT
TO anon
USING (true);

-- APPOINTMENTS: permitir insert anónimo
DROP POLICY IF EXISTS "Public can insert appointments" ON public.appointments;

CREATE POLICY "Public can insert appointments"
ON public.appointments
FOR INSERT
TO anon
WITH CHECK (true);

-- APPOINTMENT_SERVICES: permitir insert anónimo
DROP POLICY IF EXISTS "Public can manage appointment services" ON public.appointment_services;
DROP POLICY IF EXISTS "Public can insert appointment services" ON public.appointment_services;

CREATE POLICY "Public can insert appointment services"
ON public.appointment_services
FOR INSERT
TO anon
WITH CHECK (true);

-- APPOINTMENT_LINKS: permitir insert anónimo (para confirmaciones)
DROP POLICY IF EXISTS "Public can insert appointment links" ON public.appointment_links;

CREATE POLICY "Public can insert appointment links"
ON public.appointment_links
FOR INSERT
TO anon
WITH CHECK (true);
