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
 * Genera un JWT firmado con la service account para obtener un access token de Google
 */
async function getAccessToken(): Promise<string> {
  if (!FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error("Credenciales de Firebase incompletas");
  }

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

  // Importar la private key en WebCrypto
  const encoder = new TextEncoder();
  const keyData = encoder.encode(FIREBASE_PRIVATE_KEY);

  // Convertir la key PEM a PKCS8 binario
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pem = FIREBASE_PRIVATE_KEY
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\r?\n|\r/g, "");
  const binaryDer = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(unsignedToken),
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${unsignedToken}.${signatureBase64}`;

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
    console.error("Error obteniendo access token de Google:", errorText);
    throw new Error(`Error al obtener access token: ${response.status}`);
  }

  const json = await response.json();
  return json.access_token as string;
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
        console.error("FCM v1 error for token", token, ":", errorText);
        failedTokens.push(token);
      } else {
        successCount++;
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
  console.log("Push notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, appointmentId, userIds }: PushNotificationRequest = await req.json();

    if (!type || !appointmentId) {
      return new Response(
        JSON.stringify({ error: "Missing type or appointmentId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Processing ${type} push notification for appointment ${appointmentId}`);

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
      console.error("Error fetching appointment:", appointmentError);
      return new Response(
        JSON.stringify({ error: "Appointment not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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
        console.error("Error fetching recipients:", recipientsError);
        // Fallback: usar owner y staff asignado manualmente
        const { data: barbershop } = await supabase
          .from("barbershops")
          .select("id")
          .eq("id", appointment.barbershop_id)
          .single();

        if (barbershop) {
          const { data: owner } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "owner")
            .limit(1);

          if (owner && owner[0]) {
            recipientUserIds.push(owner[0].user_id);
          }
        }

        if (appointment.staff_user_id) {
          recipientUserIds.push(appointment.staff_user_id);
        }
      } else {
        recipientUserIds = recipients?.map((r: any) => r.user_id) || [];
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

    // Enviar en lotes de 1000 (límite de FCM)
    const batchSize = 1000;
    const batches: string[][] = [];
    for (let i = 0; i < allTokens.length; i += batchSize) {
      batches.push(allTokens.slice(i, i + batchSize));
    }

    const results = [];
    for (const batch of batches) {
      const result = await sendFCMNotification(batch, notificationPayload, notificationPayload.data);
      results.push(result);

      // Si hay tokens fallidos, eliminarlos de la base de datos
      if (result.failedTokens && result.failedTokens.length > 0) {
        await supabase
          .from("push_notification_tokens")
          .delete()
          .in("fcm_token", result.failedTokens);
        console.log(`Removed ${result.failedTokens.length} invalid FCM tokens`);
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Push notifications sent: ${successCount}/${batches.length} batches successful`);

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        batchesProcessed: batches.length,
        successfulBatches: successCount,
        tokensSent: allTokens.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-push-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
