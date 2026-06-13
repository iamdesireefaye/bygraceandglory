// esiprints-checkout — Stripe checkout session creator
// Val.town HTTP val — paste this as a new HTTP val named "esiprints-checkout"
//
// Required env vars:
//   STRIPE_API_KEY — your Stripe secret key

export default async function (req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const { items, successUrl, cancelUrl, metadata } = await req.json();

  const body = new URLSearchParams();
  body.append("mode", "payment");
  body.append(
    "success_url",
    successUrl || "https://esiprints.shop/download.html?purchased=cart",
  );
  body.append("cancel_url", cancelUrl || "https://esiprints.shop/");
  body.append("allow_promotion_codes", "true");

  items.forEach((item: any, i: number) => {
    body.append(`line_items[${i}][price]`, item.priceId);
    body.append(`line_items[${i}][quantity]`, "1");
  });

  if (metadata && typeof metadata === "object") {
    Object.entries(metadata).forEach(([k, v]) => {
      body.append(`metadata[${k}]`, String(v));
    });
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(Deno.env.get("STRIPE_API_KEY") + ":"),
      "Stripe-Version": "2023-10-16",
    },
    body,
  });

  const session = await res.json();

  return new Response(JSON.stringify({ url: session.url }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
