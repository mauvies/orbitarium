import { es } from "@/content/es";
import type { NoticeKind } from "./notice-kind";

const { tutor } = es.gravitation;

interface Props {
  kind: NoticeKind;
  onRetry: (() => void) | undefined;
}

/**
 * Why the tutor is not answering, in the learner's language (spec 05,
 * Decisions 10 and 12). The text is announced by the conversation's hidden
 * region, not by this one, so it is read once and focus stays where it was.
 * «Reintentar» is offered only when trying again can help.
 */
export function TutorNotice({ kind, onRetry }: Props) {
  return (
    <div className="mt-2 flex flex-wrap items-baseline gap-x-3 text-small">
      <p className="text-muted">{noticeText(kind)}</p>
      {onRetry !== undefined && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-8 rounded-[10px] px-2 text-strong underline"
        >
          {tutor.retry}
        </button>
      )}
    </div>
  );
}

export function announcedNotice(kind: NoticeKind): string | null {
  return kind === "checking" ? null : noticeText(kind);
}

function noticeText(kind: NoticeKind): string {
  switch (kind) {
    case "checking":
      return tutor.checking;
    case "not-set":
      return tutor.notSet;
    default:
      return tutor.errors[kind];
  }
}
