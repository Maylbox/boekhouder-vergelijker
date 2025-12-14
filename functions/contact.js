export function onRequestGet() {
  // Browsing /contact should show the page, not hit the API handler
  return Response.redirect("/contact.html", 302);
}

export async function onRequestPost({ request, env }) {
  try {
    const form = await request.formData();

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
    const to = (env.CONTACT_TO || "").trim();
    const bccRaw = (env.CONTACT_BCC || "").trim();
    const bcc = bccRaw ? bccRaw.split(",").map(s => s.trim()).filter(Boolean) : undefined;

    if (!env.RESEND_API_KEY) return new Response("Missing RESEND_API_KEY", { status: 500 });
    if (!from || !to) return new Response("Missing CONTACT_FROM or CONTACT_TO", { status: 500 });

    const payload = {
      from,
      to: to.split(",").map(s => s.trim()).filter(Boolean), // allow multiple TOs too
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

    return Response.redirect("/thanks.html", 303);
  } catch (e) {
    console.log("Contact function exception:", e);
    return new Response("Internal error", { status: 500 });
  }
}
