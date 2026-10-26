import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { es } from "@/content/es";

export const metadata: Metadata = { title: es.gravitation.title };

// A placeholder until the Part A spec replaces it (spec 03, Decision 1).
export default function LearnPage() {
  return (
    <Container className="pb-16">
      <PageHeader
        title={es.gravitation.title}
        lead={es.gravitation.comingSoon}
      />
      <p className="mt-8">
        <Link
          href="/three-body"
          className="text-accent underline underline-offset-4"
        >
          {es.gravitation.threeBodyLink}
        </Link>
      </p>
    </Container>
  );
}
