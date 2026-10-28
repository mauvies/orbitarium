interface Props {
  children: string;
}

export function SectionIntro({ children }: Props) {
  return <p className="mt-4 max-w-[60ch] text-lead">{children}</p>;
}
