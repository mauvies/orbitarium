"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import type { OrbitSlug } from "@/orbits";
import {
  DEFAULT_DETAIL_PREFERENCES,
  type DetailPreferences,
} from "./[slug]/detail-preferences";

type GallerySession = {
  readonly detailPreferences: DetailPreferences;
  readonly orbitOpenedFromCard: OrbitSlug | null;
  readonly changeDetailPreferences: (preferences: DetailPreferences) => void;
  readonly rememberOrbitOpenedFromCard: (slug: OrbitSlug) => void;
};

const GallerySessionContext = createContext<GallerySession | null>(null);

interface Props {
  children: ReactNode;
}

export function GallerySessionProvider({ children }: Props) {
  const [detailPreferences, changeDetailPreferences] = useState(
    DEFAULT_DETAIL_PREFERENCES,
  );

  const [orbitOpenedFromCard, rememberOrbitOpenedFromCard] =
    useState<OrbitSlug | null>(null);

  return (
    <GallerySessionContext
      value={{
        detailPreferences,
        orbitOpenedFromCard,
        changeDetailPreferences,
        rememberOrbitOpenedFromCard,
      }}
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
