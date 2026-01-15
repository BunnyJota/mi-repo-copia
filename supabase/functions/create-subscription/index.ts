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
async function createPayPalSubscription(accessToken: string, planId: string, barbershopId: string, subscriberEmail: string): Promise<{ id: string; links: Array<{ href: string; rel: string; method: string }> }> {
  if (!subscriberEmail) {
    throw new Error("Subscriber email is required to create the PayPal subscription");
  }

  const callbackUrl = `${APP_URL}/subscription/callback`;
  
  const subscriptionData = {
    plan_id: planId,
    start_time: new Date(Date.now() + 60 * 1000).toISOString(), // 1 minuto en el futuro
    subscriber: {
      email_address: subscriberEmail,
    },
    application_context: {
      brand_name: "Trimly",
      locale: "es-ES",
      shipping_preference: "NO_SHIPPING",
      user_action: "CONTINUE", // Cambiado a CONTINUE para activar manualmente desde el servidor
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
  // Primero obtener los detalles de la suscripción
  const getResponse = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!getResponse.ok) {
    const errorText = await getResponse.text();
    console.error(`Failed to get PayPal subscription ${subscriptionId}:`, errorText);
    throw new Error(`No se pudo obtener la suscripción de PayPal: ${errorText}`);
  }

  const subscription = await getResponse.json();
  const currentStatus = subscription.status;

  // Estados de PayPal que requieren activación
  const pendingStates = ["APPROVAL_PENDING", "APPROVED", "CREATED"];
  const activeStates = ["ACTIVE"];
  const errorStates = ["CANCELLED", "SUSPENDED", "EXPIRED"];

  // Si la suscripción está en un estado pendiente, intentar activarla
  if (pendingStates.includes(currentStatus)) {
    console.log(`Subscription ${subscriptionId} is in ${currentStatus} state, attempting activation...`);
    
    try {
      const activateResponse = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/activate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: "Subscription approved by customer",
        }),
      });

      if (!activateResponse.ok) {
        const errorText = await activateResponse.text();
        console.warn(`Failed to activate subscription ${subscriptionId}:`, errorText);
        
        // Si el error indica que ya está activa, obtener los detalles actualizados
        if (errorText.includes("already") || errorText.includes("ACTIVE")) {
          const updatedResponse = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });

          if (updatedResponse.ok) {
            return await updatedResponse.json();
          }
        }
        
        // Si no podemos activar, continuar con el estado actual
        console.warn(`Continuing with current subscription state: ${currentStatus}`);
      } else {
        // Activación exitosa, obtener los detalles actualizados
        const updatedResponse = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (updatedResponse.ok) {
          const updatedSubscription = await updatedResponse.json();
          console.log(`Subscription ${subscriptionId} activated successfully, new status: ${updatedSubscription.status}`);
          return updatedSubscription;
        }
      }
    } catch (error) {
      console.error(`Error activating subscription ${subscriptionId}:`, error);
      // Continuar con el estado actual en caso de error
    }
  } else if (activeStates.includes(currentStatus)) {
    console.log(`Subscription ${subscriptionId} is already ACTIVE`);
  } else if (errorStates.includes(currentStatus)) {
    console.warn(`Subscription ${subscriptionId} is in error state: ${currentStatus}`);
    throw new Error(`La suscripción está en un estado inválido: ${currentStatus}`);
  } else {
    console.warn(`Subscription ${subscriptionId} has unknown status: ${currentStatus}`);
  }

  return subscription;
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
      // Necesitamos el email del suscriptor (PayPal lo exige)
      const subscriberEmail = user.email;
      if (!subscriberEmail) {
        return new Response(
          JSON.stringify({ error: "User email not found" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Crear producto primero
      const productId = await getOrCreatePayPalProduct(accessToken);
      // Obtener o crear plan
      const planId = await getOrCreatePayPalPlan(accessToken, productId);
      
      // Crear suscripción
      const subscription = await createPayPalSubscription(accessToken, planId, barbershop_id, subscriberEmail);
      
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

      // Obtener detalles de la suscripción de PayPal primero para obtener el custom_id
      let subscription;
      try {
        const getSubscriptionResponse = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscription_id}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!getSubscriptionResponse.ok) {
          const errorText = await getSubscriptionResponse.text();
          throw new Error(`Failed to get PayPal subscription: ${errorText}`);
        }

        subscription = await getSubscriptionResponse.json();
      } catch (error: any) {
        console.error("Error getting PayPal subscription:", error);
        return new Response(
          JSON.stringify({ error: error.message || "Error al obtener la suscripción de PayPal" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Obtener barbershop_id del custom_id de PayPal (más confiable) o del parámetro
      let finalBarbershopId = barbershop_id;
      
      if (subscription.custom_id) {
        finalBarbershopId = subscription.custom_id;
        console.log(`Using barbershop_id from PayPal custom_id: ${finalBarbershopId}`);
      } else if (barbershop_id === "auto" || !barbershop_id) {
        // Si el frontend no pudo obtener el barbershop_id, intentar obtenerlo del perfil del usuario
        const { data: profileData } = await supabase
          .from("profiles")
          .select("barbershop_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileData?.barbershop_id) {
          finalBarbershopId = profileData.barbershop_id;
          console.log(`Using barbershop_id from user profile: ${finalBarbershopId}`);
        } else {
          return new Response(
            JSON.stringify({ error: "No se pudo determinar la barbería. Por favor contacta al soporte." }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      if (!finalBarbershopId || finalBarbershopId === "auto") {
        return new Response(
          JSON.stringify({ error: "No se pudo determinar la barbería asociada a esta suscripción." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Ahora activar la suscripción
      try {
        subscription = await activatePayPalSubscription(accessToken, subscription_id);
      } catch (error: any) {
        console.error("Error activating PayPal subscription:", error);
        return new Response(
          JSON.stringify({ error: error.message || "Error al activar la suscripción en PayPal" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Validar que el usuario sea owner de la barbería
      const { data: ownershipCheck } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "owner")
        .maybeSingle();

      if (!ownershipCheck) {
        return new Response(
          JSON.stringify({ error: "No tienes permisos para activar esta suscripción. Se requiere rol de owner." }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Verificar que la barbería existe y pertenece al usuario
      const { data: barbershopCheck, error: barbershopError } = await supabase
        .from("barbershops")
        .select("id")
        .eq("id", finalBarbershopId)
        .single();

      if (barbershopError || !barbershopCheck) {
        return new Response(
          JSON.stringify({ error: `Barbería no encontrada o no tienes acceso: ${finalBarbershopId}` }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Calcular fecha de fin del período
      const currentPeriodEnd = subscription.billing_info?.next_billing_time
        ? new Date(subscription.billing_info.next_billing_time)
        : subscription.billing_info?.cycle_executions?.[0]?.cycles_completed
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días desde ahora
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días por defecto

      // Mapear estados de PayPal a estados internos
      let internalStatus = "trial";
      const paypalStatus = subscription.status;
      if (paypalStatus === "ACTIVE") {
        internalStatus = "active";
      } else if (paypalStatus === "APPROVED" || paypalStatus === "APPROVAL_PENDING") {
        // Si está aprobada pero no activa, marcarla como trial hasta que se active
        internalStatus = "trial";
      } else if (paypalStatus === "CANCELLED" || paypalStatus === "EXPIRED") {
        internalStatus = "canceled";
      } else if (paypalStatus === "SUSPENDED") {
        internalStatus = "past_due";
      }

      // Actualizar o crear suscripción en BD
      const { data: existingSubscription } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("barbershop_id", finalBarbershopId)
        .maybeSingle();

      if (existingSubscription) {
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: internalStatus,
            paypal_subscription_id: subscription_id,
            current_period_end: currentPeriodEnd.toISOString(),
            last_payment_status: paypalStatus,
          })
          .eq("id", existingSubscription.id);

        if (updateError) {
          console.error("Error updating subscription:", updateError);
          return new Response(
            JSON.stringify({ error: "Error al actualizar la suscripción en la base de datos" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      } else {
        const { error: insertError } = await supabase
          .from("subscriptions")
          .insert({
            barbershop_id: finalBarbershopId,
            paypal_subscription_id: subscription_id,
            status: internalStatus,
            current_period_end: currentPeriodEnd.toISOString(),
            last_payment_status: paypalStatus,
          });

        if (insertError) {
          console.error("Error inserting subscription:", insertError);
          return new Response(
            JSON.stringify({ error: "Error al crear la suscripción en la base de datos" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          subscription: {
            id: subscription.id,
            status: subscription.status,
            internal_status: internalStatus,
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
    
    // Mensajes de error más descriptivos
    let errorMessage = "Error interno del servidor";
    
    if (error.message) {
      errorMessage = error.message;
      
      // Mejorar mensajes específicos
      if (errorMessage.includes("PayPal auth failed")) {
        errorMessage = "Error de autenticación con PayPal. Verifica las credenciales configuradas.";
      } else if (errorMessage.includes("Failed to create PayPal")) {
        errorMessage = "Error al crear recursos en PayPal. Verifica la configuración.";
      } else if (errorMessage.includes("Failed to get PayPal subscription")) {
        errorMessage = "No se pudo obtener la información de la suscripción de PayPal.";
      } else if (errorMessage.includes("Failed to activate subscription")) {
        errorMessage = "Error al activar la suscripción en PayPal.";
      } else if (errorMessage.includes("Failed to cancel PayPal subscription")) {
        errorMessage = "Error al cancelar la suscripción en PayPal.";
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
