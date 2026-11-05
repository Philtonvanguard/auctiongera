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

// The form sends lang: "es" from the /es/contact page, so a Spanish visitor
// reads Spanish errors. Anything else gets English.
const MESSAGES = {
  en: {
    name: "Please enter your name.",
    nameLong: "That name is too long.",
    email: "Please enter a valid email address.",
    emailLong: "That email address is too long.",
    message: "Please tell us a little more.",
    messageLong: "Please keep this under 5000 characters.",
    malformed: "Malformed request.",
    unconfigured: "Messages are not being delivered right now. Please email us directly.",
    failed: "We could not send that just now. Please try again in a minute.",
  },
  es: {
    name: "Escribe tu nombre.",
    nameLong: "Ese nombre es demasiado largo.",
    email: "Escribe un correo electrónico válido.",
    emailLong: "Ese correo electrónico es demasiado largo.",
    message: "Cuéntanos un poco más.",
    messageLong: "Escribe menos de 5000 caracteres.",
    malformed: "Solicitud no válida.",
    unconfigured: "Los mensajes no se están entregando en este momento. Escríbenos directamente por correo.",
    failed: "No pudimos enviarlo en este momento. Inténtalo de nuevo en un minuto.",
  },
};
type Messages = (typeof MESSAGES)["en"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Server-side validation. The client validates too, for feedback speed only:
 *  this is the boundary that actually decides. */
function validate(body: Record<string, unknown>, m: Messages) {
  const errors: Partial<Record<Field, string>> = {};
  const get = (k: Field) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");

  const name = get("name");
  const email = get("email");
  const message = get("message");

  if (name.length < 2) errors.name = m.name;
  if (name.length > 100) errors.name = m.nameLong;
  // Deliberately loose. Strict email regexes reject valid addresses.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = m.email;
  if (email.length > 254) errors.email = m.emailLong;
  if (message.length < 10) errors.message = m.message;
  if (message.length > 5000) errors.message = m.messageLong;

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
    return json({ ok: false, error: MESSAGES.en.malformed }, 400);
  }
  const spanish = body.lang === "es";
  const m = spanish ? MESSAGES.es : MESSAGES.en;

  // Honeypot: real people leave it empty. Accept silently so bots learn nothing.
  if (typeof body.company === "string" && body.company.length > 0) {
    return json({ ok: true });
  }

  const { errors, values } = validate(body, m);
  if (Object.keys(errors).length > 0) return json({ ok: false, errors }, 422);

  const { EMAILIT_API_KEY, CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL } = context.env;
  if (!EMAILIT_API_KEY || !CONTACT_FROM_EMAIL || !CONTACT_TO_EMAIL) {
    console.error("Emailit is not configured; contact form submission dropped");
    return json(
      { ok: false, error: m.unconfigured },
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
          ...(spanish ? ["Sent from the Spanish page (/es/contact)."] : []),
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
    return json({ ok: false, error: m.failed }, 502);
  }

  return json({ ok: true });
};
