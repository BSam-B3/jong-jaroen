// @ts-nocheck
// supabase/functions/send-phone-otp/index.ts
// Supabase Edge Function (Deno runtime)
// Handles: generate OTP -> hash -> store -> (send SMS)
//
// Deploy:  supabase functions deploy send-phone-otp --no-verify-jwt
//
// Secrets (set in Supabase Dashboard > Settings > Edge Functions > Secrets):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateOtp(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 1_000_000).padStart(6, "0");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Parse body ────────────────────────────────────────────────
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string") {
      return new Response(JSON.stringify({ success: false, code: "MISSING_PHONE" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 9 || cleaned.length > 15) {
      return new Response(JSON.stringify({ success: false, code: "INVALID_PHONE_FORMAT" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. Verify caller is authenticated ────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, code: "UNAUTHORIZED" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ success: false, code: "UNAUTHORIZED" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 3. Rate-limit: max 5 OTPs per phone per 10 minutes ───────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("phone_otp_verifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("phone", cleaned)
      .gte("created_at", tenMinsAgo);

    if ((count ?? 0) >= 5) {
      return new Response(JSON.stringify({ success: false, code: "RATE_LIMIT_EXCEEDED" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 4. Generate OTP and store (bcrypt-hashed) via DB function ────
    const otp = generateOtp();

    const { error: storeErr } = await supabaseAdmin.rpc("create_phone_otp", {
      p_user_id: user.id,
      p_phone: cleaned,
      p_otp: otp,
    });

    if (storeErr) {
      console.error("[send-phone-otp] store error:", storeErr.message);
      return new Response(JSON.stringify({ success: false, code: "DB_ERROR" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 5. Send SMS ──────────────────────────────────────────────────

    // --- DEV MODE: log OTP to function console (read via: supabase functions logs) ---
    console.log(`[DEV] OTP for ${cleaned} -> ${otp}`);

    // TODO: When going live, remove the console.log above and uncomment one of:

    // ---- Option A: Twilio ----
    /*
    const sid   = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const token = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const from  = Deno.env.get("TWILIO_PHONE_NUMBER")!;
    const to    = cleaned.startsWith("0") ? "+66" + cleaned.slice(1) : "+" + cleaned;
    const body  = `[จงเจริญ] OTP: ${otp} (หมดอายุใน 5 นาที)`;

    const smsRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + btoa(`${sid}:${token}`),
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      }
    );
    if (!smsRes.ok) {
      console.error("[send-phone-otp] Twilio:", await smsRes.text());
      return new Response(JSON.stringify({ success: false, code: "SMS_SEND_FAILED" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    */

    // ---- Option B: Thaibulksms (สำหรับ SMS ในไทย) ----
    /*
    const tbsRes = await fetch("https://www.thaibulksms.com/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: Deno.env.get("THAIBULKSMS_API_KEY"),
        secret: Deno.env.get("THAIBULKSMS_SECRET"),
        msisdn: cleaned,
        message: `[จงเจริญ] OTP: ${otp}`,
        sender: "JongJaroen",
        force: "standard",
      }),
    });
    if (!tbsRes.ok) {
      console.error("[send-phone-otp] ThaiBulkSMS:", await tbsRes.text());
      return new Response(JSON.stringify({ success: false, code: "SMS_SEND_FAILED" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    */

    // ── 6. Return success (never expose the OTP in response) ─────────
    return new Response(
      JSON.stringify({ success: true, code: "OTP_SENT" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[send-phone-otp] unhandled:", err);
    return new Response(JSON.stringify({ success: false, code: "INTERNAL_ERROR" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
