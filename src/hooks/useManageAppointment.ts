import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ManagedAppointment {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  total_price_estimated: number;
  client: {
    name: string;
    email: string;
  };
  staff: {
    display_name: string;
    photo_url: string | null;
  };
  barbershop: {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    logo_url: string | null;
    brand_accent: string;
    timezone: string;
    slot_interval_minutes: number;
    buffer_minutes: number;
    booking_window_days: number;
    min_advance_hours: number;
  };
  services: {
    name: string;
    price: number;
    duration_min: number;
  }[];
}

export function useAppointmentByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["appointment-by-token", token],
    queryFn: async () => {
      if (!token) return null;

      // First find the link
      const { data: link, error: linkError } = await supabase
        .from("appointment_links")
        .select("appointment_id, expires_at, used_at")
        .eq("token", token)
        .eq("purpose", "manage")
        .maybeSingle();

      if (linkError || !link) {
        console.error("Link not found:", linkError);
        return { error: "invalid" as const };
      }

      // Check if expired
      if (new Date(link.expires_at) < new Date()) {
        return { error: "expired" as const };
      }

      // Fetch appointment data
      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .select(`
          id,
          start_at,
          end_at,
          status,
          total_price_estimated,
          client:clients!appointments_client_id_fkey(name, email),
          staff:staff_profiles!inner(display_name, photo_url),
          barbershop:barbershops!appointments_barbershop_id_fkey(
            id, name, slug, address, phone, logo_url, brand_accent, timezone,
            slot_interval_minutes, buffer_minutes, booking_window_days, min_advance_hours
          ),
          appointment_services(
            service:services(name, price, duration_min)
          )
        `)
        .eq("id", link.appointment_id)
        .single();

      if (appointmentError || !appointment) {
        console.error("Appointment not found:", appointmentError);
        return { error: "not_found" as const };
      }

      const clientData = Array.isArray(appointment.client) ? appointment.client[0] : appointment.client;
      const staffData = Array.isArray(appointment.staff) ? appointment.staff[0] : appointment.staff;
      const barbershopData = Array.isArray(appointment.barbershop) ? appointment.barbershop[0] : appointment.barbershop;

      return {
        appointment: {
          id: appointment.id,
          start_at: appointment.start_at,
          end_at: appointment.end_at,
          status: appointment.status,
          total_price_estimated: appointment.total_price_estimated,
          client: clientData,
          staff: staffData,
          barbershop: barbershopData,
          services: appointment.appointment_services.map((as: any) => ({
            name: as.service.name,
            price: as.service.price,
            duration_min: as.service.duration_min,
          })),
        } as ManagedAppointment,
      };
    },
    enabled: !!token,
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ appointmentId, token }: { appointmentId: string; token: string }) => {
      // Update appointment status
      const { error } = await supabase
        .from("appointments")
        .update({ status: "canceled" })
        .eq("id", appointmentId);

      if (error) throw error;

      // Mark token as used
      await supabase
        .from("appointment_links")
        .update({ used_at: new Date().toISOString() })
        .eq("token", token);

      // Send cancellation email
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            type: "cancellation",
            appointmentId,
          },
        });
      } catch (emailErr) {
        console.error("Failed to send cancellation email:", emailErr);
      }

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["appointment-by-token", variables.token] });
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      token,
      newStartAt,
      newEndAt,
      newStaffUserId,
    }: {
      appointmentId: string;
      token: string;
      newStartAt: Date;
      newEndAt: Date;
      newStaffUserId?: string;
    }) => {
      // Update appointment
      const updateData: any = {
        start_at: newStartAt.toISOString(),
        end_at: newEndAt.toISOString(),
        status: "rescheduled",
      };

      if (newStaffUserId) {
        updateData.staff_user_id = newStaffUserId;
      }

      const { error } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", appointmentId);

      if (error) throw error;

      // Generate new token for the rescheduled appointment
      const newToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
      const expiresAt = new Date(newStartAt);
      expiresAt.setHours(expiresAt.getHours() + 24);

      await supabase.from("appointment_links").insert({
        appointment_id: appointmentId,
        token: newToken,
        purpose: "manage",
        expires_at: expiresAt.toISOString(),
      });

      // Send reschedule email
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            type: "reschedule",
            appointmentId,
          },
        });
      } catch (emailErr) {
        console.error("Failed to send reschedule email:", emailErr);
      }

      return { success: true, newToken };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["appointment-by-token", variables.token] });
    },
  });
}
