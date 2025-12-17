export const houseNames: Record<number, string> = {
  1: 'Tanu',
  2: 'Dhana',
  3: 'Sahaja',
  4: 'Sukha',
  5: 'Putra',
  6: 'Roga',
  7: 'Yuvati',
  8: 'Randhra',
  9: 'Dharma',
  10: 'Karma',
  11: 'Labha',
  12: 'Vyaya',
};

export function ordinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
}

export function formatLordship(n: any): string {
  const num = Number(n);
  const name = houseNames[num];
  if (name) {
    return `${name} (${ordinal(num)})`;
  }
  return String(n);
}
