import { type Applied, CANNON_LIMITS, type CannonField } from "@/cannon";
import { es } from "@/content/es";
import type {
  GoToSectionOutput,
  LaunchCannonOutput,
  SetCannonOutput,
} from "@/lib/tutor/tools";

const { sections, cannon, tutor } = es.gravitation;
const lines = tutor.toolLines;

export type ToolResult =
  | { readonly tool: "setCannon"; readonly output: SetCannonOutput }
  | { readonly tool: "launchCannon"; readonly output: LaunchCannonOutput }
  | { readonly tool: "goToSection"; readonly output: GoToSectionOutput };

/**
 * What the tutor did to the page, in one Spanish line built from the tool's
 * result, so the learner sees every action (spec 05, Decision 8).
 */
export function toolLine({ tool, output }: ToolResult): string {
  switch (tool) {
    case "setCannon":
      return output.status === "rejected"
        ? lines.notSet
        : lines.set(settingsText(output), clampedText(output));
    case "launchCannon":
      return output.status === "rejected"
        ? lines.notLaunched
        : lines.launched(
            settingsText(output),
            cannon.outcomes[output.outcome].announced,
            clampedText(output),
          );
    case "goToSection":
      return output.status === "rejected"
        ? lines.notMoved
        : lines.moved(sections[output.section].title);
  }
}

function settingsText({
  speedKmPerSecond,
  angleDegrees,
  altitudeKm,
}: Applied): string {
  return lines.settings(speedKmPerSecond, angleDegrees, altitudeKm);
}

/** Each clamped value, as the limit it was clamped to. */
function clampedText(applied: Applied): string {
  return lines.clamped(
    ...applied.clamped.map((field) => {
      const value = applied[field];
      const text = valueText(field, value);
      return value >= CANNON_LIMITS[field].max
        ? lines.maximum(text)
        : lines.minimum(text);
    }),
  );
}

function valueText(field: CannonField, value: number): string {
  switch (field) {
    case "speedKmPerSecond":
      return lines.speed(value);
    case "angleDegrees":
      return lines.angle(value);
    case "altitudeKm":
      return lines.altitude(value);
  }
}
