import type { CannonRequest } from "@/cannon";
import type {
  GoToSectionOutput,
  LaunchCannonOutput,
  SectionToolInput,
  SetCannonOutput,
} from "@/lib/tutor/tools";
import type { LessonControls } from "./lesson-controls";

// Spec 05, Decision 6: each tool calls its control with the model's input
// unchanged, and the control's result, rejections included, goes back to the
// model. The controls validate, round and clamp (spec 04, Decision 13).

export function runSetCannon(
  controls: LessonControls,
  input: CannonRequest,
): SetCannonOutput {
  return controls.cannon.set(input);
}

export function runLaunchCannon(
  controls: LessonControls,
  input: CannonRequest,
): LaunchCannonOutput {
  return controls.cannon.launch(input);
}

export function runGoToSection(
  controls: LessonControls,
  { section }: SectionToolInput,
): GoToSectionOutput {
  return controls.navigation.goToSection(section);
}
