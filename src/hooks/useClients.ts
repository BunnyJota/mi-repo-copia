import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "./useUserData";
import { toast } from "sonner";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
  appointment_count: number;
  last_visit: string | null;
}

export function useClients() {
  const { barbershop } = useUserData();

  return useQuery({
    queryKey: ["clients", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];

      // Get clients with appointment counts
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching clients:", error);
        return [];
      }

      // Get appointment counts for each client
      const clientsWithStats = await Promise.all(
        (clients || []).map(async (client) => {
          // Count appointments
          const { count } = await supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("client_id", client.id);

          // Get last completed appointment
          const { data: lastAppointment } = await supabase
            .from("appointments")
            .select("start_at")
            .eq("client_id", client.id)
            .eq("status", "completed")
            .order("start_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...client,
            appointment_count: count || 0,
            last_visit: lastAppointment?.start_at || null,
          } as Client;
        })
      );

      return clientsWithStats;
    },
    enabled: !!barbershop?.id,
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { barbershop } = useUserData();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", barbershop?.id] });
      toast.success("Cliente eliminado correctamente");
    },
    onError: (error) => {
      toast.error("Error al eliminar el cliente: " + error.message);
    },
  });
}
