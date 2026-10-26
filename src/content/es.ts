// Every user-facing string of the app, in Spanish (spec 03, Decision 2).
import type { OrbitSlug } from "@/orbits";

const APP_NAME = "Orbitarium";

type OrbitContent = {
  readonly name: string;
  readonly description: string;
  readonly discovery: string;
  readonly source: string;
};

// Šuvakov and Dmitrašinović named their orbits after the curve each one draws
// on the shape sphere, not after the paths of the bodies.
const shapeSphereName = (meaning: string) =>
  `Su nombre, ${meaning}, describe la curva que la órbita traza en la «esfera de formas», que representa la forma del triángulo que forman los tres cuerpos, no las trayectorias que ves aquí.`;
const SUVAKOV_SEARCH =
  "Pertenece a las 13 familias de órbitas periódicas que una búsqueda numérica descubrió en 2013.";
const SUVAKOV_DISCOVERY = "Milovan Šuvakov y Veljko Dmitrašinović, 2013";
const SUVAKOV_SOURCE =
  "Šuvakov y Dmitrašinović, Physical Review Letters 110, 114301 (2013); valores iniciales refinados en este proyecto.";

// The brief's names, untranslated: they are the names used in the literature
// (spec 03, "Content per orbit").
const orbitContent = {
  lagrange: {
    name: "Lagrange",
    description:
      "Tres masas iguales en los vértices de un triángulo equilátero que gira sin deformarse. Es la solución periódica más antigua del problema de los tres cuerpos, pero con masas iguales es inestable: el menor error la deshace en unas pocas vueltas.",
    discovery: "Joseph-Louis Lagrange, 1772",
    source: "Lagrange (1772): solución exacta del triángulo equilátero.",
  },
  "figure-eight": {
    name: "Figura de ocho",
    description:
      "Los tres cuerpos se persiguen por una misma curva en forma de ocho, separados por un tercio de período. Es de las pocas órbitas de tres cuerpos que resisten pequeñas perturbaciones.",
    discovery:
      "Cris Moore la encontró numéricamente en 1993; Alain Chenciner y Richard Montgomery demostraron que existe en 2000",
    source:
      "Chenciner y Montgomery, Annals of Mathematics 152 (2000); valores iniciales refinados en este proyecto.",
  },
  "butterfly-i": {
    name: "Butterfly I",
    description: `${shapeSphereName("«mariposa» en inglés")} ${SUVAKOV_SEARCH}`,
    discovery: SUVAKOV_DISCOVERY,
    source: SUVAKOV_SOURCE,
  },
  goggles: {
    name: "Goggles",
    description: `${shapeSphereName("«gafas» en inglés")} ${SUVAKOV_SEARCH}`,
    discovery: SUVAKOV_DISCOVERY,
    source: SUVAKOV_SOURCE,
  },
  "moth-i": {
    name: "Moth I",
    description: `${shapeSphereName("«polilla» en inglés")} ${SUVAKOV_SEARCH}`,
    discovery: SUVAKOV_DISCOVERY,
    source: SUVAKOV_SOURCE,
  },
  "yin-yang-i": {
    name: "Yin-Yang I",
    description: `${shapeSphereName("por el símbolo del yin y el yang")} ${SUVAKOV_SEARCH}`,
    discovery: SUVAKOV_DISCOVERY,
    source: SUVAKOV_SOURCE,
  },
} as const satisfies Record<OrbitSlug, OrbitContent>;

// Spanish number formatting: "6,23" (spec 03, Decision 2).
const twoDecimals = new Intl.NumberFormat("es", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
// "0,5×", "1×".
const speedFormat = new Intl.NumberFormat("es", { maximumFractionDigits: 1 });

export const es = {
  site: {
    name: APP_NAME,
    titleTemplate: `%s | ${APP_NAME}`,
    description:
      "Aprende la ley de la gravitación universal de Newton jugando con ella, y explora una galería de órbitas periódicas de tres cuerpos.",
    skipToContent: "Saltar al contenido",
    navigation: {
      label: "Principal",
      gravitation: "Gravitación",
      threeBody: "Tres cuerpos",
    },
  },
  notFound: {
    title: "Página no encontrada",
    message: "La dirección que buscas no existe o ha cambiado.",
    homeLink: "Volver al inicio",
    threeBodyLink: "Ir al problema de los tres cuerpos",
  },
  home: {
    title: APP_NAME,
    lead: "La gravedad, explicada con simulaciones interactivas.",
    gravitation: {
      link: "La ley de gravitación universal",
      description:
        "La ley de Newton explica por qué la fuerza que hace caer una manzana mantiene a la Luna en órbita. Compruébalo con el cañón de Newton y un tutor que se adapta a ti.",
    },
    threeBody: {
      link: "El problema de los tres cuerpos",
      description:
        "El movimiento de tres cuerpos que se atraen no se puede resolver con una fórmula general, pero algunas configuraciones se repiten. Mira seis de ellas moverse en tiempo real en tu navegador.",
    },
  },
  threeBody: {
    title: "El problema de los tres cuerpos",
    lead: "Seis soluciones periódicas: configuraciones en las que tres cuerpos se persiguen para siempre.",
    description:
      "Seis soluciones periódicas del problema de los tres cuerpos. Elige una de la galería de soluciones para verla en movimiento.",
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
  detail: {
    backLink: "Volver a la galería de soluciones",
    facts: {
      discovery: "Descubierta por",
      period: "Período",
      stability: "Estabilidad",
      source: "Fuente",
    },
    period: (period: number) =>
      `${twoDecimals.format(period)} unidades de tiempo`,
    player: {
      controls: "Controles de la animación",
      play: "Reproducir",
      pause: "Pausar",
      restart: "Reiniciar",
      speed: "Velocidad",
      speedOption: (speed: number) => `${speedFormat.format(speed)}×`,
      showPath: "Mostrar la trayectoria",
      showTrail: "Mostrar la estela",
      correction: "Corregir la deriva",
      // Spec 03, Decision 12.
      collision:
        "Dos cuerpos han chocado y la simulación se ha detenido. Pulsa «Reiniciar» para empezar de nuevo.",
      // Spec 03, Decision 11: the canvas's text alternative.
      canvasLabel: (name: string) =>
        `Animación de la órbita ${name}: los tres cuerpos recorren su trayectoria, dibujada en trazo tenue, y cada uno deja una estela corta.`,
    },
  },
  gravitation: {
    title: "La ley de gravitación universal",
    comingSoon: "La lección sobre esta ley está en preparación.",
    threeBodyLink: "Mientras tanto, explora el problema de los tres cuerpos",
  },
} as const;
