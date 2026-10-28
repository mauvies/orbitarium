"use client";

import type { ReactNode } from "react";
import { CardLink } from "@/components/card";
import type { OrbitSlug } from "@/orbits";
import { useGallerySession } from "./gallery-session";

interface Props {
  slug: OrbitSlug;
  children: ReactNode;
}

export function OrbitCardLink({ slug, children }: Props) {
  const { rememberOrbitOpenedFromCard } = useGallerySession();

  return (
    <CardLink
      href={`/three-body/${slug}`}
      onNavigate={() => rememberOrbitOpenedFromCard(slug)}
    >
      {children}
    </CardLink>
  );
}
