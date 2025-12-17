import { useState } from 'react';
import RashiChart, { RashiChartVariant } from './RashiChart';
import type { ChartProps } from './rashi';

interface Props extends ChartProps {}

export default function ChartTabs({ houses }: Props) {
  const [variant, setVariant] = useState<RashiChartVariant>('south');
  const tabs: { label: string; value: RashiChartVariant }[] = [
    { label: 'North Indian', value: 'north' },
    { label: 'South Indian', value: 'south' },
    { label: 'East Indian', value: 'east' },
  ];

  return (
    <div className="flex flex-col items-center">
      <RashiChart houses={houses} variant={variant} />
      <div className="mt-2 flex justify-center space-x-2">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setVariant(tab.value)}
            className={`px-2 py-1 text-xs border-b-2 transition-colors ${
              variant === tab.value
                ? 'border-neon-cyan text-neon-cyan'
                : 'border-transparent text-white hover:text-neon-cyan'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
