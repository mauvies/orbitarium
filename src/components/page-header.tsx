import type { ReactNode } from "react";

interface Props {
  title: string;
  lead?: ReactNode;
  display?: boolean;
}

export function PageHeader({ title, lead, display = false }: Props) {
  return (
    <div className="pt-10">
      <h1
        className={`font-heading font-semibold text-strong ${
          display ? "text-display" : "text-title"
        }`}
      >
        {title}
      </h1>
      {lead !== undefined && (
        <p className="mt-3 max-w-[80ch] text-lead">{lead}</p>
      )}
    </div>
  );
}
