export function makeProtectionPublicReader(prot: any) {
  const protPublic = prot?.public as Record<string, any> | undefined;
  const protSummary = prot?.summary as Record<string, any> | undefined;
  if (!prot?.public_ready) {
    console.warn('protection.public_ready is missing');
  }
  return function readPublicField(field: string): string {
    let val = protSummary?.[field];
    if (val !== undefined && val !== null && val !== '') {
      console.log(`Using ${field} from protection.summary`);
      return String(val);
    }
    val = protPublic?.[field];
    if (val !== undefined && val !== null && val !== '') {
      console.log(`Using ${field} from protection.public`);
      return String(val);
    }
    console.warn(`Missing protection field ${field} in summary/public`);
    return '—';
  };
}
