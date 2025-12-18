import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "./useUserData";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, subMonths } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export interface ReportData {
  period: {
    start: string;
    end: string;
    label: string;
  };
  summary: {
    totalAppointments: number;
    completedAppointments: number;
    canceledAppointments: number;
    totalRevenue: number;
    paidRevenue: number;
    unpaidRevenue: number;
  };
  byStaff: Array<{
    staffId: string;
    staffName: string;
    appointmentCount: number;
    revenue: number;
    commission?: number;
  }>;
  byService: Array<{
    serviceId: string;
    serviceName: string;
    appointmentCount: number;
    revenue: number;
  }>;
  byStatus: {
    pending: number;
    confirmed: number;
    completed: number;
    canceled: number;
    no_show: number;
    rescheduled: number;
  };
  appointments: Array<{
    id: string;
    date: string;
    time: string;
    clientName: string;
    staffName: string;
    services: string;
    total: number;
    status: string;
    paymentStatus: string;
  }>;
}

export type ReportPeriod = "today" | "week" | "month" | "lastMonth" | "year" | "custom";

export function useReports(period: ReportPeriod, customStart?: Date, customEnd?: Date) {
  const { barbershop } = useUserData();

  return useQuery({
    queryKey: ["reports", barbershop?.id, period, customStart?.toISOString(), customEnd?.toISOString()],
    queryFn: async (): Promise<ReportData | null> => {
      if (!barbershop?.id) return null;

      const timezone = barbershop.timezone || "America/New_York";
      const now = new Date();
      let startDate: Date;
      let endDate: Date;
      let periodLabel: string;

      // Calculate date range based on period
      switch (period) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          periodLabel = `Hoy - ${format(now, "dd/MM/yyyy")}`;
          break;
        case "week":
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          periodLabel = `Semana del ${format(startDate, "dd/MM/yyyy")} al ${format(endDate, "dd/MM/yyyy")}`;
          break;
        case "month":
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          periodLabel = format(now, "MMMM yyyy");
          break;
        case "lastMonth":
          const lastMonth = subMonths(now, 1);
          startDate = startOfMonth(lastMonth);
          endDate = endOfMonth(lastMonth);
          periodLabel = format(lastMonth, "MMMM yyyy");
          break;
        case "year":
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          periodLabel = format(now, "yyyy");
          break;
        case "custom":
          if (!customStart || !customEnd) return null;
          startDate = customStart;
          endDate = customEnd;
          periodLabel = `${format(customStart, "dd/MM/yyyy")} - ${format(customEnd, "dd/MM/yyyy")}`;
          break;
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          periodLabel = format(now, "MMMM yyyy");
      }

      // Convert to timezone-aware strings
      const startStr = formatInTimeZone(startDate, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
      const endStr = formatInTimeZone(endDate, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");

      // Fetch appointments
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select(`
          id,
          start_at,
          end_at,
          status,
          total_price_estimated,
          payment_status,
          payment_amount,
          staff_user_id,
          client:clients!appointments_client_id_fkey(id, name, email),
          appointment_services(
            qty,
            service:services(id, name, price)
          )
        `)
        .eq("barbershop_id", barbershop.id)
        .gte("start_at", startStr)
        .lte("start_at", endStr)
        .order("start_at", { ascending: true });

      if (error) {
        console.error("Error fetching appointments:", error);
        return null;
      }

      if (!appointments || appointments.length === 0) {
        return {
          period: { start: startStr, end: endStr, label: periodLabel },
          summary: {
            totalAppointments: 0,
            completedAppointments: 0,
            canceledAppointments: 0,
            totalRevenue: 0,
            paidRevenue: 0,
            unpaidRevenue: 0,
          },
          byStaff: [],
          byService: [],
          byStatus: {
            pending: 0,
            confirmed: 0,
            completed: 0,
            canceled: 0,
            no_show: 0,
            rescheduled: 0,
          },
          appointments: [],
        };
      }

      // Get staff profiles
      const staffUserIds = [...new Set(appointments.map((apt: any) => apt.staff_user_id).filter(Boolean))];
      let staffMap: Record<string, { id: string; display_name: string; commission_rate?: number }> = {};
      
      if (staffUserIds.length > 0) {
        const { data: staffData } = await supabase
          .from("staff_profiles")
          .select("id, user_id, display_name, commission_rate")
          .eq("barbershop_id", barbershop.id)
          .in("user_id", staffUserIds);
        
        if (staffData) {
          staffData.forEach((staff: any) => {
            staffMap[staff.user_id] = {
              id: staff.id,
              display_name: staff.display_name,
              commission_rate: staff.commission_rate,
            };
          });
        }
      }

      // Process data
      const summary = {
        totalAppointments: appointments.length,
        completedAppointments: appointments.filter((apt: any) => apt.status === "completed").length,
        canceledAppointments: appointments.filter((apt: any) => apt.status === "canceled").length,
        totalRevenue: appointments
          .filter((apt: any) => apt.status === "completed")
          .reduce((sum: number, apt: any) => sum + (apt.total_price_estimated || 0), 0),
        paidRevenue: appointments
          .filter((apt: any) => apt.status === "completed" && apt.payment_status === "paid")
          .reduce((sum: number, apt: any) => sum + (apt.payment_amount || apt.total_price_estimated || 0), 0),
        unpaidRevenue: appointments
          .filter((apt: any) => apt.status === "completed" && apt.payment_status === "unpaid")
          .reduce((sum: number, apt: any) => sum + (apt.total_price_estimated || 0), 0),
      };

      // By staff
      const staffStats: Record<string, { name: string; count: number; revenue: number; commission?: number }> = {};
      appointments.forEach((apt: any) => {
        if (apt.staff_user_id && staffMap[apt.staff_user_id]) {
          const staff = staffMap[apt.staff_user_id];
          if (!staffStats[apt.staff_user_id]) {
            staffStats[apt.staff_user_id] = {
              name: staff.display_name,
              count: 0,
              revenue: 0,
              commission: staff.commission_rate ? 0 : undefined,
            };
          }
          if (apt.status === "completed") {
            staffStats[apt.staff_user_id].count++;
            const revenue = apt.total_price_estimated || 0;
            staffStats[apt.staff_user_id].revenue += revenue;
            if (staff.commission_rate) {
              staffStats[apt.staff_user_id].commission = (staffStats[apt.staff_user_id].commission || 0) + (revenue * staff.commission_rate / 100);
            }
          }
        }
      });

      const byStaff = Object.entries(staffStats).map(([staffUserId, stats]) => ({
        staffId: staffMap[staffUserId]?.id || "",
        staffName: stats.name,
        appointmentCount: stats.count,
        revenue: stats.revenue,
        commission: stats.commission,
      }));

      // By service
      const serviceStats: Record<string, { name: string; count: number; revenue: number }> = {};
      appointments.forEach((apt: any) => {
        if (apt.status === "completed" && apt.appointment_services) {
          apt.appointment_services.forEach((as: any) => {
            const serviceId = as.service?.id;
            const serviceName = as.service?.name || "Sin servicio";
            const price = (as.service?.price || 0) * (as.qty || 1);
            
            if (!serviceStats[serviceId]) {
              serviceStats[serviceId] = { name: serviceName, count: 0, revenue: 0 };
            }
            serviceStats[serviceId].count += as.qty || 1;
            serviceStats[serviceId].revenue += price;
          });
        }
      });

      const byService = Object.entries(serviceStats).map(([serviceId, stats]) => ({
        serviceId,
        serviceName: stats.name,
        appointmentCount: stats.count,
        revenue: stats.revenue,
      }));

      // By status
      const byStatus = {
        pending: appointments.filter((apt: any) => apt.status === "pending").length,
        confirmed: appointments.filter((apt: any) => apt.status === "confirmed").length,
        completed: appointments.filter((apt: any) => apt.status === "completed").length,
        canceled: appointments.filter((apt: any) => apt.status === "canceled").length,
        no_show: appointments.filter((apt: any) => apt.status === "no_show").length,
        rescheduled: appointments.filter((apt: any) => apt.status === "rescheduled").length,
      };

      // Detailed appointments list
      const appointmentsList = appointments.map((apt: any) => {
        const aptDate = new Date(apt.start_at);
        const services = (apt.appointment_services || [])
          .map((as: any) => `${as.service?.name || "Sin servicio"}${as.qty > 1 ? ` x${as.qty}` : ""}`)
          .join(", ");
        
        return {
          id: apt.id,
          date: format(aptDate, "dd/MM/yyyy"),
          time: format(aptDate, "HH:mm"),
          clientName: apt.client?.name || "Sin cliente",
          staffName: apt.staff_user_id ? staffMap[apt.staff_user_id]?.display_name || "Sin asignar" : "Sin asignar",
          services: services || "Sin servicios",
          total: apt.total_price_estimated || 0,
          status: apt.status,
          paymentStatus: apt.payment_status || "unpaid",
        };
      });

      return {
        period: { start: startStr, end: endStr, label: periodLabel },
        summary,
        byStaff: byStaff.sort((a, b) => b.revenue - a.revenue),
        byService: byService.sort((a, b) => b.revenue - a.revenue),
        byStatus,
        appointments: appointmentsList,
      };
    },
    enabled: !!barbershop?.id,
  });
}
