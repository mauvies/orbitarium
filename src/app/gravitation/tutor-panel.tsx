"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@/components/use-hydrated";
import { es } from "@/content/es";
import { useLessonControls, useTutorPanel } from "./lesson-provider";
import { TutorConversation } from "./tutor-conversation";
import { TUTOR_INPUT_ID, TUTOR_PANEL_ID, TUTOR_TITLE_ID } from "./tutor-ids";
import { useTutorAvailability } from "./use-tutor-availability";
import { useTutorChat } from "./use-tutor-chat";

const { tutor } = es.gravitation;

const FLOATING_CARD = "(min-width: 80rem)";

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
      // sheet focuses its close button .
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
      className="fixed inset-x-0 top-auto bottom-0 z-30 m-0 flex-col overflow-hidden overscroll-contain open:flex h-[min(40svh,24rem)] max-h-none w-full max-w-none border-0 border-muted border-t bg-surface p-4 text-body xl:right-4 xl:bottom-18 xl:left-auto xl:h-[min(28rem,calc(100svh-14rem))] xl:w-96 xl:rounded-xl xl:border xl:border-strong xl:bg-surface-raised"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id={TUTOR_TITLE_ID}
          className="font-heading font-medium text-card text-strong"
        >
          {tutor.title}
        </h2>
        <div className="flex items-center gap-1">
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
