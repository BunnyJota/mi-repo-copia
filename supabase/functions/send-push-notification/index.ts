/**
 * Edge Function: send-push-notification
 * 
 * Envía push notifications usando Firebase Cloud Messaging (FCM).
 * 
 * CONFIGURACIÓN REQUERIDA (Supabase Dashboard -> Edge Functions -> Secrets):
 * - FIREBASE_PROJECT_ID: ID de tu proyecto Firebase (por ejemplo: trimly-6de39)
 * - FIREBASE_CLIENT_EMAIL: client_email de tu Service Account
 * - FIREBASE_PRIVATE_KEY: private_key de tu Service Account (con saltos de línea reales)
 * 
 * Las siguientes variables se configuran automáticamente por Supabase:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  type: "new_appointment" | "reminder_30min" | "reminder_24h" | "reminder_2h";
  appointmentId: string;
  userIds?: string[]; // Opcional: si se especifica, solo envía a estos usuarios
}

interface FCMNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID");
const FIREBASE_CLIENT_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL");
const FIREBASE_PRIVATE_KEY_RAW = Deno.env.get("FIREBASE_PRIVATE_KEY");

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY_RAW) {
  console.error("⚠️ Variables FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY no están configuradas. Configúralas en Supabase Dashboard -> Edge Functions -> Secrets");
}

// La private key suele venir con los saltos de línea escapados, los restauramos
const FIREBASE_PRIVATE_KEY = FIREBASE_PRIVATE_KEY_RAW
  ? FIREBASE_PRIVATE_KEY_RAW.replace(/\\n/g, "\n")
  : undefined;

const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Valida y normaliza la private key de Firebase
 */
function normalizePrivateKey(key: string): string {
  // Remover saltos de línea escapados
  let normalized = key.replace(/\\n/g, "\n");
  
  // Asegurar que tenga los headers correctos
  if (!normalized.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error("Private key no tiene el formato PEM correcto (falta BEGIN PRIVATE KEY)");
  }
  
  if (!normalized.includes("-----END PRIVATE KEY-----")) {
    throw new Error("Private key no tiene el formato PEM correcto (falta END PRIVATE KEY)");
  }
  
  return normalized;
}

/**
 * Genera un JWT firmado con la service account para obtener un access token de Google
 */
async function getAccessToken(): Promise<string> {
  if (!FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error("Credenciales de Firebase incompletas: FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY no están configuradas");
  }

  try {
    // Normalizar la private key
    const normalizedKey = normalizePrivateKey(FIREBASE_PRIVATE_KEY);
    
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: "RS256",
      typ: "JWT",
    };

    const payload = {
      iss: FIREBASE_CLIENT_EMAIL,
      sub: FIREBASE_CLIENT_EMAIL,
      aud: GOOGLE_OAUTH_TOKEN_URL,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      iat: now,
      exp: now + 3600,
    };

    const base64UrlEncode = (obj: unknown) =>
      btoa(JSON.stringify(obj))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;

    // Convertir la key PEM a PKCS8 binario
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pem = normalizedKey
      .replace(pemHeader, "")
      .replace(pemFooter, "")
      .replace(/\r?\n|\r/g, "")
      .trim();

    if (!pem || pem.length === 0) {
      throw new Error("Private key está vacía después de procesar");
    }

    let binaryDer: Uint8Array;
    try {
      binaryDer = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
    } catch (base64Error) {
      throw new Error(`Error decodificando private key (base64 inválido): ${base64Error instanceof Error ? base64Error.message : "Error desconocido"}`);
    }

    if (binaryDer.length === 0) {
      throw new Error("Private key decodificada está vacía");
    }

    // Importar la key en WebCrypto
    let cryptoKey: CryptoKey;
    try {
      cryptoKey = await crypto.subtle.importKey(
        "pkcs8",
        binaryDer.buffer,
        {
          name: "RSASSA-PKCS1-v1_5",
          hash: "SHA-256",
        },
        false,
        ["sign"],
      );
    } catch (importError) {
      throw new Error(`Error importando private key: ${importError instanceof Error ? importError.message : "Error desconocido"}`);
    }

    // Firmar el JWT
    const encoder = new TextEncoder();
    let signature: ArrayBuffer;
    try {
      signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        cryptoKey,
        encoder.encode(unsignedToken),
      );
    } catch (signError) {
      throw new Error(`Error firmando JWT: ${signError instanceof Error ? signError.message : "Error desconocido"}`);
    }

    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const jwt = `${unsignedToken}.${signatureBase64}`;

    // Obtener access token de Google
    const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error obteniendo access token de Google:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      
      // Intentar parsear el error como JSON
      let errorMessage = `Error al obtener access token: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error_description) {
          errorMessage = errorJson.error_description;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        // Si no es JSON, usar el texto tal cual
        if (errorText) {
          errorMessage = errorText.substring(0, 200);
        }
      }
      
      throw new Error(errorMessage);
    }

    const json = await response.json();
    
    if (!json.access_token) {
      throw new Error("Google OAuth no devolvió access_token en la respuesta");
    }
    
    console.log("Access token obtenido exitosamente");
    return json.access_token as string;
  } catch (error) {
    console.error("Error en getAccessToken:", error);
    throw error;
  }
}

/**
 * Envía una notificación push a través de FCM HTTP v1
 */
async function sendFCMNotification(
  tokens: string[],
  notification: FCMNotificationPayload,
  data?: Record<string, any>
): Promise<{ success: boolean; failedTokens?: string[] }> {
  if (!FIREBASE_PROJECT_ID) {
    throw new Error("FIREBASE_PROJECT_ID no está configurada");
  }

  if (tokens.length === 0) {
    return { success: true };
  }

  const accessToken = await getAccessToken();

  const failedTokens: string[] = [];
  let successCount = 0;

  try {
    for (const token of tokens) {
      const message = {
        message: {
          token,
          notification: {
            title: notification.title,
            body: notification.body,
          },
          webpush: {
            headers: {
              Urgency: "high",
            },
            notification: {
              icon: notification.icon || "/favicon.ico",
              badge: notification.badge || "/favicon.ico",
              requireInteraction: true,
            },
            data: data ?? {},
          },
          data: data
            ? Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)]),
              )
            : undefined,
        },
      };

      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorDetails = errorText;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorDetails = errorJson.error.message;
          }
        } catch {
          // Si no es JSON, usar el texto tal cual
        }
        
        // Identificar tipos de error para logging
        if (response.status === 404 || errorDetails.includes("NOT_FOUND")) {
          console.warn(`Token FCM no encontrado o inválido: ${token.substring(0, 20)}...`);
        } else if (response.status === 403 || errorDetails.includes("PERMISSION_DENIED")) {
          console.error(`Permiso denegado para enviar notificación. Verifica las credenciales de Firebase.`);
        } else {
          console.error(`FCM v1 error para token ${token.substring(0, 20)}...: ${response.status} - ${errorDetails}`);
        }
        
        failedTokens.push(token);
      } else {
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`Notificaciones enviadas exitosamente: ${successCount}/${tokens.length}`);
        }
      }
    }

    return {
      success: successCount > 0,
      failedTokens: failedTokens.length > 0 ? failedTokens : undefined,
    };
  } catch (error) {
    console.error("Error sending FCM notification:", error);
    throw error;
  }
}

/**
 * Obtiene los tokens FCM activos para los usuarios especificados
 */
async function getFCMTokens(
  supabase: any,
  userIds: string[],
  barbershopId: string
): Promise<Map<string, string[]>> {
  const { data: tokens, error } = await supabase
    .from("push_notification_tokens")
    .select("user_id, fcm_token, device_type")
    .in("user_id", userIds)
    .or(`barbershop_id.is.null,barbershop_id.eq.${barbershopId}`);

  if (error) {
    console.error("Error fetching FCM tokens:", error);
    return new Map();
  }

  const tokenMap = new Map<string, string[]>();
  userIds.forEach(userId => {
    tokenMap.set(userId, []);
  });

  tokens?.forEach((token: any) => {
    const userTokens = tokenMap.get(token.user_id) || [];
    userTokens.push(token.fcm_token);
    tokenMap.set(token.user_id, userTokens);
  });

  return tokenMap;
}

/**
 * Verifica si un usuario tiene habilitada una preferencia de notificación específica
 */
async function checkNotificationPreference(
  supabase: any,
  userId: string,
  barbershopId: string,
  type: PushNotificationRequest["type"]
): Promise<boolean> {
  const { data: prefs, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .eq("barbershop_id", barbershopId)
    .single();

  if (error || !prefs) {
    // Si no hay preferencias, usar valores por defecto (habilitado)
    return true;
  }

  switch (type) {
    case "new_appointment":
      return prefs.new_appointment_enabled === true;
    case "reminder_30min":
      return prefs.reminder_30min_enabled === true;
    case "reminder_24h":
      return prefs.reminder_24h_enabled === true;
    case "reminder_2h":
      return prefs.reminder_2h_enabled === true;
    default:
      return true;
  }
}

const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[${requestId}] Push notification function called`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validar variables de entorno críticas
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] Variables de entorno de Supabase no configuradas`);
      return new Response(
        JSON.stringify({ error: "Configuración del servidor incompleta" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validar credenciales de Firebase
    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY_RAW) {
      console.error(`[${requestId}] Credenciales de Firebase no configuradas`);
      return new Response(
        JSON.stringify({ 
          error: "Credenciales de Firebase no configuradas. Configura FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en Supabase Dashboard -> Edge Functions -> Secrets" 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { type, appointmentId, userIds }: PushNotificationRequest = await req.json();

    if (!type || !appointmentId) {
      console.warn(`[${requestId}] Request inválido: falta type o appointmentId`);
      return new Response(
        JSON.stringify({ error: "Missing type or appointmentId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[${requestId}] Processing ${type} push notification for appointment ${appointmentId}`);

    // Obtener información de la cita
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(`
        id,
        start_at,
        end_at,
        status,
        total_price_estimated,
        barbershop_id,
        staff_user_id,
        client:clients!appointments_client_id_fkey(name, email),
        barbershop:barbershops!appointments_barbershop_id_fkey(name, brand_accent),
        staff:staff_profiles!appointments_staff_user_id_fkey(display_name)
      `)
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error(`[${requestId}] Error fetching appointment:`, appointmentError);
      return new Response(
        JSON.stringify({ error: "Appointment not found", details: appointmentError?.message }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[${requestId}] Appointment found:`, {
      id: appointment.id,
      barbershop_id: appointment.barbershop_id,
      staff_user_id: appointment.staff_user_id,
      status: appointment.status,
    });

    // Determinar destinatarios
    let recipientUserIds: string[] = [];
    
    if (userIds && userIds.length > 0) {
      // Si se especifican usuarios, usar esos
      recipientUserIds = userIds;
    } else {
      // Obtener destinatarios usando la función SQL
      const { data: recipients, error: recipientsError } = await supabase
        .rpc("get_notification_recipients", { _appointment_id: appointmentId });

      if (recipientsError) {
        console.error("Error fetching recipients using SQL function:", recipientsError);
        console.log("Usando fallback manual para obtener destinatarios...");
        
        // Fallback: usar owner y staff asignado manualmente
        try {
          // Obtener owner del barbershop
          const { data: ownerProfiles, error: ownerError } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("barbershop_id", appointment.barbershop_id)
            .limit(1);

          if (!ownerError && ownerProfiles && ownerProfiles.length > 0) {
            const { data: ownerRole } = await supabase
              .from("user_roles")
              .select("user_id")
              .eq("user_id", ownerProfiles[0].user_id)
              .eq("role", "owner")
              .limit(1)
              .single();

            if (ownerRole) {
              recipientUserIds.push(ownerRole.user_id);
              console.log("Owner encontrado (fallback):", ownerRole.user_id);
            }
          }

          // Agregar staff asignado si existe
          if (appointment.staff_user_id) {
            // Verificar que el staff existe
            const { data: staffExists } = await supabase
              .from("profiles")
              .select("user_id")
              .eq("user_id", appointment.staff_user_id)
              .single();

            if (staffExists) {
              recipientUserIds.push(appointment.staff_user_id);
              console.log("Staff asignado encontrado:", appointment.staff_user_id);
            } else {
              console.warn("Staff asignado no existe en profiles:", appointment.staff_user_id);
            }
          }
        } catch (fallbackError) {
          console.error("Error en fallback de destinatarios:", fallbackError);
        }
      } else {
        recipientUserIds = recipients?.map((r: any) => r.user_id).filter((id: string) => id != null) || [];
        console.log(`Destinatarios encontrados: ${recipientUserIds.length}`, recipientUserIds);
      }
    }

    if (recipientUserIds.length === 0) {
      console.log("No recipients found for this appointment");
      return new Response(
        JSON.stringify({ success: true, message: "No recipients found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Filtrar usuarios según sus preferencias
    const filteredUserIds: string[] = [];
    for (const userId of recipientUserIds) {
      const hasPreference = await checkNotificationPreference(
        supabase,
        userId,
        appointment.barbershop_id,
        type
      );
      if (hasPreference) {
        filteredUserIds.push(userId);
      }
    }

    if (filteredUserIds.length === 0) {
      console.log("No users with enabled preferences for this notification type");
      return new Response(
        JSON.stringify({ success: true, message: "No users with enabled preferences" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Obtener tokens FCM para los usuarios
    const tokenMap = await getFCMTokens(supabase, filteredUserIds, appointment.barbershop_id);

    // Preparar el contenido de la notificación según el tipo
    const clientName = Array.isArray(appointment.client) 
      ? appointment.client[0]?.name 
      : appointment.client?.name || "Cliente";
    const barbershopName = Array.isArray(appointment.barbershop)
      ? appointment.barbershop[0]?.name
      : appointment.barbershop?.name || "Barbershop";
    const staffName = appointment.staff?.display_name || "Sin asignar";

    let notificationTitle = "";
    let notificationBody = "";

    const formatTime = (dateStr: string) => {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    };

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    };

    switch (type) {
      case "new_appointment":
        notificationTitle = `📅 Nueva cita - ${barbershopName}`;
        notificationBody = `${clientName} ha agendado una cita con ${staffName} el ${formatDate(appointment.start_at)} a las ${formatTime(appointment.start_at)}`;
        break;
      case "reminder_30min":
        notificationTitle = `⏰ Recordatorio de cita`;
        notificationBody = `Tu cita con ${clientName} es en 30 minutos (${formatTime(appointment.start_at)})`;
        break;
      case "reminder_24h":
        notificationTitle = `📅 Recordatorio de cita`;
        notificationBody = `Tienes una cita mañana con ${clientName} a las ${formatTime(appointment.start_at)}`;
        break;
      case "reminder_2h":
        notificationTitle = `⏰ Recordatorio de cita`;
        notificationBody = `Tu cita con ${clientName} es en 2 horas (${formatTime(appointment.start_at)})`;
        break;
    }

    const notificationPayload: FCMNotificationPayload = {
      title: notificationTitle,
      body: notificationBody,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: {
        type,
        appointmentId: appointment.id,
        barbershopId: appointment.barbershop_id,
        url: `/dashboard/appointments/${appointment.id}`,
      },
    };

    // Enviar notificaciones a todos los tokens
    const allTokens: string[] = [];
    filteredUserIds.forEach(userId => {
      const tokens = tokenMap.get(userId) || [];
      allTokens.push(...tokens);
    });

    if (allTokens.length === 0) {
      console.log("No FCM tokens found for recipients");
      return new Response(
        JSON.stringify({ success: true, message: "No FCM tokens found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Enviar notificaciones (FCM v1 envía una por una, no en lotes)
    // Pero agrupamos en batches para logging y manejo de errores
    const batchSize = 100; // Procesar en grupos de 100 para logging
    const batches: string[][] = [];
    for (let i = 0; i < allTokens.length; i += batchSize) {
      batches.push(allTokens.slice(i, i + batchSize));
    }

    const results = [];
    let totalFailedTokens: string[] = [];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Procesando batch ${batchIndex + 1}/${batches.length} (${batch.length} tokens)`);
      
      try {
        const result = await sendFCMNotification(batch, notificationPayload, notificationPayload.data);
        results.push(result);

        // Acumular tokens fallidos
        if (result.failedTokens && result.failedTokens.length > 0) {
          totalFailedTokens.push(...result.failedTokens);
        }
      } catch (batchError) {
        console.error(`Error procesando batch ${batchIndex + 1}:`, batchError);
        // Marcar todos los tokens del batch como fallidos
        totalFailedTokens.push(...batch);
        results.push({ success: false, failedTokens: batch });
      }
    }

    // Eliminar tokens fallidos de la base de datos
    if (totalFailedTokens.length > 0) {
      try {
        const { error: deleteError } = await supabase
          .from("push_notification_tokens")
          .delete()
          .in("fcm_token", totalFailedTokens);
        
        if (deleteError) {
          console.error("Error eliminando tokens fallidos:", deleteError);
        } else {
          console.log(`Eliminados ${totalFailedTokens.length} tokens FCM inválidos de la base de datos`);
        }
      } catch (deleteErr) {
        console.error("Error al intentar eliminar tokens fallidos:", deleteErr);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalSuccess = results.reduce((sum, r) => sum + (r.success ? 1 : 0), 0);
    
    console.log(`[${requestId}] Push notifications summary:`, {
      totalTokens: allTokens.length,
      batchesProcessed: batches.length,
      successfulBatches: successCount,
      failedTokens: totalFailedTokens.length,
    });

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        batchesProcessed: batches.length,
        successfulBatches: successCount,
        tokensSent: allTokens.length,
        tokensFailed: totalFailedTokens.length,
        requestId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    const requestId = crypto.randomUUID().substring(0, 8);
    console.error(`[${requestId}] Error in send-push-notification function:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Error desconocido al procesar notificación push",
        requestId,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
