"use client";

import { useSearchParams } from "next/navigation";
import {
  type ReactNode,
  startTransition,
  useEffect,
  useOptimistic,
} from "react";
import { es } from "@/content/es";
import {
  FILTER_PARAMETER,
  filterSearch,
  type GalleryFilter,
  matchesFilter,
  parseFilter,
} from "./filter";
import { FilterControls } from "./filter-controls";
import { useGallerySession } from "./gallery-session";
import { type GalleryCard, OrbitGrid } from "./orbit-grid";

/**
 * The gallery with its filter read from the URL (spec 03, Decision 8). The
 * page is static, so the URL is only known in the browser: the page renders
 * this inside Suspense, with GalleryView showing every orbit as the fallback.
 */
export function FilteredGallery({
  header,
  cards,
}: {
  header: ReactNode;
  cards: readonly GalleryCard[];
}) {
  const urlFilter = parseFilter(useSearchParams().get(FILTER_PARAMETER));
  const { rememberGallerySearch } = useGallerySession();
  useEffect(() => {
    rememberGallerySearch(filterSearch(urlFilter));
  }, [rememberGallerySearch, urlFilter]);
  // The router re-renders with the new URL a moment after it changes; until
  // then the choice is shown optimistically, so the radio does not flicker.
  const [filter, showFilterNow] = useOptimistic(urlFilter);

  function showFilter(next: GalleryFilter): void {
    startTransition(() => {
      showFilterNow(next);
      // Replacing the history entry keeps the filter out of the back button,
      // while going back from a detail page still returns to it.
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${filterSearch(next)}`,
      );
    });
  }

  return (
    <GalleryView
      header={header}
      cards={cards}
      filter={filter}
      onFilterChange={showFilter}
    />
  );
}

export function GalleryView({
  header,
  cards,
  filter,
  onFilterChange,
}: {
  header: ReactNode;
  cards: readonly GalleryCard[];
  filter: GalleryFilter;
  onFilterChange?: (filter: GalleryFilter) => void;
}) {
  const shown = cards.filter((card) =>
    matchesFilter(filter, card.holdsWithoutCorrection),
  );
  return (
    <>
      {/* Beside the title on wide screens, so the six cards still fit. */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        {header}
        <FilterControls filter={filter} onChange={onFilterChange} />
      </div>
      <p className="sr-only" aria-live="polite">
        {es.gallery.filter.shown(shown.length)}
      </p>
      <div className="mt-8">
        <OrbitGrid cards={shown} />
      </div>
    </>
  );
}
