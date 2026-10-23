import type { Metadata } from "next";
import Link from "next/link";
import { es } from "@/content/es";

export const metadata: Metadata = { title: es.learn.title };

// A placeholder until the Part A spec replaces it (spec 03, Decision 1).
export default function LearnPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <h1 className="font-heading text-4xl font-semibold text-strong">
        {es.learn.title}
      </h1>
      <p className="mt-4 text-lg">{es.learn.comingSoon}</p>
      <p className="mt-6">
        <Link
          href="/gallery"
          className="text-accent underline underline-offset-4"
        >
          {es.learn.galleryLink}
        </Link>
      </p>
    </div>
  );
}
