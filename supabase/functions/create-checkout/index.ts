import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuration des prix Stripe (vrais price_id)
const PRICE_IDS: Record<string, string> = {
  "1": "price_1SqKnwPpNQZ47toNVMJLXVaA", // Audit Unitaire - 9.90€
  "2": "price_1SqKo7PpNQZ47toNWEW27KV7", // Pack Duo - 17.90€
  "3": "price_1SqKoHPpNQZ47toNQ3RduPl3", // Pack Chasseur - 24.90€
};

// Crédits par plan
const CREDITS_PER_PLAN: Record<string, number> = {
  "1": 1,  // Audit Unitaire - 1 crédit
  "2": 2,  // Pack Duo - 2 crédits
  "3": 3,  // Pack Chasseur - 3 crédits
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const { planId, email } = await req.json();
    logStep("Request body parsed", { planId, email });

    if (!planId || !PRICE_IDS[planId]) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Try to get authenticated user (optional)
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
      logStep("User authenticated", { userId: user?.id, email: user?.email });
    }

    const customerEmail = user?.email || email;
    if (!customerEmail) {
      throw new Error("Email is required for checkout");
    }

    // Check if customer already exists in Stripe
    let customerId: string | undefined;
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    }

    const origin = req.headers.get("origin") || "https://latruffe.lovable.app";

    // Create checkout session with all payment methods
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price: PRICE_IDS[planId],
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_method_types: ["card", "paypal"],
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?plan=${planId}`,
      metadata: {
        planId,
        userId: user?.id || "guest",
        credits: String(CREDITS_PER_PLAN[planId]),
        customerEmail,
      },
      // Apple Pay et Google Pay sont automatiquement activés avec "card"
      // si configurés dans le dashboard Stripe
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
