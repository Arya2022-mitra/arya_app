import React from 'react';
import { EastIndianChart, ChartProps } from '../rashi';

export default function EastIndianNavamsaChart({ houses, centerLabel, size }: ChartProps) {
  const ordered = [
    houses[1],
    houses[2],
    houses[3],
    houses[4],
    houses[5],
    houses[6],
    houses[7],
    houses[8],
    houses[9],
    houses[10],
    houses[11],
    houses[12],
  ];

  const normalized: ChartProps['houses'] = {};
  ordered.forEach((entry, idx) => {
    if (entry) {
      normalized[idx + 1] = entry;
    }
  });

  return <EastIndianChart houses={normalized} centerLabel={centerLabel} size={size} />;
}
