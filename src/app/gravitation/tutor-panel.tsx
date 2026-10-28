"use client";

import {
  type KeyboardEvent,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@/components/use-hydrated";
import { es } from "@/content/es";
import { useLessonControls, useTutorPanel } from "./lesson-provider";
import { loadTutorChat } from "./load-tutor-chat";
import { TutorChatLoading } from "./tutor-chat-loading";
import { TUTOR_INPUT_ID, TUTOR_PANEL_ID, TUTOR_TITLE_ID } from "./tutor-ids";

const { tutor } = es.gravitation;

const FLOATING_CARD = "(min-width: 80rem)";

// The conversation brings the AI SDK, most of the lesson's JavaScript, so it
// loads when the panel first opens, not with the page. `React.lazy`, not
// `next/dynamic`: the latter's fallback cannot take `atCannon`.
const TutorChat = lazy(async () => ({
  default: (await loadTutorChat()).TutorChat,
}));

export function TutorPanel() {
  const [hasChatStarted, setHasChatStarted] = useState(false);
  const [headerActions, setHeaderActions] = useState<HTMLElement | null>(null);
  const [isAtCannon, setIsAtCannon] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const chatLoaded = useRef(false);

  const { open, setOpen, announcement } = useTutorPanel();
  const controls = useLessonControls();
  const isHydrated = useHydrated();

  // The first opening focuses the input once the conversation has loaded.
  const handleChatLoad = useCallback(() => {
    chatLoaded.current = true;

    const panel = dialog.current;

    if (panel?.open && matchMedia(FLOATING_CARD).matches) {
      inputOf(panel).focus();
    }
  }, []);

  // A non-modal dialog does not close on Escape by itself.
  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  useEffect(() => {
    const panel = dialog.current;

    if (panel === null) {
      return;
    }

    if (open && !panel.open) {
      // `show()`, not `showModal()`: the page must stay usable.
      panel.show();
      setHasChatStarted(true);
      setIsAtCannon(controls.navigation.current() === "cannon");

      // On a phone the input would raise the keyboard over the page, so the
      // sheet focuses its close button.
      if (!matchMedia(FLOATING_CARD).matches) {
        close.current?.focus();
      } else if (chatLoaded.current) {
        inputOf(panel).focus();
      }
    } else if (!open && panel.open) {
      panel.close();
    }
  }, [open, controls]);

  if (!isHydrated) {
    return null;
  }

  return createPortal(
    <dialog
      ref={dialog}
      id={TUTOR_PANEL_ID}
      aria-labelledby={TUTOR_TITLE_ID}
      onKeyDown={handleKeyDown}
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
          {/* «Nueva conversación» needs the conversation, so it is rendered there. */}
          <div ref={setHeaderActions} className="contents" />
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
      {hasChatStarted && (
        <Suspense fallback={<TutorChatLoading atCannon={isAtCannon} />}>
          <TutorChat
            headerActions={headerActions}
            atCannon={isAtCannon}
            onLoad={handleChatLoad}
          />
        </Suspense>
      )}
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
