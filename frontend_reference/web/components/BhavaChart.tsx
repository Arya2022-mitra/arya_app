import React from 'react';
import Card from '@/components/Card';

export interface BhavaChartProps {
  /**
   * Mapping of cell number (1-9) to data for each bhava.
   */
  cells: {
    [index: number]: {
      label?: string;
      items?: string[];
    };
  };
}

/** Render a Bhava chart using a responsive 3×3 grid. */
export default function BhavaChart({ cells }: BhavaChartProps) {
  const layout: Record<number, [number, number]> = {
    1: [0, 0],
    2: [0, 1],
    3: [0, 2],
    4: [1, 0],
    5: [1, 1],
    6: [1, 2],
    7: [2, 0],
    8: [2, 1],
    9: [2, 2],
  };

  return (
    <Card className="w-80 h-80 mx-auto bg-ivory shadow-md p-4 flex">
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full m-auto">
        {Object.entries(layout).map(([num, [row, col]]) => {
          const data = cells[Number(num)] || { items: [] };
          return (
            <div
              key={num}
              className="border border-accent dark:border-neon-cyan aspect-square flex flex-col items-center justify-center text-xs"
              style={{ gridColumn: col + 1, gridRow: row + 1 }}
            >
              {data.label && <div className="font-semibold mb-0.5">{data.label}</div>}
              {data.items && data.items.length > 0 && (
                <div>{data.items.join(' ')}</div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
