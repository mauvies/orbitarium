"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import {
  DEFAULT_DETAIL_PREFERENCES,
  type DetailPreferences,
} from "./[slug]/detail-preferences";

/**
 * What the gallery section remembers while the reader moves between its
 * pages. It lives in the gallery layout, so it resets on reload (spec 03,
 * Decision 10).
 */
type GallerySession = {
  readonly detailPreferences: DetailPreferences;
  readonly changeDetailPreferences: (preferences: DetailPreferences) => void;
};

const GallerySessionContext = createContext<GallerySession | null>(null);

interface Props {
  children: ReactNode;
}

export function GallerySessionProvider({ children }: Props) {
  const [detailPreferences, changeDetailPreferences] = useState(
    DEFAULT_DETAIL_PREFERENCES,
  );

  return (
    <GallerySessionContext
      value={{ detailPreferences, changeDetailPreferences }}
    >
      {children}
    </GallerySessionContext>
  );
}

export function useGallerySession(): GallerySession {
  const session = useContext(GallerySessionContext);

  if (session === null) {
    throw new Error(
      "useGallerySession must be used inside GallerySessionProvider",
    );
  }

  return session;
}
