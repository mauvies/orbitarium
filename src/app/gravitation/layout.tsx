import { LessonProvider } from "./lesson-provider";

// The layout stays mounted while the learner moves between steps, so the
// lesson's session survives that (spec 04, Decision 2).
export default function GravitationLayout({
  children,
}: LayoutProps<"/gravitation">) {
  return <LessonProvider>{children}</LessonProvider>;
}
