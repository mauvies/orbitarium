interface Props {
  full: string;
  short: string;
}

/**
 * `short` below 640 px and `full` from there. Screen readers always get
 * `full`: the short text is hidden from them.
 */
export function ResponsiveText({ full, short }: Props) {
  return (
    <>
      <span aria-hidden="true" className="sm:hidden">
        {short}
      </span>
      <span className="sr-only sm:not-sr-only">{full}</span>
    </>
  );
}
