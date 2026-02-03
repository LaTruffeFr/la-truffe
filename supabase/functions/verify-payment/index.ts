import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
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

    const { sessionId } = await req.json();
    logStep("Request body parsed", { sessionId });

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // SECURITY FIX: Check if this payment was already processed (replay attack prevention)
    const { data: existingPayment, error: checkError } = await supabaseAdmin
      .from("processed_payments")
      .select("session_id, credits, processed_at")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (checkError) {
      logStep("Error checking processed payments", { error: checkError.message });
      // Continue processing - table might not exist yet in some edge cases
    }

    if (existingPayment) {
      logStep("Payment already processed", { 
        sessionId, 
        credits: existingPayment.credits,
        processedAt: existingPayment.processed_at 
      });
      return new Response(JSON.stringify({ 
        success: true, 
        credits: existingPayment.credits,
        alreadyProcessed: true,
        message: "Ce paiement a déjà été traité."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { 
      status: session.payment_status, 
      metadata: session.metadata 
    });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const credits = parseInt(session.metadata?.credits || "0", 10);
    const userId = session.metadata?.userId;
    const customerEmail = session.metadata?.customerEmail || session.customer_email;

    logStep("Payment verified", { credits, userId, customerEmail });

    let updatedCredits = credits;
    let userIdToUpdate = userId;

    // If userId is "guest", try to find the user by email
    if (userId === "guest" && customerEmail) {
      const { data: users } = await supabaseAdmin
        .from("profiles")
        .select("user_id, credits")
        .eq("email", customerEmail)
        .limit(1);

      if (users && users.length > 0) {
        userIdToUpdate = users[0].user_id;
        updatedCredits = (users[0].credits || 0) + credits;
        logStep("Found user by email", { userIdToUpdate, currentCredits: users[0].credits });
      } else {
        logStep("No user found for guest email", { customerEmail });
        
        // Record the payment even for guests to prevent replay
        await supabaseAdmin
          .from("processed_payments")
          .insert({ 
            session_id: sessionId, 
            user_id: "00000000-0000-0000-0000-000000000000", // placeholder for guest
            credits 
          });
        
        return new Response(JSON.stringify({ 
          success: true, 
          credits,
          message: "Payment verified but no account found. Credits will be added when you create an account with this email."
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } else if (userId && userId !== "guest") {
      // Get current credits for authenticated user
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("credits")
        .eq("user_id", userId)
        .single();

      if (profile) {
        updatedCredits = (profile.credits || 0) + credits;
        logStep("Current credits for user", { currentCredits: profile.credits });
      }
    }

    // Update the user's credits
    if (userIdToUpdate && userIdToUpdate !== "guest") {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ credits: updatedCredits })
        .eq("user_id", userIdToUpdate);

      if (updateError) {
        logStep("Error updating credits", { error: updateError.message });
        throw new Error(`Failed to update credits: ${updateError.message}`);
      }

      // SECURITY FIX: Record this payment as processed to prevent replay attacks
      const { error: insertError } = await supabaseAdmin
        .from("processed_payments")
        .insert({ 
          session_id: sessionId, 
          user_id: userIdToUpdate, 
          credits 
        });

      if (insertError) {
        logStep("Error recording processed payment", { error: insertError.message });
        // Don't fail the request - credits were already added
        // But log it for monitoring
      }

      logStep("Credits updated successfully", { 
        userId: userIdToUpdate, 
        newCredits: updatedCredits 
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      credits,
      totalCredits: updatedCredits,
      message: `${credits} crédit(s) ajouté(s) à votre compte !`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
