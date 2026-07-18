export const USERNAME_PATTERN = /^[\p{L}\p{N}_.-]+$/u;
export const DESCRIPTION_MAX = 500;
export const USERNAME_MIN = 2;
export const USERNAME_MAX = 30;

export const isValidUsername = (value: string): boolean => {
  const trimmed = value.trim();
  return (
    trimmed.length >= USERNAME_MIN &&
    trimmed.length <= USERNAME_MAX &&
    USERNAME_PATTERN.test(trimmed)
  );
};

export const clampDescription = (value: string): string =>
  value.trim().slice(0, DESCRIPTION_MAX);
