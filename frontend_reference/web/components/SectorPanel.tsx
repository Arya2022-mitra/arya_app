import { useMemo, useState } from 'react';
import Card from './Card';

type Verdict = 'BUY_WINDOW' | 'CAUTION' | 'DO_NOT_TRADE';

interface Props {
  recommended: string[];
  avoid: string[];
  reasonTags: Record<string, string[]>;
  scores?: Record<string, 0 | 1 | 2>;
  finalVerdict: Verdict;
}

type SectorFilter = 'all' | 'rec' | 'avoid' | 's2' | 's1' | 's0';

interface SectorInfo {
  name: string;
  status: 'recommended' | 'avoid' | 'neutral';
  score: number | null;
  tags: string[];
}

function extractScore(tags: string[]): { score: number | null; remaining: string[] } {
  let foundScore: number | null = null;
  const remaining: string[] = [];
  tags.forEach((tag) => {
    const match = tag.match(/score\s*[:_-]?(\d)/i);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!Number.isNaN(parsed)) {
        foundScore = parsed;
        return;
      }
    }
    remaining.push(tag);
  });
  return { score: foundScore, remaining };
}

const filterConfigs: Array<{ key: SectorFilter; label: string; testId: string }> = [
  { key: 'all', label: 'All', testId: 'sector-filter-all' },
  { key: 'rec', label: 'Recommended', testId: 'sector-filter-rec' },
  { key: 'avoid', label: 'Avoid', testId: 'sector-filter-avoid' },
  { key: 's2', label: 'Score 2', testId: 'sector-filter-s2' },
  { key: 's1', label: 'Score 1', testId: 'sector-filter-s1' },
  { key: 's0', label: 'Score 0', testId: 'sector-filter-s0' },
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .trim();
}

export default function SectorPanel({
  recommended,
  avoid,
  reasonTags,
  scores,
  finalVerdict: _finalVerdict,
}: Props) {
  const [filter, setFilter] = useState<SectorFilter>('all');

  const sectors = useMemo<SectorInfo[]>(() => {
    const set = new Set<string>([
      ...recommended,
      ...avoid,
      ...Object.keys(reasonTags || {}),
    ]);
    return Array.from(set).map((name) => {
      const status = recommended.includes(name)
        ? 'recommended'
        : avoid.includes(name)
        ? 'avoid'
        : 'neutral';
      const tags = reasonTags[name] ?? [];
      const { score: tagScore, remaining } = extractScore(tags);
      const directScore = scores?.[name];
      const resolvedScore =
        directScore !== undefined
          ? directScore
          : typeof tagScore === 'number'
          ? tagScore
          : null;
      return {
        name,
        status,
        score: typeof resolvedScore === 'number' ? resolvedScore : null,
        tags: remaining,
      };
    });
  }, [recommended, avoid, reasonTags, scores]);

  const filtered = sectors.filter((sector) => {
    switch (filter) {
      case 'rec':
        return sector.status === 'recommended';
      case 'avoid':
        return sector.status === 'avoid';
      case 's2':
        return sector.score === 2;
      case 's1':
        return sector.score === 1;
      case 's0':
        return sector.score === 0;
      default:
        return true;
    }
  });

  const statusClassMap: Record<SectorInfo['status'], string> = {
    recommended: 'border-accent dark:border-neon-cyan',
    avoid: 'border-red-500 dark:border-red-500',
    neutral: 'border-gray-300 dark:border-gray-600',
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Sectors</h3>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {filterConfigs.map((cfg) => {
          const active = filter === cfg.key;
          return (
            <button
              key={cfg.key}
              type="button"
              data-testid={cfg.testId}
              onClick={() => setFilter(cfg.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none ${
                active
                  ? 'border-accent bg-white text-gray-900 shadow-sm dark:border-neon-cyan dark:bg-gray-900 dark:text-white'
                  : 'border-gray-300 text-gray-600 hover:border-accent bg-transparent dark:border-gray-600 dark:text-gray-300'
              }`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <p className="col-span-full text-sm text-gray-500 dark:text-gray-400">
            No sectors match this filter.
          </p>
        ) : (
          filtered.map((sector) => {
            const slug = slugify(sector.name) || sector.name;
            const cardClass = `${statusClassMap[sector.status]} rounded-lg border px-3 py-3 text-sm shadow-sm bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100`;
            return (
              <div key={sector.name} className={cardClass} data-testid={`sector-card-${slug}`}>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-100">
                    {sector.name}
                  </h4>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                    Score {sector.score ?? '—'}
                  </span>
                </div>
                {sector.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {sector.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-gray-200 px-2 py-0.5 text-[11px] uppercase tracking-wide text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                      >
                        {tag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
