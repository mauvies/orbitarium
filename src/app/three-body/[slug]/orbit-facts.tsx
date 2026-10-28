import { es } from "@/content/es";
import type { OrbitPreset } from "@/orbits";
import { StabilityStatus } from "../stability-status";

interface Props {
  orbit: OrbitPreset;
}

export function OrbitFacts({ orbit }: Props) {
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
    <dl className="divide-y divide-line">
      {facts.map(({ term, value }) => (
        <div key={term} className="py-4 first:pt-0">
          <dt className="font-heading font-medium text-strong">{term}</dt>
          <dd className="mt-1 text-small">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
