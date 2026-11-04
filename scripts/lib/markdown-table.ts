// The measurement scripts print their tables for the specs. Padding every cell
// keeps them valid Markdown and aligned in a terminal. The `.mjs` scripts
// import it with Node's type stripping, which is why it has no alias and no
// syntax that needs a transform.

type Cell = string | number;

export function markdownTable(
  headers: readonly string[],
  rows: readonly (readonly Cell[])[],
): string {
  for (const [index, row] of rows.entries()) {
    if (row.length !== headers.length) {
      throw new RangeError(
        `rows[${index}] has ${row.length} cells, but there are ${headers.length} headers`,
      );
    }
  }

  const headerCells = headers.map(cellText);
  const bodyCells = rows.map((row) => row.map(cellText));
  const widths = headerCells.map((header, column) =>
    Math.max(
      header.length,
      ...bodyCells.map((row) => String(row[column]).length),
    ),
  );

  const line = (cells: readonly string[]) =>
    `| ${widths.map((width, column) => String(cells[column]).padEnd(width)).join(" | ")} |`;
  const divider = `|${widths.map((width) => "-".repeat(width + 2)).join("|")}|`;

  return [line(headerCells), divider, ...bodyCells.map(line)].join("\n");
}

/** A pipe would end the cell and a line break the row. */
function cellText(cell: Cell): string {
  return String(cell).replaceAll("|", "\\|").replaceAll("\n", " ");
}
