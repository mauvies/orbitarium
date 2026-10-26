import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { es } from "@/content/es";
import { questionsFor } from "../questions";
import { parseStep, STEP_IDS, type StepId } from "../steps";
import { CheckQuestion } from "./check-question";
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
      {questionsFor(step)
        // The prediction waits for the cannon, which comes with step 4's page.
        .filter(({ feedback }) => feedback === "on-answer")
        .map((question) => (
          <CheckQuestion key={question.id} question={question} />
        ))}
      <StepPager current={step} />
    </Container>
  );
}

function stepFor(value: string): StepId {
  return parseStep(value) ?? notFound();
}
