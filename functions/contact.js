export async function onRequestPost({ request, env }) {
  try {
    const form = await request.formData();

    // Honeypot
    if ((form.get("bot-field") || "").toString().trim()) {
      return new Response("OK", { status: 200 });
    }

    const name = (form.get("name") || "").toString().trim();
    const email = (form.get("email") || "").toString().trim();
    const subject = (form.get("subject") || "Contactformulier").toString().trim();
    const message = (form.get("message") || "").toString().trim();

    if (!email || !message) {
      return new Response("Missing required fields", { status: 400 });
    }

    const from = (env.CONTACT_FROM || "").trim();
    const toStr = (env.CONTACT_TO || "").trim();
    const bccStr = (env.CONTACT_BCC || "").trim();

    if (!env.RESEND_API_KEY) return new Response("Missing RESEND_API_KEY", { status: 500 });
    if (!from || !toStr) return new Response("Missing CONTACT_FROM or CONTACT_TO", { status: 500 });

    const to = toStr.split(",").map(s => s.trim()).filter(Boolean);
    const bcc = bccStr ? bccStr.split(",").map(s => s.trim()).filter(Boolean) : undefined;

    const payload = {
      from,
      to,
      reply_to: email,
      subject: `Contact – ${subject}`,
      text: `Naam: ${name || "-"}\nEmail: ${email}\n\n${message}`,
      ...(bcc ? { bcc } : {})
    };

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      console.log("Resend error", r.status, errText);
      return new Response(`Email send failed (${r.status})`, { status: 502 });
    }

    return Response.redirect(new URL("/thanks.html", request.url), 303);
  } catch (e) {
    console.log("Contact function exception:", e);
    return new Response("Internal error", { status: 500 });
  }
}
