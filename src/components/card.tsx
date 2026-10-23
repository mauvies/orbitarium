import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A card linked through its title (docs/design/visual-style.md, "Orbit
 * card"). Hovering or focusing it raises the background and tints the border;
 * no lift, no shadow.
 */
export function Card({ children }: { children: ReactNode }) {
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-surface p-3 focus-within:border-accent/40 focus-within:bg-surface-raised hover:border-accent/40 hover:bg-surface-raised motion-safe:transition-colors">
      {children}
    </article>
  );
}

/** The card's link: it covers the whole card, but its name is only its text. */
export function CardLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="after:absolute after:inset-0 after:rounded-2xl"
    >
      {children}
    </Link>
  );
}
