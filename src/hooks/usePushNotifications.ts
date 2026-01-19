import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { initializeApp, FirebaseApp } from "firebase/app";

// Configuración de Firebase (debe estar en variables de entorno)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

// Inicializar Firebase solo una vez
function getFirebaseMessaging(): Messaging | null {
  if (typeof window === "undefined") {
    return null; // SSR
  }

  try {
    if (!firebaseApp) {
      firebaseApp = initializeApp(firebaseConfig);
    }

    if (!messaging && "serviceWorker" in navigator) {
      messaging = getMessaging(firebaseApp);
    }

    return messaging;
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    return null;
  }
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  barbershop_id: string;
  new_appointment_enabled: boolean;
  reminder_30min_enabled: boolean;
  reminder_24h_enabled: boolean;
  reminder_2h_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PushNotificationToken {
  id: string;
  user_id: string;
  barbershop_id: string | null;
  fcm_token: string;
  device_type: "web" | "android" | "ios";
  device_name: string | null;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

/**
 * Hook para gestionar push notifications con FCM
 */
export function usePushNotifications(barbershopId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  // Verificar soporte de notificaciones
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSupported(
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window
      );
      setPermission(Notification.permission);
    }
  }, []);

  // Obtener preferencias de notificaciones
  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ["notification-preferences", user?.id, barbershopId],
    queryFn: async () => {
      if (!user || !barbershopId) return null;

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .eq("barbershop_id", barbershopId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error;
      }

      // Si no existe, crear preferencias por defecto
      if (!data) {
        const { data: newPrefs, error: createError } = await supabase
          .rpc("get_or_create_notification_preferences", {
            _user_id: user.id,
            _barbershop_id: barbershopId,
          });

        if (createError) throw createError;

        // Obtener las preferencias creadas
        const { data: createdPrefs } = await supabase
          .from("notification_preferences")
          .select("*")
          .eq("id", newPrefs)
          .single();

        return createdPrefs as NotificationPreferences;
      }

      return data as NotificationPreferences;
    },
    enabled: !!user && !!barbershopId,
  });

  // Actualizar preferencias
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user || !barbershopId || !preferences) {
        throw new Error("User or barbershop not found");
      }

      const { data, error } = await supabase
        .from("notification_preferences")
        .update(updates)
        .eq("user_id", user.id)
        .eq("barbershop_id", barbershopId)
        .select()
        .single();

      if (error) throw error;
      return data as NotificationPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Preferencias actualizadas");
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar preferencias: ${error.message}`);
    },
  });

  // Registrar token FCM
  const registerTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const deviceType: "web" | "android" | "ios" = 
        /Android/i.test(navigator.userAgent) ? "android" :
        /iPhone|iPad|iPod/i.test(navigator.userAgent) ? "ios" :
        "web";

      const deviceName = `${deviceType} - ${navigator.userAgent.substring(0, 50)}`;

      // Verificar si el token ya existe
      const { data: existingToken } = await supabase
        .from("push_notification_tokens")
        .select("id")
        .eq("fcm_token", token)
        .single();

      if (existingToken) {
        // Actualizar last_used_at
        const { error } = await supabase
          .from("push_notification_tokens")
          .update({
            last_used_at: new Date().toISOString(),
            barbershop_id: barbershopId,
          })
          .eq("id", existingToken.id);

        if (error) throw error;
        return existingToken.id;
      }

      // Crear nuevo token
      const { data, error } = await supabase
        .from("push_notification_tokens")
        .insert({
          user_id: user.id,
          barbershop_id: barbershopId,
          fcm_token: token,
          device_type: deviceType,
          device_name: deviceName,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    },
    onError: (error: any) => {
      console.error("Error registering FCM token:", error);
    },
  });

  // Solicitar permiso y registrar token
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error("Las notificaciones push no están soportadas en este navegador");
      return;
    }

    if (!user || !barbershopId) {
      toast.error("Debes estar autenticado y tener un barbershop seleccionado");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== "granted") {
        toast.error("Permiso de notificaciones denegado");
        return;
      }

      // Registrar service worker y esperar a que esté activo
      if ("serviceWorker" in navigator) {
        try {
          // Primero, intentar desregistrar cualquier Service Worker existente
          const existingRegistrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of existingRegistrations) {
            await registration.unregister();
          }

          // Registrar el nuevo Service Worker
          const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
            scope: "/",
          });
          
          console.log("Service Worker registered:", registration);

          // Esperar a que el Service Worker esté activo
          if (registration.installing) {
            await new Promise<void>((resolve) => {
              registration.installing!.addEventListener("statechange", () => {
                if (registration.installing!.state === "activated") {
                  resolve();
                }
              });
            });
          } else if (registration.waiting) {
            // Si está en waiting, activarlo
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
            await new Promise<void>((resolve) => {
              registration.waiting!.addEventListener("statechange", () => {
                if (registration.waiting!.state === "activated") {
                  resolve();
                }
              });
            });
          } else if (registration.active) {
            // Si ya está activo, esperar un momento para asegurar que está listo
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          // Verificar que el Service Worker esté realmente activo
          const activeWorker = registration.active;
          if (!activeWorker) {
            throw new Error("Service Worker no se activó correctamente");
          }

          console.log("Service Worker activo:", activeWorker);
        } catch (error) {
          console.error("Error registering service worker:", error);
          toast.error(`Error al registrar el service worker: ${error instanceof Error ? error.message : "Error desconocido"}`);
          return;
        }
      } else {
        toast.error("Tu navegador no soporta Service Workers");
        return;
      }

      // Esperar un momento adicional para asegurar que Firebase puede acceder al Service Worker
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Obtener token FCM
      const messagingInstance = getFirebaseMessaging();
      if (!messagingInstance) {
        toast.error("Error al inicializar Firebase Messaging");
        return;
      }

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        toast.error("VAPID Key no configurada. Verifica tu archivo .env.local");
        return;
      }

      const token = await getToken(messagingInstance, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: await navigator.serviceWorker.ready,
      });

      if (!token) {
        toast.error("No se pudo obtener el token de notificación");
        return;
      }

      // Registrar token en la base de datos
      await registerTokenMutation.mutateAsync(token);
      toast.success("Notificaciones push activadas");

      // Configurar listener para mensajes en primer plano
      onMessage(messagingInstance, (payload) => {
        console.log("Message received:", payload);
        
        // Mostrar notificación manualmente si el usuario está en primer plano
        if (payload.notification) {
          new Notification(payload.notification.title || "Nueva notificación", {
            body: payload.notification.body,
            icon: payload.notification.icon || "/favicon.ico",
            badge: "/favicon.ico",
            tag: payload.data?.appointmentId,
            data: payload.data,
          });
        }

        // Opcional: mostrar toast también
        toast.info(payload.notification?.body || "Nueva notificación");
      });
    } catch (error: any) {
      console.error("Error requesting notification permission:", error);
      toast.error(`Error al activar notificaciones: ${error.message}`);
    }
  }, [isSupported, user, barbershopId, registerTokenMutation]);

  // Obtener tokens del usuario
  const { data: tokens } = useQuery({
    queryKey: ["push-notification-tokens", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("push_notification_tokens")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as PushNotificationToken[];
    },
    enabled: !!user,
  });

  // Eliminar token
  const deleteTokenMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const { error } = await supabase
        .from("push_notification_tokens")
        .delete()
        .eq("id", tokenId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-notification-tokens"] });
      toast.success("Token eliminado");
    },
    onError: (error: any) => {
      toast.error(`Error al eliminar token: ${error.message}`);
    },
  });

  return {
    isSupported,
    permission,
    preferences: preferences || null,
    preferencesLoading,
    tokens: tokens || [],
    requestPermission,
    updatePreferences: updatePreferencesMutation.mutate,
    deleteToken: deleteTokenMutation.mutate,
    isRegistering: registerTokenMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
  };
}
