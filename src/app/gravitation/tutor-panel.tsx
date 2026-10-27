"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { es } from "@/content/es";
import { useLessonControls, useTutorPanel } from "./lesson-provider";
import { TutorConversation } from "./tutor-conversation";
import { TUTOR_INPUT_ID, TUTOR_PANEL_ID, TUTOR_TITLE_ID } from "./tutor-ids";
import { useHydrated } from "./use-hydrated";
import { useTutorAvailability } from "./use-tutor-availability";
import { useTutorChat } from "./use-tutor-chat";

const { tutor } = es.gravitation;

// Tailwind's `xl`, where the panel becomes a floating card (spec 04,
// Decision 15).
const FLOATING_CARD = "(min-width: 80rem)";

/**
 * The tutor's panel and its conversation (spec 04, Decision 15; spec 05,
 * Decision 11). A non-modal dialog at every width: a floating card over the
 * page from 1,280 px, a bottom sheet below; neither moves the page. Its live
 * region announces the tutor's moves (spec 04, Decision 14). It is placed in
 * `body`, outside `<main>`: the tutor is not part of the lesson's content,
 * nor of its outline of headings. A portal needs the document, so it mounts
 * once the page hydrates, closed, and stays mounted, so closing it keeps the
 * conversation.
 */
export function TutorPanel() {
  const { open, setOpen, announcement } = useTutorPanel();
  const controls = useLessonControls();
  const chat = useTutorChat(controls);
  const { availability, askOnce, retry } = useTutorAvailability();
  const [atCannon, setAtCannon] = useState(false);
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
      askOnce();
      setAtCannon(controls.navigation.current() === "cannon");
      // On a phone the input would raise the keyboard over the page, so the
      // sheet focuses its close button (spec 05, Decision 11).
      if (matchMedia(FLOATING_CARD).matches) {
        inputOf(panel).focus();
      } else {
        close.current?.focus();
      }
    } else if (!open && panel.open) {
      panel.close();
    }
  }, [open, controls, askOnce]);

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
      className="fixed inset-x-0 top-auto bottom-0 z-30 m-0 flex-col overflow-hidden overscroll-contain open:flex h-[min(55dvh,32rem)] max-h-none w-full max-w-none border-0 border-muted border-t bg-surface p-4 text-body xl:right-4 xl:bottom-18 xl:left-auto xl:h-[min(28rem,calc(100dvh-14rem))] xl:w-96 xl:rounded-xl xl:border xl:border-strong xl:bg-surface-raised"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id={TUTOR_TITLE_ID}
          className="font-heading font-medium text-card text-strong"
        >
          {tutor.title}
        </h2>
        <div className="flex items-center gap-1">
          {/* Only once there is something to clear (spec 05, Decision 11). */}
          {chat.messages.length > 0 && (
            <button
              type="button"
              onClick={async () => {
                await chat.stop();
                chat.setMessages([]);
                chat.clearError();
              }}
              className="min-h-8 rounded-[10px] px-2 text-muted text-small hover:text-strong"
            >
              {tutor.newConversation}
            </button>
          )}
          <button
            ref={close}
            type="button"
            aria-label={tutor.close}
            onClick={() => setOpen(false)}
            className="flex size-8 items-center justify-center rounded-[10px] border border-muted text-strong hover:border-strong"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4">
              <path
                d="M4 4 12 12 M12 4 4 12"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
      <TutorConversation
        chat={chat}
        availability={availability}
        retryAvailability={retry}
        atCannon={atCannon}
      />
      <output className="sr-only">{announcement}</output>
    </dialog>,
    document.body,
  );
}

function inputOf(panel: HTMLDialogElement): HTMLElement {
  const input = panel.querySelector<HTMLElement>(`#${TUTOR_INPUT_ID}`);
  if (input === null) {
    throw new Error("the tutor's panel has no input");
  }
  return input;
}
