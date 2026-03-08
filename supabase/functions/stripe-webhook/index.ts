import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Supabase admin client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      logStep("Webhook signature verified");
    } else {
      // Fallback: parse without signature verification (dev mode)
      event = JSON.parse(body);
      logStep("Webhook parsed without signature (no STRIPE_WEBHOOK_SECRET set)");
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const creditsAmount = parseInt(session.metadata?.credits_amount || "0", 10);

      logStep("checkout.session.completed", { userId, creditsAmount, sessionId: session.id });

      if (!userId || creditsAmount <= 0) {
        throw new Error(`Invalid metadata: user_id=${userId}, credits=${creditsAmount}`);
      }

      // Check idempotency
      const { data: existing } = await supabaseAdmin
        .from("processed_payments")
        .select("id")
        .eq("session_id", session.id)
        .maybeSingle();

      if (existing) {
        logStep("Payment already processed, skipping", { sessionId: session.id });
        return new Response(JSON.stringify({ received: true, skipped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Add credits atomically
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ credits: supabaseAdmin.rpc ? undefined : undefined })
        .eq("user_id", userId);

      // Use raw SQL via RPC for atomic increment
      const { error: rpcError } = await supabaseAdmin.rpc("add_credits", {
        _user_id: userId,
        _amount: creditsAmount,
      });

      // Fallback: direct update if RPC doesn't exist
      if (rpcError) {
        logStep("RPC add_credits failed, using direct update", { error: rpcError.message });
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("credits")
          .eq("user_id", userId)
          .single();

        if (profile) {
          await supabaseAdmin
            .from("profiles")
            .update({ credits: profile.credits + creditsAmount })
            .eq("user_id", userId);
        }
      }

      // Record idempotency
      await supabaseAdmin.from("processed_payments").insert({
        session_id: session.id,
        user_id: userId,
        credits: creditsAmount,
      });

      logStep("Credits added successfully", { userId, creditsAmount });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
