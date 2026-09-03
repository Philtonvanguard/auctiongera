/**
 * Contact form endpoint.
 *
 * Sends through Emailit directly rather than n8n. The only n8n instance is
 * local (localhost:5678) and a Worker cannot reach it, so routing through it
 * would mean the form only worked while a laptop was awake.
 *
 * CONTACT_FROM_EMAIL must be on a domain verified in Emailit. vipelex.com is
 * verified; auctiongera.bid is not, so sending "from" the auction domain will
 * be rejected until it is added there.
 */
interface Env {
  EMAILIT_API_KEY: string;
  CONTACT_FROM_EMAIL: string;
  CONTACT_TO_EMAIL: string;
}

type Field = "name" | "email" | "message";

const EMAILIT_ENDPOINT = "https://api.emailit.com/v2/emails";

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

/** Header injection guard: a newline in the subject could forge extra headers
 *  downstream, and the name is attacker-controlled. */
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

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

  const { EMAILIT_API_KEY, CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL } = context.env;
  if (!EMAILIT_API_KEY || !CONTACT_FROM_EMAIL || !CONTACT_TO_EMAIL) {
    console.error("Emailit is not configured; contact form submission dropped");
    return json(
      { ok: false, error: "Messages are not being delivered right now. Please email us directly." },
      503,
    );
  }

  try {
    const res = await fetch(EMAILIT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EMAILIT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: CONTACT_TO_EMAIL,
        // Replying from the inbox reaches the buyer, not the no-reply address.
        reply_to: values.email,
        subject: oneLine(`AuctionGera enquiry from ${values.name}`),
        text: [
          "New message from the AuctionGera contact form.",
          "",
          `Name:  ${oneLine(values.name)}`,
          `Email: ${oneLine(values.email)}`,
          "",
          values.message,
        ].join("\n"),
      }),
    });

    // Never report success we cannot vouch for.
    if (!res.ok) {
      console.error(`Emailit returned ${res.status}: ${await res.text()}`);
      throw new Error(`Emailit returned ${res.status}`);
    }
  } catch (err) {
    console.error("contact send failed:", err);
    return json({ ok: false, error: "We could not send that just now. Please try again in a minute." }, 502);
  }

  return json({ ok: true });
};
