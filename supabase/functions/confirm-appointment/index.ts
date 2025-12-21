/**
 * Edge Function: confirm-appointment
 * 
 * Permite a los clientes confirmar o cancelar sus citas a través de un token único.
 * 
 * Esta función NO requiere configuración adicional.
 * Las siguientes variables se configuran automáticamente por Supabase:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * 
 * Uso: POST con body { token: string, action: "confirm" | "cancel" }
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface ConfirmRequest {
  token: string;
  action: "confirm" | "cancel";
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Confirm appointment function called");

  if (req.method === "OPTIONS") {
    // Preflight response
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, action }: ConfirmRequest = await req.json();
    console.log(`Processing ${action} for token ${token}`);

    // Fetch the appointment link
    const { data: link, error: linkError } = await supabase
      .from("appointment_links")
      .select("id, appointment_id, purpose, expires_at, used_at")
      .eq("token", token)
      .maybeSingle();

    if (linkError || !link) {
      console.error("Token not found:", linkError);
      return new Response(
        JSON.stringify({ error: "invalid", message: "Token inválido" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if token has expired
    if (new Date(link.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "expired", message: "El enlace ha expirado" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if token has already been used
    if (link.used_at) {
      return new Response(
        JSON.stringify({ error: "used", message: "Este enlace ya fue utilizado" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate action matches token purpose (or action is cancel for confirm token)
    const validAction = 
      (link.purpose === "confirm" && action === "confirm") ||
      (link.purpose === "cancel" && action === "cancel") ||
      (link.purpose === "confirm" && action === "cancel"); // Allow cancel from confirm email

    if (!validAction) {
      return new Response(
        JSON.stringify({ error: "invalid_action", message: "Acción no válida para este enlace" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get current appointment status
    const { data: appointment, error: aptError } = await supabase
      .from("appointments")
      .select("id, status, barbershop_id")
      .eq("id", link.appointment_id)
      .single();

    if (aptError || !appointment) {
      console.error("Appointment not found:", aptError);
      return new Response(
        JSON.stringify({ error: "not_found", message: "Cita no encontrada" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if appointment is still pending
    if (appointment.status !== "pending") {
      return new Response(
        JSON.stringify({ 
          error: "already_processed", 
          message: `La cita ya fue ${appointment.status === "confirmed" ? "confirmada" : "procesada"}`,
          status: appointment.status
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update appointment status
    const newStatus = action === "confirm" ? "confirmed" : "canceled";
    
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", link.appointment_id);

    if (updateError) {
      console.error("Error updating appointment:", updateError);
      throw updateError;
    }

    // Mark token as used
    await supabase
      .from("appointment_links")
      .update({ used_at: new Date().toISOString() })
      .eq("id", link.id);

    // Also mark related tokens as used (if confirming, mark cancel token as used and vice versa)
    await supabase
      .from("appointment_links")
      .update({ used_at: new Date().toISOString() })
      .eq("appointment_id", link.appointment_id)
      .in("purpose", ["confirm", "cancel"]);

    console.log(`Appointment ${link.appointment_id} ${action}ed successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        action,
        status: newStatus,
        message: action === "confirm" ? "Cita confirmada exitosamente" : "Cita cancelada exitosamente"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in confirm-appointment function:", error);
    return new Response(
      JSON.stringify({ error: "server_error", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);