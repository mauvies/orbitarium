import { LessonProvider } from "./lesson-provider";
import { TutorPanel } from "./tutor-panel";
import { TutorSpace } from "./tutor-space";
import { TutorToggle } from "./tutor-toggle";

// The lesson's session lives around the page, so it resets on reload
// (spec 04, Decision 2). The tutor's toggle and panel sit beside the page,
// inside the same provider, so spec 05's tutor can use the lesson's controls.
export default function GravitationLayout({
  children,
}: LayoutProps<"/gravitation">) {
  return (
    <LessonProvider>
      <TutorSpace>{children}</TutorSpace>
      <TutorToggle />
      <TutorPanel />
    </LessonProvider>
  );
}
