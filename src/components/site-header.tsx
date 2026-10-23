import Link from "next/link";
import { es } from "@/content/es";

const sections = [
  { href: "/gallery", label: es.site.navigation.gallery },
  { href: "/learn", label: es.site.navigation.learn },
] as const;

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-5">
      <Link
        href="/"
        className="font-heading text-lg font-semibold text-strong hover:text-accent"
      >
        {es.site.name}
      </Link>
      <nav aria-label={es.site.navigation.label}>
        {/* The links' padding enlarges their targets; the margin keeps the text aligned. */}
        <ul className="-mr-3 flex gap-1">
          {sections.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="inline-block rounded-md px-3 py-2 hover:text-accent"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
