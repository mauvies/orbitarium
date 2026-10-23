// Every user-facing string of the app, in Spanish (spec 03, Decision 2).

const APP_NAME = "Orbitarium";

export const es = {
  site: {
    name: APP_NAME,
    titleTemplate: `%s · ${APP_NAME}`,
    description:
      "Aprende la ley de la gravitación universal de Newton jugando con ella, y explora una galería de órbitas periódicas de tres cuerpos.",
  },
  home: {
    title: APP_NAME,
    lead: "La gravedad, explicada con simulaciones que puedes tocar.",
    lesson: {
      link: "Aprende la gravitación universal",
      description:
        "Descubre por qué cae una manzana y por qué la Luna no, con un cañón de Newton y un tutor que se adapta a ti.",
    },
    gallery: {
      link: "Explora la galería de órbitas",
      description:
        "Seis soluciones periódicas del problema de los tres cuerpos, animadas paso a paso.",
    },
  },
  learn: {
    title: "Aprende",
    comingSoon:
      "La lección sobre la ley de la gravitación universal está en preparación.",
    galleryLink: "Mientras tanto, explora la galería de órbitas",
  },
} as const;
