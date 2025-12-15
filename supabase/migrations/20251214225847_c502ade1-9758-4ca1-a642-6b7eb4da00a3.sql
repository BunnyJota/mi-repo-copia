-- Create role enum for RBAC
CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'barber', 'super_admin');

-- Create appointment status enum
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'canceled', 'no_show', 'rescheduled');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid');

-- Create payment method enum  
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'other');

-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled', 'inactive');

-- =====================
-- BARBERSHOPS TABLE
-- =====================
CREATE TABLE public.barbershops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  brand_accent TEXT NOT NULL DEFAULT '#E45500',
  is_active BOOLEAN NOT NULL DEFAULT true,
  slot_interval_minutes INTEGER NOT NULL DEFAULT 15,
  buffer_minutes INTEGER NOT NULL DEFAULT 0,
  booking_window_days INTEGER NOT NULL DEFAULT 30,
  min_advance_hours INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- PROFILES TABLE (linked to auth.users)
-- =====================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- USER ROLES TABLE (separate for security)
-- =====================
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- =====================
-- STAFF PROFILES TABLE
-- =====================
CREATE TABLE public.staff_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  photo_url TEXT,
  commission_rate DECIMAL(5,2),
  color_tag TEXT DEFAULT '#E45500',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- SERVICES TABLE
-- =====================
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_min INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- CLIENTS TABLE
-- =====================
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (barbershop_id, email)
);

-- =====================
-- AVAILABILITY RULES TABLE
-- =====================
CREATE TABLE public.availability_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (barbershop_id, day_of_week)
);

-- =====================
-- STAFF AVAILABILITY RULES TABLE
-- =====================
CREATE TABLE public.staff_availability_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (staff_user_id, day_of_week)
);

-- =====================
-- TIME BLOCKS TABLE (for blocking time slots)
-- =====================
CREATE TABLE public.time_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  staff_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- APPOINTMENTS TABLE
-- =====================
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  staff_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status appointment_status NOT NULL DEFAULT 'confirmed',
  notes_internal TEXT,
  notes_client TEXT,
  total_price_estimated DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  payment_method payment_method,
  payment_amount DECIMAL(10,2),
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- APPOINTMENT SERVICES TABLE (many-to-many)
-- =====================
CREATE TABLE public.appointment_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL DEFAULT 1,
  UNIQUE (appointment_id, service_id)
);

-- =====================
-- APPOINTMENT LINKS TABLE (for token-based management)
-- =====================
CREATE TABLE public.appointment_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL DEFAULT 'manage',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- EMAIL LOG TABLE
-- =====================
CREATE TABLE public.email_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- SUBSCRIPTIONS TABLE
-- =====================
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL UNIQUE REFERENCES public.barbershops(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  paypal_plan_id TEXT,
  paypal_subscription_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  last_payment_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- PAYPAL WEBHOOK EVENTS TABLE
-- =====================
CREATE TABLE public.paypal_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending'
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_appointments_barbershop ON public.appointments(barbershop_id);
CREATE INDEX idx_appointments_staff ON public.appointments(staff_user_id);
CREATE INDEX idx_appointments_start ON public.appointments(start_at);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_clients_barbershop ON public.clients(barbershop_id);
CREATE INDEX idx_clients_email ON public.clients(barbershop_id, email);
CREATE INDEX idx_barbershops_slug ON public.barbershops(slug);
CREATE INDEX idx_services_barbershop ON public.services(barbershop_id);
CREATE INDEX idx_staff_profiles_barbershop ON public.staff_profiles(barbershop_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_appointment_links_token ON public.appointment_links(token);

-- =====================
-- FUNCTIONS
-- =====================

-- Function to check if user has a specific role (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's barbershop_id
CREATE OR REPLACE FUNCTION public.get_user_barbershop_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT barbershop_id
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Function to check if user belongs to a barbershop
CREATE OR REPLACE FUNCTION public.user_belongs_to_barbershop(_user_id UUID, _barbershop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND barbershop_id = _barbershop_id
  )
$$;

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for auto-creating profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update triggers for all tables with updated_at
CREATE TRIGGER update_barbershops_updated_at BEFORE UPDATE ON public.barbershops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_staff_profiles_updated_at BEFORE UPDATE ON public.staff_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- ENABLE RLS
-- =====================
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paypal_webhook_events ENABLE ROW LEVEL SECURITY;

-- =====================
-- RLS POLICIES: BARBERSHOPS
-- =====================
-- Public can read active barbershops by slug (for booking page)
CREATE POLICY "Public can read active barbershops by slug" ON public.barbershops
  FOR SELECT USING (is_active = true);

-- Users can manage their own barbershop
CREATE POLICY "Users can manage their own barbershop" ON public.barbershops
  FOR ALL USING (public.user_belongs_to_barbershop(auth.uid(), id));

-- Super admins can manage all barbershops
CREATE POLICY "Super admins can manage all barbershops" ON public.barbershops
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- =====================
-- RLS POLICIES: PROFILES
-- =====================
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view profiles in their barbershop" ON public.profiles
  FOR SELECT USING (
    barbershop_id IS NOT NULL 
    AND public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
  );

-- =====================
-- RLS POLICIES: USER ROLES
-- =====================
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- =====================
-- RLS POLICIES: STAFF PROFILES
-- =====================
CREATE POLICY "Public can view active staff by barbershop" ON public.staff_profiles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can view/update own profile" ON public.staff_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Barbershop members can manage staff" ON public.staff_profiles
  FOR ALL USING (public.user_belongs_to_barbershop(auth.uid(), barbershop_id));

-- =====================
-- RLS POLICIES: SERVICES
-- =====================
CREATE POLICY "Public can read active services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Barbershop members can manage services" ON public.services
  FOR ALL USING (public.user_belongs_to_barbershop(auth.uid(), barbershop_id));

-- =====================
-- RLS POLICIES: CLIENTS
-- =====================
CREATE POLICY "Barbershop members can manage clients" ON public.clients
  FOR ALL USING (public.user_belongs_to_barbershop(auth.uid(), barbershop_id));

-- Allow insert for public booking (no auth required)
CREATE POLICY "Public can insert clients for booking" ON public.clients
  FOR INSERT WITH CHECK (true);

-- =====================
-- RLS POLICIES: AVAILABILITY RULES
-- =====================
CREATE POLICY "Public can read availability rules" ON public.availability_rules
  FOR SELECT USING (true);

CREATE POLICY "Barbershop members can manage availability" ON public.availability_rules
  FOR ALL USING (public.user_belongs_to_barbershop(auth.uid(), barbershop_id));

-- =====================
-- RLS POLICIES: STAFF AVAILABILITY RULES
-- =====================
CREATE POLICY "Public can read staff availability" ON public.staff_availability_rules
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage own availability" ON public.staff_availability_rules
  FOR ALL USING (auth.uid() = staff_user_id);

CREATE POLICY "Barbershop members can manage staff availability" ON public.staff_availability_rules
  FOR ALL USING (public.user_belongs_to_barbershop(auth.uid(), barbershop_id));

-- =====================
-- RLS POLICIES: TIME BLOCKS
-- =====================
CREATE POLICY "Public can read time blocks" ON public.time_blocks
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage own blocks" ON public.time_blocks
  FOR ALL USING (auth.uid() = staff_user_id);

CREATE POLICY "Barbershop members can manage blocks" ON public.time_blocks
  FOR ALL USING (public.user_belongs_to_barbershop(auth.uid(), barbershop_id));

-- =====================
-- RLS POLICIES: APPOINTMENTS
-- =====================
CREATE POLICY "Barbershop members can manage appointments" ON public.appointments
  FOR ALL USING (public.user_belongs_to_barbershop(auth.uid(), barbershop_id));

CREATE POLICY "Staff can view own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = staff_user_id);

-- Allow insert for public booking
CREATE POLICY "Public can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

-- =====================
-- RLS POLICIES: APPOINTMENT SERVICES
-- =====================
CREATE POLICY "Public can manage appointment services" ON public.appointment_services
  FOR ALL USING (true);

-- =====================
-- RLS POLICIES: APPOINTMENT LINKS
-- =====================
CREATE POLICY "Public can read appointment links by token" ON public.appointment_links
  FOR SELECT USING (true);

CREATE POLICY "Public can insert appointment links" ON public.appointment_links
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Barbershop members can manage links" ON public.appointment_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_id
      AND public.user_belongs_to_barbershop(auth.uid(), a.barbershop_id)
    )
  );

-- =====================
-- RLS POLICIES: EMAIL LOG
-- =====================
CREATE POLICY "Barbershop members can view email logs" ON public.email_log
  FOR SELECT USING (
    barbershop_id IS NULL 
    OR public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
  );

CREATE POLICY "System can insert email logs" ON public.email_log
  FOR INSERT WITH CHECK (true);

-- =====================
-- RLS POLICIES: SUBSCRIPTIONS
-- =====================
CREATE POLICY "Barbershop members can view subscription" ON public.subscriptions
  FOR SELECT USING (public.user_belongs_to_barbershop(auth.uid(), barbershop_id));

CREATE POLICY "Owners can manage subscription" ON public.subscriptions
  FOR ALL USING (
    public.user_belongs_to_barbershop(auth.uid(), barbershop_id)
    AND public.has_role(auth.uid(), 'owner')
  );

CREATE POLICY "Super admins can manage all subscriptions" ON public.subscriptions
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- =====================
-- RLS POLICIES: PAYPAL WEBHOOK EVENTS
-- =====================
CREATE POLICY "Super admins can view webhook events" ON public.paypal_webhook_events
  FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert webhook events" ON public.paypal_webhook_events
  FOR INSERT WITH CHECK (true);