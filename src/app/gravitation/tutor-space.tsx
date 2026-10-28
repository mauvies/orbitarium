"use client";

import type { ReactNode } from "react";
import { useTutorPanel } from "./lesson-provider";

// Spec 04, Decision 15. Closed, the page keeps room under its end for the
// toggle. Open, room for the panel and the toggle too, so the end of the page
// scrolls above them: the sheet below 1,280 px, the floating card from
// there. Only the page's end grows; nothing above the reader moves.
const CLOSED = "pb-20";
const OPEN =
  "pb-[calc(min(40svh,24rem)_+_5rem)] xl:pb-[calc(min(28rem,calc(100svh_-_14rem))_+_5.5rem)]";

/** The page, with room for the tutor's toggle and, when open, its panel. */
export function TutorSpace({ children }: { children: ReactNode }) {
  const { open } = useTutorPanel();
  return <div className={open ? OPEN : CLOSED}>{children}</div>;
}
