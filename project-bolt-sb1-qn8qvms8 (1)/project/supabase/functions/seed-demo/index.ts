import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const users = [
    { email: "admin@tatsolutions.com", password: "password", phone: "+91 98765 00001", first_name: "Admin", last_name: "User", company_name: "TA Tech Solutions", role: "admin" },
    { email: "dealer@tatsolutions.com", password: "password", phone: "+91 98765 00002", first_name: "Raj", last_name: "Sharma", company_name: "Raj Mobiles", role: "dealer" },
    { email: "customer@tatsolutions.com", password: "password", phone: "+91 98765 00003", first_name: "Priya", last_name: "Patel", company_name: "", role: "customer" },
  ];

  const results = [];

  for (const u of users) {
    // Create auth user
    const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({
        email: u.email,
        password: u.password,
        email_confirm: true,
      }),
    });

    const createData = await createRes.json();
    const userId = createData?.id;

    if (!userId) {
      results.push({ email: u.email, status: "error", detail: createData });
      continue;
    }

    // Create profile
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        user_id: userId,
        email: u.email,
        phone: u.phone,
        first_name: u.first_name,
        last_name: u.last_name,
        company_name: u.company_name,
        role: u.role,
      }),
    });

    const profileData = await profileRes.json();
    results.push({ email: u.email, status: "created", user_id: userId, profile: profileData });

    // For the customer user, also create a customer record linked to the dealer
    if (u.role === "customer") {
      // Find the dealer user id
      const dealerResult = results.find((r: { email: string }) => r.email === "dealer@tatsolutions.com");
      if (dealerResult) {
        await fetch(`${supabaseUrl}/rest/v1/customers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
          body: JSON.stringify({
            user_id: userId,
            dealer_id: dealerResult.user_id,
            first_name: u.first_name,
            last_name: u.last_name,
            email: u.email,
            phone: u.phone,
            company_name: u.company_name || "N/A",
          }),
        });
      }
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
