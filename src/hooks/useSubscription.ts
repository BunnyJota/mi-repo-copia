import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "./useUserData";
import { toast } from "sonner";

interface CreateSubscriptionResponse {
  success: boolean;
  subscription_id?: string;
  approval_url?: string;
  subscription?: {
    id: string;
    status: string;
  };
  error?: string;
}

interface ActivateSubscriptionResponse {
  success: boolean;
  subscription?: {
    id: string;
    status: string;
  };
  error?: string;
}

interface CancelSubscriptionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Hook para crear una suscripción de PayPal
 */
export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const { barbershop } = useUserData();

  return useMutation({
    mutationFn: async () => {
      if (!barbershop?.id) {
        throw new Error("No barbershop found");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: {
          barbershop_id: barbershop.id,
          action: "create",
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      const response = data as CreateSubscriptionResponse;
      
      if (response.error) {
        throw new Error(response.error);
      }

      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["userData"] });
      
      if (data.approval_url) {
        // Redirigir a PayPal para aprobación
        window.location.href = data.approval_url;
      } else {
        toast.success("Suscripción creada exitosamente");
      }
    },
    onError: (error: Error) => {
      toast.error("Error al crear la suscripción: " + error.message);
    },
  });
}

/**
 * Hook para activar una suscripción después de la aprobación en PayPal
 */
export function useActivateSubscription() {
  const queryClient = useQueryClient();
  const { barbershop } = useUserData();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      if (!barbershop?.id) {
        throw new Error("No barbershop found");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: {
          barbershop_id: barbershop.id,
          action: "activate",
          subscription_id: subscriptionId,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      const response = data as ActivateSubscriptionResponse;
      
      if (response.error) {
        throw new Error(response.error);
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userData"] });
      toast.success("Suscripción activada exitosamente");
    },
    onError: (error: Error) => {
      toast.error("Error al activar la suscripción: " + error.message);
    },
  });
}

/**
 * Hook para cancelar una suscripción
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient();
  const { barbershop } = useUserData();

  return useMutation({
    mutationFn: async (reason?: string) => {
      if (!barbershop?.id) {
        throw new Error("No barbershop found");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: {
          barbershop_id: barbershop.id,
          action: "cancel",
          reason: reason || "Solicitado por el cliente",
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      const response = data as CancelSubscriptionResponse;
      
      if (response.error) {
        throw new Error(response.error);
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userData"] });
      toast.success("Suscripción cancelada exitosamente");
    },
    onError: (error: Error) => {
      toast.error("Error al cancelar la suscripción: " + error.message);
    },
  });
}
