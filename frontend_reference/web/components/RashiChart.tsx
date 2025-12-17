import React from 'react';
import Card from '@/components/Card';
import {
  SouthIndianChart,
  NorthIndianChart,
  EastIndianChart,
  ChartProps,
} from './rashi';

export type RashiChartVariant = 'north' | 'south' | 'east';

export interface RashiChartProps extends ChartProps {
  variant?: RashiChartVariant;
}

export default function RashiChart({
  houses,
  centerLabel,
  variant = 'south',
  size = 320,
}: RashiChartProps) {
  let chart: React.ReactElement;
  switch (variant) {
    case 'north':
      chart = (
        <NorthIndianChart houses={houses} centerLabel={centerLabel} size={size} />
      );
      break;
    case 'east':
      chart = <EastIndianChart houses={houses} centerLabel={centerLabel} />;
      break;
    case 'south':
    default:
      chart = <SouthIndianChart houses={houses} centerLabel={centerLabel} />;
      break;
  }
  return (
    <div style={{ width: size, height: size }}>
      <Card className="mx-auto bg-ivory shadow-md flex items-center justify-center w-full h-full">
        {chart}
      </Card>
    </div>
  );
}
