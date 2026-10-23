// Every user-facing string of the app, in Spanish (spec 03, Decision 2).
import type { OrbitSlug } from "@/orbits";

const APP_NAME = "Orbitarium";

type OrbitContent = {
  readonly name: string;
};

// The brief's names, untranslated: they are the names used in the literature
// (spec 03, "Content per orbit").
const orbitContent = {
  lagrange: { name: "Lagrange" },
  "figure-eight": { name: "Figura de ocho" },
  "butterfly-i": { name: "Butterfly I" },
  goggles: { name: "Goggles" },
  "moth-i": { name: "Moth I" },
  "yin-yang-i": { name: "Yin-Yang I" },
} as const satisfies Record<OrbitSlug, OrbitContent>;

// Spanish number formatting: "6,23" (spec 03, Decision 2).
const twoDecimals = new Intl.NumberFormat("es", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const es = {
  site: {
    name: APP_NAME,
    titleTemplate: `%s | ${APP_NAME}`,
    description:
      "Aprende la ley de la gravitación universal de Newton jugando con ella, y explora una galería de órbitas periódicas de tres cuerpos.",
    skipToContent: "Saltar al contenido",
    navigation: {
      label: "Principal",
      gallery: "Galería",
      learn: "Aprende",
    },
  },
  notFound: {
    title: "Página no encontrada",
    message: "La dirección que buscas no existe o ha cambiado.",
    homeLink: "Volver al inicio",
    galleryLink: "Ir a la galería de órbitas",
  },
  home: {
    title: APP_NAME,
    lead: "La gravedad, explicada con simulaciones interactivas.",
    lesson: {
      link: "Aprende la gravitación universal",
      description:
        "Descubre por qué la misma fuerza que hace caer una manzana mantiene a la Luna en órbita, con el cañón de Newton y un tutor que se adapta a ti.",
    },
    gallery: {
      link: "Explora la galería de órbitas",
      description:
        "Seis órbitas periódicas de tres cuerpos, simuladas en tiempo real en tu navegador.",
    },
  },
  gallery: {
    title: "Galería de órbitas",
    metaTitle: "Galería",
    lead: "Seis soluciones periódicas del problema de los tres cuerpos.",
    description:
      "Seis soluciones periódicas del problema de los tres cuerpos. Elige una para verla en movimiento.",
    // Spec 03, Decision 9: what the simulation shows, not a formal result.
    stability: {
      holds: "Se mantiene sola",
      drifts: "Se deshace sin corrección",
    },
    period: (period: number) => `T = ${twoDecimals.format(period)}`,
    // Spec 03, Decision 8.
    filter: {
      legend: "Filtrar por estabilidad",
      all: "Todas",
      holds: "Se mantienen solas",
      drifts: "Se deshacen sin corrección",
      shown: (count: number) =>
        count === 1 ? "Se muestra 1 órbita" : `Se muestran ${count} órbitas`,
    },
  },
  orbits: orbitContent,
  learn: {
    title: "Aprende",
    comingSoon:
      "La lección sobre la ley de la gravitación universal está en preparación.",
    galleryLink: "Mientras tanto, explora la galería de órbitas",
  },
} as const;
