import { LessonProvider } from "./lesson-provider";

// The lesson's session lives around the page, so it resets on reload
// (spec 04, Decision 2).
export default function GravitationLayout({
  children,
}: LayoutProps<"/gravitation">) {
  return <LessonProvider>{children}</LessonProvider>;
}
