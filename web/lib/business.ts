/**
 * Published business identity for the marketing half.
 *
 * Mirrors the BUSINESS dict in app.py. Two apps serve one domain, so the
 * footer, the contact page and the legal pages have to agree on who runs this
 * site and how to reach them: a visitor who finds a phone number on /contact
 * and a different one in the privacy policy has found a reason not to bid.
 *
 * The address is the LLC's registered commercial mailbox, which is what
 * CAN-SPAM asks for in marketing mail. It is deliberately not a home address.
 */
export const BUSINESS = {
  entity: "Vipelex LLC",
  jurisdiction: "Delaware",
  email: "spinner@vipelex.com",
  // Digits only for tel:/sms: hrefs; phoneDisplay is what people read.
  phone: "+13022768934",
  phoneDisplay: "(302) 276-8934",
  addressLine: "254 Chapman Rd, Ste 208, PMB 20052",
  addressCity: "Newark",
  addressRegion: "DE",
  addressPostal: "19702",
} as const;

export const ADDRESS_ONE_LINE =
  `${BUSINESS.addressLine}, ${BUSINESS.addressCity}, ${BUSINESS.addressRegion} ${BUSINESS.addressPostal}`;
