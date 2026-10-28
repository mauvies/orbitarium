import type { Metadata } from "next";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { es } from "@/content/es";
import { orbits } from "@/orbits";
import { OrbitGrid } from "./orbit-grid";

export const metadata: Metadata = {
  title: es.threeBody.title,
  description: es.threeBody.description,
};

export default function GalleryPage() {
  return (
    <Container className="pb-16">
      <PageHeader title={es.threeBody.title} lead={es.threeBody.lead} />
      <div className="mt-8">
        <OrbitGrid orbits={orbits} />
      </div>
    </Container>
  );
}
