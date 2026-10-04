/**
 * Room name limits, shared by the browser and the API routes so the UI hint and
 * the server validation can never drift apart.
 */

/** Host and singer names are capped so they never break the mobile header. */
export const NAME_MAX_LENGTH = 15;

/** Trim, collapse inner whitespace, and hard-cap to NAME_MAX_LENGTH. */
export function clampName(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, NAME_MAX_LENGTH);
}

/**
 * Length check for the API routes. Runs against the whitespace-collapsed name so
 * "Alexandra   Garcia" is not rejected for length when it fits once tidied up.
 */
export function isNameTooLong(value: string): boolean {
  return value.replace(/\s+/g, " ").trim().length > NAME_MAX_LENGTH;
}

/** Validation message used by both the name inputs and the API routes. */
export const NAME_LENGTH_ERROR = `Name must be ${NAME_MAX_LENGTH} characters or fewer`;