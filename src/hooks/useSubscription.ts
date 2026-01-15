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
      let errorMessage = error.message || "Error desconocido al crear la suscripción";
      
      // Mensajes más descriptivos
      if (errorMessage.includes("No barbershop found")) {
        errorMessage = "No se encontró la barbería. Por favor configura tu barbería primero.";
      } else if (errorMessage.includes("Not authenticated")) {
        errorMessage = "Sesión expirada. Por favor inicia sesión nuevamente.";
      } else if (errorMessage.includes("PayPal") || errorMessage.includes("paypal")) {
        errorMessage = `Error al comunicarse con PayPal: ${errorMessage}`;
      }
      
      toast.error(errorMessage);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No autenticado. Por favor inicia sesión nuevamente.");
      }

      // Estrategia 1: Obtener barbershop_id del perfil del usuario
      let barbershopId: string | null = null;
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("barbershop_id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (profileError) {
          console.warn("Error obteniendo perfil:", profileError);
        } else if (profileData?.barbershop_id) {
          barbershopId = profileData.barbershop_id;
          console.log("Barbershop ID obtenido del perfil:", barbershopId);
        }
      } catch (error) {
        console.warn("Error al obtener perfil:", error);
      }

      // Estrategia 2: Si no tenemos barbershop del perfil, usar el de useUserData
      if (!barbershopId && barbershop?.id) {
        barbershopId = barbershop.id;
        console.log("Barbershop ID obtenido de useUserData:", barbershopId);
      }

      // Estrategia 3: Buscar barbershop a través de user_roles (si el usuario es owner)
      if (!barbershopId) {
        try {
          // Buscar si el usuario tiene rol owner y obtener barbershop_id de alguna forma
          // Primero intentar buscar en subscriptions por paypal_subscription_id
          const { data: subscriptionData, error: subError } = await supabase
            .from("subscriptions")
            .select("barbershop_id")
            .eq("paypal_subscription_id", subscriptionId)
            .maybeSingle();

          if (!subError && subscriptionData?.barbershop_id) {
            barbershopId = subscriptionData.barbershop_id;
            console.log("Barbershop ID obtenido de subscriptions:", barbershopId);
          }
        } catch (error) {
          console.warn("Error al buscar en subscriptions:", error);
        }
      }

      // Estrategia 4: Retry con espera para race conditions
      if (!barbershopId) {
        const maxRetries = 5;
        let retryCount = 0;
        
        while (retryCount < maxRetries && !barbershopId) {
          try {
            // Esperar antes de cada intento (excepto el primero)
            if (retryCount > 0) {
              await new Promise(resolve => setTimeout(resolve, 1500 * retryCount));
            }

            const { data: subscriptionData, error: subError } = await supabase
              .from("subscriptions")
              .select("barbershop_id")
              .eq("paypal_subscription_id", subscriptionId)
              .maybeSingle();

            if (!subError && subscriptionData?.barbershop_id) {
              barbershopId = subscriptionData.barbershop_id;
              console.log(`Barbershop ID encontrado en intento ${retryCount + 1}:`, barbershopId);
              break;
            }
          } catch (error) {
            console.warn(`Intento ${retryCount + 1} falló al buscar suscripción:`, error);
          }
          
          retryCount++;
        }
      }

      // Si aún no tenemos barbershop_id, permitir que la Edge Function lo obtenga del custom_id de PayPal
      // Pero necesitamos pasar algún valor, así que usaremos un placeholder que la Edge Function reconocerá
      if (!barbershopId) {
        console.warn("No se pudo obtener barbershop_id en el frontend. La Edge Function intentará obtenerlo del custom_id de PayPal.");
        // Pasamos "auto" como señal para que la Edge Function use el custom_id
        barbershopId = "auto";
      }

      // Llamar a la Edge Function para activar
      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: {
          barbershop_id: barbershopId,
          action: "activate",
          subscription_id: subscriptionId,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error al invocar create-subscription:", error);
        throw new Error(error.message || "Error al activar la suscripción");
      }

      const response = data as ActivateSubscriptionResponse;
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.success) {
        throw new Error("La activación de la suscripción no fue exitosa");
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userData"] });
      toast.success("Suscripción activada exitosamente");
    },
    onError: (error: Error) => {
      let errorMessage = error.message || "Error desconocido al activar la suscripción";
      
      // Mensajes más descriptivos
      if (errorMessage.includes("No barbershop found") || errorMessage.includes("barbería")) {
        errorMessage = "No se encontró la barbería asociada. Por favor contacta al soporte.";
      } else if (errorMessage.includes("Not authenticated") || errorMessage.includes("autenticado")) {
        errorMessage = "Sesión expirada. Por favor inicia sesión nuevamente.";
      } else if (errorMessage.includes("permisos") || errorMessage.includes("owner")) {
        errorMessage = "No tienes permisos para activar esta suscripción.";
      } else if (errorMessage.includes("PayPal") || errorMessage.includes("paypal")) {
        errorMessage = `Error al comunicarse con PayPal: ${errorMessage}`;
      }
      
      toast.error(errorMessage);
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
      let errorMessage = error.message || "Error desconocido al cancelar la suscripción";
      
      // Mensajes más descriptivos
      if (errorMessage.includes("No barbershop found")) {
        errorMessage = "No se encontró la barbería. Por favor contacta al soporte.";
      } else if (errorMessage.includes("Not authenticated")) {
        errorMessage = "Sesión expirada. Por favor inicia sesión nuevamente.";
      } else if (errorMessage.includes("Subscription not found")) {
        errorMessage = "No se encontró la suscripción o no está vinculada a PayPal.";
      } else if (errorMessage.includes("PayPal") || errorMessage.includes("paypal")) {
        errorMessage = `Error al comunicarse con PayPal: ${errorMessage}`;
      }
      
      toast.error(errorMessage);
    },
  });
}
