import { CannonThumbnail } from "@/app/(home)/cannon-thumbnail";
import { es } from "@/content/es";
import { StepIntro, StepQuestions } from "./step-layout";

const { intro } = es.gravitation.steps.orbit;

/** Newton's own drawing: shots that fall back ever farther, and one that circles. */
export function OrbitPicture() {
  return (
    <figure className="mx-auto w-full max-w-md">
      <CannonThumbnail className="w-full" />
    </figure>
  );
}

export function OrbitText() {
  return (
    <>
      <StepIntro>{intro}</StepIntro>
      <StepQuestions step="orbit" />
    </>
  );
}
