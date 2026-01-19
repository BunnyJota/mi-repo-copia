/**
 * Edge Function: subscription-audit
 *
 * Revisa suscripciones para expirar trials y re-sincronizar con PayPal.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") || "sandbox";

const PAYPAL_API_BASE = PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

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

async function fetchPayPalSubscription(accessToken: string, subscriptionId: string) {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch PayPal subscription ${subscriptionId}: ${error}`);
  }

  return response.json();
}

const handler = async (): Promise<Response> => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const nowIso = new Date().toISOString();

    // 1) Expirar trials vencidos sin pago
    const { data: expiredTrials, error: expiredError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("status", "trial")
      .not("trial_ends_at", "is", null)
      .lt("trial_ends_at", nowIso);

    if (expiredError) {
      console.error("Error fetching expired trials:", expiredError);
    }

    if (expiredTrials && expiredTrials.length > 0) {
      const expiredIds = expiredTrials.map((trial) => trial.id);
      await supabase
        .from("subscriptions")
        .update({
          status: "past_due",
          last_payment_status: "TRIAL_EXPIRED",
        })
        .in("id", expiredIds);
    }

    // 2) Re-sincronizar suscripciones con PayPal (si hay webhook perdido)
    if (PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET) {
      const accessToken = await getPayPalAccessToken();

      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("id, barbershop_id, paypal_subscription_id, trial_ends_at")
        .in("status", ["trial", "active", "past_due"])
        .not("paypal_subscription_id", "is", null);

      for (const sub of subscriptions || []) {
        try {
          const paypalSub = await fetchPayPalSubscription(accessToken, sub.paypal_subscription_id);
          const paypalStatus = paypalSub.status;
          const nextBillingTime = paypalSub.billing_info?.next_billing_time;
          const lastPaymentTime = paypalSub.billing_info?.last_payment?.time;
          const trialEndsAt = nextBillingTime ? new Date(nextBillingTime) : null;
          const isTrialPhase = !lastPaymentTime && trialEndsAt
            ? trialEndsAt.getTime() > Date.now()
            : false;

          let internalStatus = "trial";
          if (paypalStatus === "ACTIVE") {
            internalStatus = isTrialPhase ? "trial" : "active";
          } else if (paypalStatus === "CANCELLED" || paypalStatus === "EXPIRED") {
            internalStatus = "canceled";
          } else if (paypalStatus === "SUSPENDED") {
            internalStatus = "past_due";
          }

          await supabase
            .from("subscriptions")
            .update({
              status: internalStatus,
              current_period_end: nextBillingTime || null,
              last_payment_status: paypalStatus,
              trial_ends_at: trialEndsAt?.toISOString() || sub.trial_ends_at,
            })
            .eq("id", sub.id);
        } catch (syncError) {
          console.error(`Failed to sync subscription ${sub.id}:`, syncError);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Error running subscription audit:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};

serve(handler);
