"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { es } from "@/content/es";
import type { OrbitSlug } from "@/orbits";
import { useGallerySession } from "../gallery-session";

interface Props {
  slug: OrbitSlug;
}

export function BackLink({ slug }: Props) {
  const router = useRouter();
  const { orbitOpenedFromCard } = useGallerySession();

  const handleNavigate = (event: { preventDefault: () => void }) => {
    if (orbitOpenedFromCard !== slug) {
      return;
    }

    event.preventDefault();
    router.back();
  };

  return (
    <Link
      href="/three-body"
      onNavigate={handleNavigate}
      className="group/back inline-flex items-center gap-2 text-accent"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="size-5 shrink-0 motion-safe:transition-transform group-hover/back:-translate-x-0.5"
      >
        <path
          d="M17 10H3M9 4l-6 6 6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="underline underline-offset-4">{es.detail.backLink}</span>
    </Link>
  );
}
