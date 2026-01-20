import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "./useUserData";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { toast } from "sonner";

export interface Appointment {
  id: string;
  start_at: string;
  end_at: string;
  status: "pending" | "confirmed" | "completed" | "canceled" | "no_show" | "rescheduled";
  total_price_estimated: number;
  payment_status: "unpaid" | "paid";
  notes_client: string | null;
  notes_internal: string | null;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  staff: {
    id: string;
    display_name: string;
    color_tag: string | null;
  } | null;
  services: {
    id: string;
    name: string;
    price: number;
    duration_min: number;
    qty: number;
  }[];
}

export interface UpcomingAgendaResult {
  items: Appointment[];
  total: number;
}

export function useAppointments(dateFilter?: Date, options?: { refetchInterval?: number }) {
  const { barbershop } = useUserData();

  return useQuery({
    queryKey: ["appointments", barbershop?.id, dateFilter?.toISOString()],
    queryFn: async () => {
      if (!barbershop?.id) return [];

      // First, get appointments
      let query = supabase
        .from("appointments")
        .select(`
          id,
          start_at,
          end_at,
          status,
          total_price_estimated,
          payment_status,
          notes_client,
          notes_internal,
          staff_user_id,
          client:clients!appointments_client_id_fkey(id, name, email, phone),
          appointment_services(
            qty,
            service:services(id, name, price, duration_min)
          )
        `)
        .eq("barbershop_id", barbershop.id)
        .order("start_at", { ascending: true });

      if (dateFilter) {
        // Use barbershop timezone for day boundaries
        const timezone = barbershop.timezone || "America/New_York";
        const dateStr = format(dateFilter, "yyyy-MM-dd");
        // Start of day in barbershop timezone, converted to UTC
        const dayStart = new Date(`${dateStr}T00:00:00`);
        const dayEnd = new Date(`${dateStr}T23:59:59.999`);
        // Convert to UTC considering the barbershop timezone offset
        const dayStartUtc = formatInTimeZone(dayStart, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
        const dayEndUtc = formatInTimeZone(dayEnd, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
        query = query.gte("start_at", dayStartUtc).lte("start_at", dayEndUtc);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching appointments:", error);
        return [];
      }

      if (!data || data.length === 0) return [];

      // Get unique staff_user_ids
      const staffUserIds = [...new Set(data.map((apt: any) => apt.staff_user_id).filter(Boolean))];

      // Fetch staff profiles separately
      let staffMap: Record<string, { id: string; display_name: string; color_tag: string | null }> = {};
      if (staffUserIds.length > 0) {
        const { data: staffData } = await supabase
          .from("staff_profiles")
          .select("id, user_id, display_name, color_tag")
          .eq("barbershop_id", barbershop.id)
          .in("user_id", staffUserIds);
        
        if (staffData) {
          staffData.forEach((staff: any) => {
            staffMap[staff.user_id] = {
              id: staff.id,
              display_name: staff.display_name,
              color_tag: staff.color_tag,
            };
          });
        }
      }

      // Transform data to match the Appointment interface
      return (data || []).map((apt: any) => ({
        id: apt.id,
        start_at: apt.start_at,
        end_at: apt.end_at,
        status: apt.status,
        total_price_estimated: apt.total_price_estimated,
        payment_status: apt.payment_status,
        notes_client: apt.notes_client,
        notes_internal: apt.notes_internal,
        client: apt.client,
        staff: apt.staff_user_id ? staffMap[apt.staff_user_id] || null : null,
        services: (apt.appointment_services || []).map((as: any) => ({
          id: as.service?.id,
          name: as.service?.name,
          price: as.service?.price,
          duration_min: as.service?.duration_min,
          qty: as.qty,
        })),
      })) as Appointment[];
    },
    enabled: !!barbershop?.id,
    refetchInterval: options?.refetchInterval,
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when connection is restored
    // Return empty array when disabled to avoid infinite loading
    placeholderData: [],
  });
}

export function useTodayAppointments(options?: { refetchInterval?: number }) {
  return useAppointments(new Date(), options);
}

export function useUpcomingAgendaAppointments(options?: {
  refetchInterval?: number;
  limit?: number;
}) {
  const { barbershop, profile, isOwner, isManager, isSuperAdmin } = useUserData();
  const limit = options?.limit ?? 15;

  return useQuery({
    queryKey: [
      "upcoming-agenda-appointments",
      barbershop?.id,
      profile?.user_id,
      isOwner,
      isManager,
      isSuperAdmin,
      limit,
    ],
    queryFn: async (): Promise<UpcomingAgendaResult> => {
      if (!barbershop?.id) return { items: [], total: 0 };
      if (!profile?.user_id) return { items: [], total: 0 };

      const timezone = barbershop.timezone || "America/New_York";
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");
      const dayStartUtc = formatInTimeZone(
        new Date(`${todayStr}T00:00:00`),
        timezone,
        "yyyy-MM-dd'T'HH:mm:ssXXX",
      );
      const dayEndUtc = formatInTimeZone(
        new Date(`${todayStr}T23:59:59.999`),
        timezone,
        "yyyy-MM-dd'T'HH:mm:ssXXX",
      );

      const activeStatuses = ["pending", "confirmed", "rescheduled", "no_show"] as const;

      let query = supabase
        .from("appointments")
        .select(
          `
          id,
          start_at,
          end_at,
          status,
          total_price_estimated,
          payment_status,
          notes_client,
          notes_internal,
          staff_user_id,
          client:clients!appointments_client_id_fkey(id, name, email, phone),
          appointment_services(
            qty,
            service:services(id, name, price, duration_min)
          )
        `,
          { count: "exact" },
        )
        .eq("barbershop_id", barbershop.id)
        .gte("start_at", dayStartUtc)
        .lte("start_at", dayEndUtc)
        .in("status", activeStatuses)
        .order("start_at", { ascending: true })
        .range(0, limit - 1);

      if (!isOwner && !isManager && !isSuperAdmin) {
        query = query.eq("staff_user_id", profile.user_id);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching upcoming agenda appointments:", error);
        return { items: [], total: 0 };
      }

      if (!data || data.length === 0) return { items: [], total: count || 0 };

      const staffUserIds = [...new Set(data.map((apt: any) => apt.staff_user_id).filter(Boolean))];
      let staffMap: Record<string, { id: string; display_name: string; color_tag: string | null }> = {};

      if (staffUserIds.length > 0) {
        const { data: staffData } = await supabase
          .from("staff_profiles")
          .select("id, user_id, display_name, color_tag")
          .eq("barbershop_id", barbershop.id)
          .in("user_id", staffUserIds);

        if (staffData) {
          staffData.forEach((staff: any) => {
            staffMap[staff.user_id] = {
              id: staff.id,
              display_name: staff.display_name,
              color_tag: staff.color_tag,
            };
          });
        }
      }

      const items = (data || []).map((apt: any) => ({
        id: apt.id,
        start_at: apt.start_at,
        end_at: apt.end_at,
        status: apt.status,
        total_price_estimated: apt.total_price_estimated,
        payment_status: apt.payment_status,
        notes_client: apt.notes_client,
        notes_internal: apt.notes_internal,
        client: apt.client,
        staff: apt.staff_user_id ? staffMap[apt.staff_user_id] || null : null,
        services: (apt.appointment_services || []).map((as: any) => ({
          id: as.service?.id,
          name: as.service?.name,
          price: as.service?.price,
          duration_min: as.service?.duration_min,
          qty: as.qty,
        })),
      })) as Appointment[];

      return { items, total: count || items.length };
    },
    enabled: !!barbershop?.id && !!profile?.user_id,
    refetchInterval: options?.refetchInterval,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: { items: [], total: 0 },
  });
}

export function useAppointmentStats() {
  const { barbershop } = useUserData();

  return useQuery({
    queryKey: ["appointment-stats", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return null;

      const timezone = barbershop.timezone || "America/New_York";
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");
      
      // Today's boundaries in barbershop timezone
      const todayStart = formatInTimeZone(new Date(`${todayStr}T00:00:00`), timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
      const todayEnd = formatInTimeZone(new Date(`${todayStr}T23:59:59.999`), timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
      
      // Start of week
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const weekStr = format(startOfWeek, "yyyy-MM-dd");
      const weekStart = formatInTimeZone(new Date(`${weekStr}T00:00:00`), timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
      
      // Start of month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStr = format(startOfMonth, "yyyy-MM-dd");
      const monthStart = formatInTimeZone(new Date(`${monthStr}T00:00:00`), timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");

      // Today's appointments with full data
      const { data: todayAppointments } = await supabase
        .from("appointments")
        .select("id, client_id, status, total_price_estimated, payment_status, payment_amount")
        .eq("barbershop_id", barbershop.id)
        .gte("start_at", todayStart)
        .lte("start_at", todayEnd)
        .not("status", "eq", "canceled");

      // This week's appointments
      const { count: weekCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("barbershop_id", barbershop.id)
        .gte("start_at", weekStart)
        .lte("start_at", todayEnd)
        .not("status", "eq", "canceled");

      // This month's revenue (completed appointments)
      const { data: monthRevenue } = await supabase
        .from("appointments")
        .select("total_price_estimated")
        .eq("barbershop_id", barbershop.id)
        .gte("start_at", monthStart)
        .eq("status", "completed");

      const totalRevenue = (monthRevenue || []).reduce(
        (sum, apt) => sum + (apt.total_price_estimated || 0),
        0
      );

      // Calculate today's stats
      const todayCount = todayAppointments?.length || 0;
      const uniqueClientsToday = new Set(todayAppointments?.map((apt: any) => apt.client_id)).size;
      
      // Today's revenue (completed appointments)
      const todayCompleted = todayAppointments?.filter((apt: any) => apt.status === "completed") || [];
      const todayRevenue = todayCompleted.reduce(
        (sum: number, apt: any) => sum + (apt.payment_amount || apt.total_price_estimated || 0),
        0
      );
      
      // Today's paid revenue
      const todayPaidRevenue = todayCompleted
        .filter((apt: any) => apt.payment_status === "paid")
        .reduce((sum: number, apt: any) => sum + (apt.payment_amount || apt.total_price_estimated || 0), 0);
      
      // Pending appointments (not completed, not canceled)
      const pendingCount = todayAppointments?.filter(
        (apt: any) => apt.status !== "completed" && apt.status !== "canceled"
      ).length || 0;

      return {
        todayCount,
        weekCount: weekCount || 0,
        monthRevenue: totalRevenue,
        // New today stats
        uniqueClientsToday,
        todayRevenue,
        todayPaidRevenue,
        pendingCount,
      };
    },
    enabled: !!barbershop?.id,
    refetchInterval: 15000, // Refetch every 15 seconds for real-time updates (reduced from 30s)
    refetchIntervalInBackground: true, // Continue refetching even when tab is in background
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when connection is restored
    // Return default values when disabled to avoid infinite loading
    placeholderData: {
      todayCount: 0,
      weekCount: 0,
      monthRevenue: 0,
      uniqueClientsToday: 0,
      todayRevenue: 0,
      todayPaidRevenue: 0,
      pendingCount: 0,
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  const { barbershop } = useUserData();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Cita eliminada correctamente");
    },
    onError: (error) => {
      toast.error("Error al eliminar la cita: " + error.message);
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Appointment["status"] }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-agenda-appointments"] });
      toast.success("Cita marcada como completada");
    },
    onError: (error) => {
      toast.error("Error al actualizar la cita: " + error.message);
    },
  });
}
