import { referenceSpeeds } from "@/cannon";
import { es } from "@/content/es";
import { ResponsiveText } from "./responsive-text";

const { cannon } = es.gravitation;

const BADGE =
  "rounded-full border border-muted bg-surface px-2 py-px text-body text-xs tabular-nums sm:px-2.5 sm:py-0.5 sm:text-small";

/**
 * The two speeds to aim for, computed from the model for the current height,
 * as badges at the canvas's top right (spec 04, Decision 11). Below 640 px
 * they are smaller and name only the speed's purpose; screen readers always
 * get the full text.
 */
export function ReferenceSpeedBadges({ altitudeKm }: { altitudeKm: number }) {
  const { circularKmPerSecond, escapeKmPerSecond } =
    referenceSpeeds(altitudeKm);
  return (
    <ul className="absolute top-3 right-3 flex max-w-[calc(100%-1.5rem)] flex-wrap justify-end gap-1.5 sm:gap-2">
      <li className={BADGE}>
        <ResponsiveText
          full={cannon.circularReference(circularKmPerSecond)}
          short={cannon.circularReferenceShort(circularKmPerSecond)}
        />
      </li>
      <li className={BADGE}>
        <ResponsiveText
          full={cannon.escapeReference(escapeKmPerSecond)}
          short={cannon.escapeReferenceShort(escapeKmPerSecond)}
        />
      </li>
    </ul>
  );
}
