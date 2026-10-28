"use client";

import { useEffect, useRef } from "react";
import { useHydrated } from "@/components/use-hydrated";
import { es } from "@/content/es";
import { useTutorPanel } from "./lesson-provider";
import { TUTOR_PANEL_ID } from "./tutor-ids";

const { tutor } = es.gravitation;

const CLOSED = "bottom-4 right-4";
const OPEN = "bottom-[calc(min(55dvh,32rem)+1rem)] right-4 xl:bottom-4";

export function TutorToggle() {
  const { open, setOpen } = useTutorPanel();
  const hydrated = useHydrated();
  const button = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);

  // Closing returns focus here, however the panel was closed.
  useEffect(() => {
    if (wasOpen.current && !open) {
      button.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  return (
    <button
      ref={button}
      type="button"
      aria-expanded={open}
      aria-controls={TUTOR_PANEL_ID}
      disabled={!hydrated}
      onClick={() => setOpen(!open)}
      className={`fixed z-40 rounded-full border border-muted bg-accent px-4 py-2 font-semibold text-bg-bottom disabled:opacity-50 ${open ? OPEN : CLOSED}`}
    >
      {tutor.toggle}
    </button>
  );
}
