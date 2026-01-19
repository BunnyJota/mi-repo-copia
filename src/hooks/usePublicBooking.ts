import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDays, startOfDay, endOfDay, format, parseISO, getDay, addMinutes } from "date-fns";

export interface PublicBarbershop {
  id: string;
  name: string;
  slug: string;
  currency?: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  brand_accent: string;
  timezone: string;
  slot_interval_minutes: number;
  buffer_minutes: number;
  booking_window_days: number;
  min_advance_hours: number;
}

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  duration_min: number;
  price: number;
}

export interface PublicStaff {
  id: string;
  user_id: string;
  display_name: string;
  photo_url: string | null;
  color_tag: string | null;
}

export interface AvailabilityRule {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_enabled: boolean;
}

export interface StaffAvailabilityRule extends AvailabilityRule {
  staff_user_id: string;
}

// Demo data
const DEMO_BARBERSHOP: PublicBarbershop = {
  id: "demo-barbershop-id",
  name: "Classic Barber",
  slug: "demo",
  currency: "USD",
  address: "123 Main Street, New York",
  phone: "+1 (555) 123-4567",
  logo_url: null,
  brand_accent: "#E45500",
  timezone: "America/New_York",
  slot_interval_minutes: 15,
  buffer_minutes: 10,
  booking_window_days: 30,
  min_advance_hours: 2,
};

const DEMO_SERVICES: PublicService[] = [
  {
    id: "demo-service-1",
    name: "Corte Clásico",
    description: "Corte de cabello tradicional",
    duration_min: 30,
    price: 25,
  },
  {
    id: "demo-service-2",
    name: "Corte + Barba",
    description: "Corte de cabello y arreglo de barba",
    duration_min: 45,
    price: 35,
  },
  {
    id: "demo-service-3",
    name: "Fade",
    description: "Corte degradado moderno",
    duration_min: 40,
    price: 30,
  },
  {
    id: "demo-service-4",
    name: "Afeitado Clásico",
    description: "Afeitado con navaja tradicional",
    duration_min: 25,
    price: 20,
  },
];

const DEMO_STAFF: PublicStaff[] = [
  {
    id: "demo-staff-1",
    user_id: "demo-user-1",
    display_name: "Carlos",
    photo_url: null,
    color_tag: "#3B82F6",
  },
  {
    id: "demo-staff-2",
    user_id: "demo-user-2",
    display_name: "Miguel",
    photo_url: null,
    color_tag: "#10B981",
  },
];

const DEMO_AVAILABILITY_RULES: AvailabilityRule[] = [
  { day_of_week: 1, open_time: "09:00", close_time: "18:00", is_enabled: true },
  { day_of_week: 2, open_time: "09:00", close_time: "18:00", is_enabled: true },
  { day_of_week: 3, open_time: "09:00", close_time: "18:00", is_enabled: true },
  { day_of_week: 4, open_time: "09:00", close_time: "18:00", is_enabled: true },
  { day_of_week: 5, open_time: "09:00", close_time: "18:00", is_enabled: true },
  { day_of_week: 6, open_time: "10:00", close_time: "16:00", is_enabled: true },
  { day_of_week: 0, open_time: "10:00", close_time: "14:00", is_enabled: true },
];

export function useBarbershopBySlug(slug: string) {
  return useQuery({
    queryKey: ["public-barbershop", slug],
    queryFn: async () => {
      // Demo mode
      if (slug === "demo") {
        return DEMO_BARBERSHOP;
      }

      const { data, error } = await supabase
        .from("barbershops")
        .select("id, name, slug, address, phone, logo_url, brand_accent, timezone, slot_interval_minutes, buffer_minutes, booking_window_days, min_advance_hours, currency")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching barbershop:", error);
        return null;
      }

      return data as PublicBarbershop | null;
    },
    enabled: !!slug,
  });
}

export function usePublicServices(barbershopId: string | undefined) {
  return useQuery({
    queryKey: ["public-services", barbershopId],
    queryFn: async () => {
      if (!barbershopId) return [];

      // Demo mode
      if (barbershopId === "demo-barbershop-id") {
        return DEMO_SERVICES;
      }

      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, duration_min, price")
        .eq("barbershop_id", barbershopId)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching services:", error);
        return [];
      }

      return data as PublicService[];
    },
    enabled: !!barbershopId,
  });
}

export function usePublicStaff(barbershopId: string | undefined) {
  return useQuery({
    queryKey: ["public-staff", barbershopId],
    queryFn: async () => {
      if (!barbershopId) return [];

      // Demo mode
      if (barbershopId === "demo-barbershop-id") {
        return DEMO_STAFF;
      }

      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, user_id, display_name, photo_url, color_tag")
        .eq("barbershop_id", barbershopId)
        .eq("is_active", true)
        .order("display_name", { ascending: true });

      if (error) {
        console.error("Error fetching staff:", error);
        return [];
      }

      return data as PublicStaff[];
    },
    enabled: !!barbershopId,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useAvailabilityRulesPublic(barbershopId: string | undefined) {
  return useQuery({
    queryKey: ["public-availability-rules", barbershopId],
    queryFn: async () => {
      if (!barbershopId) return [];

      // Demo mode
      if (barbershopId === "demo-barbershop-id") {
        return DEMO_AVAILABILITY_RULES;
      }

      const { data, error } = await supabase
        .from("availability_rules")
        .select("day_of_week, open_time, close_time, is_enabled")
        .eq("barbershop_id", barbershopId)
        .order("day_of_week", { ascending: true });

      if (error) {
        console.error("Error fetching availability rules:", error);
        return [];
      }

      return data as AvailabilityRule[];
    },
    enabled: !!barbershopId,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

const DEMO_STAFF_AVAILABILITY: StaffAvailabilityRule[] = [
  { staff_user_id: "demo-user-1", day_of_week: 1, open_time: "09:00", close_time: "18:00", is_enabled: true },
  { staff_user_id: "demo-user-1", day_of_week: 2, open_time: "09:00", close_time: "18:00", is_enabled: true },
  { staff_user_id: "demo-user-1", day_of_week: 3, open_time: "09:00", close_time: "18:00", is_enabled: true },
  { staff_user_id: "demo-user-1", day_of_week: 4, open_time: "09:00", close_time: "18:00", is_enabled: true },
  { staff_user_id: "demo-user-1", day_of_week: 5, open_time: "09:00", close_time: "18:00", is_enabled: true },
  { staff_user_id: "demo-user-1", day_of_week: 6, open_time: "10:00", close_time: "16:00", is_enabled: true },
  { staff_user_id: "demo-user-2", day_of_week: 1, open_time: "09:00", close_time: "18:00", is_enabled: true },
  { staff_user_id: "demo-user-2", day_of_week: 2, open_time: "09:00", close_time: "18:00", is_enabled: true },
  { staff_user_id: "demo-user-2", day_of_week: 3, open_time: "09:00", close_time: "18:00", is_enabled: true },
  { staff_user_id: "demo-user-2", day_of_week: 4, open_time: "09:00", close_time: "18:00", is_enabled: true },
  { staff_user_id: "demo-user-2", day_of_week: 5, open_time: "09:00", close_time: "18:00", is_enabled: true },
  { staff_user_id: "demo-user-2", day_of_week: 6, open_time: "10:00", close_time: "16:00", is_enabled: true },
];

export function useStaffAvailabilityPublic(barbershopId: string | undefined) {
  return useQuery({
    queryKey: ["public-staff-availability", barbershopId],
    queryFn: async () => {
      if (!barbershopId) return [];

      // Demo mode
      if (barbershopId === "demo-barbershop-id") {
        return DEMO_STAFF_AVAILABILITY;
      }

      const { data, error } = await supabase
        .from("staff_availability_rules")
        .select("staff_user_id, day_of_week, open_time, close_time, is_enabled")
        .eq("barbershop_id", barbershopId)
        .eq("is_enabled", true)
        .order("day_of_week", { ascending: true });

      if (error) {
        console.error("Error fetching staff availability:", error);
        return [];
      }

      return data as StaffAvailabilityRule[];
    },
    enabled: !!barbershopId,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useTimeBlocks(barbershopId: string | undefined, date: Date) {
  return useQuery({
    queryKey: ["public-time-blocks", barbershopId, format(date, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!barbershopId) return [];

      // Demo mode - no time blocks
      if (barbershopId === "demo-barbershop-id") {
        return [];
      }

      const dayStart = startOfDay(date).toISOString();
      const dayEnd = endOfDay(date).toISOString();

      const { data, error } = await supabase
        .from("time_blocks")
        .select("start_at, end_at, staff_user_id")
        .eq("barbershop_id", barbershopId)
        .gte("start_at", dayStart)
        .lte("end_at", dayEnd);

      if (error) {
        console.error("Error fetching time blocks:", error);
        return [];
      }

      return data;
    },
    enabled: !!barbershopId,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useExistingAppointments(
  barbershopId: string | undefined, 
  date: Date,
  staffUserId?: string
) {
  return useQuery({
    queryKey: ["public-appointments", barbershopId, format(date, "yyyy-MM-dd"), staffUserId],
    queryFn: async () => {
      if (!barbershopId) return [];

      // Demo mode - no existing appointments
      if (barbershopId === "demo-barbershop-id") {
        return [];
      }

      const dayStart = startOfDay(date).toISOString();
      const dayEnd = endOfDay(date).toISOString();

      let query = supabase
        .from("appointments")
        .select("start_at, end_at, staff_user_id")
        .eq("barbershop_id", barbershopId)
        .gte("start_at", dayStart)
        .lte("start_at", dayEnd)
        .not("status", "in", '("canceled","no_show")');

      if (staffUserId && staffUserId !== "any") {
        query = query.eq("staff_user_id", staffUserId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching existing appointments:", error);
        return [];
      }

      return data;
    },
    enabled: !!barbershopId,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

interface AvailableSlot {
  time: string;
  staffUserIds: string[];
}

export function useAvailableSlots(
  barbershop: PublicBarbershop | null | undefined,
  date: Date,
  totalDuration: number,
  staffUserId?: string,
  staff?: PublicStaff[]
) {
  const { data: availabilityRules } = useAvailabilityRulesPublic(barbershop?.id);
  const { data: staffAvailability } = useStaffAvailabilityPublic(barbershop?.id);
  const { data: timeBlocks } = useTimeBlocks(barbershop?.id, date);
  const { data: existingAppointments } = useExistingAppointments(
    barbershop?.id, 
    date,
    staffUserId === "any" ? undefined : staffUserId
  );

  return useQuery({
    queryKey: [
      "available-slots", 
      barbershop?.id, 
      format(date, "yyyy-MM-dd"), 
      totalDuration,
      staffUserId
    ],
    queryFn: async () => {
      if (!barbershop || availabilityRules === undefined || staff === undefined) return [];

      // No staff => no slots
      if (!staff || staff.length === 0) return [];

      // Enforce booking window (same rule as UI)
      const todayStart = startOfDay(new Date());
      const windowEnd = addDays(todayStart, barbershop.booking_window_days);
      if (date > windowEnd) return [];

      const dayOfWeek = getDay(date);
      const dayRule = availabilityRules.find(
        (r) => r.day_of_week === dayOfWeek && r.is_enabled
      );

      if (!dayRule) return []; // Barbershop closed

      const slotInterval = barbershop.slot_interval_minutes;
      const buffer = barbershop.buffer_minutes;
      const now = new Date();
      const minAdvance = addMinutes(now, barbershop.min_advance_hours * 60);
      const totalWithBuffer = totalDuration + buffer;

      // Parse barbershop opening hours
      const [shopOpenHour, shopOpenMin] = dayRule.open_time.split(":").map(Number);
      const [shopCloseHour, shopCloseMin] = dayRule.close_time.split(":").map(Number);
      const shopOpenMinutes = shopOpenHour * 60 + shopOpenMin;
      const shopCloseMinutes = shopCloseHour * 60 + shopCloseMin;

      // If service duration (with buffer) does not fit in the day, skip
      if (totalWithBuffer > shopCloseMinutes - shopOpenMinutes) return [];

      const slots: AvailableSlot[] = [];
      const dateStr = format(date, "yyyy-MM-dd");

      // Determine which staff to check
      const staffToCheck = staffUserId && staffUserId !== "any" 
        ? staff?.filter(s => s.user_id === staffUserId) || []
        : staff || [];

      if (staffToCheck.length === 0) return [];

      // For each staff, determine their working hours for this day
      const staffWorkingHours: Map<string, { openMinutes: number; closeMinutes: number }> = new Map();

      for (const staffMember of staffToCheck) {
        // Check if staff has specific availability rules for this day
        const staffDayRule = staffAvailability?.find(
          (r) => r.staff_user_id === staffMember.user_id && r.day_of_week === dayOfWeek && r.is_enabled
        );

        // Check if staff has ANY rules configured for ANY day
        const staffHasAnyRules = staffAvailability?.some(
          (r) => r.staff_user_id === staffMember.user_id
        );

        if (staffHasAnyRules) {
          // Staff has custom availability configured
          if (staffDayRule) {
            // Staff works this day with custom hours
            const [staffOpenHour, staffOpenMin] = staffDayRule.open_time.split(":").map(Number);
            const [staffCloseHour, staffCloseMin] = staffDayRule.close_time.split(":").map(Number);
            staffWorkingHours.set(staffMember.user_id, {
              openMinutes: staffOpenHour * 60 + staffOpenMin,
              closeMinutes: staffCloseHour * 60 + staffCloseMin,
            });
          }
          // If staffDayRule is null/undefined but staff has rules, they don't work this day - skip them
          // (don't add to staffWorkingHours, so they won't be available)
        } else {
          // Staff has no custom rules, use barbershop hours
          // Only add if barbershop is open this day
          if (dayRule.is_enabled) {
          staffWorkingHours.set(staffMember.user_id, {
            openMinutes: shopOpenMinutes,
            closeMinutes: shopCloseMinutes,
          });
          }
        }
      }

      // If no staff is available this day, return empty
      if (staffWorkingHours.size === 0) return [];

      // Generate time slots based on barbershop hours (service + buffer must fit)
      let currentMinutes = shopOpenMinutes;

      while (currentMinutes + totalWithBuffer <= shopCloseMinutes) {
        const hour = Math.floor(currentMinutes / 60);
        const minute = currentMinutes % 60;
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        
        const slotStart = new Date(`${dateStr}T${timeStr}:00`);
        const slotEnd = addMinutes(slotStart, totalWithBuffer);

        // Skip if slot is in the past
        if (slotStart < minAdvance) {
          currentMinutes += slotInterval;
          continue;
        }

        // Find available staff for this slot
        const availableStaffIds: string[] = [];

        for (const staffMember of staffToCheck) {
          const hours = staffWorkingHours.get(staffMember.user_id);
          
          // Staff doesn't work this day
          if (!hours) continue;

          // Check if slot is within staff working hours
          if (
            currentMinutes < hours.openMinutes || 
            currentMinutes + totalWithBuffer > hours.closeMinutes
          ) {
            continue;
          }

          // Check time blocks
          const isBlocked = timeBlocks?.some((block) => {
            if (block.staff_user_id && block.staff_user_id !== staffMember.user_id) {
              return false; // Block for different staff
            }
            const blockStart = new Date(block.start_at);
            const blockEnd = new Date(block.end_at);
            return slotStart < blockEnd && slotEnd > blockStart;
          });

          if (isBlocked) continue;

          // Check existing appointments
          const hasConflict = existingAppointments?.some((apt) => {
            if (apt.staff_user_id !== staffMember.user_id) return false;
            const aptStart = new Date(apt.start_at);
            const aptEnd = new Date(apt.end_at);
            // Apply buffer before/after existing appointments
            const aptStartWithBuffer = addMinutes(aptStart, -buffer);
            const aptEndWithBuffer = addMinutes(aptEnd, buffer);
            return slotStart < aptEndWithBuffer && slotEnd > aptStartWithBuffer;
          });

          if (!hasConflict) {
            availableStaffIds.push(staffMember.user_id);
          }
        }

        if (availableStaffIds.length > 0) {
          slots.push({ time: timeStr, staffUserIds: availableStaffIds });
        }

        currentMinutes += slotInterval;
      }

      return slots;
    },
    enabled: !!barbershop && availabilityRules !== undefined && staff !== undefined,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

interface CreateBookingData {
  barbershopId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  staffUserId: string;
  serviceIds: string[];
  startAt: Date;
  endAt: Date;
  totalPrice: number;
}

const missingSupabaseConfig =
  !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function mapBookingError(error: unknown): Error {
  const code = (error as any)?.code ?? (error as any)?.status;

  if (error instanceof Error && error.message === "MISSING_SUPABASE_CONFIG") {
    return new Error(
      "Falta configurar Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY) en el despliegue."
    );
  }

  if (code === "42501") {
    return new Error(
      "La base de datos bloqueó la operación por políticas RLS. Revisa que las políticas permitan inserts públicos en clients/appointments."
    );
  }

  if (code === "401" || code === 401) {
    return new Error(
      "No autorizado con Supabase (401). Verifica que la clave pública y la URL estén bien configuradas."
    );
  }

  if (error instanceof Error) return error;
  if (typeof (error as any)?.message === "string") return new Error((error as any).message);

  return new Error("No se pudo crear la cita. Intenta de nuevo.");
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: async (data: CreateBookingData) => {
      try {
        if (missingSupabaseConfig) {
          throw new Error("MISSING_SUPABASE_CONFIG");
        }

        // First, create or find the client
        const { data: existingClient, error: clientLookupError } = await supabase
          .from("clients")
          .select("id")
          .eq("barbershop_id", data.barbershopId)
          .eq("email", data.clientEmail)
          .maybeSingle();

        if (clientLookupError) throw clientLookupError;

        let clientId: string;

        if (existingClient) {
          clientId = existingClient.id;
          // Update phone if provided (best-effort)
          if (data.clientPhone) {
            const { error: updateError } = await supabase
              .from("clients")
              .update({ phone: data.clientPhone, name: data.clientName })
              .eq("id", clientId);

            if (updateError) {
              console.warn("No se pudo actualizar el teléfono del cliente:", updateError);
            }
          }
        } else {
          const { data: newClient, error: clientError } = await supabase
            .from("clients")
            .insert({
              barbershop_id: data.barbershopId,
              name: data.clientName,
              email: data.clientEmail,
              phone: data.clientPhone || null,
            })
            .select("id")
            .single();

          if (clientError) throw clientError;
          clientId = newClient.id;
        }

        // Create appointment with pending status (client must confirm via email)
        const { data: appointment, error: appointmentError } = await supabase
          .from("appointments")
          .insert({
            barbershop_id: data.barbershopId,
            client_id: clientId,
            staff_user_id: data.staffUserId,
            start_at: data.startAt.toISOString(),
            end_at: data.endAt.toISOString(),
            total_price_estimated: data.totalPrice,
            status: "pending",
          })
          .select("id")
          .single();

        if (appointmentError) throw appointmentError;

        // Add services to appointment
        const appointmentServices = data.serviceIds.map((serviceId) => ({
          appointment_id: appointment.id,
          service_id: serviceId,
          qty: 1,
        }));

        const { error: servicesError } = await supabase
          .from("appointment_services")
          .insert(appointmentServices);

        if (servicesError) throw servicesError;

        // Send confirmation email via edge function
        try {
          const { error: emailError } = await supabase.functions.invoke("send-email", {
            body: {
              type: "confirmation",
              appointmentId: appointment.id,
            },
          });

          if (emailError) {
            console.error("Error sending confirmation email:", emailError);
            // Don't throw - appointment was created successfully
          }
        } catch (emailErr) {
          console.error("Failed to send email:", emailErr);
        }

        // Send push notification for new appointment
        try {
          const { error: pushError } = await supabase.functions.invoke("send-push-notification", {
            body: {
              type: "new_appointment",
              appointmentId: appointment.id,
            },
          });

          if (pushError) {
            console.error("Error sending push notification:", pushError);
            // Don't throw - appointment was created successfully
          }
        } catch (pushErr) {
          console.error("Failed to send push notification:", pushErr);
        }

        return appointment;
      } catch (error) {
        throw mapBookingError(error);
      }
    },
  });
}
