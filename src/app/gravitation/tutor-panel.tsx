"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { es } from "@/content/es";
import { useTutorPanel } from "./lesson-provider";
import { TUTOR_PANEL_ID, TUTOR_TITLE_ID } from "./tutor-ids";
import { useHydrated } from "./use-hydrated";

const { tutor } = es.gravitation;

/**
 * The tutor's panel, only a shell until spec 05 (spec 04, Decision 15). A
 * non-modal dialog at every width: a floating card over the page from
 * 1,280 px, a bottom sheet below; neither moves the page. Its live region announces the tutor's moves
 * (Decision 14). It is placed in `body`, outside `<main>`: the tutor is not
 * part of the lesson's content, nor of its outline of headings. A portal
 * needs the document, so it mounts once the page hydrates, closed.
 */
export function TutorPanel() {
  const { open, setOpen, announcement } = useTutorPanel();
  const hydrated = useHydrated();
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const panel = dialog.current;
    if (panel === null) {
      return;
    }
    if (open && !panel.open) {
      // `show()`, not `showModal()`: the page must stay usable.
      panel.show();
      close.current?.focus();
    } else if (!open && panel.open) {
      panel.close();
    }
  }, [open]);

  if (!hydrated) {
    return null;
  }
  return createPortal(
    <dialog
      ref={dialog}
      id={TUTOR_PANEL_ID}
      aria-labelledby={TUTOR_TITLE_ID}
      // A non-modal dialog does not close on Escape by itself.
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          setOpen(false);
        }
      }}
      // Below 1,280 px a bottom sheet; from there a floating card at the
      // bottom right, just above the toggle (4.5 rem up), leaving at least
      // 14 rem of page above it. Raised and outlined, without a shadow.
      className="fixed inset-x-0 top-auto bottom-0 z-30 m-0 h-[min(55dvh,32rem)] max-h-none w-full max-w-none border-0 border-muted border-t bg-surface p-4 text-body xl:right-4 xl:bottom-18 xl:left-auto xl:h-[min(28rem,calc(100dvh_-_14rem))] xl:w-96 xl:rounded-xl xl:border xl:border-strong xl:bg-surface-raised"
    >
      <div className="flex items-start justify-between gap-4">
        <h2
          id={TUTOR_TITLE_ID}
          className="font-heading font-semibold text-section text-strong"
        >
          {tutor.title}
        </h2>
        <button
          ref={close}
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-[10px] border border-muted px-3 py-1.5 text-small text-strong hover:bg-surface-raised"
        >
          {tutor.close}
        </button>
      </div>
      <p className="mt-4 max-w-[60ch]">{tutor.placeholder}</p>
      <output className="sr-only">{announcement}</output>
    </dialog>,
    document.body,
  );
}
