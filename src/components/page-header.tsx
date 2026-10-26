import type { ReactNode } from "react";

/**
 * The page's h1 and lead, at the same height on every page
 * (docs/design/visual-style.md, "Page header"). `display` is the home hero's
 * larger title.
 */
export function PageHeader({
  title,
  lead,
  display = false,
}: {
  title: string;
  lead?: ReactNode;
  display?: boolean;
}) {
  return (
    <div className="pt-10 lg:pt-14">
      <h1
        className={`font-heading font-semibold text-strong ${
          display ? "text-display" : "text-title"
        }`}
      >
        {title}
      </h1>
      {lead !== undefined && (
        <p className="mt-3 max-w-[70ch] text-lead">{lead}</p>
      )}
    </div>
  );
}
