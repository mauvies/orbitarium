"use client";

import Link from "next/link";
import { es } from "@/content/es";
import { useGallerySession } from "../gallery-session";

/** Back to the gallery with the filter the reader left it with (spec 03, Decision 8). */
export function BackToGalleryLink() {
  const { gallerySearch } = useGallerySession();
  return (
    <Link
      href={`/three-body${gallerySearch}`}
      className="text-accent underline underline-offset-4"
    >
      {es.detail.backLink}
    </Link>
  );
}
