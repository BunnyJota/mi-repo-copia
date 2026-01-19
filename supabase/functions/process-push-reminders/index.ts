/**
 * Edge Function: process-push-reminders
 * 
 * Procesa recordatorios de citas y envía push notifications.
 * Esta función debe ejecutarse periódicamente (cada 5-10 minutos) usando pg_cron.
 * 
 * CONFIGURACIÓN REQUERIDA:
 * - Esta función llama internamente a send-push-notification
 * - Asegúrate de que FCM_SERVER_KEY esté configurada en send-push-notification
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

interface ReminderAppointment {
  id: string;
  start_at: string;
  barbershop_id: string;
  staff_user_id: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Process push reminders function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Obtener citas que necesitan recordatorio de 30 minutos
    const { data: appointments30min, error: error30min } = await supabase
      .from("appointments")
      .select("id, start_at, barbershop_id, staff_user_id")
      .eq("status", "confirmed")
      .gte("start_at", now.toISOString())
      .lte("start_at", thirtyMinutesFromNow.toISOString());

    // Obtener citas que necesitan recordatorio de 2 horas
    const { data: appointments2h, error: error2h } = await supabase
      .from("appointments")
      .select("id, start_at, barbershop_id, staff_user_id")
      .eq("status", "confirmed")
      .gte("start_at", twoHoursFromNow.toISOString())
      .lte("start_at", new Date(twoHoursFromNow.getTime() + 5 * 60 * 1000).toISOString()); // Ventana de 5 minutos

    // Obtener citas que necesitan recordatorio de 24 horas
    const { data: appointments24h, error: error24h } = await supabase
      .from("appointments")
      .select("id, start_at, barbershop_id, staff_user_id")
      .eq("status", "confirmed")
      .gte("start_at", twentyFourHoursFromNow.toISOString())
      .lte("start_at", new Date(twentyFourHoursFromNow.getTime() + 5 * 60 * 1000).toISOString()); // Ventana de 5 minutos

    const results = {
      reminder_30min: { processed: 0, errors: [] as string[] },
      reminder_2h: { processed: 0, errors: [] as string[] },
      reminder_24h: { processed: 0, errors: [] as string[] },
    };

    // Obtener función URL de send-push-notification
    const functionUrl = `${supabaseUrl}/functions/v1/send-push-notification`;
    const functionHeaders = {
      "Authorization": `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
    };

    // Procesar recordatorios de 30 minutos
    if (appointments30min && !error30min) {
      for (const appointment of appointments30min) {
        try {
          // Verificar si ya se envió este recordatorio (usando una tabla de logs o similar)
          // Por simplicidad, aquí asumimos que se procesa cada vez
          // En producción, deberías tener una tabla reminder_log para evitar duplicados

          const response = await fetch(functionUrl, {
            method: "POST",
            headers: functionHeaders,
            body: JSON.stringify({
              type: "reminder_30min",
              appointmentId: appointment.id,
            }),
          });

          if (response.ok) {
            results.reminder_30min.processed++;
          } else {
            const errorText = await response.text();
            results.reminder_30min.errors.push(`Appointment ${appointment.id}: ${errorText}`);
          }
        } catch (error: any) {
          results.reminder_30min.errors.push(`Appointment ${appointment.id}: ${error.message}`);
        }
      }
    } else if (error30min) {
      results.reminder_30min.errors.push(`Error fetching appointments: ${error30min.message}`);
    }

    // Procesar recordatorios de 2 horas
    if (appointments2h && !error2h) {
      for (const appointment of appointments2h) {
        try {
          const response = await fetch(functionUrl, {
            method: "POST",
            headers: functionHeaders,
            body: JSON.stringify({
              type: "reminder_2h",
              appointmentId: appointment.id,
            }),
          });

          if (response.ok) {
            results.reminder_2h.processed++;
          } else {
            const errorText = await response.text();
            results.reminder_2h.errors.push(`Appointment ${appointment.id}: ${errorText}`);
          }
        } catch (error: any) {
          results.reminder_2h.errors.push(`Appointment ${appointment.id}: ${error.message}`);
        }
      }
    } else if (error2h) {
      results.reminder_2h.errors.push(`Error fetching appointments: ${error2h.message}`);
    }

    // Procesar recordatorios de 24 horas
    if (appointments24h && !error24h) {
      for (const appointment of appointments24h) {
        try {
          const response = await fetch(functionUrl, {
            method: "POST",
            headers: functionHeaders,
            body: JSON.stringify({
              type: "reminder_24h",
              appointmentId: appointment.id,
            }),
          });

          if (response.ok) {
            results.reminder_24h.processed++;
          } else {
            const errorText = await response.text();
            results.reminder_24h.errors.push(`Appointment ${appointment.id}: ${errorText}`);
          }
        } catch (error: any) {
          results.reminder_24h.errors.push(`Appointment ${appointment.id}: ${error.message}`);
        }
      }
    } else if (error24h) {
      results.reminder_24h.errors.push(`Error fetching appointments: ${error24h.message}`);
    }

    console.log("Push reminders processed:", results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        timestamp: now.toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in process-push-reminders function:", error);
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
