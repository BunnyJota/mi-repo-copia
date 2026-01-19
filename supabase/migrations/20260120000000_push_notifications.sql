-- ============================================
-- PUSH NOTIFICATIONS CON FCM
-- ============================================

-- Tabla para tokens FCM por dispositivo
CREATE TABLE IF NOT EXISTS public.push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL CHECK (device_type IN ('web', 'android', 'ios')),
  device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- Tabla para preferencias de notificaciones
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  new_appointment_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_30min_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_24h_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_2h_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, barbershop_id)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON public.push_notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_barbershop ON public.push_notification_tokens(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_barbershop ON public.notification_preferences(barbershop_id);

-- Función para obtener destinatarios de notificación (owner + staff asignado)
CREATE OR REPLACE FUNCTION public.get_notification_recipients(_appointment_id UUID)
RETURNS TABLE(user_id UUID, is_owner BOOLEAN)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT u.id, u.is_owner
  FROM (
    -- Owner del barbershop
    SELECT p.user_id as id, true as is_owner
    FROM public.appointments a
    JOIN public.barbershops b ON b.id = a.barbershop_id
    JOIN public.profiles p ON p.barbershop_id = b.id
    JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role = 'owner'
    WHERE a.id = _appointment_id
    
    UNION
    
    -- Staff asignado a la cita
    SELECT a.staff_user_id as id, false as is_owner
    FROM public.appointments a
    WHERE a.id = _appointment_id AND a.staff_user_id IS NOT NULL
  ) u;
END;
$$;

-- Función para obtener o crear preferencias por defecto
CREATE OR REPLACE FUNCTION public.get_or_create_notification_preferences(_user_id UUID, _barbershop_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pref_id UUID;
BEGIN
  SELECT id INTO pref_id
  FROM public.notification_preferences
  WHERE user_id = _user_id AND barbershop_id = _barbershop_id;
  
  IF pref_id IS NULL THEN
    INSERT INTO public.notification_preferences (user_id, barbershop_id)
    VALUES (_user_id, _barbershop_id)
    RETURNING id INTO pref_id;
  END IF;
  
  RETURN pref_id;
END;
$$;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_used_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_push_notification_tokens_updated_at 
  BEFORE UPDATE ON public.push_notification_tokens 
  FOR EACH ROW EXECUTE FUNCTION public.update_push_tokens_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON public.notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.push_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: push_notification_tokens
CREATE POLICY "Users can manage own tokens" ON public.push_notification_tokens
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert tokens" ON public.push_notification_tokens
  FOR INSERT WITH CHECK (true);

-- RLS Policies: notification_preferences
CREATE POLICY "Users can view own preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Owners pueden ver preferencias de su barbershop
CREATE POLICY "Owners can view staff preferences" ON public.notification_preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.profiles p ON p.user_id = ur.user_id
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'owner'
        AND p.barbershop_id = notification_preferences.barbershop_id
    )
  );

-- Owners pueden actualizar preferencias de su barbershop
CREATE POLICY "Owners can update staff preferences" ON public.notification_preferences
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.profiles p ON p.user_id = ur.user_id
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'owner'
        AND p.barbershop_id = notification_preferences.barbershop_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.profiles p ON p.user_id = ur.user_id
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'owner'
        AND p.barbershop_id = notification_preferences.barbershop_id
    )
  );
