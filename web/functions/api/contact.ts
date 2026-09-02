/**
 * Contact form endpoint. Was a Next route handler; a static export has no
 * server, so it lives here instead. Behaviour is unchanged.
 */
interface Env {
  N8N_CONTACT_WEBHOOK: string;
}

type Field = "name" | "email" | "message";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Server-side validation. The client validates too, for feedback speed only:
 *  this is the boundary that actually decides. */
function validate(body: Record<string, unknown>) {
  const errors: Partial<Record<Field, string>> = {};
  const get = (k: Field) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");

  const name = get("name");
  const email = get("email");
  const message = get("message");

  if (name.length < 2) errors.name = "Please enter your name.";
  if (name.length > 100) errors.name = "That name is too long.";
  // Deliberately loose. Strict email regexes reject valid addresses.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address.";
  if (email.length > 254) errors.email = "That email address is too long.";
  if (message.length < 10) errors.message = "Please tell us a little more.";
  if (message.length > 5000) errors.message = "Please keep this under 5000 characters.";

  return { errors, values: { name, email, message } };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: Record<string, unknown>;
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: "Malformed request." }, 400);
  }

  // Honeypot: real people leave it empty. Accept silently so bots learn nothing.
  if (typeof body.company === "string" && body.company.length > 0) {
    return json({ ok: true });
  }

  const { errors, values } = validate(body);
  if (Object.keys(errors).length > 0) return json({ ok: false, errors }, 422);

  const webhook = context.env.N8N_CONTACT_WEBHOOK;
  if (!webhook) {
    console.error("N8N_CONTACT_WEBHOOK is not set; contact form submission dropped");
    return json(
      { ok: false, error: "Messages are not being delivered right now. Please email us directly." },
      503,
    );
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "contact_form", ...values, received_at: new Date().toISOString() }),
    });
    // Do not report success we cannot vouch for.
    if (!res.ok) throw new Error(`webhook returned ${res.status}`);
  } catch (err) {
    console.error("contact webhook failed:", err);
    return json({ ok: false, error: "We could not send that just now. Please try again in a minute." }, 502);
  }

  return json({ ok: true });
};
