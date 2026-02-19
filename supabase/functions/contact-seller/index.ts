import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const {
      listing_id,
      seller_user_id,
      buyer_email,
      buyer_name,
      buyer_phone,
      message,
    } = await req.json();

    // Validate required fields
    if (!listing_id || !seller_user_id || !buyer_email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Create notification in database
    const { data: notification, error: notificationError } = await supabase
      .from("notifications")
      .insert({
        listing_id,
        seller_user_id,
        buyer_email,
        buyer_name,
        buyer_phone,
        message,
        notification_type: "contact_inquiry",
      })
      .select()
      .single();

    if (notificationError) {
      console.error("Notification error:", notificationError);
      throw notificationError;
    }

    // Get listing details for email notification
    const { data: listing } = await supabase
      .from("cars")
      .select("title, price, user_id")
      .eq("id", listing_id)
      .single();

    // Get seller details
    const { data: seller } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", seller_user_id)
      .single();

    // Send email to seller (using SendGrid or similar)
    // For now, we'll just log it
    console.log("Notification created:", {
      notification,
      seller_email: seller?.email,
      listing_title: listing?.title,
    });

    // Increment contact count in listing stats
    await supabase
      .from("listing_stats")
      .update({
        contact_count: supabase.rpc("increment_contact_count", {
          listing_id,
        }),
      })
      .eq("listing_id", listing_id);

    return new Response(JSON.stringify({ success: true, notification }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
});
