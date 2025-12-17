import React from 'react';
import { ChartProps } from './types';
import { getPlanetAbbreviations, STROKE_COLOR, STROKE_WIDTH } from './helpers';

const LAYOUT: Record<number, [number, number]> = {
  1: [0, 1],
  2: [0, 2],
  3: [0, 3],
  4: [1, 3],
  5: [2, 3],
  6: [3, 3],
  7: [3, 2],
  8: [3, 1],
  9: [3, 0],
  10: [2, 0],
  11: [1, 0],
  12: [0, 0],
};

export default function SouthIndianChart({ houses, centerLabel }: ChartProps) {
  const size = 320;
  const cell = size / 4;
  const watermarkSize = size * 0.8;
  const offset = (size - watermarkSize) / 2;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="font-cinzel"
    >
      <rect width={size} height={size} fill="#fdfcf5" />
      <image
        href="/om_watermark.svg"
        x={offset}
        y={offset}
        width={watermarkSize}
        height={watermarkSize}
        opacity={0.05}
      />
      <rect
        x={0}
        y={0}
        width={size}
        height={size}
        fill="none"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      {/* House boundaries */}
      {Object.values(LAYOUT).map(([row, col], idx) => (
        <rect
          key={`b-${idx}`}
          x={col * cell}
          y={row * cell}
          width={cell}
          height={cell}
          fill="none"
          stroke={STROKE_COLOR}
          strokeWidth={STROKE_WIDTH}
        />
      ))}
      {centerLabel && (
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[8px]"
        >
          {centerLabel}
        </text>
      )}
      {Object.entries(LAYOUT).map(([house, [row, col]]) => {
        const centerX = col * cell + cell / 2;
        const centerY = row * cell + cell / 2;
        const numberX = col * cell + 4;
        const numberY = row * cell + 8;
        const data = houses[Number(house)];
        const label = data?.label || '';
        const planets = data?.planets
          ? getPlanetAbbreviations(data.planets)
          : [];
        const asc = data?.planets?.find(p => /Asc|Lagna/i.test(p));
        return (
          <g key={house} textAnchor="middle" className="text-[8px]">
            <text x={numberX} y={numberY} className="fill-red-600 text-[6px]">
              {house}
            </text>
            <text x={centerX} y={centerY - 4}>{label}</text>
            {asc && (
              <text
                x={centerX}
                y={centerY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-bold text-[6px]"
              >
                {asc.toLowerCase().includes('lagna') ? 'Lagna' : 'Asc'}
              </text>
            )}
            {planets.length > 0 && (
              <text
                x={centerX}
                y={centerY + 6}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-serif text-[10px]"
              >
                {planets.map((p, i) => (
                  <tspan key={i} x={centerX} dy={i === 0 ? 0 : '1.2em'}>
                    {p}
                  </tspan>
                ))}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
