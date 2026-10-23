import { es } from "@/content/es";
import { GALLERY_FILTERS, type GalleryFilter } from "./filter";
import { StatusDot } from "./stability-status";

/**
 * One choice among three, so native radio buttons: arrow keys move between
 * them. Without `onChange` (before the page hydrates) they are disabled: a
 * click then would be lost.
 */
export function FilterControls({
  filter,
  onChange,
}: {
  filter: GalleryFilter;
  onChange?: (filter: GalleryFilter) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">{es.gallery.filter.legend}</legend>
      <div className="flex flex-wrap gap-2">
        {GALLERY_FILTERS.map((option) => (
          <label
            key={option}
            className="relative flex items-center gap-2 rounded-[10px] border border-line px-3 py-2 text-small hover:text-strong has-checked:border-accent/40 has-checked:bg-surface-raised has-checked:text-strong"
          >
            {/* Invisible but covering the label: it takes the clicks, and the focus ring outlines the whole option. */}
            <input
              type="radio"
              name="filter"
              value={option}
              checked={filter === option}
              onChange={() => onChange?.(option)}
              disabled={onChange === undefined}
              className="absolute inset-0 cursor-pointer appearance-none rounded-[10px]"
            />
            {option !== "all" && <StatusDot holds={option === "holds"} />}
            {es.gallery.filter[option]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
