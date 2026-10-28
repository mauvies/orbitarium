import { Card } from "@/components/card";
import { OrbitThumbnail } from "@/components/orbit-thumbnail";
import { es } from "@/content/es";
import type { OrbitPreset } from "@/orbits";
import { OrbitCardLink } from "./orbit-card-link";
import { StabilityStatus } from "./stability-status";

interface Props {
  orbit: OrbitPreset;
}

export function OrbitCard({ orbit }: Props) {
  return (
    <Card>
      <OrbitThumbnail orbit={orbit} />
      <div className="px-1 pt-4 pb-1">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-card font-medium text-strong">
            <OrbitCardLink slug={orbit.slug}>
              {es.orbits[orbit.slug].name}
            </OrbitCardLink>
          </h2>
          <p className="shrink-0 text-small text-muted">
            {es.threeBody.period(orbit.period)}
          </p>
        </div>
        <div className="mt-2">
          <StabilityStatus holds={orbit.holdsWithoutCorrection} />
        </div>
      </div>
    </Card>
  );
}
