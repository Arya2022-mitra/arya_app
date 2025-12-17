export function getProfileId(p: { id?: number | string; profile_id?: number | string } | null | undefined): number {
  const raw = (p as any)?.profile_id ?? (p as any)?.id;
  if (typeof raw === 'string') {
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? 0 : n;
  }
  return raw as number;
}
export default getProfileId;
