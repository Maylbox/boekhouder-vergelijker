export async function onRequestPost({ request, env }) {
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

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: env.CONTACT_TO,
      bcc: env.CONTACT_BCC.split(",").map(e => e.trim()),
      reply_to: email,
      subject: `Contact – ${subject}`,
      text: `
Naam: ${name || "-"}
Email: ${email}

${message}
      `,
    }),
  });

  return Response.redirect("/thanks.html", 303);
}
