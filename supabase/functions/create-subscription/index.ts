/**
 * Edge Function: create-subscription
 * 
 * Crea y gestiona suscripciones de PayPal para barberías.
 * 
 * CONFIGURACIÓN REQUERIDA (Supabase Dashboard -> Edge Functions -> Secrets):
 * - PAYPAL_CLIENT_ID: Client ID de PayPal
 * - PAYPAL_CLIENT_SECRET: Client Secret de PayPal
 * - PAYPAL_MODE: sandbox o live (default: sandbox)
 * - APP_URL: URL de tu aplicación (ej: https://tu-app.vercel.app)
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
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") || "sandbox";
const APP_URL = Deno.env.get("APP_URL") || "https://trimly.it.com";

const PAYPAL_API_BASE = PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

interface CreateSubscriptionRequest {
  barbershop_id: string;
  action: "create" | "activate" | "cancel";
  subscription_id?: string;
  order_id?: string;
  reason?: string;
}

// Obtener token de acceso de PayPal
async function getPayPalAccessToken(): Promise<string> {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal auth failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Crear producto en PayPal (si no existe)
async function getOrCreatePayPalProduct(accessToken: string): Promise<string> {
  // En producción, guarda este product_id y reúsalo
  // Por ahora, siempre creamos un producto nuevo (PayPal permite múltiples productos)
  const productData = {
    name: "Trimly Professional",
    description: "Plan Profesional Trimly - Suscripción Mensual",
    type: "SERVICE",
    category: "SOFTWARE",
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create PayPal product: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

// Crear o obtener plan de PayPal ($10 USD mensual)
async function getOrCreatePayPalPlan(accessToken: string, productId: string): Promise<string> {
  const planName = "Trimly-Professional-Monthly";
  
  const planData = {
    product_id: productId,
    name: planName,
    description: "Plan Profesional Trimly - Suscripción Mensual",
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency: {
          interval_unit: "MONTH",
          interval_count: 1,
        },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0, // 0 = sin fin
        pricing_scheme: {
          fixed_price: {
            value: "10.00",
            currency_code: "USD",
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: {
        value: "0",
        currency_code: "USD",
      },
      setup_fee_failure_action: "CONTINUE",
      payment_failure_threshold: 3,
    },
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify(planData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create PayPal plan: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

// Crear suscripción en PayPal
async function createPayPalSubscription(accessToken: string, planId: string, barbershopId: string): Promise<{ id: string; links: Array<{ href: string; rel: string; method: string }> }> {
  const callbackUrl = `${APP_URL}/subscription/callback`;
  
  const subscriptionData = {
    plan_id: planId,
    start_time: new Date(Date.now() + 60 * 1000).toISOString(), // 1 minuto en el futuro
    subscriber: {
      email_address: "", // Se puede obtener del perfil del usuario
    },
    application_context: {
      brand_name: "Trimly",
      locale: "es-ES",
      shipping_preference: "NO_SHIPPING",
      user_action: "SUBSCRIBE_NOW",
      payment_method: {
        payer_selected: "PAYPAL",
        payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
      },
      return_url: callbackUrl,
      cancel_url: `${APP_URL}/dashboard?tab=settings&subscription=cancelled`,
    },
    custom_id: barbershopId,
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify(subscriptionData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create PayPal subscription: ${error}`);
  }

  return await response.json();
}

// Activar suscripción después de aprobación
async function activatePayPalSubscription(accessToken: string, subscriptionId: string): Promise<any> {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get PayPal subscription: ${error}`);
  }

  return await response.json();
}

// Cancelar suscripción en PayPal
async function cancelPayPalSubscription(accessToken: string, subscriptionId: string, reason: string = "Customer requested cancellation"): Promise<void> {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: reason.substring(0, 128), // PayPal limita a 128 caracteres
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to cancel PayPal subscription: ${error}`);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("PayPal credentials not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener token de autenticación del usuario
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verificar usuario autenticado
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { barbershop_id, action, subscription_id, order_id, reason }: CreateSubscriptionRequest = await req.json();

    if (!barbershop_id) {
      return new Response(
        JSON.stringify({ error: "barbershop_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verificar que el usuario es owner de la barbería
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .maybeSingle();

    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("id")
      .eq("id", barbershop_id)
      .single();

    if (!barbershop) {
      return new Response(
        JSON.stringify({ error: "Barbershop not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Obtener token de acceso de PayPal
    const accessToken = await getPayPalAccessToken();

    if (action === "create") {
      // Crear producto primero
      const productId = await getOrCreatePayPalProduct(accessToken);
      // Obtener o crear plan
      const planId = await getOrCreatePayPalPlan(accessToken, productId);
      
      // Crear suscripción
      const subscription = await createPayPalSubscription(accessToken, planId, barbershop_id);
      
      // Guardar plan_id en la suscripción (actualizar si existe, crear si no)
      const { data: existingSubscription } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("barbershop_id", barbershop_id)
        .maybeSingle();

      if (existingSubscription) {
        await supabase
          .from("subscriptions")
          .update({
            paypal_plan_id: planId,
            paypal_subscription_id: subscription.id,
          })
          .eq("id", existingSubscription.id);
      } else {
        await supabase
          .from("subscriptions")
          .insert({
            barbershop_id,
            paypal_plan_id: planId,
            paypal_subscription_id: subscription.id,
            status: "trial",
          });
      }

      // Encontrar link de aprobación
      const approveLink = subscription.links?.find((link: any) => link.rel === "approve");
      
      return new Response(
        JSON.stringify({
          success: true,
          subscription_id: subscription.id,
          approval_url: approveLink?.href,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else if (action === "activate") {
      if (!subscription_id) {
        return new Response(
          JSON.stringify({ error: "subscription_id is required for activate action" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Obtener detalles de la suscripción
      const subscription = await activatePayPalSubscription(accessToken, subscription_id);
      
      // Calcular fecha de fin del período
      const currentPeriodEnd = subscription.billing_info?.next_billing_time
        ? new Date(subscription.billing_info.next_billing_time)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días por defecto

      // Actualizar suscripción en BD
      await supabase
        .from("subscriptions")
        .update({
          status: subscription.status === "ACTIVE" ? "active" : "trial",
          paypal_subscription_id: subscription_id,
          current_period_end: currentPeriodEnd.toISOString(),
          last_payment_status: subscription.status,
        })
        .eq("barbershop_id", barbershop_id);

      return new Response(
        JSON.stringify({
          success: true,
          subscription: {
            id: subscription.id,
            status: subscription.status,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else if (action === "cancel") {
      // Obtener la suscripción de la BD para obtener el paypal_subscription_id
      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("paypal_subscription_id")
        .eq("barbershop_id", barbershop_id)
        .maybeSingle();

      if (!subscriptionData || !subscriptionData.paypal_subscription_id) {
        return new Response(
          JSON.stringify({ error: "Subscription not found or not linked to PayPal" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Cancelar suscripción en PayPal
      await cancelPayPalSubscription(accessToken, subscriptionData.paypal_subscription_id, reason);

      // Actualizar estado en BD
      await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          last_payment_status: "CANCELLED",
        })
        .eq("barbershop_id", barbershop_id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Subscription cancelled successfully",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  } catch (error: any) {
    console.error("Error in create-subscription function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
