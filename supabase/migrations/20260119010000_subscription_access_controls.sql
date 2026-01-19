-- ============================================
-- SUBSCRIPTION ACCESS CONTROLS + PAYPAL CONFIG
-- ============================================

-- Configuración de PayPal (producto/plan reutilizable)
CREATE TABLE IF NOT EXISTS public.paypal_billing_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paypal_product_id TEXT NOT NULL,
  paypal_trial_plan_id TEXT NOT NULL,
  paypal_regular_plan_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.paypal_billing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage paypal config" ON public.paypal_billing_config
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Campos adicionales para suscripciones
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMP WITH TIME ZONE;

-- Helper: validar acceso por suscripción
CREATE OR REPLACE FUNCTION public.subscription_has_access(_barbershop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.barbershop_id = _barbershop_id
      AND (
        s.status = 'active'
        OR (
          s.status = 'trial'
          AND (s.trial_ends_at IS NULL OR s.trial_ends_at > now())
        )
      )
  )
$$;

-- Helper: validar acceso usando appointment_id
CREATE OR REPLACE FUNCTION public.subscription_has_access_for_appointment(_appointment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.subscription_has_access(a.barbershop_id)
  FROM public.appointments a
  WHERE a.id = _appointment_id
  LIMIT 1
$$;

-- Helper: verificar si el usuario actual es owner del barbershop
CREATE OR REPLACE FUNCTION public.is_owner(_barbershop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'owner'
      AND p.barbershop_id = _barbershop_id
  )
$$;

-- =====================
-- ACTUALIZAR POLICIES
-- =====================

-- Appointments
DROP POLICY IF EXISTS "Barbershop members can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Barbershop members can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Barbershop members can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Barbershop members can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owners can delete appointments" ON public.appointments;

-- Permitir SELECT/INSERT/UPDATE a miembros del barbershop
CREATE POLICY "Barbershop members can view appointments" ON public.appointments
  FOR SELECT USING (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  );

CREATE POLICY "Barbershop members can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  );

CREATE POLICY "Barbershop members can update appointments" ON public.appointments
  FOR UPDATE USING (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  )
  WITH CHECK (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  );

-- Solo owners pueden eliminar
CREATE POLICY "Owners can delete appointments" ON public.appointments
  FOR DELETE USING (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
    AND public.is_owner(barbershop_id)
  );

-- Mantener política pública para reservas públicas
DROP POLICY IF EXISTS "Public can insert appointments" ON public.appointments;
CREATE POLICY "Public can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (public.subscription_has_access(barbershop_id));

-- Clients
DROP POLICY IF EXISTS "Barbershop members can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Barbershop members can view clients" ON public.clients;
DROP POLICY IF EXISTS "Barbershop members can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Barbershop members can update clients" ON public.clients;
DROP POLICY IF EXISTS "Owners can delete clients" ON public.clients;

-- Permitir SELECT/INSERT/UPDATE a miembros del barbershop
CREATE POLICY "Barbershop members can view clients" ON public.clients
  FOR SELECT USING (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  );

CREATE POLICY "Barbershop members can insert clients" ON public.clients
  FOR INSERT WITH CHECK (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  );

CREATE POLICY "Barbershop members can update clients" ON public.clients
  FOR UPDATE USING (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  )
  WITH CHECK (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  );

-- Solo owners pueden eliminar
CREATE POLICY "Owners can delete clients" ON public.clients
  FOR DELETE USING (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
    AND public.is_owner(barbershop_id)
  );

-- Mantener política pública para reservas públicas
DROP POLICY IF EXISTS "Public can insert clients for booking" ON public.clients;
CREATE POLICY "Public can insert clients for booking" ON public.clients
  FOR INSERT WITH CHECK (public.subscription_has_access(barbershop_id));

-- Services
DROP POLICY IF EXISTS "Barbershop members can manage services" ON public.services;
CREATE POLICY "Barbershop members can manage services" ON public.services
  FOR ALL USING (public.user_belongs_to_barbershop(auth.uid(), barbershop_id))
  WITH CHECK (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  );

-- Staff profiles
DROP POLICY IF EXISTS "Barbershop members can manage staff" ON public.staff_profiles;
DROP POLICY IF EXISTS "Barbershop members can view staff" ON public.staff_profiles;
DROP POLICY IF EXISTS "Barbershop members can insert staff" ON public.staff_profiles;
DROP POLICY IF EXISTS "Barbershop members can update staff" ON public.staff_profiles;
DROP POLICY IF EXISTS "Owners can delete staff" ON public.staff_profiles;

-- Permitir SELECT/INSERT/UPDATE a miembros del barbershop
CREATE POLICY "Barbershop members can view staff" ON public.staff_profiles
  FOR SELECT USING (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  );

CREATE POLICY "Barbershop members can insert staff" ON public.staff_profiles
  FOR INSERT WITH CHECK (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  );

CREATE POLICY "Barbershop members can update staff" ON public.staff_profiles
  FOR UPDATE USING (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  )
  WITH CHECK (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  );

-- Solo owners pueden eliminar
CREATE POLICY "Owners can delete staff" ON public.staff_profiles
  FOR DELETE USING (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
    AND public.is_owner(barbershop_id)
  );

-- Availability rules
DROP POLICY IF EXISTS "Barbershop members can manage availability" ON public.availability_rules;
CREATE POLICY "Barbershop members can manage availability" ON public.availability_rules
  FOR ALL USING (public.user_belongs_to_barbershop(auth.uid(), barbershop_id))
  WITH CHECK (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  );

-- Staff availability rules
DROP POLICY IF EXISTS "Staff can manage own availability" ON public.staff_availability_rules;
CREATE POLICY "Staff can manage own availability" ON public.staff_availability_rules
  FOR ALL USING (auth.uid() = staff_user_id)
  WITH CHECK (
    auth.uid() = staff_user_id
    AND public.subscription_has_access(barbershop_id)
  );

DROP POLICY IF EXISTS "Barbershop members can manage staff availability" ON public.staff_availability_rules;
CREATE POLICY "Barbershop members can manage staff availability" ON public.staff_availability_rules
  FOR ALL USING (public.user_belongs_to_barbershop(auth.uid(), barbershop_id))
  WITH CHECK (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  );

-- Time blocks
DROP POLICY IF EXISTS "Staff can manage own blocks" ON public.time_blocks;
CREATE POLICY "Staff can manage own blocks" ON public.time_blocks
  FOR ALL USING (auth.uid() = staff_user_id)
  WITH CHECK (
    auth.uid() = staff_user_id
    AND public.subscription_has_access(barbershop_id)
  );

DROP POLICY IF EXISTS "Barbershop members can manage blocks" ON public.time_blocks;
CREATE POLICY "Barbershop members can manage blocks" ON public.time_blocks
  FOR ALL USING (public.user_belongs_to_barbershop(auth.uid(), barbershop_id))
  WITH CHECK (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  );

-- Appointment services
DROP POLICY IF EXISTS "Public can manage appointment services" ON public.appointment_services;
CREATE POLICY "Public can manage appointment services" ON public.appointment_services
  FOR ALL USING (public.subscription_has_access_for_appointment(appointment_id))
  WITH CHECK (public.subscription_has_access_for_appointment(appointment_id));

-- Appointment links
DROP POLICY IF EXISTS "Public can insert appointment links" ON public.appointment_links;
CREATE POLICY "Public can insert appointment links" ON public.appointment_links
  FOR INSERT WITH CHECK (public.subscription_has_access_for_appointment(appointment_id));
