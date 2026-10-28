import type { ReactNode } from "react";
import { Card, CardLink } from "@/components/card";
import { CardArrow } from "./card-arrow";

interface Props {
  href: string;
  title: string;
  description: string;
  picture: ReactNode;
}

export function SectionCard({ href, title, description, picture }: Props) {
  return (
    <Card>
      <div className="flex grow flex-col gap-4 sm:flex-row sm:items-start">
        {picture}
        <div className="flex grow flex-col self-stretch px-1 pb-1 sm:py-1 sm:pr-1 sm:pl-0">
          <h2 className="font-heading text-card font-medium text-strong">
            <CardLink href={href}>{title}</CardLink>
          </h2>
          <p className="mt-2">{description}</p>
          <CardArrow className="mt-auto self-end" />
        </div>
      </div>
    </Card>
  );
}
