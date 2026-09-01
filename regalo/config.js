/* ============================================================
   REGALA Y GANA — Configuración central del distribuidor
   ------------------------------------------------------------
   Para usar esta función con OTRO distribuidor, solo se edita
   este archivo y las fotografías en /regalo/img/.
   Si existe el documento settings/giftProgram en Firestore,
   sus valores tienen prioridad sobre este archivo.
   ============================================================ */

window.GIFT_CONFIG = {

  distributor: {
    id: "letty-dfw",                 // identificador interno (sin espacios)
    name: (window.OFICINA && window.OFICINA.nombre) || "Letty Trillo",
    phone: "19726070347",            // solo dígitos, con código de país
    whatsapp: (window.OFICINA && window.OFICINA.tel) || "19726070347",
    city: "DFW, Texas",
    logo: "../logo-pasaporte.jpeg",
    /* La direccion del sitio se detecta sola: funciona en Vercel,
       en GitHub Pages o en un dominio propio, sin editar nada. */
    /* Direccion publica del sitio. Se usa SIEMPRE esta, aunque la pagina
       se abra desde una direccion temporal de Vercel: asi el enlace que
       comparte el participante nunca apunta a una version protegida. */
    siteUrl: (window.OFICINA && window.OFICINA.dominio) || "https://lettytrillo.com"
  },

  /* Identidad visual del programa (logo Regala y Gana) */
  brand: {
    logo: "logo-regala-y-gana.webp",
    logoPng: "logo-regala-y-gana.png",
    ogImage: "og-regala-y-gana.jpeg"
  },

  campaign: {
    durationDays: 30,                // vigencia del enlace de cada participante
    graceDays: 7                     // días administrativos para validar
  },

  theme: {
    bg: "#0B0B0B",                   // negro violáceo
    ink: "#FAF8F3",                  // texto claro
    navy: "#FAF8F3",
    gold: "#E3C15A",
    goldText: "#F2DC8E",
    card: "#161616",
    hairline: "rgba(212,175,55,.15)"
  },

  texts: {
    programName: "Regala y Gana",
    heroClaim: "{NOMBRE} te ha enviado un obsequio para tu cocina.",
    subClaim: "Sin costo. Sin obligación de compra. Sujeto a disponibilidad y zona de servicio.",
    claimButton: "Reclamar mi obsequio",
    /* Mensaje completo: para WhatsApp y para copiar. Lleva el enlace dentro. */
    shareMessage:
      "Te envié un obsequio para tu cocina.\n\n" +
      "Pensé en ti y quise compartir este regalo contigo.\n\n" +
      "Puedes reclamarlo sin costo y sin obligación de compra aquí:\n\n" +
      "{ENLACE}",
    /* Mismo mensaje SIN el enlace: se usa al compartir con otras apps,
       donde el enlace viaja aparte para que se vea la vista previa. */
    shareText:
      "Te envié un obsequio para tu cocina.\n\n" +
      "Pensé en ti y quise compartir este regalo contigo.\n\n" +
      "Puedes reclamarlo sin costo y sin obligación de compra.",
    afterClaimTitle: "¡Listo! Tu obsequio quedó registrado.",
    afterClaimBody: "Muy pronto te contactaremos para coordinar la entrega según disponibilidad en tu ciudad.",
    termsSummary:
      "Programa válido por 30 días desde la creación del enlace. " +
      "Obsequios sujetos a disponibilidad y zona de servicio. " +
      "Solo cuentan obsequios entregados y ventas confirmadas por el distribuidor. " +
      "Se otorga únicamente la recompensa más alta alcanzada; los premios no son acumulativos. " +
      "Un obsequio por persona y por número telefónico."
  },

  /* Escala de recompensas.
     El participante recibe SOLO la recompensa más alta alcanzada. */
  levels: [
    { level: 1, gifts: 4,  sales: 1, prize: "Tabla de cocina",
      img: "tabla-cocina.webp" },
    { level: 2, gifts: 5,  sales: 1, prize: "Set de 3 tazones",
      img: "tazones-3.webp" },
    { level: 3, gifts: 6,  sales: 1, prize: "Chocolatera",
      img: "chocolatera.webp" },
    { level: 4, gifts: 7,  sales: 2, prize: "Paellera de 10 pulgadas, 5 capas",
      img: "paellera-10.webp" },
    { level: 5, gifts: 8,  sales: 2, prize: "Paellera Party de 14 pulgadas",
      img: "paellera-14.webp" },
    { level: 6, gifts: 9,  sales: 2, prize: "Blender Go",
      img: "blender-go.webp" },
    { level: 7, gifts: 10, sales: 3, prize: "Premio mayor: a elegir",
      img: "premio-mayor.webp",
      choice: [
        { name: "Set de 5 piezas", img: "premio-set-5.webp" },
        { name: "Licuadora",       img: "premio-licuadora.webp" },
        { name: "Extractor",       img: "premio-extractor.webp" }
      ]
    }
  ],

  fallbackPrizeImg: "premio-generico.webp",

  firebase: (window.OFICINA && window.OFICINA.firebase) || {}
};
