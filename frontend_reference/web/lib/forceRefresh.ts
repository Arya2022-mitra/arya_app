const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

export function parseForceRefreshParam(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => parseForceRefreshParam(entry));
  }
  if (typeof value !== 'string') {
    return false;
  }
  return TRUE_VALUES.has(value.trim().toLowerCase());
}
