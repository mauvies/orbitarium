/**
 * How far from the Earth's centre the cannon's view reaches, in Earth radii,
 * to its edges (spec 04, Decision 10): the Earth fills a third of it.
 */
export const CANNON_VIEW_RADIUS = 3;

/**
 * Where a shot's trace stops: the view's corner, so a shot leaves the frame
 * instead of stopping inside it (spec 04, Decision 10).
 */
export const CANNON_STOP_RADIUS = CANNON_VIEW_RADIUS * Math.SQRT2;
