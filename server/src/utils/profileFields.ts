export const USERNAME_PATTERN = /^[\p{L}\p{N}_.-]+$/u;
export const DESCRIPTION_MAX = 500;
export const USERNAME_MIN = 2;
export const USERNAME_MAX = 30;

/** NFKC + trim — collapses compatibility homoglyphs before uniqueness checks. */
export const normalizeUsername = (value: string): string =>
  value.trim().normalize("NFKC");

export const isValidUsername = (value: string): boolean => {
  const normalized = normalizeUsername(value);
  return (
    normalized.length >= USERNAME_MIN &&
    normalized.length <= USERNAME_MAX &&
    USERNAME_PATTERN.test(normalized)
  );
};

export const clampDescription = (value: string): string =>
  value.trim().slice(0, DESCRIPTION_MAX);
