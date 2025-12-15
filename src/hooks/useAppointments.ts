import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "./useUserData";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

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

export function useAppointments(dateFilter?: Date) {
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
  });
}

export function useTodayAppointments() {
  return useAppointments(new Date());
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

      // Today's appointments
      const { count: todayCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
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

      return {
        todayCount: todayCount || 0,
        weekCount: weekCount || 0,
        monthRevenue: totalRevenue,
      };
    },
    enabled: !!barbershop?.id,
  });
}
