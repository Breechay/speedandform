import { createClient } from "jsr:@supabase/supabase-js@2";

const REDIRECT_TO = "https://speedandform.com/auth/record-callback/";
const HANDOFF_BASE = "https://speedandform.com/auth/app-signin/";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBJECT = "Your Speed & Form sign-in link";
const FROM = "Speed & Form <access@send.speedandform.com>";
const REPLY_TO = "support@speedandform.com";

const esc = (value: string) => String(value).replace(/[&<>"']/g, (c) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[c]!));

async function sha256(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

function emailHtml(openUrl: string) {
  const href = esc(openUrl);
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#e8e3d9;color:#161916;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;line-height:1px;font-size:1px;">Sign in to your FORM account on this iPhone. This link works once.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#e8e3d9" style="width:100%;margin:0;padding:0;background:#e8e3d9;">
    <tr>
      <td align="center" style="padding:32px 20px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
          <tr>
            <td style="padding:0 0 24px;border-bottom:1px solid #c7c2b8;">
              <img src="https://speedandform.com/assets/brand/kit/emblem/sf-emblem-ink.png" width="76" alt="Speed &amp; Form" style="display:block;width:76px;height:auto;border:0;outline:none;text-decoration:none;">
            </td>
          </tr>
          <tr>
            <td style="padding:40px 0 0;font-family:Arial,Helvetica,sans-serif;color:#161916;">
              <div style="font-family:'Courier New',Courier,monospace;font-size:11px;line-height:18px;letter-spacing:1px;color:#5e625b;">PRIVATE ACCESS</div>
              <div style="margin-top:15px;font-family:Arial,Helvetica,sans-serif;font-size:40px;line-height:43px;font-weight:500;letter-spacing:-1.5px;color:#161916;">Open FORM.</div>
              <div style="margin-top:20px;max-width:480px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:27px;color:#5e625b;">Use this one-time link to sign in to your FORM account on this iPhone.</div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
                <tr>
                  <td bgcolor="#161916" style="background:#161916;">
                    <a href="${href}" style="display:inline-block;padding:15px 21px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:600;color:#f1ede4;text-decoration:none;">Continue</a>
                  </td>
                </tr>
              </table>
              <div style="margin-top:30px;padding-top:22px;border-top:1px solid #c7c2b8;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:#5e625b;">This link works once and expires shortly. If you did not request this, ignore this email. Need help? <a href="mailto:support@speedandform.com" style="color:#161916;text-decoration:underline;">support@speedandform.com</a>.</div>
              <div style="margin-top:24px;font-family:'Courier New',Courier,monospace;font-size:11px;line-height:18px;color:#5e625b;">Speed &amp; Form</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function emailText(openUrl: string) {
  return `PRIVATE ACCESS

Open FORM.

Use this one-time link to sign in to your FORM account on this iPhone.

Continue: ${openUrl}

This link works once and expires shortly.
If you did not request this, ignore this email.
Need help? support@speedandform.com

Speed & Form
`;
}

Deno.serve(async (req: Request) => {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ code: "method_not_allowed" }), { status: 405, headers });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ code: "invalid_request" }), { status: 400, headers });
  }

  const rawEmail = typeof (body as Record<string, unknown>)?.email === "string"
    ? String((body as Record<string, unknown>).email)
    : "";
  const email = rawEmail.trim().toLowerCase();

  // Admission stays intentionally non-enumerating.
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return new Response(JSON.stringify({ state: "received" }), { status: 202, headers });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("NEWSLETTER_RESEND_API_KEY") || Deno.env.get("RESEND_API_KEY");

  if (!supabaseUrl || !serviceRoleKey || !resendKey) {
    return new Response(JSON.stringify({ code: "unavailable" }), { status: 503, headers });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const emailHash = await sha256(email);
  const { data: admission, error: admissionError } = await admin.rpc(
    "coaching_magic_link_admit",
    { p_email: email, p_email_hash: emailHash },
  );

  if (admissionError) {
    return new Response(JSON.stringify({ code: "unavailable" }), { status: 503, headers });
  }

  if (admission !== "ok_existing" && admission !== "ok_new") {
    return new Response(JSON.stringify({ state: "received" }), { status: 202, headers });
  }

  const linkType = admission === "ok_new" ? "invite" : "magiclink";
  const { data: generated, error: linkError } = await admin.auth.admin.generateLink({
    type: linkType,
    email,
    options: { redirectTo: REDIRECT_TO },
  } as any);

  const actionLink =
    generated?.properties?.action_link ||
    (generated?.properties as any)?.actionLink;

  if (linkError || !actionLink) {
    return new Response(JSON.stringify({ code: "email_unavailable" }), { status: 503, headers });
  }

  // Keep the one-time provider URL out of normal server logs and referrers.
  // The fragment reaches a scanner-safe page; only the athlete's explicit
  // Continue tap begins verification.
  const openUrl = `${HANDOFF_BASE}#continue=${encodeURIComponent(actionLink)}`;

  const resend = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: SUBJECT,
      html: emailHtml(openUrl),
      text: emailText(openUrl),
      reply_to: REPLY_TO,
      tags: [{ name: "stream", value: "form_auth" }],
    }),
  });

  if (!resend.ok) {
    return new Response(JSON.stringify({ code: "email_unavailable" }), { status: 503, headers });
  }

  return new Response(JSON.stringify({ state: "received" }), { status: 202, headers });
});
