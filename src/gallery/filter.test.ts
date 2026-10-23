import { describe, expect, it } from "vitest";
import { filterSearch, matchesFilter, parseFilter } from "./filter";

describe("parseFilter", () => {
  it.each([
    ["holds", "holds"],
    ["drifts", "drifts"],
    ["all", "all"],
  ] as const)("reads %s", (value, filter) => {
    expect(parseFilter(value)).toBe(filter);
  });

  it("shows every orbit when the parameter is absent", () => {
    expect(parseFilter(null)).toBe("all");
  });

  // Spec 03, Decision 8: a mistyped shared link should not break the gallery.
  it.each([
    "",
    "HOLDS",
    "se-mantienen",
  ])("shows every orbit for the unknown value %j", (value) => {
    expect(parseFilter(value)).toBe("all");
  });
});

describe("matchesFilter", () => {
  it("keeps every orbit for all", () => {
    expect(matchesFilter("all", true)).toBe(true);
    expect(matchesFilter("all", false)).toBe(true);
  });

  it("keeps only the orbits that hold for holds", () => {
    expect(matchesFilter("holds", true)).toBe(true);
    expect(matchesFilter("holds", false)).toBe(false);
  });

  it("keeps only the orbits that drift for drifts", () => {
    expect(matchesFilter("drifts", true)).toBe(false);
    expect(matchesFilter("drifts", false)).toBe(true);
  });
});

describe("filterSearch", () => {
  it("writes the filter as a query parameter", () => {
    expect(filterSearch("holds")).toBe("?filter=holds");
    expect(filterSearch("drifts")).toBe("?filter=drifts");
  });

  it("leaves the URL clean for all", () => {
    expect(filterSearch("all")).toBe("");
  });
});
