import type { OrbitPreset } from "@/orbits";
import { OrbitCard } from "./orbit-card";

export function OrbitGrid({ orbits }: { orbits: readonly OrbitPreset[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {orbits.map((orbit) => (
        <li key={orbit.slug}>
          <OrbitCard orbit={orbit} />
        </li>
      ))}
    </ul>
  );
}
