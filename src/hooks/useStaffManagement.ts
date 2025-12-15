import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "./useUserData";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type StaffProfile = Tables<"staff_profiles">;
export type StaffAvailabilityRule = Tables<"staff_availability_rules">;

export function useAllStaff() {
  const { barbershop } = useUserData();

  return useQuery({
    queryKey: ["all-staff", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];

      const { data, error } = await supabase
        .from("staff_profiles")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .order("display_name");

      if (error) throw error;
      return data as StaffProfile[];
    },
    enabled: !!barbershop?.id,
  });
}

export function useStaffAvailability(staffUserId: string | null) {
  const { barbershop } = useUserData();

  return useQuery({
    queryKey: ["staff-availability", staffUserId],
    queryFn: async () => {
      if (!barbershop?.id || !staffUserId) return [];

      const { data, error } = await supabase
        .from("staff_availability_rules")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .eq("staff_user_id", staffUserId)
        .order("day_of_week");

      if (error) throw error;
      return data as StaffAvailabilityRule[];
    },
    enabled: !!barbershop?.id && !!staffUserId,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  const { barbershop } = useUserData();

  return useMutation({
    mutationFn: async (staff: {
      email: string;
      password: string;
      display_name: string;
      color_tag?: string;
      commission_rate?: number;
    }) => {
      if (!barbershop?.id) throw new Error("No barbershop found");

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: staff.email,
        password: staff.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: staff.display_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      const userId = authData.user.id;

      // 2. Update the profile to link to barbershop
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          barbershop_id: barbershop.id,
          display_name: staff.display_name,
        })
        .eq("user_id", userId);

      if (profileError) throw profileError;

      // 3. Create staff profile
      const { data: staffData, error: staffError } = await supabase
        .from("staff_profiles")
        .insert({
          user_id: userId,
          barbershop_id: barbershop.id,
          display_name: staff.display_name,
          color_tag: staff.color_tag || "#E45500",
          commission_rate: staff.commission_rate,
        })
        .select()
        .single();

      if (staffError) throw staffError;

      // 4. Assign barber role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: "barber" as const,
      });

      if (roleError) throw roleError;

      return staffData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-staff", barbershop?.id] });
      toast.success("Barbero creado correctamente");
    },
    onError: (error) => {
      console.error("Error creating staff:", error);
      toast.error("Error al crear el barbero: " + error.message);
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  const { barbershop } = useUserData();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<StaffProfile> & { id: string }) => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-staff", barbershop?.id] });
      toast.success("Barbero actualizado correctamente");
    },
    onError: (error) => {
      toast.error("Error al actualizar el barbero: " + error.message);
    },
  });
}

export function useToggleStaffActive() {
  const queryClient = useQueryClient();
  const { barbershop } = useUserData();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["all-staff", barbershop?.id] });
      toast.success(data.is_active ? "Barbero activado" : "Barbero desactivado");
    },
    onError: (error) => {
      toast.error("Error al cambiar el estado: " + error.message);
    },
  });
}

export function useSaveStaffAvailability() {
  const queryClient = useQueryClient();
  const { barbershop } = useUserData();

  return useMutation({
    mutationFn: async ({
      staffUserId,
      rules,
    }: {
      staffUserId: string;
      rules: Array<{
        day_of_week: number;
        open_time: string;
        close_time: string;
        is_enabled: boolean;
      }>;
    }) => {
      if (!barbershop?.id) throw new Error("No barbershop found");

      // Delete existing rules
      await supabase
        .from("staff_availability_rules")
        .delete()
        .eq("staff_user_id", staffUserId)
        .eq("barbershop_id", barbershop.id);

      // Insert new rules
      const { data, error } = await supabase
        .from("staff_availability_rules")
        .insert(
          rules.map((rule) => ({
            ...rule,
            staff_user_id: staffUserId,
            barbershop_id: barbershop.id,
          }))
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["staff-availability", variables.staffUserId],
      });
      toast.success("Disponibilidad guardada correctamente");
    },
    onError: (error) => {
      toast.error("Error al guardar la disponibilidad: " + error.message);
    },
  });
}
