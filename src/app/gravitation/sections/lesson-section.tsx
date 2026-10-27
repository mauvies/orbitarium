import type { ReactNode } from "react";
import { SECTION_SCROLL_MARGIN_PX, type SectionId } from "../section-ids";

/**
 * One part of the lesson. Narrow screens read its title, its description, its
 * picture and its question, in that order, which is also the tab order. From
 * 1,024 px the text (title, description and question) fills one column and
 * the picture the other, centred beside it; `textFirst` puts the text on the
 * left. The empty first and last rows centre the text against the picture.
 */
export function LessonSection({
  id,
  title,
  intro,
  picture,
  questions,
  textFirst = false,
}: {
  id: SectionId;
  title: string;
  intro: ReactNode;
  picture: ReactNode;
  questions: ReactNode;
  textFirst?: boolean;
}) {
  const text = textFirst ? "lg:col-start-1" : "lg:col-start-2";
  const side = textFirst ? "lg:col-start-2" : "lg:col-start-1";
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      // The same margin the part at the top is measured against (Decision 14).
      style={{ scrollMarginTop: SECTION_SCROLL_MARGIN_PX }}
      className="py-12 lg:py-16"
    >
      <div className="grid lg:grid-cols-2 lg:grid-rows-[1fr_auto_auto_auto_1fr] lg:gap-x-16">
        {/* Focusable, so the tutor's navigation can move focus to it (spec 04, Decision 14). */}
        <h2
          id={`${id}-title`}
          tabIndex={-1}
          className={`font-heading font-semibold text-section text-strong lg:row-start-2 ${text}`}
        >
          {title}
        </h2>
        <div className={`lg:row-start-3 ${text}`}>{intro}</div>
        <div
          className={`my-8 lg:row-span-5 lg:row-start-1 lg:my-0 lg:self-center ${side}`}
        >
          {picture}
        </div>
        <div className={`lg:row-start-4 ${text}`}>{questions}</div>
      </div>
    </section>
  );
}
