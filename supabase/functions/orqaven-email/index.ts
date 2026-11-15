
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const brevoKey = Deno.env.get("BREVO_API_KEY");

    if (!supabaseUrl || !serviceKey || !brevoKey) {
      return json({ error: "Server configuration incomplete" }, 500);
    }

    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return json({ error: "Authentication required" }, 401);
    }

    const token = authorization.slice(7);

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the logged-in user.
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return json({ error: "Invalid session" }, 401);
    }

    // Only ORQAVEN admins may send campaigns.
    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (adminError || !admin) {
      return json({ error: "Admin access required" }, 403);
    }

    const body = await req.json();
    const subject = String(body.subject || "").trim();
    const htmlContent = String(body.htmlContent || "").trim();
    const textContent = String(body.textContent || "").trim();

    if (!subject || !htmlContent) {
      return json({
        error: "Subject and HTML content are required",
      }, 400);
    }

    if (subject.length > 200 || htmlContent.length > 100000) {
      return json({ error: "Campaign content is too large" }, 400);
    }

    // Do not send until the unsubscribe system is implemented.
    if (!htmlContent.includes("{{unsubscribe_url}}")) {
      return json({
        error: "Campaign must contain {{unsubscribe_url}}. Unsubscribe support must be implemented before sending.",
      }, 400);
    }

    // Only confirmed subscribers who have not unsubscribed.
    const { data: subscribers, error: subscriberError } =
      await supabase
        .from("marketing_subscribers")
        .select("id,email")
        .eq("confirmed", true)
        .is("unsubscribed_at", null)
        .limit(500);

    if (subscriberError) {
      return json({ error: "Could not load subscribers" }, 500);
    }

    if (!subscribers?.length) {
      return json({ error: "No confirmed subscribers found" }, 400);
    }

    // Sending is deliberately blocked until the unsubscribe
    // endpoint and per-recipient unsubscribe links are ready.
    return json({
      message: "Campaign validated. Sending is not enabled yet.",
      recipientCount: subscribers.length,
      nextStep: "Implement unsubscribe links before enabling delivery.",
    }, 200);

  } catch (error) {
    console.error("ORQAVEN email error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});
