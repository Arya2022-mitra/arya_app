import React from 'react';
import Card from '@/components/Card';
import {
  SouthIndianNavamsaChart,
  NorthIndianNavamsaChart,
  EastIndianNavamsaChart,
  ChartProps,
} from './navamsa';

export type NavamsaChartVariant = 'south' | 'north' | 'east';

export interface NavamsaChartDisplayProps extends ChartProps {
  variant?: NavamsaChartVariant;
}

export default function NavamsaChartDisplay({
  houses,
  centerLabel,
  variant = 'south',
  size = 320,
}: NavamsaChartDisplayProps) {
  let chart: React.ReactElement;
  switch (variant) {
    case 'north':
      chart = (
        <NorthIndianNavamsaChart houses={houses} centerLabel={centerLabel} size={size} />
      );
      break;
    case 'east':
      chart = <EastIndianNavamsaChart houses={houses} centerLabel={centerLabel} />;
      break;
    case 'south':
    default:
      chart = <SouthIndianNavamsaChart houses={houses} centerLabel={centerLabel} />;
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
