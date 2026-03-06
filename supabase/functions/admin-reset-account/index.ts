import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email = "latruffe.consulting@gmail.com";
    const password = "LaTruffe62860*";

    // Find existing user
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = users?.find((u: any) => u.email === email);

    if (existingUser) {
      // Delete old user (cascades to profiles, user_roles, etc.)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      if (deleteError) throw deleteError;
      console.log("Deleted old user:", existingUser.id);
    }

    // Create new user with email/password
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) throw createError;

    const newUserId = newUser.user.id;
    console.log("Created new user:", newUserId);

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: "admin" });
    if (roleError) throw roleError;

    // Create profile with unlimited credits
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({ user_id: newUserId, email, credits: 9999 });
    if (profileError) throw profileError;

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Account recreated with email/password",
      userId: newUserId 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
