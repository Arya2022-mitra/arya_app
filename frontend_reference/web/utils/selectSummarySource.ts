import { sanitizeHtml } from '@/lib/sanitizeHtml';
import {
  cleanSummaryWithWindows,
  type FormatOptions,
  type NormalizedTimeWindow,
  type TimeWindow,
  looksLikeRawJsonData,
  stripDebugBlocks,
} from '@/lib/cleanSummaryWithWindows';
import { dedupeSummary } from '@/lib/dedupeSummary';

export type SummarySelectionSource = 'summary_metadata' | 'day_api' | null;

export interface StructuredSummarySections {
  overall?: string;
  health?: string;
  money?: string;
}

export interface SummarySelection {
  text: string | null;
  html: string | null;
  source: SummarySelectionSource;
  /** Structured sections (overall, health, money) if available from AI summary */
  structured?: StructuredSummarySections | null;
}

export type SummaryMetadataCandidate = {
  summary_metadata?: {
    summary?: string;
    layers?: Record<string, unknown>;
  };
  layers?: Record<string, unknown>;
  debug?: {
    layers?: Record<string, unknown>;
  };
  html?: string | null;
  summary?: string | null;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getSummaryLayer(aiSummaryData?: SummaryMetadataCandidate | null): unknown {
  if (!aiSummaryData) return null;
  return (
    aiSummaryData.summary_metadata?.layers?.summary ??
    aiSummaryData.layers?.summary ??
    aiSummaryData.debug?.layers?.summary ??
    null
  );
}

function extractStructuredSections(summaryLayer: unknown): StructuredSummarySections | null {
  if (!isObject(summaryLayer)) return null;

  const structuredEntries: StructuredSummarySections = {};

  if (typeof summaryLayer.overall === 'string' && summaryLayer.overall.trim()) {
    structuredEntries.overall = summaryLayer.overall;
  }
  if (typeof summaryLayer.health === 'string' && summaryLayer.health.trim()) {
    structuredEntries.health = summaryLayer.health;
  }
  if (typeof summaryLayer.money === 'string' && summaryLayer.money.trim()) {
    structuredEntries.money = summaryLayer.money;
  }

  return Object.keys(structuredEntries).length > 0 ? structuredEntries : null;
}

function extractSummaryMetadata(
  aiSummaryData?: SummaryMetadataCandidate | null
): { text?: string | null; html?: string | null; structured?: StructuredSummarySections | null } {
  if (!aiSummaryData) return {};

  const summaryLayer = getSummaryLayer(aiSummaryData);
  const structuredSections = extractStructuredSections(summaryLayer);

  const summaryFromLayers = isObject(summaryLayer) ? (summaryLayer as Record<string, unknown>) : summaryLayer;

  const textCandidate =
    (isObject(summaryFromLayers) ? (summaryFromLayers.text as string | undefined) : undefined) ||
    (isObject(summaryFromLayers) ? (summaryFromLayers.summary as string | undefined) : undefined) ||
    (typeof summaryFromLayers === 'string' ? summaryFromLayers : undefined) ||
    (typeof aiSummaryData.summary_metadata?.summary === 'string'
      ? aiSummaryData.summary_metadata.summary
      : undefined);

  const htmlCandidate = isObject(summaryFromLayers)
    ? ((summaryFromLayers.html as string | undefined) || (summaryFromLayers.html_text as string | undefined))
    : undefined;

  const fallbackHtml = aiSummaryData.html ?? null;
  const fallbackText = aiSummaryData.summary ?? null;

  return {
    text: textCandidate ?? fallbackText ?? null,
    html: htmlCandidate ?? fallbackHtml ?? null,
    structured: structuredSections,
  };
}

function normalizeCandidate(raw: string | undefined | null, minimumLength = 20): string {
  if (!raw) return '';

  const withoutDebug = stripDebugBlocks(String(raw));
  const withoutHtml = withoutDebug.replace(/<[^>]+>/g, ' ');
  const normalized = withoutHtml.replace(/\s+/g, ' ').trim();

  if (!normalized || normalized.length < minimumLength) return '';
  if (looksLikeRawJsonData(normalized)) return '';
  if (/^\s*[\[{].*[\]}]\s*$/.test(normalized)) return '';

  return normalized;
}

export function selectSummarySource(params: {
  aiSummaryData?: SummaryMetadataCandidate | null;
  daySummary?: string | null;
  minimumLength?: number;
}): SummarySelection {
  const { aiSummaryData, daySummary, minimumLength = 20 } = params;
  const metadata = extractSummaryMetadata(aiSummaryData);

  // Prioritize structured data if available
  if (metadata.structured) {
    return {
      text: null,
      html: null,
      source: 'summary_metadata',
      structured: metadata.structured,
    };
  }

  // Resolution order for unstructured content: AI html -> AI text -> Day API
  const aiHtml = metadata.html ? sanitizeHtml(metadata.html) ?? null : null;
  const aiHtmlNormalized = normalizeCandidate(metadata.html, minimumLength);
  const aiTextNormalized = normalizeCandidate(metadata.text, minimumLength);

  if (aiHtmlNormalized || aiTextNormalized) {
    return { text: aiTextNormalized || aiHtmlNormalized || null, html: aiHtml, source: 'summary_metadata' };
  }

  const cleanedDaySummary = normalizeCandidate(daySummary, minimumLength);
  if (cleanedDaySummary) {
    return { text: cleanedDaySummary, html: null, source: 'day_api' };
  }

  return { text: null, html: null, source: null };
}

export function formatSelectedSummary(
  selection: SummarySelection,
  timeWindows: (TimeWindow | NormalizedTimeWindow)[] | null | undefined,
  options?: FormatOptions
): string {
  if (!selection.text) return '';

  const expanded = cleanSummaryWithWindows(selection.text, timeWindows ?? undefined, options);
  return dedupeSummary(expanded, {
    mode: 'consecutive',
    similarityThreshold: 0.9,
  });
}
