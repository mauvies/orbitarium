"use client";

import { useEffect, useState } from "react";
import { useHydrated } from "@/components/use-hydrated";
import { es } from "@/content/es";
import { shareLink } from "./share-link";

type Notice = "none" | "copied" | "failed";

const { share } = es.detail;

const NOTICE_MS = 2_000;

export function ShareButton() {
  const [notice, setNotice] = useState<Notice>("none");
  const isHydrated = useHydrated();

  const message = notice === "none" ? "" : share[notice];

  async function handleClick(): Promise<void> {
    try {
      const outcome = await shareLink(navigator, {
        title: document.title,
        url: window.location.href,
      });

      setNotice(outcome === "copied" ? "copied" : "none");
    } catch {
      setNotice("failed");
    }
  }

  useEffect(() => {
    if (notice === "none") {
      return;
    }

    const timer = window.setTimeout(() => setNotice("none"), NOTICE_MS);

    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={!isHydrated}
        className="inline-flex shrink-0 items-center gap-2 rounded-[10px] border border-line bg-surface px-3 py-2 text-small text-strong hover:bg-surface-raised"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          className="size-5"
        >
          <circle cx="15" cy="4.5" r="2.5" />
          <circle cx="5" cy="10" r="2.5" />
          <circle cx="15" cy="15.5" r="2.5" />
          <path d="M7.2 8.8l5.6-3.1M7.2 11.2l5.6 3.1" />
        </svg>
        <span>{message || share.label}</span>
      </button>
      <output className="sr-only">{message}</output>
    </>
  );
}
