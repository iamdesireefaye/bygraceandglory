// esiprints-signup — Email signup handler
// Val.town HTTP val — paste this as a new HTTP val named "esiprints-signup"
//
// No extra env vars needed.
//
// Update index.html SCRIPT_URL to:
//   https://brilliantmind1206--esiprints-signup.web.val.run

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

  let body: { email?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const { email, source = "website" } = body;
  if (!email || !email.includes("@")) {
    return json({ ok: false, error: "Valid email required" }, 400);
  }

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS esi_subscribers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT UNIQUE NOT NULL,
      source     TEXT DEFAULT 'website',
      created_at TEXT NOT NULL
    )
  `);

  const now = new Date().toISOString();

  try {
    await sqlite.execute(
      `INSERT INTO esi_subscribers (email, source, created_at) VALUES (?, ?, ?)`,
      [email, source, now],
    );
  } catch (err: unknown) {
    // Duplicate email — not an error, just already subscribed
    if (String(err).includes("UNIQUE")) {
      return json({ ok: true, message: "Already subscribed" });
    }
    throw err;
  }

  return json({ ok: true });
}
