/**
 * Edge Function: paypal-webhook
 * 
 * Procesa eventos de webhook de PayPal para actualizar el estado de las suscripciones.
 * 
 * CONFIGURACIÓN REQUERIDA (Supabase Dashboard -> Edge Functions -> Secrets):
 * - PAYPAL_CLIENT_ID: Client ID de PayPal (para verificar webhooks)
 * - PAYPAL_CLIENT_SECRET: Client Secret de PayPal
 * - PAYPAL_MODE: sandbox o live (default: sandbox)
 * 
 * Las siguientes variables se configuran automáticamente por Supabase:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * 
 * IMPORTANTE: Configura este endpoint en PayPal Developer Dashboard:
 * - Sandbox: https://your-project.supabase.co/functions/v1/paypal-webhook
 * - Production: https://your-project.supabase.co/functions/v1/paypal-webhook
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paypal-transmission-id, paypal-transmission-time, paypal-transmission-sig, paypal-cert-url, paypal-auth-algo",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") || "sandbox";

const PAYPAL_API_BASE = PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource_type?: string;
  summary?: string;
  resource?: any;
  create_time?: string;
}

// Verificar webhook de PayPal (simplificado - en producción deberías verificar la firma)
async function verifyWebhook(eventId: string): Promise<boolean> {
  try {
    // Obtener token de acceso
    const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
    const tokenResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenResponse.ok) return false;
    const { access_token } = await tokenResponse.json();

    // Verificar evento en PayPal (obtener detalles del evento)
    const verifyResponse = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transmission_id: eventId,
        transmission_time: new Date().toISOString(),
        cert_url: "",
        auth_algo: "SHA256withRSA",
        transmission_sig: "",
        webhook_id: "",
        webhook_event: {},
      }),
    });

    // Por ahora, solo verificamos que tengamos credenciales
    // En producción, implementa la verificación completa de firma
    return true;
  } catch {
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const event: PayPalWebhookEvent = await req.json();

    if (!event.id || !event.event_type) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook event" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verificar si el evento ya fue procesado
    const { data: existingEvent } = await supabase
      .from("paypal_webhook_events")
      .select("id, status")
      .eq("event_id", event.id)
      .maybeSingle();

    if (existingEvent) {
      // Evento ya procesado
      return new Response(
        JSON.stringify({ message: "Event already processed", event_id: event.id }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Guardar evento en BD
    const { data: savedEvent, error: saveError } = await supabase
      .from("paypal_webhook_events")
      .insert({
        event_id: event.id,
        event_type: event.event_type,
        payload_json: event,
        status: "pending",
      })
      .select("id")
      .single();

    if (saveError) {
      console.error("Error saving webhook event:", saveError);
      // Continuar aunque falle el guardado
    }

    // Procesar evento según su tipo
    let processed = false;
    let subscriptionId: string | null = null;
    let barbershopId: string | null = null;

    // Extraer subscription_id del evento
    if (event.resource?.id) {
      subscriptionId = event.resource.id;
    } else if (event.resource?.billing_agreement_id) {
      subscriptionId = event.resource.billing_agreement_id;
    }

    // Buscar suscripción por paypal_subscription_id
    if (subscriptionId) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("id, barbershop_id")
        .eq("paypal_subscription_id", subscriptionId)
        .maybeSingle();

      if (subscription) {
        barbershopId = subscription.barbershop_id;
      }
    }

    // Procesar según el tipo de evento
    switch (event.event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "BILLING.SUBSCRIPTION.CREATED":
        if (subscriptionId && barbershopId) {
          let currentPeriodEnd: Date;
          
          if (event.resource?.billing_info?.next_billing_time) {
            currentPeriodEnd = new Date(event.resource.billing_info.next_billing_time);
          } else if (event.resource?.start_time) {
            // Calcular 1 mes desde la fecha de inicio
            const startDate = new Date(event.resource.start_time);
            currentPeriodEnd = new Date(startDate);
            currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
          } else {
            // Fallback: 1 mes desde ahora
            currentPeriodEnd = new Date();
            currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
          }

          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              current_period_end: currentPeriodEnd.toISOString(),
              last_payment_status: "ACTIVE",
            })
            .eq("barbershop_id", barbershopId);

          processed = true;
        }
        break;

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED":
        if (subscriptionId && barbershopId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              last_payment_status: "CANCELLED",
            })
            .eq("barbershop_id", barbershopId);

          processed = true;
        }
        break;

      case "BILLING.SUBSCRIPTION.SUSPENDED":
        if (subscriptionId && barbershopId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              last_payment_status: "SUSPENDED",
            })
            .eq("barbershop_id", barbershopId);

          processed = true;
        }
        break;

      case "PAYMENT.SALE.COMPLETED":
        if (subscriptionId && barbershopId) {
          // Obtener detalles de la suscripción para calcular siguiente facturación
          let nextBillingTime: Date;
          
          if (event.resource?.billing_agreement_id) {
            try {
              // Obtener token de acceso
              const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
              const tokenResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
                method: "POST",
                headers: {
                  "Authorization": `Basic ${auth}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: "grant_type=client_credentials",
              });

              if (tokenResponse.ok) {
                const { access_token } = await tokenResponse.json();
                
                // Obtener detalles de la suscripción
                const subResponse = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
                  method: "GET",
                  headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json",
                  },
                });

                if (subResponse.ok) {
                  const subData = await subResponse.json();
                  if (subData.billing_info?.next_billing_time) {
                    // Usar la fecha de PayPal si está disponible
                    nextBillingTime = new Date(subData.billing_info.next_billing_time);
                    console.log(`Using PayPal next_billing_time from webhook: ${nextBillingTime.toISOString()}`);
                  } else {
                    // Si no hay next_billing_time, calcular 1 mes desde HOY (cuando se procesa el pago)
                    // Esto asegura que si el pago se procesa el 15 de enero, el próximo sea el 15 de febrero
                    nextBillingTime = new Date();
                    nextBillingTime.setMonth(nextBillingTime.getMonth() + 1);
                    console.log(`Calculated next payment from payment date: ${nextBillingTime.toISOString()}`);
                  }
                } else {
                  // Fallback: 1 mes desde ahora
                  nextBillingTime = new Date();
                  nextBillingTime.setMonth(nextBillingTime.getMonth() + 1);
                }
              } else {
                // Fallback: 1 mes desde ahora
                nextBillingTime = new Date();
                nextBillingTime.setMonth(nextBillingTime.getMonth() + 1);
              }
            } catch (error) {
              console.error("Error getting subscription details for payment:", error);
              // Fallback: 1 mes desde ahora
              nextBillingTime = new Date();
              nextBillingTime.setMonth(nextBillingTime.getMonth() + 1);
            }
          } else {
            // Fallback: 1 mes desde ahora
            nextBillingTime = new Date();
            nextBillingTime.setMonth(nextBillingTime.getMonth() + 1);
          }

          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              current_period_end: nextBillingTime.toISOString(),
              last_payment_status: "COMPLETED",
            })
            .eq("barbershop_id", barbershopId);

          processed = true;
        }
        break;

      case "PAYMENT.SALE.DENIED":
      case "PAYMENT.SALE.REFUNDED":
        if (subscriptionId && barbershopId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              last_payment_status: event.event_type.includes("DENIED") ? "DENIED" : "REFUNDED",
            })
            .eq("barbershop_id", barbershopId);

          processed = true;
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.event_type}`);
    }

    // Marcar evento como procesado
    if (savedEvent) {
      await supabase
        .from("paypal_webhook_events")
        .update({
          status: processed ? "processed" : "failed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", savedEvent.id);
    }

    return new Response(
      JSON.stringify({
        message: "Webhook processed",
        event_id: event.id,
        event_type: event.event_type,
        processed,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in paypal-webhook function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
