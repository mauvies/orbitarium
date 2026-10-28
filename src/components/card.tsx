import Link from "next/link";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
}

/**
 * A card linked through its title (docs/design/visual-style.md, "Orbit
 * card"). Hovering or focusing it raises the background and tints the border;
 * no lift, no shadow.
 */
export function Card({ children }: CardProps) {
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-surface p-3 focus-within:border-accent/40 focus-within:bg-surface-raised hover:border-accent/40 hover:bg-surface-raised motion-safe:transition-colors">
      {children}
    </article>
  );
}

interface CardLinkProps {
  href: string;
  children: ReactNode;
}

/** The card's link: it covers the whole card, but its name is only its text. */
export function CardLink({ href, children }: CardLinkProps) {
  return (
    <Link
      href={href}
      className="after:absolute after:inset-0 after:rounded-2xl"
    >
      {children}
    </Link>
  );
}
