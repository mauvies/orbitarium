import Link from "next/link";
import { es } from "@/content/es";

const sections = [
  { href: "/learn", ...es.home.lesson },
  { href: "/gallery", ...es.home.gallery },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
      <h1 className="font-heading text-4xl font-semibold text-strong sm:text-5xl">
        {es.home.title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg">{es.home.lead}</p>
      <ul className="mt-12 grid gap-6 sm:grid-cols-2">
        {sections.map(({ href, link, description }) => (
          <li
            key={href}
            className="relative rounded-2xl bg-surface p-6 ring-1 ring-muted/30 focus-within:ring-accent hover:ring-accent motion-safe:transition-shadow"
          >
            <h2 className="font-heading text-xl font-medium text-strong">
              {/* The link covers the whole card, but its name is only its text. */}
              <Link
                href={href}
                className="after:absolute after:inset-0 after:rounded-2xl"
              >
                {link}
              </Link>
            </h2>
            <p className="mt-2">{description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
