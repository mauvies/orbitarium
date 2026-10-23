// The gallery's stability filter, kept in the URL (spec 03, Decision 8).

export const GALLERY_FILTERS = ["all", "holds", "drifts"] as const;

export type GalleryFilter = (typeof GALLERY_FILTERS)[number];

export const FILTER_PARAMETER = "filter";

/**
 * The filter in a URL's query parameter. An absent or unknown value shows
 * every orbit: a mistyped shared link should not break the gallery.
 */
export function parseFilter(value: string | null): GalleryFilter {
  return GALLERY_FILTERS.find((filter) => filter === value) ?? "all";
}

export function matchesFilter(
  filter: GalleryFilter,
  holdsWithoutCorrection: boolean,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "holds":
      return holdsWithoutCorrection;
    case "drifts":
      return !holdsWithoutCorrection;
  }
}

/** The query string for the filter; none for every orbit. */
export function filterSearch(filter: GalleryFilter): string {
  return filter === "all" ? "" : `?${FILTER_PARAMETER}=${filter}`;
}
