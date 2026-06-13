// esiprints-contact — Contact form handler
// Val.town HTTP val — paste this as a new HTTP val named "esiprints-contact"
//
// Required env vars:
//   RESEND_API_KEY — your Resend API key
//
// Update contact.html to POST to:
//   https://brilliantmind1206--esiprints-contact.web.val.run

import { sqlite } from "https://esm.town/v/std/sqlite";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

export default async function (req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  let body: { name?: string; email?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const { name, email, message } = body;
  if (!name || !email || !message) {
    return json({ ok: false, error: "name, email, and message are required" }, 400);
  }

  // Save to SQLite
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS esi_contacts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      message    TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  const now = new Date().toISOString();
  await sqlite.execute(
    `INSERT INTO esi_contacts (name, email, message, created_at) VALUES (?, ?, ?, ?)`,
    [name, email, message, now],
  );

  // Notify hello@esiprints.shop
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (resendKey) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Esi Prints <hello@esiprints.shop>",
        to: ["hello@esiprints.shop"],
        reply_to: email,
        subject: `New message from ${name}`,
        html: `
          <p><strong>From:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Date:</strong> ${now}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
          <p style="white-space:pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
          <p style="color:#999;font-size:12px;">Reply directly to this email to respond to ${name}.</p>
        `,
      }),
    });
  }

  return json({ ok: true });
}
