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

-- =====================
-- ACTUALIZAR POLICIES
-- =====================

-- Appointments
DROP POLICY IF EXISTS "Barbershop members can manage appointments" ON public.appointments;
CREATE POLICY "Barbershop members can manage appointments" ON public.appointments
  FOR ALL USING (public.user_belongs_to_barbershop(auth.uid(), barbershop_id))
  WITH CHECK (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  );

DROP POLICY IF EXISTS "Public can insert appointments" ON public.appointments;
CREATE POLICY "Public can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (public.subscription_has_access(barbershop_id));

-- Clients
DROP POLICY IF EXISTS "Barbershop members can manage clients" ON public.clients;
CREATE POLICY "Barbershop members can manage clients" ON public.clients
  FOR ALL USING (public.user_belongs_to_barbershop(auth.uid(), barbershop_id))
  WITH CHECK (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
  );

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
CREATE POLICY "Barbershop members can manage staff" ON public.staff_profiles
  FOR ALL USING (public.user_belongs_to_barbershop(auth.uid(), barbershop_id))
  WITH CHECK (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.subscription_has_access(barbershop_id)
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
