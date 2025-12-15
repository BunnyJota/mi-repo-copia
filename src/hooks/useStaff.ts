import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "./useUserData";

export interface StaffMember {
  id: string;
  user_id: string;
  display_name: string;
  photo_url: string | null;
  color_tag: string | null;
  is_active: boolean;
  commission_rate: number | null;
}

export function useStaff() {
  const { barbershop } = useUserData();

  return useQuery({
    queryKey: ["staff", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];

      const { data, error } = await supabase
        .from("staff_profiles")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .eq("is_active", true)
        .order("display_name", { ascending: true });

      if (error) {
        console.error("Error fetching staff:", error);
        return [];
      }

      return data as StaffMember[];
    },
    enabled: !!barbershop?.id,
  });
}
