"use client";

import { useState } from "react";
import { DICT, type Lang } from "@/lib/i18n";

type Errors = Partial<Record<"name" | "email" | "message", string>>;
type State = "idle" | "sending" | "sent" | "failed";

const FIELD =
  "mt-1.5 w-full rounded-lg border bg-card-2 px-4 py-2.5 text-body placeholder:text-muted/60 focus:outline-none";

export default function ContactForm({ lang }: { lang: Lang }) {
  const t = DICT[lang].form;
  const [state, setState] = useState<State>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setErrors({});
    setFormError("");

    const data = { ...Object.fromEntries(new FormData(event.currentTarget)), lang };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (res.ok && json.ok) {
        setState("sent");
        return;
      }
      // Field errors go next to the field; everything else goes to the top.
      if (json.errors) setErrors(json.errors);
      setFormError(json.error ?? t.checkFields);
      setState("failed");
    } catch {
      setFormError(t.offline);
      setState("failed");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-success/40 bg-success/10 p-8">
        <h2 className="font-display text-2xl text-success">{t.sentTitle}</h2>
        <p className="mt-2 text-muted">{t.sentBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {formError}
        </p>
      )}

      <div>
        <label htmlFor="name" className="text-sm font-medium">{t.name}</label>
        <input
          id="name" name="name" type="text" required autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={`${FIELD} ${errors.name ? "border-danger" : "border-line focus:border-gold"}`}
        />
        {errors.name && <p id="name-error" className="mt-1.5 text-sm text-danger">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-medium">{t.email}</label>
        <input
          id="email" name="email" type="email" required autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={`${FIELD} ${errors.email ? "border-danger" : "border-line focus:border-gold"}`}
        />
        {errors.email && <p id="email-error" className="mt-1.5 text-sm text-danger">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="message" className="text-sm font-medium">{t.message}</label>
        <textarea
          id="message" name="message" rows={6} required
          placeholder={t.placeholder}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={`${FIELD} ${errors.message ? "border-danger" : "border-line focus:border-gold"}`}
        />
        {errors.message && <p id="message-error" className="mt-1.5 text-sm text-danger">{errors.message}</p>}
      </div>

      {/* Honeypot. Hidden from people and from screen readers, visible to bots. */}
      <div aria-hidden className="absolute left-[-9999px]">
        <label htmlFor="company">{t.company}</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button
        type="submit"
        disabled={state === "sending"}
        className="press rounded-lg bg-gold px-6 py-3 font-semibold text-ink transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "sending" ? t.sending : t.send}
      </button>
    </form>
  );
}
