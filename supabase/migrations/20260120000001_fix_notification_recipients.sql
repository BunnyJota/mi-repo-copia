-- ============================================
-- FIX: Mejorar función get_notification_recipients
-- ============================================
-- Corrige problemas con casos edge: sin owner, múltiples owners, etc.

-- Reemplazar la función con una versión mejorada
CREATE OR REPLACE FUNCTION public.get_notification_recipients(_appointment_id UUID)
RETURNS TABLE(user_id UUID, is_owner BOOLEAN)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH owner_query AS (
    -- Owner del barbershop (solo uno, el primero encontrado)
    SELECT DISTINCT ON (p.user_id) p.user_id as id, true as is_owner
    FROM public.appointments a
    JOIN public.barbershops b ON b.id = a.barbershop_id
    JOIN public.profiles p ON p.barbershop_id = b.id
    JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role = 'owner'
    WHERE a.id = _appointment_id
    LIMIT 1
  ),
  staff_query AS (
    -- Staff asignado a la cita (si existe)
    SELECT a.staff_user_id as id, false as is_owner
    FROM public.appointments a
    WHERE a.id = _appointment_id 
      AND a.staff_user_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.user_id = a.staff_user_id
      )
  )
  SELECT DISTINCT u.id, u.is_owner
  FROM (
    SELECT id, is_owner FROM owner_query
    UNION
    SELECT id, is_owner FROM staff_query
  ) u
  WHERE u.id IS NOT NULL;
END;
$$;

-- Agregar comentario
COMMENT ON FUNCTION public.get_notification_recipients(UUID) IS 
'Retorna los destinatarios de notificaciones para una cita: el owner del barbershop y el staff asignado (si existe). Maneja casos edge como múltiples owners o staff inexistente.';
