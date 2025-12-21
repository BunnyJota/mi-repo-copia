/**
 * Edge Function: process-reminders
 *
 * Lee reminder_queue y envía emails de tipo "reminder"
 * usando la función existente "send-email".
 *
 * Configuración requerida (Supabase -> Edge Functions -> Secrets):
 * - SUPABASE_URL (ya disponible)
 * - SUPABASE_SERVICE_ROLE_KEY (ya disponible)
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response(
      JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Traer pendientes vencidos
    const { data: reminders, error } = await supabase
      .from("reminder_queue")
      .select("id, appointment_id, reminder_type, attempts")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(50);

    if (error) {
      throw error;
    }

    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let processed = 0;
    for (const reminder of reminders) {
      try {
        const { error: sendError } = await supabase.functions.invoke("send-email", {
          body: {
            type: "reminder",
            appointmentId: reminder.appointment_id,
          },
        });

        if (sendError) {
          throw sendError;
        }

        await supabase
          .from("reminder_queue")
          .update({
            status: "sent",
            attempts: (reminder.attempts || 0) + 1,
            last_error: null,
            sent_at: new Date().toISOString(),
          })
          .eq("id", reminder.id);

        processed += 1;
      } catch (err: any) {
        console.error("Failed to send reminder", reminder.id, err?.message || err);
        await supabase
          .from("reminder_queue")
          .update({
            status: "error",
            attempts: (reminder.attempts || 0) + 1,
            last_error: err?.message || "unknown error",
          })
          .eq("id", reminder.id);
      }
    }

    return new Response(JSON.stringify({ processed }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("process-reminders error:", err);
    return new Response(JSON.stringify({ error: err?.message || "unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
