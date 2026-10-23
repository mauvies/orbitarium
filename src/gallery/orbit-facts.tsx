import { es } from "@/content/es";
import type { OrbitPreset } from "@/orbits";
import { StabilityStatus } from "./stability-status";

/** Who found the orbit, its period, its stability label and its source. */
export function OrbitFacts({ orbit }: { orbit: OrbitPreset }) {
  const content = es.orbits[orbit.slug];
  const facts = [
    { term: es.detail.facts.discovery, value: content.discovery },
    { term: es.detail.facts.period, value: es.detail.period(orbit.period) },
    {
      term: es.detail.facts.stability,
      value: <StabilityStatus holds={orbit.holdsWithoutCorrection} />,
    },
    { term: es.detail.facts.source, value: content.source },
  ];
  return (
    <dl className="grid gap-4">
      {facts.map(({ term, value }) => (
        <div key={term}>
          <dt className="text-small text-muted">{term}</dt>
          <dd className="mt-1">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
