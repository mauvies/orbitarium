export {
  CANNON_LIMITS,
  type ResolvedRequest,
  resolveRequest,
} from "./controls";
export { circularSpeed, launchState } from "./launch";
export { launchOutcome } from "./outcome";
export {
  CANNON_PRESET_IDS,
  CANNON_PRESETS,
  type CannonPresetId,
  type ReferenceSpeeds,
  referenceSpeeds,
} from "./presets";
export {
  finalFrame,
  type Trace,
  type TraceEnd,
  type TraceFrame,
  traceFrame,
  traceLaunch,
} from "./trajectory";
export type {
  Applied,
  CannonField,
  CannonOutcome,
  CannonRequest,
  CannonSettings,
  FieldLimits,
  LaunchState,
  Rejected,
} from "./types";
export {
  EARTH_GM_KM3_PER_SECOND2,
  EARTH_RADIUS,
  EARTH_RADIUS_KM,
  engineToKmPerSecond,
  kmPerSecondToEngine,
  kmPerSecondToKmPerHour,
  launchRadius,
  MOUNTAIN_ALTITUDE_KM,
  SPEED_UNIT_KM_PER_SECOND,
  TIME_UNIT_SECONDS,
} from "./units";
