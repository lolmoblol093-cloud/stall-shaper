import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAccountRequest {
  email: string;
  password: string;
  tenant_id: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is authenticated and has admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized: No authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create a client with the user's JWT to check their role
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the authenticated user
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !userData.user) {
      console.error("Failed to get user:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Authenticated user: ${userData.user.id}`);

    // Check if the user has admin role using the service role client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      console.error("User is not an admin:", roleError);
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Admin role verified");

    const { email, password, tenant_id }: CreateAccountRequest = await req.json();

    // Validate input
    if (!email || !password || !tenant_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, password, tenant_id" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Creating tenant account for email: ${email}, tenant_id: ${tenant_id}`);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      console.log("User already exists, updating password");
      // Update existing user's password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );

      if (updateError) {
        console.error("Error updating user:", updateError);
        throw updateError;
      }

      userId = existingUser.id;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
      });

      if (createError) {
        console.error("Error creating user:", createError);
        throw createError;
      }

      userId = newUser.user.id;
      console.log(`Created new user with id: ${userId}`);
    }

    // Check if tenant_users record already exists
    const { data: existingTenantUser } = await supabaseAdmin
      .from("tenant_users")
      .select("id")
      .eq("user_id", userId)
      .eq("tenant_id", tenant_id)
      .single();

    if (!existingTenantUser) {
      // Link user to tenant
      const { error: linkError } = await supabaseAdmin.from("tenant_users").insert({
        user_id: userId,
        tenant_id: tenant_id,
      });

      if (linkError) {
        console.error("Error linking user to tenant:", linkError);
        throw linkError;
      }
      console.log("Linked user to tenant");
    }

    // Check if user already has tenant role
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "tenant")
      .single();

    if (!existingRole) {
      // Add tenant role
      const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role: "tenant",
      });

      if (roleError) {
        console.error("Error adding tenant role:", roleError);
        throw roleError;
      }
      console.log("Added tenant role");
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in create-tenant-account function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
