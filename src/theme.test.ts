import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Spec 03, Decision 3 and G11: colours are defined once, as theme tokens, and
// Tailwind's default palette is removed there, so named classes such as
// `bg-zinc-50` produce nothing. What is left to catch is a colour written as a
// literal, in a class (`bg-[#383838]`), a style or an SVG attribute.
const THEME_FILE = join("app", "globals.css");
const STYLED_SOURCE = /\.(?:css|ts|tsx)$/;
const COLOUR_LITERAL =
  /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/i;

function styledSources(): string[] {
  return readdirSync(import.meta.dirname, { recursive: true, encoding: "utf8" })
    .filter((path) => STYLED_SOURCE.test(path))
    .filter((path) => path !== THEME_FILE && !path.endsWith(".test.ts"))
    .sort();
}

function linesWithColourLiterals(path: string): string[] {
  return readFileSync(join(import.meta.dirname, path), "utf8")
    .split("\n")
    .flatMap((line, index) =>
      COLOUR_LITERAL.test(line) ? [`${index + 1}: ${line.trim()}`] : [],
    );
}

describe("colours come only from the theme tokens", () => {
  it.each(styledSources())("has no colour literal in src/%s", (path) => {
    expect(linesWithColourLiterals(path)).toEqual([]);
  });
});
