-- Reforzar políticas para reservas públicas (clientes/citas)
-- Permite inserciones anónimas y lectura mínima necesaria para lookup de cliente.
-- Las políticas se aplican a todos los roles (incluyendo anon) sin restricción TO

-- CLIENTS: permitir insert y select para buscar por email
DROP POLICY IF EXISTS "Public can insert clients for booking" ON public.clients;
DROP POLICY IF EXISTS "Public can select clients for booking" ON public.clients;

CREATE POLICY "Public can insert clients for booking"
ON public.clients
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can select clients for booking"
ON public.clients
FOR SELECT
USING (true);

-- APPOINTMENTS: permitir insert anónimo (la política ya existe, solo la recreamos para asegurar consistencia)
DROP POLICY IF EXISTS "Public can insert appointments" ON public.appointments;

CREATE POLICY "Public can insert appointments"
ON public.appointments
FOR INSERT
WITH CHECK (true);

-- APPOINTMENT_SERVICES: reemplazar política existente para incluir WITH CHECK
-- La política original "Public can manage appointment services" tiene FOR ALL USING (true)
-- pero le falta WITH CHECK (true) para operaciones de INSERT/UPDATE
DROP POLICY IF EXISTS "Public can manage appointment services" ON public.appointment_services;

CREATE POLICY "Public can manage appointment services"
ON public.appointment_services
FOR ALL
USING (true)
WITH CHECK (true);

-- APPOINTMENT_LINKS: permitir insert (la política ya existe, solo la recreamos para asegurar consistencia)
DROP POLICY IF EXISTS "Public can insert appointment links" ON public.appointment_links;

CREATE POLICY "Public can insert appointment links"
ON public.appointment_links
FOR INSERT
WITH CHECK (true);
