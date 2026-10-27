import { CannonThumbnail } from "@/app/(home)/cannon-thumbnail";
import { es } from "@/content/es";
import { StepIntro } from "./step-layout";

const { intro } = es.gravitation.sections.orbit;

/** Newton's own drawing: shots that fall back ever farther, and one that circles. */
export function OrbitPicture() {
  return (
    <figure className="mx-auto w-full max-w-md">
      <CannonThumbnail className="w-full" />
    </figure>
  );
}

export function OrbitIntro() {
  return <StepIntro>{intro}</StepIntro>;
}
