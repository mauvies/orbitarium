import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { es } from "@/content/es";
import { parseStep, STEP_IDS, type StepId } from "../steps";
import { StepList, StepPager } from "./step-navigation";

// Spec 04, Decision 1: one page per step, built ahead of time; any other step
// is a 404.
export const dynamicParams = false;

export function generateStaticParams(): { step: string }[] {
  return STEP_IDS.map((step) => ({ step }));
}

export async function generateMetadata({
  params,
}: PageProps<"/gravitation/[step]">): Promise<Metadata> {
  return { title: es.gravitation.steps[stepFor((await params).step)].title };
}

export default async function StepPage({
  params,
}: PageProps<"/gravitation/[step]">) {
  const step = stepFor((await params).step);
  return (
    <Container className="pb-16">
      <StepList current={step} />
      <PageHeader title={es.gravitation.steps[step].title} />
      <StepPager current={step} />
    </Container>
  );
}

function stepFor(value: string): StepId {
  return parseStep(value) ?? notFound();
}
