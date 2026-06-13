// esiprints-webhook — Stripe webhook handler + digital delivery
// Val.town HTTP val — paste this as a new HTTP val named "esiprints-webhook"
//
// Required env vars:
//   STRIPE_API_KEY          — your Stripe secret key
//   STRIPE_WEBHOOK_SECRET   — from Stripe Dashboard → Webhooks → signing secret
//   RESEND_API_KEY          — your Resend API key

const GITHUB_RAW = "https://raw.githubusercontent.com/iamdesireefaye/bygraceandglory/main/downloads/";
const BUNDLE_PRICE_IDS = new Set([
  "price_1Tb6xq67yoxIEqDvFEDubpxv", // Grace Edit
  "price_1Tb6xt67yoxIEqDvnrhjH1pw", // Glory Bundle
  "price_1Tb6xv67yoxIEqDvZ9gR3rkS", // Full Testimony
]);

// ── Price ID → product mapping ────────────────────────────────────────────────
const PRICE_TO_PRODUCT: Record<string, { name: string; file: string }> = {
  "price_1Tb6uz67yoxIEqDvYoeAdD5C": { name: "For I Know the Plans",       file: "For I Know the Plans.png" },
  "price_1Tb6v267yoxIEqDv1dT9Rd1a": { name: "God Is Within Her",           file: "God Is Within Her.png" },
  "price_1Tb6v467yoxIEqDvijYpb9Kv": { name: "She Will Not Fall",           file: "She Will Not Fall.png" },
  "price_1Tb6v767yoxIEqDvmBPFMSYN": { name: "Soar on Wings Like Eagles",   file: "Soar on Wings Like Eagles.png" },
  "price_1Tb6v967yoxIEqDvapfHM7ls": { name: "Write the Vision",            file: "Write the Vision.png" },
  "price_1Tb6vC67yoxIEqDv6SAdQDVV": { name: "For I Know the Plans II",     file: "For I Know the Plans II.png" },
  "price_1Tb6vG67yoxIEqDvZK8KwIMS": { name: "The Plans I Have",            file: "The Plans I Have.png" },
  "price_1Tb6vJ67yoxIEqDvGlxQ0yDC": { name: "God Is Within Her II",        file: "God Is Within Her II.png" },
  "price_1Tb6vL67yoxIEqDvub6oofhr": { name: "Soar on Wings II",            file: "Soar on Wings II.png" },
  "price_1Tb6vO67yoxIEqDvuTVFWrOU": { name: "Write the Vision II",         file: "Write the Vision II.png" },
  "price_1Tb6vR67yoxIEqDvmVRDYCP5": { name: "He Rejoices Over You",        file: "He Rejoices Over You.png" },
  "price_1Tb6vT67yoxIEqDvcp5mcsfG": { name: "No Weapon Formed",            file: "No Weapon Formed.png" },
  "price_1Tb6vW67yoxIEqDv2ZJFaVRB": { name: "For Such a Time",             file: "For Such a Time.png" },
  "price_1Tb6vZ67yoxIEqDvH32XMmhq": { name: "His Mercies Are New",         file: "His Mercies Are New.png" },
  "price_1Tb6vb67yoxIEqDvczFMMwue": { name: "Windows of Heaven",           file: "Windows of Heaven.png" },
  "price_1Tb6ve67yoxIEqDvfNhIuCpd": { name: "Pour Out a Blessing",         file: "Pour Out a Blessing.png" },
  "price_1Tb6vg67yoxIEqDvPmEeYDYW": { name: "Head and Not the Tail",       file: "Head and Not the Tail.png" },
  "price_1Tb6vj67yoxIEqDvVndXSDsK": { name: "Violet Wings",                file: "Violet Wings.png" },
  "price_1Tb6vm67yoxIEqDvQGeT50F5": { name: "Garden Whisper",              file: "Garden Whisper.png" },
  "price_1Tb6vo67yoxIEqDv3iIAR71g": { name: "Leopard & Butterflies",       file: "Leopard & Butterflies.png" },
  "price_1Tb6vr67yoxIEqDvdDX1ufAD": { name: "Veiled in Wings",             file: "Veiled in Wings.png" },
  "price_1Tb6vv67yoxIEqDvDvwDPk01": { name: "Sepia Butterfly Mask",        file: "Sepia Butterfly Mask.png" },
  "price_1Tb6vx67yoxIEqDvSbqmcavy": { name: "Emerald Butterfly",           file: "Emerald Butterfly.png" },
  "price_1Tb6w067yoxIEqDvQLiVduQc": { name: "Monarch Veil",                file: "Monarch Veil.png" },
  "price_1Tb6w267yoxIEqDv4cLoRugG": { name: "Monarch Veil II",             file: "Monarch Veil II.png" },
  "price_1Tb6w567yoxIEqDveS48Lle4": { name: "Monarch Surrender",           file: "Monarch Surrender.png" },
  "price_1Tb6w867yoxIEqDvBrD7VHVj": { name: "Purple Monarchs",             file: "Purple Monarchs.png" },
  "price_1Tb6wA67yoxIEqDvPzKG2xel": { name: "Crowned in Bloom",            file: "Crowned in Bloom.png" },
  "price_1Tb6wD67yoxIEqDvzd7DP1QA": { name: "The Queen's Throne",          file: "The Queen's Throne.png" },
  "price_1Tb6wF67yoxIEqDvCGJxznoV": { name: "Wings of Worship",            file: "Wings of Worship.png" },
  "price_1Tb6wI67yoxIEqDvzl1QgmOW": { name: "Floral Crown",                file: "Floral Crown.png" },
  "price_1Tb6wK67yoxIEqDvuBGlVebp": { name: "Midnight Crown",              file: "Midnight Crown.png" },
  "price_1Tb6wN67yoxIEqDvnPW0XGNY": { name: "Sunflower Joy",               file: "Sunflower Joy.png" },
  "price_1Tb6wP67yoxIEqDvanZqbUg3": { name: "Fearfully & Wonderfully Made",file: "Fearfully & Wonderfully Made.png" },
  "price_1Tb6wS67yoxIEqDvUC3C4kuN": { name: "Love Letters",                file: "Love Letters.png" },
  "price_1Tb6wU67yoxIEqDvSR8PB49Q": { name: "Candlelit Reading",           file: "Candlelit Reading.png" },
  "price_1Tb6wW67yoxIEqDvMhBReQkg": { name: "Held Close",                  file: "Held Close.png" },
  "price_1Tb6wZ67yoxIEqDv3ZLkdZOk": { name: "Sunday Rest",                 file: "Sunday Rest.png" },
  "price_1Tb6wc67yoxIEqDvJl7CUrV0": { name: "Letters from God",            file: "Letters from God.png" },
  "price_1Tb6we67yoxIEqDvxr43tC2Y": { name: "Resting in the Word",         file: "Resting in the Word.png" },
  "price_1Tb6wg67yoxIEqDvyHYKxe4j": { name: "Butterfly Devotion",          file: "Butterfly Devotion.png" },
  "price_1Tb6wj67yoxIEqDv5bLQ1lhI": { name: "Art Studio Devotion",         file: "Art Studio Devotion.png" },
  "price_1Tb6wl67yoxIEqDvj2hM5vQj": { name: "Garden of the Word",          file: "Garden of the Word.png" },
  "price_1Tb6xH67yoxIEqDvjjc8Fpiz": { name: "Illuminated",                 file: "Illuminated.png" },
  "price_1Tb6wr67yoxIEqDv0sg6yQOK": { name: "Holy Bible & Leopard",        file: "Holy Bible & Leopard.png" },
  "price_1Tb6wu67yoxIEqDvO17zpQRu": { name: "Evening Devotion",            file: "Evening Devotion.png" },
  "price_1Tb6ww67yoxIEqDv8XTsBdpV": { name: "Heart Balloons",              file: "Heart Balloons.png" },
  "price_1Tb6wz67yoxIEqDvmKCFQP0e": { name: "Heart Balloons II",           file: "Heart Balloons II.png" },
  "price_1Tb6x167yoxIEqDvrmJHRYLI": { name: "Candlelit Hands",             file: "Candlelit Hands.png" },
  "price_1Tb6x567yoxIEqDvp641uFql": { name: "Morning Cup",                 file: "Morning Cup.png" },
  "price_1Tb6x867yoxIEqDvg79jdkSA": { name: "New Morning",                 file: "New Morning.png" },
  "price_1Tb6xC67yoxIEqDvLHRUZxoD": { name: "Linen Morning",               file: "Linen Morning.png" },
  "price_1Tb6xF67yoxIEqDv906WfGqs": { name: "Morning Window",              file: "Morning Window.png" },
  "price_1Tb6xK67yoxIEqDv6icb8w6d": { name: "The Photographer",            file: "The Photographer.png" },
  "price_1Tb6xN67yoxIEqDv2scAMh5a": { name: "Afternoon Light",             file: "Afternoon Light.png" },
  "price_1Tb6xP67yoxIEqDvjBaQUizv": { name: "Urban Jungle",                file: "Urban Jungle.png" },
  "price_1Tb6xS67yoxIEqDvtsu0bd3y": { name: "The Botanist",                file: "The Botanist.png" },
  "price_1Tb6xU67yoxIEqDvY2xnjnp6": { name: "CEO Morning",                 file: "CEO Morning.png" },
  "price_1Tb6xX67yoxIEqDvKFfqzgBV": { name: "Plant Shop",                  file: "Plant Shop.png" },
  "price_1Tb6xa67yoxIEqDv3ReKQ3mO": { name: "First Class",                 file: "First Class.png" },
  "price_1Tb6xd67yoxIEqDvUsZaZRNH": { name: "Sunset Dinner",               file: "Sunset Dinner.png" },
  "price_1Tb6xg67yoxIEqDv4iFEmiMP": { name: "Braids & Butterflies",        file: "Braids & Butterflies.png" },
  "price_1Tb6xj67yoxIEqDv4xaimiHN": { name: "Beaded Braids",               file: "Beaded Braids.png" },
  "price_1Tb6xl67yoxIEqDvAllohUpA": { name: "Sister Sister",               file: "Sister Sister.png" },
  "price_1Tb6xo67yoxIEqDvJqA2XddT": { name: "Side by Side",                file: "Side by Side.png" },
  "price_1ThkEu67yoxIEqDvpgevbVnm": { name: "After the Shower",            file: "After the Shower.png" },
  "price_1ThkEw67yoxIEqDvebrifYpu": { name: "Rose Petal Bath",             file: "Rose Petal Bath.png" },
  "price_1ThkEy67yoxIEqDvR4twl8Au": { name: "Butterfly Vanity",            file: "Butterfly Vanity.png" },
  "price_1ThkF067yoxIEqDvU34qZxMS": { name: "Bed and Business",            file: "Bed and Business.png" },
  "price_1ThkF267yoxIEqDvOfmaxnKx": { name: "Morning Reach",               file: "Morning Reach.png" },
  "price_1ThkF467yoxIEqDvuMOlrPiJ": { name: "Guided Hands",                file: "Guided Hands.png" },
  "price_1ThkF667yoxIEqDv4k9zJsAx": { name: "Lifted Hands",                file: "Lifted Hands.png" },
  "price_1ThkF867yoxIEqDvB8QmYqFK": { name: "Silk Morning",                file: "Silk Morning.png" },
  "price_1ThkFB67yoxIEqDvwuYwkd1E": { name: "Still Small Voice",           file: "Still Small Voice.png" },
  "price_1ThkFD67yoxIEqDvDofco4V3": { name: "Golden Soak",                 file: "Golden Soak.png" },
  "price_1ThkFF67yoxIEqDvGI1WZVyH": { name: "New Day Rising",              file: "New Day Rising.png" },
  "price_1ThkFH67yoxIEqDvaA0wGCCV": { name: "CEO Energy",                  file: "CEO Energy.png" },
  "price_1ThkFK67yoxIEqDvy8odcIaF": { name: "Monarch Bath",                file: "Monarch Bath.png" },
  "price_1ThkFN67yoxIEqDv3o488N23": { name: "Sweet Rest",                  file: "Sweet Rest.png" },
  "price_1ThkFV67yoxIEqDvLavM7K5t": { name: "Garden Dweller",              file: "Garden Dweller.png" },
  "price_1ThkFa67yoxIEqDvyFaI6uNp": { name: "Word Study",                  file: "Word Study.png" },
  "price_1ThkFd67yoxIEqDvRT9zMjJu": { name: "Leopard Lounge",              file: "Leopard Lounge.png" },
  "price_1ThkFf67yoxIEqDvoH2wkV1e": { name: "Morning Watch",               file: "Morning Watch.png" },
  "price_1ThkFg67yoxIEqDvOuh8y2yM": { name: "Write It Down",               file: "Write It Down.png" },
  "price_1ThkFi67yoxIEqDvHpbqrhgH": { name: "Evening Watch",               file: "Evening Watch.png" },
  "price_1ThkFk67yoxIEqDvkvPGZBmM": { name: "Above the Clouds",            file: "Above the Clouds.png" },
  "price_1ThkFm67yoxIEqDvh1rYc0Ae": { name: "Sunset Monarch",              file: "Sunset Monarch.png" },
  "price_1ThkFo67yoxIEqDvGzgZAIlL": { name: "Golden Journal",              file: "Golden Journal.png" },
  "price_1ThkFq67yoxIEqDvzJMb0rUJ": { name: "Sacred Hands",                file: "Sacred Hands.png" },
  "price_1ThkFs67yoxIEqDvZ51W4oIy": { name: "Inner Child",                 file: "Inner Child.png" },
};

// ── Stripe webhook signature verification ─────────────────────────────────────
async function verifyStripeSignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const parts = Object.fromEntries(signature.split(",").map((p) => p.split("=") as [string, string]));
    const timestamp = parts["t"];
    const sigHex = parts["v1"];
    if (!timestamp || !sigHex) return false;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`));
    const expected = Array.from(new Uint8Array(signed)).map((b) => b.toString(16).padStart(2, "0")).join("");
    return expected === sigHex;
  } catch {
    return false;
  }
}

// ── Delivery email ────────────────────────────────────────────────────────────
async function sendDeliveryEmail(customerEmail: string, products: Array<{ name: string; url: string }>) {
  const linksHtml = products.map((p) => `
    <div style="margin:16px 0; padding:16px; background:#f5f0e8;">
      <div style="font-family:Georgia,serif; font-size:15px; color:#2a1f14; margin-bottom:8px;">${p.name}</div>
      <a href="${p.url}" style="display:inline-block; font-family:Helvetica,sans-serif; font-size:11px;
         font-weight:600; letter-spacing:0.15em; text-transform:uppercase;
         color:#2a1f14; background:#c4a265; padding:10px 24px; text-decoration:none;">
        Download Print →
      </a>
    </div>`).join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fefdfb;padding:48px 40px;">
    <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#c4a265;margin-bottom:24px;">Esi Prints</div>
    <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#2a1f14;margin:0 0 8px;">Your download is ready</h1>
    <p style="font-family:Georgia,serif;font-size:15px;color:#8a7a6a;line-height:1.7;margin:0 0 32px;">Thank you for your purchase. Click below to download your print(s).</p>
    <div style="border-top:1px solid #ece4d6;padding-top:8px;margin-bottom:32px;">${linksHtml}</div>
    <div style="border-top:1px solid #ece4d6;padding-top:24px;">
      <p style="font-size:12px;color:#8a7a6a;line-height:1.8;margin:0 0 12px;"><strong>Printing tips:</strong> For best results, print at up to 24×36 inches on archival matte or fine art paper.</p>
      <p style="font-size:11px;color:#bbb;line-height:1.7;margin:0;">Questions? <a href="mailto:hello@esiprints.shop" style="color:#c4a265;">hello@esiprints.shop</a><br>© 2026 Esi Prints · By Grace &amp; Glory</p>
    </div>
  </div>
</body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Esi Prints <hello@esiprints.shop>", to: [customerEmail], subject: "Your Esi Prints download is ready", html }),
  });

  if (!res.ok) console.error("Resend error:", await res.text());
  else console.log("Email sent to", customerEmail);
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function (req: Request): Promise<Response> {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const stripeKey = Deno.env.get("STRIPE_API_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey || !webhookSecret) {
    console.error("Missing env vars");
    return new Response("Server misconfigured", { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature", { status: 400 });

  const body = await req.text();
  const valid = await verifyStripeSignature(body, sig, webhookSecret);
  if (!valid) {
    console.error("Signature verification failed");
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);
  if (event.type !== "checkout.session.completed") return new Response("OK", { status: 200 });

  const session = event.data.object;
  const customerEmail = session.customer_details?.email;
  if (!customerEmail) {
    console.error("No customer email");
    return new Response("No email", { status: 400 });
  }

  // Fetch line items
  const liRes = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${session.id}/line_items?limit=100`,
    { headers: { Authorization: "Basic " + btoa(stripeKey + ":"), "Stripe-Version": "2023-10-16" } },
  );
  const liData = await liRes.json();
  const lineItems = liData.data ?? [];

  const products: Array<{ name: string; url: string }> = [];
  let bundleFilesHandled = false;

  for (const item of lineItems) {
    const priceId = item.price?.id;
    if (!priceId) continue;

    // Bundle price IDs — look up selected files from session metadata
    if (BUNDLE_PRICE_IDS.has(priceId) && !bundleFilesHandled) {
      bundleFilesHandled = true;
      const sessionRes = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${session.id}`,
        { headers: { Authorization: "Basic " + btoa(stripeKey + ":"), "Stripe-Version": "2023-10-16" } },
      );
      const sessionData = await sessionRes.json();
      const meta = sessionData.metadata || {};
      let filesStr = "";
      for (let n = 0; meta["files_" + n]; n++) filesStr += meta["files_" + n];
      const files = filesStr.split(",").filter(Boolean);
      for (const file of files) {
        const name = file.replace(".png", "");
        products.push({ name, url: GITHUB_RAW + encodeURIComponent(file.replace(".png", ".jpg")) });
      }
      continue;
    }

    const product = PRICE_TO_PRODUCT[priceId];
    if (!product) { console.warn("Unknown price ID:", priceId); continue; }
    const qty = item.quantity ?? 1;
    for (let i = 0; i < qty; i++) {
      products.push({ name: product.name, url: GITHUB_RAW + encodeURIComponent(product.file.replace('.png', '.jpg')) });
    }
  }

  if (products.length > 0) {
    await sendDeliveryEmail(customerEmail, products);
  } else {
    console.warn("No recognized products in session", session.id);
  }

  return new Response("OK", { status: 200 });
}
