// esiprints-checkout — Stripe checkout session creator
// Val.town HTTP val — paste this as a new HTTP val named "esiprints-checkout"
//
// Required env vars:
//   STRIPE_API_KEY — your Stripe secret key
//
// Update index.html CHECKOUT_URL to:
//   https://brilliantmind1206--esiprints-checkout.web.val.run

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

  let body: { items?: { priceId: string }[]; successUrl?: string; cancelUrl?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const { items, successUrl, cancelUrl } = body;

  if (!items || items.length === 0) {
    return json({ ok: false, error: "No items provided" }, 400);
  }

  const stripeKey = Deno.env.get("STRIPE_API_KEY");
  if (!stripeKey) {
    return json({ ok: false, error: "Stripe not configured" }, 500);
  }

  const lineItems = items.map((item) => ({
    price: item.priceId,
    quantity: 1,
  }));

  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("success_url", successUrl || "https://esiprints.shop/download.html");
  params.append("cancel_url", cancelUrl || "https://esiprints.shop/");
  params.append("allow_promotion_codes", "true");

  lineItems.forEach((li, i) => {
    params.append(`line_items[${i}][price]`, li.price);
    params.append(`line_items[${i}][quantity]`, String(li.quantity));
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const session = await res.json();

  if (!res.ok || !session.url) {
    console.error("Stripe error:", session);
    return json({ ok: false, error: session.error?.message || "Stripe error" }, 500);
  }

  return json({ url: session.url });
}
