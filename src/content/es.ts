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
  },
} as const;
