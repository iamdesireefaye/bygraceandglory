// esiprints-download — Token-based download handler
// Val.town HTTP val — paste this as a new HTTP val named "esiprints-download"
//
// No extra env vars needed — uses shared Val.town SQLite.
//
// Usage: https://brilliantmind1206--esiprints-download.web.val.run?token=TOKEN
// Put this URL in DOWNLOAD_BASE_URL env var of esiprints-webhook.

import { sqlite } from "https://esm.town/v/std/sqlite";

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/iamdesireefaye/bygraceandglory/main/img/";

const MAX_DOWNLOADS = 2;

// ── Branded HTML response ─────────────────────────────────────────────────────
function page(title: string, body: string): Response {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Esi Prints</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--gold:#c4a265;--cream:#f5f0e8;--espresso:#2a1f14;--white:#fefdfb}
    body{
      font-family:'Georgia',serif;background:var(--cream);min-height:100vh;
      display:flex;align-items:center;justify-content:center;
      padding:2rem;text-align:center;
    }
    .card{
      background:var(--white);max-width:480px;width:100%;
      padding:3rem 2.5rem;box-shadow:0 10px 50px rgba(0,0,0,0.08);
    }
    .eyebrow{
      font-family:Helvetica,sans-serif;font-size:10px;font-weight:600;
      letter-spacing:0.3em;text-transform:uppercase;color:var(--gold);margin-bottom:1.2rem;
    }
    h1{font-size:1.8rem;font-weight:400;color:var(--espresso);margin-bottom:1rem;line-height:1.3;}
    p{font-size:1rem;color:#8a7a6a;line-height:1.7;margin-bottom:1rem;}
    a{color:var(--gold);text-decoration:none;}
    a:hover{text-decoration:underline;}
    .back{margin-top:1.5rem;font-size:0.85rem;}
  </style>
</head>
<body>
  <div class="card">
    <div class="eyebrow">Esi Prints</div>
    ${body}
    <p class="back"><a href="https://esiprints.shop">← Back to shop</a></p>
  </div>
</body>
</html>`,
    { headers: { "Content-Type": "text/html" } },
  );
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function (req: Request): Promise<Response> {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return page(
      "Invalid Link",
      `<h1>Invalid Link</h1>
       <p>This download link isn't valid. If you just purchased, please check your email for the correct link.</p>
       <p>Need help? <a href="mailto:hello@esiprints.shop">hello@esiprints.shop</a></p>`,
    );
  }

  // Ensure table exists
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS esi_downloads (
      token          TEXT PRIMARY KEY,
      product_name   TEXT NOT NULL,
      filename       TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      download_count INTEGER DEFAULT 0,
      created_at     TEXT NOT NULL
    )
  `);

  const result = await sqlite.execute(
    `SELECT product_name, filename, download_count FROM esi_downloads WHERE token = ?`,
    [token],
  );

  if (!result.rows || result.rows.length === 0) {
    return page(
      "Link Not Found",
      `<h1>Link Not Found</h1>
       <p>This download link is invalid or has already expired.</p>
       <p>Need help? <a href="mailto:hello@esiprints.shop">hello@esiprints.shop</a></p>`,
    );
  }

  const [productName, filename, downloadCount] = result.rows[0];

  if (Number(downloadCount) >= MAX_DOWNLOADS) {
    return page(
      "Download Limit Reached",
      `<h1>Download limit reached</h1>
       <p>Your link for <em>${productName}</em> has been used ${MAX_DOWNLOADS} times and is no longer active.</p>
       <p>This protects the work of independent artists. If you need assistance, please email us.</p>
       <p><a href="mailto:hello@esiprints.shop">hello@esiprints.shop</a></p>`,
    );
  }

  // Increment counter before redirecting
  await sqlite.execute(
    `UPDATE esi_downloads SET download_count = download_count + 1 WHERE token = ?`,
    [token],
  );

  const fileUrl = GITHUB_RAW_BASE + encodeURIComponent(String(filename));
  return Response.redirect(fileUrl, 302);
}
