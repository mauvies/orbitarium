import { describe, expect, it } from "vitest";
import { markdownTable } from "./markdown-table";

const HEADERS = ["Orbit", "Steps"];
const ROWS = [
  ["Lagrange", "1,000"],
  ["Yin-yang I", "500,000"],
];

describe("markdownTable", () => {
  it("pads every cell to the width of its column", () => {
    const table = markdownTable(HEADERS, ROWS);

    expect(table).toBe(
      [
        "| Orbit      | Steps   |",
        "|------------|---------|",
        "| Lagrange   | 1,000   |",
        "| Yin-yang I | 500,000 |",
      ].join("\n"),
    );
  });

  it("widens a column to its header when the header is the longest cell", () => {
    const table = markdownTable(["Substeps per frame"], [["3"]]);

    expect(table).toBe(
      [
        "| Substeps per frame |",
        "|--------------------|",
        "| 3                  |",
      ].join("\n"),
    );
  });

  it("writes numbers as they print", () => {
    const table = markdownTable(["Period"], [[12]]);

    expect(table.split("\n").at(-1)).toBe("| 12     |");
  });

  it("escapes pipes and joins lines so free text stays in its cell", () => {
    const table = markdownTable(["Expected"], [["either a | b\nor c"]]);

    expect(table.split("\n").at(-1)).toBe("| either a \\| b or c |");
  });

  it("throws naming the row whose cells do not match the headers", () => {
    const rows = [["Lagrange", "1,000"], ["Goggles"]];

    expect(() => markdownTable(HEADERS, rows)).toThrow(
      "rows[1] has 1 cells, but there are 2 headers",
    );
  });
});
