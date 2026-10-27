import Link from "next/link";
import { es } from "@/content/es";
import { Container } from "./container";
import { LogoMark } from "./logo-mark";
import { SiteNavigation } from "./site-navigation";

export function SiteHeader() {
  return (
    <header className="h-16 border-b border-line">
      <Container className="flex h-full items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-card font-semibold text-strong"
        >
          <LogoMark className="size-7" />
          {/* On a phone only the logo shows, so both links fit on one line. */}
          <span className="sr-only sm:not-sr-only">{es.site.name}</span>
        </Link>
        <SiteNavigation />
      </Container>
    </header>
  );
}
