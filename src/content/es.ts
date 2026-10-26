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

// Spec 04, "Physics accuracy review (L19)", sentence 7: Newton's Moon test,
// in the correct option's feedback.
const MOON_TEST =
  "El doble de lejos, 2 × 2 = 4 veces más débil. La Luna, 60 veces más lejos, recibe 3600 veces menos: en un segundo se desvía hacia la Tierra 1,4 mm, frente a los 4,9 m que cae la manzana.";
// "3600", "28.000": Spanish groups thousands only from five digits.
const wholeNumber = new Intl.NumberFormat("es");

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
    // The link to the cannon band is part of the lead (spec 04, Decision 1).
    lead: {
      before:
        "La fuerza que hace caer una manzana es la misma que mantiene a la Luna en su órbita. Aquí verás cómo llegó Newton a esa idea y a la ley que la describe, o ",
      link: "ve directo al cañón",
      after: ".",
    },
    animation: {
      pause: "Pausar",
      resume: "Reanudar",
    },
    // Spec 04, Decision 4: the cannon's band.
    cannon: {
      controlsLabel: "Controles del cañón",
      caption:
        "El cañón dispara desde una montaña de 10 km, algo más alta que el Everest, y aquí no hay aire que frene la bala.",
      speed: "Velocidad",
      speedField: "Velocidad en km/s",
      speedUnit: "km/s",
      // Spec 04, Decision 16: the slider's value text, with units.
      speedValue: (kmPerSecond: number, kmPerHour: number) =>
        `${twoDecimals.format(kmPerSecond)} km/s, ${wholeNumber.format(Math.round(kmPerHour))} km/h`,
      angle: "Ángulo",
      angleValue: (degrees: number) => `${wholeNumber.format(degrees)}°`,
      launch: "Disparar",
      // Spec 04, Decision 16: the canvas's text alternative.
      canvasLabel: {
        idle: "La Tierra y el cañón en lo alto de la montaña, todavía sin disparar.",
        launched: (kmPerSecond: number, degrees: number) =>
          `La Tierra y la trayectoria del último disparo: ${twoDecimals.format(kmPerSecond)} km/s a ${wholeNumber.format(degrees)}°.`,
      },
    },
    // Spec 04, Decision 4: an illustration, an intro of one or two lines,
    // then the question.
    steps: {
      falling: {
        title: "La manzana cae",
        intro:
          "Cuenta Newton que la idea se le ocurrió al ver caer una manzana: ¿por qué cae siempre hacia el suelo, y nunca de lado? Fíjate en dos manzanas que caen lejos una de otra: una en Madrid y otra en Bali.",
        illustration: {
          label:
            "La Tierra con dos manzanos muy separados, uno en Madrid y otro en Bali. Cae la manzana de Madrid, luego la de Bali, y al final una línea une cada una con el centro de la Tierra: las dos caídas apuntan allí.",
          madrid: "Madrid",
          bali: "Bali",
        },
      },
      mutual: {
        title: "La atracción es mutua",
        intro:
          "Newton dio un paso más: todo lo que tiene masa atrae a todo lo demás. La Tierra atrae a la manzana, y la manzana también atrae a la Tierra.",
        illustration: {
          label:
            "Una manzana sobre la Tierra, con dos flechas del mismo tamaño: una sobre la manzana, hacia la Tierra, y otra sobre la Tierra, hacia la manzana. Solo la manzana se mueve.",
          caption:
            "Dos fuerzas iguales: para una manzana de 100 g, de alrededor de 1 newton cada una.",
        },
      },
      moon: {
        title: "¿Llega hasta la Luna?",
        intro:
          "Si todo lo que tiene masa se atrae, la Tierra también atrae a la Luna. Pero la Luna está unas 60 veces más lejos del centro de la Tierra que la manzana.",
        illustration: {
          label:
            "La Tierra y la Luna, dibujadas a escala entre sí. La línea que las une está cortada: en realidad las separan unos 60 radios terrestres.",
          caption:
            "La Tierra y la Luna, a escala entre sí. La distancia está acortada: en realidad es de unos 60 radios terrestres.",
          earth: "Tierra",
          moon: "Luna",
          distance: "60 radios terrestres",
        },
      },
      orbit: {
        title: "¿Por qué no cae la Luna?",
        intro:
          "Entonces, si la Tierra atrae a la Luna, ¿por qué no se cae? Newton lo pensó con un cañón en lo alto de una montaña.",
      },
      cannon: {
        title: "El cañón de Newton",
        intro:
          "Elige la velocidad y el ángulo, y dispara. ¿A qué velocidad deja de caer la bala?",
      },
      law: {
        title: "La ley completa",
        intro:
          "Todo junto: la fuerza crece con cada masa y se debilita con el cuadrado de la distancia entre sus centros.",
      },
    },
    navigation: {
      label: "Pasos de la lección",
      // Spec 04, Decision 3: a visible mark and an accessible text.
      answeredMark: "✓",
      answered: "(respondido)",
      // Visual only: the list is ordered, so screen readers announce it.
      number: (position: number) => `${position}. `,
      previous: (title: string) => `Anterior: ${title}`,
      next: (title: string) => `Siguiente: ${title}`,
    },
    question: {
      answer: "Responder",
      correct: "Correcto.",
      wrong: "No exactamente.",
      correctAnswer: (label: string) => `La correcta: ${label}`,
      // Spec 04, Decision 5: the first answer stays recorded; the options
      // can be seen again to read the other explanations.
      showOptions: "Ver opciones",
      yourAnswer: "Tu respuesta",
      continue: "Continuar",
    },
    // Spec 04, Decisions 5 and 18: the design note's questions. Each wrong
    // option's feedback answers the belief it reveals.
    questions: {
      "two-falls": {
        prompt: "¿Qué tienen en común estas dos caídas?",
        options: {
          centre: {
            label: "Las dos van hacia el centro de la Tierra.",
            feedback:
              "En una Tierra redonda, «abajo» significa «hacia el centro de la Tierra»: todo lo que cae, cae hacia el centro.",
          },
          "screen-bottom": {
            label: "Las dos van hacia la parte de abajo de la pantalla.",
            feedback:
              "Fíjate en las líneas: las dos caídas no son paralelas, se cruzan en el centro de la Tierra. «Abajo» no es una dirección fija: es hacia el centro.",
          },
          "south-pole": {
            label: "Las dos van hacia el polo sur.",
            feedback:
              "Ninguna va hacia el polo sur. «Abajo» no es una dirección fija del planeta: cada manzana cae hacia el centro de la Tierra.",
          },
          "different-directions": {
            label: "Nada: caen en direcciones distintas.",
            feedback:
              "Sus direcciones son distintas, pero apuntan al mismo sitio: el centro de la Tierra. Esa es la causa común.",
          },
        },
      },
      "who-pulls-harder": {
        prompt: "¿Quién tira más fuerte, la manzana o la Tierra?",
        options: {
          earth: {
            label: "La Tierra.",
            feedback:
              "Parece lógico, pero no: la manzana atrae a la Tierra con la misma fuerza con que la Tierra atrae a la manzana.",
          },
          apple: {
            label: "La manzana.",
            feedback:
              "La manzana se mueve mucho más, pero no porque sufra más fuerza: las dos fuerzas son iguales, y la manzana tiene muchísima menos masa.",
          },
          "only-earth": {
            label: "Solo tira la Tierra; la manzana no tira.",
            feedback:
              "La atracción siempre es mutua: la manzana también atrae a la Tierra, y con la misma fuerza.",
          },
          equal: {
            label: "Tiran exactamente igual de fuerte.",
            feedback:
              "Las dos fuerzas son iguales. Esa fuerza acelera a la manzana 9,8 m/s² y a la Tierra unos 1,6 × 10⁻²⁵ m/s², porque la Tierra tiene muchísima más masa.",
          },
        },
      },
      "twice-as-far": {
        prompt: "Si la Luna estuviera el doble de lejos, la atracción sería…",
        options: {
          half: {
            label: "La mitad.",
            feedback:
              "Menos aún: la atracción baja con el cuadrado de la distancia. El doble de lejos, 4 veces más débil; la Luna, 60 veces más lejos, recibe 3600 veces menos.",
          },
          quarter: {
            label: "La cuarta parte.",
            feedback: MOON_TEST,
          },
          same: {
            label: "La misma.",
            feedback:
              "La distancia sí importa: la atracción baja con su cuadrado. El doble de lejos, 4 veces más débil; la Luna, 60 veces más lejos, recibe 3600 veces menos.",
          },
          double: {
            label: "El doble.",
            feedback:
              "Al contrario: cuanto más lejos, más débil. El doble de lejos, 4 veces más débil; la Luna, 60 veces más lejos, recibe 3600 veces menos.",
          },
        },
      },
      "why-the-moon-does-not-fall": {
        prompt: "¿Por qué no cae la Luna sobre la Tierra?",
        options: {
          "no-gravity": {
            label: "Porque en el espacio no hay gravedad.",
            feedback:
              "Sí la hay: a la altura de la Estación Espacial, la gravedad es casi el 90 % de la de la superficie. Los astronautas flotan porque caen a la vez que la estación.",
          },
          "falls-sideways": {
            label:
              "Sí cae, pero se mueve de lado tan deprisa que nunca llega al suelo.",
            feedback:
              "La Luna cae hacia la Tierra, pero se mueve de lado tan deprisa, alrededor de 1 km/s, que nunca llega al suelo.",
          },
          pushed: {
            label: "Porque la Tierra la empuja hacia fuera.",
            feedback:
              "La Tierra no empuja a la Luna: solo la atrae. No hace falta ninguna fuerza hacia fuera; basta con que se mueva de lado.",
          },
          "does-not-reach": {
            label: "Porque a esa distancia la gravedad ya no llega.",
            feedback:
              "Sí llega: más arriba viste que allí la atracción es unas 3600 veces más débil, pero no desaparece. Esa atracción es la que curva su camino.",
          },
        },
      },
      "twice-the-mass": {
        prompt:
          "Si la manzana tuviera el doble de masa, la fuerza entre ella y la Tierra sería…",
        options: {
          double: {
            label: "El doble.",
            feedback:
              "La fuerza se duplica, pero también la masa que hay que mover, así que la manzana cae igual de deprisa.",
          },
          quadruple: {
            label: "Cuatro veces mayor.",
            feedback:
              "Solo la distancia va al cuadrado. Cada masa cuenta una vez: el doble de masa, el doble de fuerza.",
          },
          same: {
            label: "La misma.",
            feedback:
              "Es verdad que caería igual de deprisa, pero porque la fuerza se duplica a la vez que la masa que hay que mover. La fuerza es el doble.",
          },
        },
      },
    },
    // Spec 04, Decision 4 and L14: distances from the Earth's centre.
    distance: {
      label: "Distancia al centro de la Tierra",
      valueText: (radii: number, denominator: number) =>
        radii === 1
          ? "En la superficie: toda la atracción."
          : `A ${radii} veces la distancia al centro de la Tierra: 1/${wholeNumber.format(denominator)} de la atracción en la superficie.`,
    },
    // Spec 04, Decision 4: each symbol names what it is and the step where the
    // learner saw it; the operators are read as words.
    law: {
      formula: {
        force: "F",
        constant: "G",
        mass: "m",
        first: "1",
        second: "2",
        distance: "r",
        squared: "2",
        equals: "=",
        times: "·",
      },
      spokenFormula:
        "La fuerza es igual a G por la masa de la manzana por la masa de la Tierra, dividido entre el cuadrado de la distancia entre sus centros.",
      constant:
        "G es la constante de gravitación universal, la misma en la Tierra y en el cielo.",
      constantValue: "Su valor es de unos 6,67 × 10⁻¹¹ N·m²/kg².",
    },
  },
} as const;
