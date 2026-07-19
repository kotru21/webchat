/**
 * Group fingerprint hex into readable 4-char chunks for out-of-band compare.
 * @param {string | null | undefined} fp
 * @returns {string}
 */
export function formatFingerprint(fp) {
  if (!fp) return "";
  const compact = String(fp).replace(/\s+/g, "");
  return compact.replace(/(.{4})(?=.)/g, "$1 ").trim();
}
