import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { es } from "@/content/es";

export const metadata: Metadata = { title: es.learn.title };

// A placeholder until the Part A spec replaces it (spec 03, Decision 1).
export default function LearnPage() {
  return (
    <Container className="pb-16">
      <PageHeader title={es.learn.title} lead={es.learn.comingSoon} />
      <p className="mt-8">
        <Link
          href="/gallery"
          className="text-accent underline underline-offset-4"
        >
          {es.learn.galleryLink}
        </Link>
      </p>
    </Container>
  );
}
