import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDays, startOfDay, endOfDay, format, parseISO, getDay, addMinutes } from "date-fns";

export interface PublicBarbershop {
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

export function useBarbershopBySlug(slug: string) {
  return useQuery({
    queryKey: ["public-barbershop", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbershops")
        .select("id, name, slug, address, phone, logo_url, brand_accent, timezone, slot_interval_minutes, buffer_minutes, booking_window_days, min_advance_hours")
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
  });
}

export function useAvailabilityRulesPublic(barbershopId: string | undefined) {
  return useQuery({
    queryKey: ["public-availability-rules", barbershopId],
    queryFn: async () => {
      if (!barbershopId) return [];

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
  });
}

export function useStaffAvailabilityPublic(barbershopId: string | undefined) {
  return useQuery({
    queryKey: ["public-staff-availability", barbershopId],
    queryFn: async () => {
      if (!barbershopId) return [];

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
  });
}

export function useTimeBlocks(barbershopId: string | undefined, date: Date) {
  return useQuery({
    queryKey: ["public-time-blocks", barbershopId, format(date, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!barbershopId) return [];

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
      staffUserId,
      availabilityRules,
      staffAvailability,
      timeBlocks,
      existingAppointments
    ],
    queryFn: async () => {
      if (!barbershop || !availabilityRules) return [];

      const dayOfWeek = getDay(date);
      const dayRule = availabilityRules.find(
        (r) => r.day_of_week === dayOfWeek && r.is_enabled
      );

      if (!dayRule) return []; // Barbershop closed

      const slotInterval = barbershop.slot_interval_minutes;
      const buffer = barbershop.buffer_minutes;
      const now = new Date();
      const minAdvance = addMinutes(now, barbershop.min_advance_hours * 60);

      // Parse barbershop opening hours
      const [shopOpenHour, shopOpenMin] = dayRule.open_time.split(":").map(Number);
      const [shopCloseHour, shopCloseMin] = dayRule.close_time.split(":").map(Number);
      const shopOpenMinutes = shopOpenHour * 60 + shopOpenMin;
      const shopCloseMinutes = shopCloseHour * 60 + shopCloseMin;

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
        } else {
          // Staff has no custom rules, use barbershop hours
          staffWorkingHours.set(staffMember.user_id, {
            openMinutes: shopOpenMinutes,
            closeMinutes: shopCloseMinutes,
          });
        }
      }

      // If no staff is available this day, return empty
      if (staffWorkingHours.size === 0) return [];

      // Generate time slots based on barbershop hours
      let currentMinutes = shopOpenMinutes;

      while (currentMinutes + totalDuration <= shopCloseMinutes) {
        const hour = Math.floor(currentMinutes / 60);
        const minute = currentMinutes % 60;
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        
        const slotStart = new Date(`${dateStr}T${timeStr}:00`);
        const slotEnd = addMinutes(slotStart, totalDuration + buffer);

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
          if (currentMinutes < hours.openMinutes || currentMinutes + totalDuration > hours.closeMinutes) {
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
            return slotStart < aptEnd && slotEnd > aptStart;
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
    enabled: !!barbershop && !!availabilityRules && !!staff,
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

export function useCreateBooking() {
  return useMutation({
    mutationFn: async (data: CreateBookingData) => {
      // First, create or find the client
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("barbershop_id", data.barbershopId)
        .eq("email", data.clientEmail)
        .maybeSingle();

      let clientId: string;

      if (existingClient) {
        clientId = existingClient.id;
        // Update phone if provided
        if (data.clientPhone) {
          await supabase
            .from("clients")
            .update({ phone: data.clientPhone, name: data.clientName })
            .eq("id", clientId);
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

      return appointment;
    },
  });
}
