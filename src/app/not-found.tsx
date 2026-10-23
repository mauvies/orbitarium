import type { Metadata } from "next";
import Link from "next/link";
import { es } from "@/content/es";

export const metadata: Metadata = { title: es.notFound.title };

const links = [
  { href: "/", label: es.notFound.homeLink },
  { href: "/gallery", label: es.notFound.galleryLink },
] as const;

// Spec 03, Decisions 1 and 2: Next.js's default 404 page is in English.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <h1 className="font-heading text-4xl font-semibold text-strong">
        {es.notFound.title}
      </h1>
      <p className="mt-4 text-lg">{es.notFound.message}</p>
      <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="text-accent underline underline-offset-4"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
