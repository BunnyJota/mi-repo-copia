/**
 * Edge Function: send-email
 * 
 * Envía emails de confirmación, recordatorio, cancelación y reprogramación de citas.
 * 
 * CONFIGURACIÓN REQUERIDA (Supabase Dashboard -> Edge Functions -> Secrets):
 * - RESEND_API_KEY: Tu API key de resend.com
 * - APP_URL: URL de tu aplicación (ej: https://tu-app.vercel.app)
 * 
 * Las siguientes variables se configuran automáticamente por Supabase:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Validar que RESEND_API_KEY esté configurada
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
if (!RESEND_API_KEY) {
  console.error("⚠️ RESEND_API_KEY no está configurada. Configúrala en Supabase Dashboard -> Edge Functions -> Secrets");
}

const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "confirmation" | "reminder" | "cancellation" | "reschedule";
  appointmentId: string;
  barbershopId?: string;
}

interface AppointmentData {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  total_price_estimated: number;
  client: {
    name: string;
    email: string;
    phone: string | null;
  };
  staff: {
    display_name: string;
  };
  barbershop: {
    name: string;
    address: string | null;
    phone: string | null;
    brand_accent: string;
  };
  services: {
    name: string;
    price: number;
  }[];
  token?: string;
}

const formatDate = (dateStr: string, timezone: string = "America/New_York") => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  }).format(date);
};

const formatTime = (dateStr: string, timezone: string = "America/New_York") => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
};

const generateEmailHtml = (
  type: EmailRequest["type"],
  data: AppointmentData,
  confirmUrl: string,
  cancelUrl: string,
  manageUrl: string
) => {
  const accentColor = data.barbershop.brand_accent || "#E45500";
  
  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  `;

  const headerStyles = `
    background-color: ${accentColor};
    color: white;
    padding: 30px;
    text-align: center;
    border-radius: 12px 12px 0 0;
  `;

  const contentStyles = `
    background-color: #ffffff;
    padding: 30px;
    border: 1px solid #e5e5e5;
    border-top: none;
  `;

  const footerStyles = `
    background-color: #f5f5f5;
    padding: 20px;
    text-align: center;
    border-radius: 0 0 12px 12px;
    border: 1px solid #e5e5e5;
    border-top: none;
  `;

  const buttonStyles = `
    display: inline-block;
    padding: 14px 28px;
    background-color: ${accentColor};
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin: 5px;
  `;

  const cancelButtonStyles = `
    display: inline-block;
    padding: 14px 28px;
    background-color: #dc2626;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin: 5px;
  `;

  const outlineButtonStyles = `
    display: inline-block;
    padding: 14px 28px;
    background-color: transparent;
    color: ${accentColor};
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin: 5px;
    border: 2px solid ${accentColor};
  `;

  const servicesList = data.services.map(s => `${s.name} - $${s.price}`).join("<br>");
  
  let title = "";
  let subtitle = "";
  let showConfirmButtons = false;
  let showManageButtons = false;

  switch (type) {
    case "confirmation":
      title = "¡Confirma tu Cita!";
      subtitle = "Hemos recibido tu reserva. Por favor confirma haciendo clic en el botón de abajo.";
      showConfirmButtons = true;
      break;
    case "reminder":
      title = "Recordatorio de Cita";
      subtitle = "Tu cita está próxima";
      showManageButtons = true;
      break;
    case "cancellation":
      title = "Cita Cancelada";
      subtitle = "Tu cita ha sido cancelada";
      showManageButtons = false;
      break;
    case "reschedule":
      title = "Cita Reprogramada";
      subtitle = "Tu cita ha sido reprogramada";
      showManageButtons = true;
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="${baseStyles}">
        <div style="${headerStyles}">
          <h1 style="margin: 0; font-size: 28px;">${data.barbershop.name}</h1>
        </div>
        
        <div style="${contentStyles}">
          <h2 style="color: #1a1a1a; margin-top: 0;">${title}</h2>
          <p style="color: #666; font-size: 16px;">${subtitle}</p>
          
          <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1a1a1a;">Detalles de tu cita</h3>
            
            <p style="margin: 8px 0;">
              <strong>📅 Fecha:</strong> ${formatDate(data.start_at)}
            </p>
            <p style="margin: 8px 0;">
              <strong>🕐 Hora:</strong> ${formatTime(data.start_at)}
            </p>
            <p style="margin: 8px 0;">
              <strong>✂️ Servicios:</strong><br>${servicesList}
            </p>
            <p style="margin: 8px 0;">
              <strong>👤 Barbero:</strong> ${data.staff.display_name}
            </p>
            <p style="margin: 8px 0; font-size: 18px;">
              <strong>💰 Total:</strong> $${data.total_price_estimated}
            </p>
          </div>
          
          ${data.barbershop.address ? `
            <p style="color: #666;">
              <strong>📍 Dirección:</strong> ${data.barbershop.address}
            </p>
          ` : ""}
          
          ${data.barbershop.phone ? `
            <p style="color: #666;">
              <strong>📞 Teléfono:</strong> ${data.barbershop.phone}
            </p>
          ` : ""}
          
          ${showConfirmButtons ? `
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; margin-bottom: 15px; font-weight: bold;">¿Confirmas esta cita?</p>
              <div>
                <a href="${confirmUrl}" style="${buttonStyles}">✅ Confirmar Cita</a>
              </div>
              <div style="margin-top: 15px;">
                <a href="${cancelUrl}" style="${cancelButtonStyles}">❌ Cancelar Cita</a>
              </div>
              <p style="color: #999; font-size: 12px; margin-top: 20px;">
                Si no confirmas, la cita quedará pendiente y podría ser cancelada.
              </p>
            </div>
          ` : ""}
          
          ${showManageButtons ? `
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; margin-bottom: 15px;">¿Necesitas hacer cambios?</p>
              <a href="${manageUrl}" style="${outlineButtonStyles}">Gestionar cita</a>
            </div>
          ` : ""}
        </div>
        
        <div style="${footerStyles}">
          <p style="margin: 0; color: #666; font-size: 14px;">
            ${data.barbershop.name}
          </p>
          <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">
            Este email fue enviado automáticamente. Por favor no responda a este mensaje.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, appointmentId }: EmailRequest = await req.json();
    console.log(`Processing ${type} email for appointment ${appointmentId}`);

    // Fetch appointment with client and barbershop data (without staff join)
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        id,
        start_at,
        end_at,
        status,
        total_price_estimated,
        barbershop_id,
        staff_user_id,
        client:clients!appointments_client_id_fkey(name, email, phone),
        barbershop:barbershops!appointments_barbershop_id_fkey(name, address, phone, brand_accent, timezone),
        appointment_services(
          service:services(name, price)
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment) {
      console.error("Error fetching appointment:", fetchError);
      throw new Error("Appointment not found");
    }

    // Fetch staff profile separately using staff_user_id
    let staffData = { display_name: "Sin asignar" };
    if (appointment.staff_user_id) {
      const { data: staffProfile } = await supabase
        .from("staff_profiles")
        .select("display_name")
        .eq("user_id", appointment.staff_user_id)
        .eq("barbershop_id", appointment.barbershop_id)
        .single();
      
      if (staffProfile) {
        staffData = staffProfile;
      }
    }

    // Generate tokens for confirm/cancel/manage
    const confirmToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
    const cancelToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
    const manageToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
    
    // Set expiration to appointment time + 24 hours
    const expiresAt = new Date(appointment.start_at);
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create tokens for confirm, cancel, and manage
    if (type === "confirmation") {
      // Delete existing tokens for this appointment
      await supabase
        .from("appointment_links")
        .delete()
        .eq("appointment_id", appointmentId);

      // Insert new tokens
      const { error: linkError } = await supabase
        .from("appointment_links")
        .insert([
          {
            appointment_id: appointmentId,
            token: confirmToken,
            purpose: "confirm",
            expires_at: expiresAt.toISOString(),
          },
          {
            appointment_id: appointmentId,
            token: cancelToken,
            purpose: "cancel",
            expires_at: expiresAt.toISOString(),
          },
          {
            appointment_id: appointmentId,
            token: manageToken,
            purpose: "manage",
            expires_at: expiresAt.toISOString(),
          },
        ]);

      if (linkError) {
        console.error("Error creating links:", linkError);
      }
    } else {
      // For other email types, get existing manage token or create new one
      const { data: existingLink } = await supabase
        .from("appointment_links")
        .select("token")
        .eq("appointment_id", appointmentId)
        .eq("purpose", "manage")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (!existingLink) {
        await supabase
          .from("appointment_links")
          .insert({
            appointment_id: appointmentId,
            token: manageToken,
            purpose: "manage",
            expires_at: expiresAt.toISOString(),
          });
      }
    }

    // Build URLs - Usa la variable de entorno APP_URL
    // Configúrala en: Supabase Dashboard -> Edge Functions -> Secrets
    const appUrl = Deno.env.get("APP_URL");
    if (!appUrl) {
      console.warn("⚠️ APP_URL no está configurada. Usando URL por defecto. Configúrala en Supabase Dashboard -> Edge Functions -> Secrets");
    }
    const baseUrl = appUrl || "http://localhost:5173";
    const confirmUrl = `${baseUrl}/confirm/${confirmToken}`;
    const cancelUrl = `${baseUrl}/confirm/${cancelToken}?action=cancel`;
    const manageUrl = `${baseUrl}/m/${type === "confirmation" ? manageToken : (await supabase
      .from("appointment_links")
      .select("token")
      .eq("appointment_id", appointmentId)
      .eq("purpose", "manage")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle()).data?.token || manageToken}`;

    // Prepare data for email
    const clientData = Array.isArray(appointment.client) ? appointment.client[0] : appointment.client;
    const barbershopData = Array.isArray(appointment.barbershop) ? appointment.barbershop[0] : appointment.barbershop;

    const emailData: AppointmentData = {
      id: appointment.id,
      start_at: appointment.start_at,
      end_at: appointment.end_at,
      status: appointment.status,
      total_price_estimated: appointment.total_price_estimated,
      client: clientData,
      staff: staffData,
      barbershop: barbershopData,
      services: appointment.appointment_services.map((as: any) => ({
        name: as.service.name,
        price: as.service.price,
      })),
    };

    // Generate email subject
    let subject = "";
    switch (type) {
      case "confirmation":
        subject = `⏳ Confirma tu cita - ${emailData.barbershop.name}`;
        break;
      case "reminder":
        subject = `⏰ Recordatorio: Tu cita en ${emailData.barbershop.name}`;
        break;
      case "cancellation":
        subject = `❌ Cita cancelada - ${emailData.barbershop.name}`;
        break;
      case "reschedule":
        subject = `🔄 Cita reprogramada - ${emailData.barbershop.name}`;
        break;
    }

    // Generate HTML
    const html = generateEmailHtml(type, emailData, confirmUrl, cancelUrl, manageUrl);

    // Send email
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: `${emailData.barbershop.name} <onboarding@resend.dev>`,
      to: [emailData.client.email],
      subject,
      html,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully:", emailResult);

    // Log email
    await supabase.from("email_log").insert({
      barbershop_id: appointment.barbershop_id,
      to_email: emailData.client.email,
      template: type,
      status: "sent",
      provider_id: emailResult?.id || null,
    });

    return new Response(
      JSON.stringify({ success: true, messageId: emailResult?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email function:", error);
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