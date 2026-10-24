export type ThemeColors = {
  /** The path and the trail. */
  readonly accent: string;
  /** The bodies. */
  readonly strong: string;
};

/** The canvas's colours, read from the theme tokens (spec 03, Decision 3). */
export function readThemeColors(element: Element): ThemeColors {
  const style = getComputedStyle(element);
  return {
    accent: readToken(style, "--color-accent"),
    strong: readToken(style, "--color-strong"),
  };
}

function readToken(style: CSSStyleDeclaration, name: string): string {
  const value = style.getPropertyValue(name).trim();
  if (value === "") {
    throw new Error(`the theme token ${name} is not defined`);
  }
  return value;
}
