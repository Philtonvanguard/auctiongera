/**
 * English and Spanish copy for the marketing half.
 *
 * `es` is typed as `Dict`, so a key added to `en` and not translated fails the
 * build instead of shipping English on a Spanish page. Spanish is US Spanish,
 * informal (tú). Lot titles, conditions and locations are admin-entered and
 * stay as written.
 *
 * Spanish pages live under /es/ and keep the English slugs, as on the other
 * Vipelex sites. The Flask half serves its own /es/ twins of the legal and
 * auth pages (see app.py), so `href` is used for links to those too.
 */
export type Lang = "en" | "es";

/** The /es/ twin of an English path, or the path itself for English. */
export const href = (lang: Lang, path: string) =>
  lang === "es" ? (path === "/" ? "/es" : `/es${path}`) : path;

/** Canonical plus hreflang alternates for one page, in Metadata form. */
export const alternates = (lang: Lang, path: string) => ({
  canonical: href(lang, path),
  languages: { en: path, es: href("es", path), "x-default": path },
});

const en = {
  locale: "en-US",
  site: {
    title: "AuctionGera | Barn-Find Car Parts at Auction",
    description:
      "A barn of stored car parts, sold lot by lot at open auction. Inspect in person, bid online, pay cash on pickup.",
    ogAlt: "Stored car parts stacked inside the barn",
    ogLocale: "en_US",
  },
  shell: {
    skip: "Skip to content",
    navLabel: "Main",
    nav: { lots: "Lots", barn: "The Barn", how: "How It Works", contact: "Contact" },
    // Shown on the other language's pages, so it is written in its own language.
    switchTo: "Español",
    blurb:
      "One barn, decades of stored car parts, sold lot by lot. Inspect in person, bid online, pay cash on pickup.",
    browse: "Browse",
    currentLots: "Current lots",
    howItWorks: "How it works",
    createAccount: "Create an account",
    legal: "Legal",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    optOut: "Opt Out / Data Requests",
    accessibility: "Accessibility",
    contact: "Contact",
    text: "Text",
    rights: (entity: string, jurisdiction: string) =>
      `AuctionGera, operated by ${entity}, a ${jurisdiction} limited liability company. All rights reserved.`,
  },
  auth: {
    signedInAs: "Signed in as",
    admin: "Admin",
    signOut: "Sign out",
    signIn: "Sign in to bid",
  },
  hero: { play: "Play background video", pause: "Pause background video" },
  home: {
    eyebrow: "Barn-find car parts",
    title: "A barn full of parts that have not moved in decades.",
    lead:
      "Seats, panels, wheels, trim, and the odd complete assembly. Stored dry, sold honestly, lot by lot. What you see in the photos is what sits in the barn.",
    seeLots: "See current lots",
    whatsInBarn: "What is in the barn",
    openNow: "Open now",
    comingUp: "Coming up",
    buyerFees: "Buyer fees",
    none: "None",
    currentLots: "Current lots",
    viewAll: "View all lots",
    emptyTitle: "Nothing open at the moment",
    emptyBody:
      "Lots go up in batches as they come out of the barn. Create a free account and you will be first to know when the next one opens.",
    createAccount: "Create a free account",
    howTitle: "How it works",
    howBody:
      "Three steps, no buyer fees, no reserve games. The barn has been shut for a long time and we would rather these parts went to someone who wants them.",
    fullTerms: "Read the full terms",
    steps: [
      {
        title: "Come look at it",
        body: "Photos only tell you so much. Inspection days let you put hands on a part before you commit to a number.",
      },
      {
        title: "Bid online",
        body: "Create a free account and bid from anywhere. Every lot lists condition, location, and what is actually included.",
      },
      {
        title: "Pay cash, take it home",
        body: "Highest bid at close wins. We contact you the same day to arrange pickup. Payment is cash on collection.",
      },
    ],
  },
  lots: {
    metaTitle: "Current Car Part Lots at Auction",
    metaDescription:
      "Every car part lot currently open, opening soon, or recently closed. Condition and location listed on each.",
    title: "Current lots",
    lead:
      "Parts come out of the barn in batches, so this list changes. Bidding, account sign-in, and lot detail all live on the auction pages linked from each card.",
    emptyTitle: "No lots to show right now",
    emptyBody:
      "Nothing is listed at the moment. Create an account to be notified when the next batch comes out of the barn.",
    createAccount: "Create a free account",
    sections: {
      live: { heading: "Open for bidding", blurb: "Bidding is live. Highest bid at close wins." },
      upcoming: { heading: "Opening soon", blurb: "Listed and photographed. Bidding has not started yet." },
      ended: { heading: "Recently closed", blurb: "Sold or passed. Kept up so you can see what things go for." },
    },
  },
  card: {
    badge: { live: "Bidding open", upcoming: "Opens soon", ended: "Closed", cancelled: "Withdrawn" },
    noPhoto: "No photo yet",
    photos: (n: number) => `${n} photos`,
    condition: "Condition:",
    location: "Location:",
    currentBid: "Current bid",
    openingBid: "Opening bid",
    bids: (n: number) => `${n} ${n === 1 ? "bid" : "bids"}`,
    closes: "Closes",
  },
  how: {
    metaTitle: "How Bidding, Inspection and Pickup Work",
    metaDescription:
      "Bidding, winning, inspection, and cash-on-pickup collection terms for AuctionGera lots.",
    title: "How it works",
    lead: "Online bidding, in-person collection, cash on pickup. No buyer premium and no hidden fees.",
    register: {
      title: "Create a free account",
      body: "Registration takes a minute and costs nothing. You need an account to bid, not to browse.",
      link: "Register here",
    },
    inspect: {
      title: "Inspect if you can",
      body: "Arrange a viewing before bidding. Photos are honest, and they are still photos.",
      link: "Contact us to book a time",
    },
    steps: [
      {
        title: "Place your bid",
        body: "Each lot shows the current bid and the minimum increment. Your bid is a commitment to buy at that price if you win.",
      },
      {
        title: "Win at close",
        body: "Highest bid when the timer reaches zero takes the lot. We email you the same day to arrange collection.",
      },
      {
        title: "Collect and pay cash",
        body: "Come to the barn in the agreed window with cash and a way to carry the lot. Payment happens at handover, not before.",
      },
    ],
    noteLead: "Inspection and collection.",
    note:
      "Both are arranged with us directly rather than booked online. Message us to fix a viewing time before you bid, and the collection window is agreed with the winner on the day the lot closes.",
    faqTitle: "Common questions",
    faq: [
      {
        q: "How do I pay?",
        a: "Cash on collection. There is no online checkout, and we do not take card or transfer at this time. Bring the exact bid amount when you collect.",
      },
      {
        q: "Can I inspect a part before bidding?",
        a: "Yes, and we would rather you did. Contact us to arrange a time. Buying a barn-find part sight-unseen is how people end up disappointed.",
      },
      {
        q: "Do you ship?",
        a: "No. Everything is collection in person. Bring a vehicle that fits the lot, and bring help if the lot is heavy. We do not load for you.",
      },
      {
        q: "What condition are parts in?",
        a: "Used, stored, and decades old. Each listing states condition as we find it. Surface rust and dust are expected. Anything with a real defect is described.",
      },
      {
        q: "Can I return a part?",
        a: "No. Every lot sells as-is, where-is, which is exactly why inspection is offered. Ask questions before you bid rather than after.",
      },
      {
        q: "What if I win and do not collect?",
        a: "Tell us if plans change. Repeatedly winning lots and not collecting will get your account suspended, since it takes the lot off the market for everyone else.",
      },
    ],
  },
  barn: {
    metaTitle: "The Barn: Decades of Stored Car Parts",
    metaDescription:
      "Where the parts come from: one barn, stored dry for decades, now being emptied lot by lot.",
    title: "The barn",
    p1: "Everything sold here comes out of one building. No consignors, no drop-shippers, no parts sourced from somewhere else and relisted. One barn, one owner, one collection being worked through shelf by shelf.",
    calloutLead: "The building is being cleared.",
    callout:
      "Work is going floor by floor, and what comes out is listed as it is reached. Nothing is being held back for a better price later.",
    p2: "The parts were stored under roof, out of the weather. That matters. Surface rust and dust are normal for anything that has sat this long. Structural rot generally is not, and where a part has a real problem we say so in the listing rather than shooting around it.",
    p3: "Lots are photographed as they are found. We do not clean parts up to flatter them in pictures. What you see is what sits on the shelf.",
    tendsTitle: "What tends to come up",
    tends: [
      "Seats and interior trim",
      "Body panels and fenders",
      "Wheels and hubcaps",
      "Glass and lighting",
      "Engine and drivetrain parts",
      "Mixed hardware lots",
    ],
    tendsNote:
      "Categories shift as we work deeper into the building. The barn structure itself, including reclaimable timber, may be offered once the contents are cleared.",
    askTitle: "Looking for something specific?",
    askBody:
      "Plenty is still unsorted. If you are hunting a particular part, tell us the make, model, and year and we will look while we are in there.",
    askCta: "Send us a want list",
  },
  contact: {
    metaTitle: "Contact: Book an Inspection or Ask About a Lot",
    metaDescription:
      "Book an inspection, send a want list, or ask about a lot. We reply to everything.",
    title: "Get in touch",
    lead:
      "Booking an inspection, chasing a specific part, or asking about a lot you have your eye on. All of it goes to the same place and we read every message.",
    direct: "Reach us directly",
    email: "Email",
    callOrText: "Call or text",
    sendText: "Send a text",
    mail: "Mail",
    notHere: "Lots are inspected by appointment at the barn, not at this address.",
    bestTitle: "Best reason to write",
    bestBody:
      "Tell us the make, model, and year you are working on. Plenty of the barn is still unsorted, and we can look while we are in there.",
    soonTitle: "Bidding on a lot that closes soon?",
    soonBody:
      "Say so in your first line. Questions about a lot near its close get answered ahead of everything else, because after it closes the answer is no use to you.",
  },
  form: {
    name: "Your name",
    email: "Email",
    message: "What are you after?",
    placeholder: "Make, model, year, and the part you are hunting.",
    company: "Company",
    send: "Send message",
    sending: "Sending...",
    sentTitle: "Message sent",
    sentBody:
      "We will get back to you shortly. If it is urgent and you do not hear back, send it again rather than assuming it arrived.",
    checkFields: "Please check the highlighted fields and try again.",
    offline: "Could not reach the server. Check your connection and try again.",
  },
};

export type Dict = typeof en;

const es: Dict = {
  locale: "es-US",
  site: {
    title: "AuctionGera | Autopartes de granero en subasta",
    description:
      "Un granero lleno de autopartes guardadas, vendidas lote por lote en subasta abierta. Revísalas en persona, puja en línea y paga en efectivo al recoger.",
    ogAlt: "Autopartes guardadas y apiladas dentro del granero",
    ogLocale: "es_US",
  },
  shell: {
    skip: "Saltar al contenido",
    navLabel: "Principal",
    nav: { lots: "Lotes", barn: "El granero", how: "Cómo funciona", contact: "Contacto" },
    switchTo: "English",
    blurb:
      "Un granero, décadas de autopartes guardadas, vendidas lote por lote. Revísalas en persona, puja en línea y paga en efectivo al recoger.",
    browse: "Explorar",
    currentLots: "Lotes actuales",
    howItWorks: "Cómo funciona",
    createAccount: "Crea una cuenta",
    legal: "Legal",
    terms: "Términos del servicio",
    privacy: "Política de privacidad",
    optOut: "Exclusión y solicitudes de datos",
    accessibility: "Accesibilidad",
    contact: "Contacto",
    text: "SMS al",
    rights: (entity: string, jurisdiction: string) =>
      `AuctionGera, operado por ${entity}, una compañía de responsabilidad limitada de ${jurisdiction}. Todos los derechos reservados.`,
  },
  auth: {
    signedInAs: "Sesión iniciada como",
    admin: "Admin",
    signOut: "Cerrar sesión",
    // Shorter than a literal "inicia sesión para pujar", which pushed the
    // header past a 375px phone screen.
    signIn: "Inicia sesión",
  },
  hero: { play: "Reproducir video de fondo", pause: "Pausar video de fondo" },
  home: {
    eyebrow: "Autopartes de granero",
    title: "Un granero lleno de piezas que no se han movido en décadas.",
    lead:
      "Asientos, paneles, ruedas, molduras y uno que otro ensamble completo. Guardados en seco, vendidos con honestidad, lote por lote. Lo que ves en las fotos es lo que hay en el granero.",
    seeLots: "Ver lotes actuales",
    whatsInBarn: "Qué hay en el granero",
    openNow: "Abiertos ahora",
    comingUp: "Próximamente",
    buyerFees: "Comisión al comprador",
    none: "Ninguna",
    currentLots: "Lotes actuales",
    viewAll: "Ver todos los lotes",
    emptyTitle: "No hay nada abierto por ahora",
    emptyBody:
      "Los lotes salen en tandas a medida que los sacamos del granero. Crea una cuenta gratis y serás de los primeros en saber cuándo abre el siguiente.",
    createAccount: "Crea una cuenta gratis",
    howTitle: "Cómo funciona",
    howBody:
      "Tres pasos, sin comisiones al comprador y sin trucos con precios de reserva. El granero estuvo cerrado mucho tiempo y preferimos que estas piezas lleguen a alguien que las quiera.",
    fullTerms: "Lee las condiciones completas",
    steps: [
      {
        title: "Ven a verlo",
        body: "Las fotos solo dicen hasta cierto punto. En los días de inspección puedes tocar una pieza antes de comprometerte con una cifra.",
      },
      {
        title: "Puja en línea",
        body: "Crea una cuenta gratis y puja desde donde estés. Cada lote indica el estado, la ubicación y lo que realmente incluye.",
      },
      {
        title: "Paga en efectivo y llévatelo",
        body: "La puja más alta al cierre gana. Te contactamos el mismo día para coordinar la recogida. El pago es en efectivo al recoger.",
      },
    ],
  },
  lots: {
    metaTitle: "Lotes de autopartes en subasta",
    metaDescription:
      "Todos los lotes de autopartes abiertos, por abrir o cerrados recientemente. Cada uno indica su estado y ubicación.",
    title: "Lotes actuales",
    lead:
      "Las piezas salen del granero en tandas, así que esta lista cambia. Las pujas, el inicio de sesión y el detalle de cada lote están en las páginas de subasta enlazadas desde cada tarjeta, que por ahora están en inglés.",
    emptyTitle: "No hay lotes para mostrar ahora",
    emptyBody:
      "Por ahora no hay nada publicado. Crea una cuenta para recibir un aviso cuando salga la próxima tanda del granero.",
    createAccount: "Crea una cuenta gratis",
    sections: {
      live: { heading: "Abiertos para pujar", blurb: "Las pujas están abiertas. La puja más alta al cierre gana." },
      upcoming: { heading: "Abren pronto", blurb: "Publicados y fotografiados. Las pujas todavía no empiezan." },
      ended: {
        heading: "Cerrados recientemente",
        blurb: "Vendidos o sin venta. Los dejamos publicados para que veas en cuánto se venden las cosas.",
      },
    },
  },
  card: {
    badge: { live: "Pujas abiertas", upcoming: "Abre pronto", ended: "Cerrado", cancelled: "Retirado" },
    noPhoto: "Todavía sin foto",
    photos: (n: number) => `${n} fotos`,
    condition: "Estado:",
    location: "Ubicación:",
    currentBid: "Puja actual",
    openingBid: "Puja inicial",
    bids: (n: number) => `${n} ${n === 1 ? "puja" : "pujas"}`,
    closes: "Cierra el",
  },
  how: {
    metaTitle: "Cómo funcionan las pujas, la inspección y la recogida",
    metaDescription:
      "Condiciones de puja, adjudicación, inspección y recogida con pago en efectivo para los lotes de AuctionGera.",
    title: "Cómo funciona",
    lead: "Pujas en línea, recogida en persona y pago en efectivo al recoger. Sin prima del comprador y sin cargos ocultos.",
    register: {
      title: "Crea una cuenta gratis",
      body: "Registrarte toma un minuto y no cuesta nada. Necesitas una cuenta para pujar, no para mirar.",
      link: "Regístrate aquí",
    },
    inspect: {
      title: "Inspecciona si puedes",
      body: "Coordina una visita antes de pujar. Las fotos son honestas, y aun así siguen siendo fotos.",
      link: "Contáctanos para reservar una hora",
    },
    steps: [
      {
        title: "Haz tu puja",
        body: "Cada lote muestra la puja actual y el incremento mínimo. Tu puja es un compromiso de comprar a ese precio si ganas.",
      },
      {
        title: "Gana al cierre",
        body: "La puja más alta cuando el contador llega a cero se lleva el lote. Te escribimos el mismo día para coordinar la recogida.",
      },
      {
        title: "Recoge y paga en efectivo",
        body: "Ven al granero en el horario acordado con el efectivo y una forma de llevarte el lote. El pago se hace en la entrega, no antes.",
      },
    ],
    noteLead: "Inspección y recogida.",
    note:
      "Las dos se coordinan directamente con nosotros, no se reservan en línea. Escríbenos para fijar una hora de visita antes de pujar. El horario de recogida se acuerda con el ganador el día que cierra el lote.",
    faqTitle: "Preguntas frecuentes",
    faq: [
      {
        q: "¿Cómo pago?",
        a: "En efectivo al recoger. No hay pago en línea y por ahora no aceptamos tarjeta ni transferencia. Trae el monto exacto de tu puja cuando vengas a recoger.",
      },
      {
        q: "¿Puedo inspeccionar una pieza antes de pujar?",
        a: "Sí, y preferimos que lo hagas. Contáctanos para coordinar una hora. Comprar una pieza de granero sin verla es la forma más segura de llevarse una decepción.",
      },
      {
        q: "¿Hacen envíos?",
        a: "No. Todo se recoge en persona. Trae un vehículo donde quepa el lote y trae ayuda si el lote es pesado. Nosotros no cargamos por ti.",
      },
      {
        q: "¿En qué estado están las piezas?",
        a: "Usadas, guardadas y con décadas de antigüedad. Cada anuncio indica el estado tal como lo encontramos. El óxido superficial y el polvo son normales. Cualquier defecto real se describe.",
      },
      {
        q: "¿Puedo devolver una pieza?",
        a: "No. Cada lote se vende tal como está y donde está, y por eso mismo ofrecemos la inspección. Haz tus preguntas antes de pujar, no después.",
      },
      {
        q: "¿Qué pasa si gano y no recojo?",
        a: "Avísanos si cambian tus planes. Ganar lotes una y otra vez sin recogerlos hará que suspendamos tu cuenta, ya que deja el lote fuera del mercado para todos los demás.",
      },
    ],
  },
  barn: {
    metaTitle: "El granero: décadas de autopartes guardadas",
    metaDescription:
      "De dónde vienen las piezas: un granero guardado en seco durante décadas que ahora se vacía lote por lote.",
    title: "El granero",
    p1: "Todo lo que se vende aquí sale de un solo edificio. Sin consignatarios, sin revendedores, sin piezas traídas de otro lado y publicadas otra vez. Un granero, un dueño, una colección que se revisa estante por estante.",
    calloutLead: "Estamos vaciando el edificio.",
    callout:
      "El trabajo avanza piso por piso y lo que sale se publica a medida que llegamos a ello. No guardamos nada para venderlo más caro después.",
    p2: "Las piezas se guardaron bajo techo, protegidas del clima. Eso importa. El óxido superficial y el polvo son normales en algo que ha estado guardado tanto tiempo. La corrosión estructural en general no lo es, y cuando una pieza tiene un problema real lo decimos en el anuncio en vez de esconderlo en las fotos.",
    p3: "Los lotes se fotografían tal como los encontramos. No limpiamos las piezas para que luzcan mejor en las fotos. Lo que ves es lo que hay en el estante.",
    tendsTitle: "Lo que suele aparecer",
    tends: [
      "Asientos y molduras interiores",
      "Paneles de carrocería y guardafangos",
      "Ruedas y tapacubos",
      "Vidrios e iluminación",
      "Piezas de motor y transmisión",
      "Lotes mixtos de tornillería y herrajes",
    ],
    tendsNote:
      "Las categorías cambian a medida que avanzamos dentro del edificio. La estructura del granero, incluida la madera recuperable, podría ofrecerse cuando terminemos de vaciarlo.",
    askTitle: "¿Buscas algo en particular?",
    askBody:
      "Todavía hay mucho sin clasificar. Si buscas una pieza en particular, dinos la marca, el modelo y el año, y la buscamos mientras estamos adentro.",
    askCta: "Envíanos tu lista de piezas",
  },
  contact: {
    metaTitle: "Contacto: reserva una inspección o pregunta por un lote",
    metaDescription:
      "Reserva una inspección, envía tu lista de piezas o pregunta por un lote. Respondemos todos los mensajes.",
    title: "Escríbenos",
    lead:
      "Para reservar una inspección, buscar una pieza en particular o preguntar por un lote que te interesa. Todo llega al mismo lugar y leemos cada mensaje.",
    direct: "Contáctanos directamente",
    email: "Correo electrónico",
    callOrText: "Llama o envía un SMS",
    sendText: "Envía un SMS",
    mail: "Correo postal",
    notHere: "Los lotes se inspeccionan con cita en el granero, no en esta dirección.",
    bestTitle: "El mejor motivo para escribir",
    bestBody:
      "Dinos la marca, el modelo y el año del vehículo en el que trabajas. Gran parte del granero sigue sin clasificar y podemos buscar mientras estamos adentro.",
    soonTitle: "¿Pujas por un lote que cierra pronto?",
    soonBody:
      "Dilo en la primera línea. Las preguntas sobre un lote a punto de cerrar se responden antes que todo lo demás, ya que después del cierre la respuesta ya no te sirve.",
  },
  form: {
    name: "Tu nombre",
    email: "Correo electrónico",
    message: "¿Qué estás buscando?",
    placeholder: "Marca, modelo, año y la pieza que buscas.",
    company: "Empresa",
    send: "Enviar mensaje",
    sending: "Enviando...",
    sentTitle: "Mensaje enviado",
    sentBody:
      "Te responderemos pronto. Si es urgente y no recibes respuesta, envíalo otra vez en lugar de suponer que llegó.",
    checkFields: "Revisa los campos marcados e inténtalo de nuevo.",
    offline: "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
  },
};

export const DICT: Record<Lang, Dict> = { en, es };
