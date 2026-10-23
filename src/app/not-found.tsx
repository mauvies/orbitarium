import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { es } from "@/content/es";

export const metadata: Metadata = { title: es.notFound.title };

const links = [
  { href: "/", label: es.notFound.homeLink },
  { href: "/gallery", label: es.notFound.galleryLink },
] as const;

// Spec 03, Decisions 1 and 2: Next.js's default 404 page is in English.
export default function NotFound() {
  return (
    <Container className="pb-16">
      <PageHeader title={es.notFound.title} lead={es.notFound.message} />
      <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
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
    </Container>
  );
}
