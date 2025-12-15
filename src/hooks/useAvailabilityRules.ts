import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "./useUserData";

export interface AvailabilityRule {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_enabled: boolean;
}

export function useAvailabilityRules() {
  const { barbershop } = useUserData();

  return useQuery({
    queryKey: ["availability-rules", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];

      const { data, error } = await supabase
        .from("availability_rules")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .order("day_of_week", { ascending: true });

      if (error) {
        console.error("Error fetching availability rules:", error);
        return [];
      }

      return data as AvailabilityRule[];
    },
    enabled: !!barbershop?.id,
  });
}

export function getHoursFromRules(rules: AvailabilityRule[], dayOfWeek: number) {
  const dayRule = rules.find((r) => r.day_of_week === dayOfWeek && r.is_enabled);
  
  if (!dayRule) return [];

  const openHour = parseInt(dayRule.open_time.split(":")[0]);
  const closeHour = parseInt(dayRule.close_time.split(":")[0]);
  
  const hours: string[] = [];
  for (let h = openHour; h < closeHour; h++) {
    hours.push(`${h.toString().padStart(2, "0")}:00`);
  }
  
  return hours;
}
