export type DedupeMode = 'consecutive' | 'global';

export interface DedupeOptions {
  mode?: DedupeMode;
  similarityThreshold?: number;
  collapsePhrases?: string[];
}

const DEFAULT_COLLAPSE_PHRASES = [
  'Take ten mindful breaths, journal insights, and let compassion guide every action.',
  'Stay observant.',
];

const DEFAULT_OPTIONS: Required<DedupeOptions> = {
  mode: 'consecutive',
  similarityThreshold: 0.9,
  collapsePhrases: DEFAULT_COLLAPSE_PHRASES,
};

type Unit = {
  text: string;
  normalized: string;
};

const BULLET_PATTERN = /^\s*(?:[-*\u2022]|\d+\.)\s+/;

function replaceSmartQuotes(text: string): string {
  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u00A0/g, ' ');
}

function normalizeForComparison(text: string): string {
  const withoutSmartQuotes = replaceSmartQuotes(text);
  const lower = withoutSmartQuotes.toLowerCase();
  const withoutDiacritics = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const withoutPunctuation = withoutDiacritics.replace(/[\p{P}\p{S}]/gu, ' ');
  return withoutPunctuation.replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): Set<string> {
  return new Set(text.split(/\s+/).filter(Boolean));
}

function jaccardSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const setA = tokenize(a);
  const setB = tokenize(b);
  const intersection = new Set([...setA].filter((token) => setB.has(token)));
  const unionSize = new Set([...setA, ...setB]).size;
  return unionSize === 0 ? 0 : intersection.size / unionSize;
}

function splitIntoSentences(paragraph: string): string[] {
  const flattened = paragraph.replace(/\s*\n\s*/g, ' ').trim();
  if (!flattened) return [];
  const matches = flattened.match(/[^.!?]+[.!?]?/g);
  if (!matches) return [flattened];
  return matches.map((sentence) => sentence.trim()).filter(Boolean);
}

function parseParagraph(paragraph: string): { units: Unit[]; isBullet: boolean } {
  const lines = paragraph.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  const isBullet = lines.length > 0 && lines.every((line) => BULLET_PATTERN.test(line));

  if (isBullet) {
    return {
      isBullet,
      units: lines.map((line) => ({
        text: line,
        normalized: normalizeForComparison(line),
      })),
    };
  }

  const sentences = splitIntoSentences(paragraph);
  return {
    isBullet: false,
    units: sentences.map((sentence) => ({
      text: sentence,
      normalized: normalizeForComparison(sentence),
    })),
  };
}

function reassembleParagraph(units: Unit[], isBullet: boolean): string {
  if (units.length === 0) return '';
  if (isBullet) {
    return units.map((unit) => unit.text).join('\n');
  }
  return units
    .map((unit) => unit.text.trim())
    .filter(Boolean)
    .join(' ');
}

function shouldRemoveUnit(
  unit: Unit,
  lastKept: Unit | undefined,
  seenGlobal: Unit[],
  options: Required<DedupeOptions>,
  collapseLookup: Set<string>
): boolean {
  const { mode, similarityThreshold } = options;

  if (!unit.normalized) {
    return false;
  }

  if (lastKept && collapseLookup.has(unit.normalized) && unit.normalized === lastKept.normalized) {
    return true;
  }

  const candidates = mode === 'global' ? seenGlobal : lastKept ? [lastKept] : [];
  for (const candidate of candidates) {
    if (!candidate.normalized) continue;
    const similarity = jaccardSimilarity(candidate.normalized, unit.normalized);
    if (similarity >= similarityThreshold) {
      return true;
    }
  }

  return false;
}

function cleanParagraph(
  paragraph: string,
  globalSeen: Unit[],
  options: Required<DedupeOptions>,
  collapseLookup: Set<string>,
  removedCounter: { count: number }
): string {
  const { units, isBullet } = parseParagraph(paragraph);
  const kept: Unit[] = [];

  let lastKept: Unit | undefined;
  for (const unit of units) {
    if (shouldRemoveUnit(unit, lastKept, globalSeen, options, collapseLookup)) {
      removedCounter.count += 1;
      continue;
    }

    kept.push(unit);
    lastKept = unit;
    if (options.mode === 'global') {
      globalSeen.push(unit);
    }
  }

  return reassembleParagraph(kept, isBullet);
}

export function dedupeSummary(
  rawText: string | null | undefined,
  options: DedupeOptions = {}
): string {
  if (!rawText) return '';

  const mergedOptions: Required<DedupeOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
    collapsePhrases: options.collapsePhrases ?? DEFAULT_OPTIONS.collapsePhrases,
  };

  const paragraphs = rawText.split(/\n\s*\n/);
  const collapseLookup = new Set(
    mergedOptions.collapsePhrases.map((phrase) => normalizeForComparison(phrase)).filter(Boolean)
  );

  const removedCounter = { count: 0 };
  const globalSeen: Unit[] = [];

  const cleanedParagraphs = paragraphs
    .map((paragraph) => cleanParagraph(paragraph, globalSeen, mergedOptions, collapseLookup, removedCounter))
    .filter((paragraph) => paragraph.trim().length > 0);

  const cleanedText = cleanedParagraphs.join('\n\n').trim();

  if (removedCounter.count > 0 && typeof console !== 'undefined') {
    const modeLabel = mergedOptions.mode === 'global' ? 'global' : 'consecutive';
    console.debug(
      `[dedupeSummary] Removed ${removedCounter.count} repeated item(s) (${modeLabel} mode).`
    );
  }

  return cleanedText;
}

export { DEFAULT_COLLAPSE_PHRASES };
