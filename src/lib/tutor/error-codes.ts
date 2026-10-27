export const TUTOR_ERROR_CODES = [
  "rate-limited",
  "daily-limit",
  "too-long",
  "unavailable",
] as const;

export type TutorErrorCode = (typeof TUTOR_ERROR_CODES)[number];

export function parseErrorCode(message: string): TutorErrorCode {
  return TUTOR_ERROR_CODES.find((code) => code === message) ?? "unavailable";
}
