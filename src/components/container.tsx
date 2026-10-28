import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

/** The page's width and gutters (docs/design/visual-style.md, "Layout"). */
export function Container({ children, className = "" }: Props) {
  return (
    <div
      className={`mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </div>
  );
}
