export async function onRequestPost({ request, env }) {
  try {
    console.log("Contact form POST received");

    const form = await request.formData();

    // Honeypot (silent success)
    const honeypot = (form.get("bot-field") || "").toString().trim();
    if (honeypot) {
      console.log("Honeypot triggered, ignoring");
      return new Response("OK", { status: 200 });
    }

    // Form fields
    const name = (form.get("name") || "").toString().trim();
    const email = (form.get("email") || "").toString().trim();
    const subject = (form.get("subject") || "Contactformulier").toString().trim();
    const message = (form.get("message") || "").toString().trim();

    if (!email || !message) {
      console.log("Missing required fields", { email, hasMessage: !!message });
      return new Response("Missing required fields", { status: 400 });
    }

    const from = (env.CONTACT_FROM || "").trim();
    const toStr = (env.CONTACT_TO || "").trim();
    const bccStr = (env.CONTACT_BCC || "").trim();

    if (!env.RESEND_API_KEY) {
      console.log("Missing RESEND_API_KEY");
      return new Response("Server misconfigured", { status: 500 });
    }

    if (!from || !toStr) {
      console.log("Missing CONTACT_FROM or CONTACT_TO", { from, toStr });
      return new Response("Server misconfigured", { status: 500 });
    }

    const to = toStr.split(",").map(s => s.trim()).filter(Boolean);
    const bcc = bccStr
      ? bccStr.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    console.log("📬 Email routing", {
      from,
      to,
      bcc: bcc.length ? bcc : "(none)",
      replyTo: email
    });

    const payload = {
      from,
      to,
      subject: `Contact – ${subject}`,
      replyTo: email, 
      text: [
        `Naam: ${name || "-"}`,
        `Email: ${email}`,
        "",
        message
      ].join("\n"),
      ...(bcc.length ? { bcc } : {})
    };

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      console.log("Resend API error", r.status, errText);
      return new Response("Email send failed", { status: 502 });
    }

    const result = await r.json().catch(() => ({}));
    console.log("Email sent successfully", result);

    return Response.redirect(new URL("/thanks.html", request.url), 303);
  } catch (err) {
    console.log("Contact function crashed", err);
    return new Response("Internal server error", { status: 500 });
  }
}
