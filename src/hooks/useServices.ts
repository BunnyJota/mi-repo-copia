import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "./useUserData";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Service = Tables<"services">;
export type ServiceInsert = TablesInsert<"services">;
export type ServiceUpdate = TablesUpdate<"services">;

export function useServices() {
  const { barbershop } = useUserData();

  return useQuery({
    queryKey: ["services", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .order("name");

      if (error) throw error;
      return data as Service[];
    },
    enabled: !!barbershop?.id,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  const { barbershop } = useUserData();

  return useMutation({
    mutationFn: async (service: Omit<ServiceInsert, "barbershop_id">) => {
      if (!barbershop?.id) throw new Error("No barbershop found");

      const { data, error } = await supabase
        .from("services")
        .insert({ ...service, barbershop_id: barbershop.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", barbershop?.id] });
      toast.success("Servicio creado correctamente");
    },
    onError: (error) => {
      toast.error("Error al crear el servicio: " + error.message);
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  const { barbershop } = useUserData();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ServiceUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("services")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", barbershop?.id] });
      toast.success("Servicio actualizado correctamente");
    },
    onError: (error) => {
      toast.error("Error al actualizar el servicio: " + error.message);
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  const { barbershop } = useUserData();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", barbershop?.id] });
      toast.success("Servicio eliminado correctamente");
    },
    onError: (error) => {
      toast.error("Error al eliminar el servicio: " + error.message);
    },
  });
}
