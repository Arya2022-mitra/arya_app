import React from 'react';
import Card from '@/components/Card';
import NavamsaChartDisplay from '@/components/NavamsaChart';
import BhavaChart from '@/components/BhavaChart';

/** Escape HTML special characters in a string */
function sanitize(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidDasha(data: any): boolean {
  if (!data || !Array.isArray(data.timeline)) return false;
  return data.timeline.every((row: any) =>
    typeof row.start === 'string' &&
    typeof row.end === 'string' &&
    typeof row.lord === 'string' &&
    (!row.antardashas ||
      (Array.isArray(row.antardashas) &&
        row.antardashas.every(
          (a: any) =>
            typeof a.start === 'string' &&
            typeof a.end === 'string' &&
            typeof a.lord === 'string'
        )))
  );
}

function hasValidCells(data: any): boolean {
  const cells = extractCells(data);
  if (!cells) return false;
  return Object.values(cells).every(
    (c) =>
      (!c.label || typeof c.label === 'string') &&
      (!c.items || (Array.isArray(c.items) && c.items.every((i) => typeof i === 'string')))
  );
}

/** Convert plugin results into JSX snippets suitable for chat display */
export default function responseComposer(engine: string, raw: any): React.ReactNode {
  if (!raw) return null;

  const message =
    raw?.plugin_output?.message ??
    raw?.plugin_output?.summary ??
    raw?.message;
  const data = raw?.plugin_output?.data ?? raw?.plugin_output ?? raw;
  const sanitizedMessage =
    typeof message === 'string' && message.trim() ? sanitize(message) : null;

  const normalized = engine?.toLowerCase();
  let content: React.ReactNode = null;
  const devRawEnabled = process.env.NEXT_PUBLIC_DEV_RAW_RESPONSES === 'true';
  switch (normalized) {
    case 'dasha_engine':
    case 'dasha-engine':
      content = composeDasha(data);
      break;
    case 'bhava_engine':
    case 'bhava-engine':
      content = composeBhava(data);
      break;
    case 'navamsa_engine':
    case 'navamsa-chart-engine':
    case 'navamsa_chart_engine':
      content = composeNavamsa(data);
      break;
    case 'panchang_engine':
      content = composeCards(data);
      break;
    default:
      if (Array.isArray(data?.timeline)) {
        content = composeDasha(data);
      } else {
        content = devRawEnabled ? (
          <pre className="mt-2 text-xs whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          composeCards(data)
        );
      }
  }

  return (
    <>
      {sanitizedMessage && (
        <p className="whitespace-pre-wrap mb-2">{sanitizedMessage}</p>
      )}
      {content}
    </>
  );
}

function composeCards(data: any): React.ReactNode {
  if (Array.isArray(data)) {
    return (
      <div className="grid gap-2">
        {data.map((item, idx) => (
          <Card key={idx}>{renderRecord(item)}</Card>
        ))}
      </div>
    );
  }
  if (typeof data === 'object') {
    return <Card>{renderRecord(data)}</Card>;
  }
  return <Card>{sanitize(String(data))}</Card>;
}

function renderRecord(obj: Record<string, any>): React.ReactNode {
  const mvNode = renderMahavidya(obj);
  const {
    mahavidya_deity,
    mahavidya_selected,
    mahavidya_rationale,
    mahavidya_debug,
    debug,
    ...rest
  } = obj;
  const list = renderKeyValues(rest);
  if (mvNode) {
    return (
      <>
        {mvNode}
        {list}
      </>
    );
  }
  return list;
}

function renderMahavidya(obj: any): React.ReactNode | null {
  const mode = process.env.NEXT_PUBLIC_MAHAVIDYA_VISIBILITY_MODE || 'off';
  const safe = process.env.NEXT_PUBLIC_MAHAVIDYA_SAFE_MODE !== 'false';

  if (mode === 'off') return null;

  const pub = obj.public ?? obj.summary?.public;
  const name: string | undefined = pub?.mv_deity;
  const rationale: string | undefined = pub?.mahavidya_rationale ?? obj.mahavidya_rationale;
  const debugInfo: any = mode === 'debug' && !safe ? obj.mahavidya_debug : undefined;

  if (!name && !rationale && !debugInfo) return null;

  return (
    <div className="mb-2 text-xs">
      {name && (
        <div>
          <strong>Mahavidya/Tamasic Deity:</strong> {sanitize(String(name))}
        </div>
      )}
      {rationale && <div>{sanitize(String(rationale))}</div>}
      {debugInfo && (
        <pre className="mt-1 whitespace-pre-wrap overflow-x-auto">
          {sanitize(JSON.stringify(debugInfo, null, 2))}
        </pre>
      )}
    </div>
  );
}

function renderKeyValues(obj: Record<string, any>): React.ReactNode {
  return (
    <ul className="text-xs space-y-1">
      {Object.entries(obj).map(([k, v]) => (
        <li key={k}>
          <strong>{formatKey(sanitize(String(k)))}:</strong> {sanitize(String(v))}
        </li>
      ))}
    </ul>
  );
}

function formatKey(k: string): string {
  return k.replace(/_/g, ' ');
}

function composeDasha(data: any): React.ReactNode {
  if (!isValidDasha(data)) return composeCards(data);
  const rows = data.timeline as any[];
  return (
    <table
      className="mt-2 text-xs border border-gray-300 rounded w-full"
      role="table"
    >
      <thead className="bg-gray-100">
        <tr>
          <th className="border px-2 py-1">Start Date</th>
          <th className="border px-2 py-1">End Date</th>
          <th className="border px-2 py-1">Lord</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((maha, i) => (
          <React.Fragment key={i}>
            <tr className="hover:bg-gray-50">
              <td className="border px-2 py-1">{sanitize(maha.start)}</td>
              <td className="border px-2 py-1">{sanitize(maha.end)}</td>
              <td className="border px-2 py-1 font-semibold">{sanitize(maha.lord)}</td>
            </tr>
            {Array.isArray(maha.antardashas) &&
              maha.antardashas.map((antara: any, j: number) => (
                <tr key={i + '-' + j} className="hover:bg-gray-50">
                  <td className="border px-2 py-1 pl-4">{sanitize(antara.start)}</td>
                  <td className="border px-2 py-1">{sanitize(antara.end)}</td>
                  <td className="border px-2 py-1">{sanitize(antara.lord)}</td>
                </tr>
              ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}

function composeNavamsa(data: any): React.ReactNode {
  if (!hasValidCells(data)) return composeCards(data);
  const cells = extractCells(data)!;
  if (cells) {
    const houses: Record<number, { label?: string; planets: string[] }> = {};
    for (const [key, val] of Object.entries(cells)) {
      houses[Number(key)] = {
        label: val.label,
        planets: val.items || [],
      };
    }
    const chart = <NavamsaChartDisplay houses={houses} />;
    const houseCount = Object.keys(houses).length;
    if (houseCount === 12) return chart;
    console.warn(`Navamsa chart requires 12 houses but received ${houseCount}`);
    return (
      <div className="space-y-2">
        <p className="text-xs text-red-500">
          Navamsa chart requires 12 houses but received {houseCount}.
        </p>
        {composeCards(data)}
      </div>
    );
  }
  return composeCards(data);
}

function composeBhava(data: any): React.ReactNode {
  if (!hasValidCells(data)) return composeCards(data);
  const cells = extractCells(data)!;
  if (cells) {
    const chart = <BhavaChart cells={cells} />;
    if (Object.keys(cells).length >= 9) return chart;
    return (
      <div className="space-y-2">
        {chart}
        {composeCards(data)}
      </div>
    );
  }
  return composeCards(data);
}

function extractCells(source: any): Record<number, { label?: string; items?: string[] }> | null {
  if (!source) return null;
  const raw = source.cells || source.houses || source;
  const cells: Record<number, { label?: string; items?: string[] }> = {};
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const idx = Number(item.house ?? item.cell ?? item.index ?? item.id);
      if (!Number.isNaN(idx)) {
        cells[idx] = {
          label: item.sign ? sanitize(String(item.sign)) : item.label ? sanitize(String(item.label)) : undefined,
          items: Array.isArray(item.planets || item.items)
            ? (item.planets || item.items).map((x: any) => sanitize(String(x)))
            : undefined,
        };
      }
    }
  } else if (typeof raw === 'object') {
    for (const [key, value] of Object.entries(raw)) {
      if (/^\d+$/.test(key)) {
        const val: any = value;
        cells[Number(key)] = {
          label: val?.sign ? sanitize(String(val.sign)) : val?.label ? sanitize(String(val.label)) : undefined,
          items: Array.isArray(val?.planets || val?.items)
            ? (val.planets || val.items).map((x: any) => sanitize(String(x)))
            : undefined,
        };
      }
    }
  }
  return Object.keys(cells).length ? cells : null;
}
