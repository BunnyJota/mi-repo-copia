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

/**
 * Valida que todas las variables de entorno de Firebase estén configuradas
 */
function validateFirebaseConfig(): { valid: boolean; missing: string[] } {
  const required = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
  ];

  const missing: string[] = [];
  for (const key of required) {
    const value = import.meta.env[key];
    if (!value || value.trim() === "") {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Convierte una clave base64 estándar a base64url si es necesario
 */
function convertBase64ToBase64Url(base64: string): string {
  return base64
    .replace(/\+/g, "-")  // Reemplazar + con -
    .replace(/\//g, "_")  // Reemplazar / con _
    .replace(/=/g, "");   // Remover padding
}

/**
 * Valida y normaliza la VAPID key al formato correcto para Firebase
 * La VAPID key debe ser una clave pública en formato base64url (URL-safe base64)
 */
function validateAndNormalizeVapidKey(vapidKey: string): string {
  if (!vapidKey || vapidKey.trim() === "") {
    throw new Error("VAPID key está vacía");
  }

  // Remover espacios y saltos de línea
  let normalized = vapidKey.trim().replace(/\s+/g, "").replace(/\r?\n|\r/g, "");

  // Si contiene caracteres de base64 estándar (+ o /), convertir a base64url
  if (normalized.includes("+") || normalized.includes("/")) {
    console.log("Detectado formato base64 estándar, convirtiendo a base64url...");
    normalized = convertBase64ToBase64Url(normalized);
  }

  // Verificar que solo contiene caracteres válidos para base64url
  // base64url: A-Z, a-z, 0-9, -, _
  const base64urlRegex = /^[A-Za-z0-9_-]+$/;
  if (!base64urlRegex.test(normalized)) {
    const invalidChars = normalized.match(/[^A-Za-z0-9_-]/g);
    throw new Error(
      `VAPID key contiene caracteres inválidos: ${invalidChars?.join(", ")}. ` +
      `Debe estar en formato base64url (solo A-Z, a-z, 0-9, -, _). ` +
      `Verifica que copiaste la clave completa desde Firebase Console → Project Settings → Cloud Messaging → Web Push certificates`
    );
  }

  // Verificar longitud mínima (una clave pública EC P-256 debe tener al menos 65 bytes cuando se decodifica)
  // En base64url, esto es aproximadamente 87 caracteres (65 * 4/3 redondeado)
  // Pero Firebase puede usar diferentes longitudes, así que verificamos un rango razonable
  if (normalized.length < 80) {
    throw new Error(
      `VAPID key parece ser demasiado corta (${normalized.length} caracteres). ` +
      `Una clave pública válida debería tener aproximadamente 87 caracteres. ` +
      `Verifica que copiaste la clave completa desde Firebase Console.`
    );
  }

  // Verificar longitud máxima razonable (no más de 200 caracteres)
  if (normalized.length > 200) {
    throw new Error(
      `VAPID key parece ser demasiado larga (${normalized.length} caracteres). ` +
      `Verifica que copiaste solo la clave pública (Key pair), no la clave privada.`
    );
  }

  console.log("VAPID key validada y normalizada:", {
    length: normalized.length,
    preview: normalized.substring(0, 30) + "...",
    format: "base64url",
  });

  return normalized;
}

// Inicializar Firebase solo una vez
function getFirebaseMessaging(): Messaging | null {
  if (typeof window === "undefined") {
    return null; // SSR
  }

  // Validar configuración antes de inicializar
  const validation = validateFirebaseConfig();
  if (!validation.valid) {
    console.error("Firebase configuration incomplete. Missing:", validation.missing);
    return null;
  }

  try {
    if (!firebaseApp) {
      firebaseApp = initializeApp(firebaseConfig);
      console.log("Firebase initialized successfully");
    }

    if (!messaging && "serviceWorker" in navigator) {
      messaging = getMessaging(firebaseApp);
      console.log("Firebase Messaging initialized");
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

      if (!token || token.trim() === "") {
        throw new Error("Token FCM inválido o vacío");
      }

      const deviceType: "web" | "android" | "ios" = 
        /Android/i.test(navigator.userAgent) ? "android" :
        /iPhone|iPad|iPod/i.test(navigator.userAgent) ? "ios" :
        "web";

      const deviceName = `${deviceType} - ${navigator.userAgent.substring(0, 50)}`;

      console.log("Registrando token FCM:", { deviceType, deviceName, tokenLength: token.length });

      // Verificar si el token ya existe
      const { data: existingToken, error: lookupError } = await supabase
        .from("push_notification_tokens")
        .select("id")
        .eq("fcm_token", token)
        .maybeSingle();

      if (lookupError && lookupError.code !== "PGRST116") {
        // PGRST116 = no rows returned, que es OK
        console.error("Error buscando token existente:", lookupError);
        throw lookupError;
      }

      if (existingToken) {
        console.log("Token existente encontrado, actualizando...");
        // Actualizar last_used_at
        const { error } = await supabase
          .from("push_notification_tokens")
          .update({
            last_used_at: new Date().toISOString(),
            barbershop_id: barbershopId,
          })
          .eq("id", existingToken.id);

        if (error) {
          console.error("Error actualizando token existente:", error);
          throw error;
        }
        console.log("Token actualizado exitosamente");
        return existingToken.id;
      }

      // Crear nuevo token
      console.log("Creando nuevo token FCM...");
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

      if (error) {
        console.error("Error creando nuevo token:", error);
        throw error;
      }
      
      console.log("Token FCM creado exitosamente:", data.id);
      return data.id;
    },
    onError: (error: any) => {
      console.error("Error registering FCM token:", error);
      toast.error(`Error al registrar token: ${error instanceof Error ? error.message : "Error desconocido"}`);
    },
    onSuccess: () => {
      console.log("Token FCM registrado exitosamente en la base de datos");
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

      // Validar configuración de Firebase antes de continuar
      const firebaseValidation = validateFirebaseConfig();
      if (!firebaseValidation.valid) {
        const missingList = firebaseValidation.missing.join(", ");
        toast.error(`Configuración de Firebase incompleta. Faltan: ${missingList}. Verifica tu archivo .env.local`);
        return;
      }

      let vapidKey: string;
      try {
        const rawVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        console.log("VAPID Key raw desde env:", {
          exists: !!rawVapidKey,
          length: rawVapidKey?.length || 0,
          preview: rawVapidKey ? rawVapidKey.substring(0, 30) + "..." : "undefined",
        });
        
        if (!rawVapidKey || rawVapidKey.trim() === "") {
          toast.error("VAPID Key no configurada. Verifica tu archivo .env o .env.local y asegúrate de que VITE_FIREBASE_VAPID_KEY esté definida.");
          return;
        }
        vapidKey = validateAndNormalizeVapidKey(rawVapidKey);
        console.log("VAPID Key validada exitosamente:", {
          length: vapidKey.length,
          preview: vapidKey.substring(0, 30) + "...",
        });
      } catch (vapidError) {
        console.error("Error validando VAPID key:", vapidError);
        const errorMessage = vapidError instanceof Error ? vapidError.message : "Error desconocido";
        toast.error(`VAPID Key inválida: ${errorMessage}. Verifica que copiaste la clave completa desde Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates`);
        return;
      }

      // Registrar service worker y esperar a que esté activo
      if (!("serviceWorker" in navigator)) {
        toast.error("Tu navegador no soporta Service Workers");
        return;
      }

      let activeRegistration: ServiceWorkerRegistration | null = null;

      try {
        // Verificar si ya existe un Service Worker activo
        const existingRegistrations = await navigator.serviceWorker.getRegistrations();
        const existingActive = existingRegistrations.find(
          (reg) => reg.active && reg.active.scriptURL.includes("firebase-messaging-sw.js")
        );

        if (existingActive && existingActive.active) {
          console.log("Service Worker ya está activo, reutilizando:", existingActive.active);
          activeRegistration = existingActive;
        } else {
          // Si hay registrations pero no están activas o son de otro archivo, desregistrarlas
          for (const registration of existingRegistrations) {
            if (!registration.active || !registration.active.scriptURL.includes("firebase-messaging-sw.js")) {
              console.log("Desregistrando Service Worker obsoleto:", registration.scope);
              await registration.unregister();
            }
          }

          // Registrar el nuevo Service Worker
          console.log("Registrando nuevo Service Worker...");
          const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
            scope: "/",
          });
          
          console.log("Service Worker registered:", registration);

          // Esperar a que el Service Worker esté activo
          if (registration.installing) {
            console.log("Service Worker está instalando...");
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error("Timeout esperando activación del Service Worker (10s)"));
              }, 10000);

              registration.installing.addEventListener("statechange", () => {
                const state = registration.installing?.state;
                console.log("Service Worker state changed:", state);
                
                if (state === "activated") {
                  clearTimeout(timeout);
                  resolve();
                } else if (state === "redundant") {
                  clearTimeout(timeout);
                  reject(new Error("Service Worker se volvió redundante durante la instalación"));
                }
              });
            });
          } else if (registration.waiting) {
            console.log("Service Worker está en waiting, activando...");
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
            
            // Esperar a que se active
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error("Timeout esperando activación del Service Worker (10s)"));
              }, 10000);

              const checkActive = () => {
                if (registration.active && registration.active.state === "activated") {
                  clearTimeout(timeout);
                  resolve();
                } else if (registration.waiting?.state === "redundant") {
                  clearTimeout(timeout);
                  reject(new Error("Service Worker se volvió redundante"));
                } else {
                  setTimeout(checkActive, 100);
                }
              };
              checkActive();
            });
          }

          // Usar navigator.serviceWorker.ready como fallback
          activeRegistration = await navigator.serviceWorker.ready;
          
          if (!activeRegistration.active || activeRegistration.active.state !== "activated") {
            throw new Error("Service Worker no se activó correctamente. Estado: " + activeRegistration.active?.state);
          }

          console.log("Service Worker activo y listo:", activeRegistration.active.state);
        }

        // Esperar un momento adicional para asegurar que Firebase puede acceder al Service Worker
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Obtener token FCM
        const messagingInstance = getFirebaseMessaging();
        if (!messagingInstance) {
          toast.error("Error al inicializar Firebase Messaging. Verifica la consola para más detalles.");
          return;
        }

        console.log("Obteniendo token FCM con VAPID key:", {
          vapidKeyLength: vapidKey.length,
          vapidKeyPreview: vapidKey.substring(0, 30) + "...",
          serviceWorkerActive: activeRegistration.active?.state,
        });

        let token: string;
        try {
          token = await getToken(messagingInstance, {
            vapidKey: vapidKey,
            serviceWorkerRegistration: activeRegistration,
          });
        } catch (tokenError: any) {
          console.error("Error obteniendo token FCM:", tokenError);
          
          // Proporcionar mensajes de error más específicos
          if (tokenError?.code === "messaging/invalid-vapid-key" || 
              tokenError?.message?.includes("applicationServerKey") ||
              tokenError?.name === "InvalidAccessError") {
            const errorMsg = `
La VAPID Key no es válida. Por favor verifica:

1. Ve a Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
2. Si no hay un par de claves, haz clic en "Generate key pair"
3. Copia la CLAVE PÚBLICA (no la privada)
4. Asegúrate de copiar la clave completa sin espacios ni saltos de línea
5. La clave debe estar en formato base64url (solo letras, números, guiones y guiones bajos)

VAPID Key actual (primeros 30 caracteres): ${vapidKey.substring(0, 30)}...
            `.trim();
            toast.error(errorMsg);
          } else {
            toast.error(`Error al obtener token FCM: ${tokenError?.message || "Error desconocido"}`);
          }
          return;
        }

        if (!token || token.trim() === "") {
          toast.error("No se pudo obtener el token de notificación. Verifica que el Service Worker esté activo y que la VAPID key sea correcta.");
          return;
        }

        console.log("Token FCM obtenido exitosamente");

        // Registrar token en la base de datos
        await registerTokenMutation.mutateAsync(token);
        toast.success("Notificaciones push activadas correctamente");

        // Configurar listener para mensajes en primer plano
        onMessage(messagingInstance, (payload) => {
          console.log("Message received in foreground:", payload);
          
          // Mostrar notificación manualmente si el usuario está en primer plano
          if (payload.notification) {
            try {
              new Notification(payload.notification.title || "Nueva notificación", {
                body: payload.notification.body,
                icon: payload.notification.icon || "/favicon.ico",
                badge: "/favicon.ico",
                tag: payload.data?.appointmentId,
                data: payload.data,
              });
            } catch (notifError) {
              console.error("Error showing notification:", notifError);
            }
          }

          // Mostrar toast también
          toast.info(payload.notification?.body || "Nueva notificación");
        });
      } catch (swError) {
        console.error("Error registering service worker:", swError);
        const errorMessage = swError instanceof Error ? swError.message : "Error desconocido";
        toast.error(`Error al registrar el service worker: ${errorMessage}`);
        return;
      }
    } catch (error: any) {
      console.error("Error requesting notification permission:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      toast.error(`Error al activar notificaciones: ${errorMessage}`);
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
