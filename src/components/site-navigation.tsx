"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { es } from "@/content/es";

const sections = [
  { href: "/gravitation", label: es.site.navigation.gravitation },
  { href: "/three-body", label: es.site.navigation.threeBody },
] as const;

/** A section is current on its own page and on every page below it. */
function isCurrentSection(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label={es.site.navigation.label}>
      {/* The links' padding enlarges their targets; the margin keeps the text aligned. */}
      <ul className="-mr-3 flex gap-1">
        {sections.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={
                isCurrentSection(pathname, href) ? "page" : undefined
              }
              className="inline-block px-3 py-2 decoration-2 decoration-accent underline-offset-6 hover:text-strong aria-[current=page]:text-strong aria-[current=page]:underline"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
