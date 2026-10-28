import Link from "next/link";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
}

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
  onNavigate?: () => void;
}

export function CardLink({ href, children, onNavigate }: CardLinkProps) {
  return (
    <Link
      href={href}
      onNavigate={onNavigate}
      className="after:absolute after:inset-0 after:rounded-2xl"
    >
      {children}
    </Link>
  );
}
