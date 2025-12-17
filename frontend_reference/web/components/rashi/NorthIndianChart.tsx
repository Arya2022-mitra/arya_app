// NorthIndianChart.tsx
import React from 'react';
import { ChartProps } from './types';
import { getPlanetAbbreviations, STROKE_COLOR, STROKE_WIDTH } from './helpers';

const size = 320;
const mid = size / 2; // 160
const quarter = size / 4; // 80

// In NorthIndianChart.tsx, replace your existing LAYOUT definition with:

const LAYOUT: Record<number, [number, number]> = {
  1:  [mid,                   quarter],                      // center-top row
  2:  [quarter,               quarter / 2],                  // top-left
  3:  [quarter / 2,           quarter],                      // left-top
  4:  [quarter,               mid],                          // left-middle
  5:  [quarter / 2,           mid + quarter],                // left-bottom
  6:  [quarter,               mid + quarter + quarter / 2],  // bottom-left
  7:  [mid,                   mid + quarter],                // bottom-center
  8:  [mid + quarter,         mid + quarter + quarter / 2],  // bottom-right
  9:  [mid + quarter + quarter / 2, mid + quarter],          // right-bottom
  10: [mid + quarter,         mid],                          // right-middle
  11: [mid + quarter + quarter / 2, quarter],                // right-top
  12: [mid + quarter,         quarter / 2],                  // top-right
};


export default function NorthIndianChart({ houses, centerLabel }: ChartProps) {
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="font-cinzel"
    >
      <rect width={size} height={size} fill="#fdfcf5" />

      {/* Outer diamond */}
      <polygon
        points={`${mid},0 ${size},${mid} ${mid},${size} 0,${mid}`}
        fill="none"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />

      {/* Diagonal Lines */}
      <line x1={0} y1={0} x2={size} y2={size} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
      <line x1={size} y1={0} x2={0} y2={size} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />

      {/* Inner diamond (connecting the midpoints of the sides of the outer diamond) */}
      <polygon
          points={`${mid},0 ${size},${mid} ${mid},${size} 0,${mid}`}
          fill="none"
          stroke={STROKE_COLOR}
          strokeWidth={STROKE_WIDTH}
        />
        <line
          x1={mid}
          y1={0}
          x2={mid}
          y2={size}
          stroke={STROKE_COLOR}
          strokeWidth={STROKE_WIDTH}
          style={{ display: 'none' }}
        />
        <line
          x1={0}
          y1={mid}
          x2={size}
          y2={mid}
          stroke={STROKE_COLOR}
          strokeWidth={STROKE_WIDTH}
          style={{ display: 'none' }}
        />

      {/* Optional center label (e.g., Om) */}
      {centerLabel && (
        <text
          x={mid}
          y={mid}
          textAnchor="middle"
          dominantBaseline="middle"
          opacity={0.08}
          fontSize="60"
        >
          {centerLabel}
        </text>
      )}

      {/* Houses with numbers, labels, planets, and lagna */}
      {Object.entries(LAYOUT).map(([house, [x, y]]) => {
        const data = houses[Number(house)];
        const label = data?.label || '';
        const planets = data?.planets
          ? getPlanetAbbreviations(data.planets)
          : [];
        const asc = data?.planets?.find(p => /Asc|Lagna/i.test(p));

        return (
          <g key={house} textAnchor="middle">
            {/* House number */}
            <text x={x} y={y - 12} fontSize="8" fill="red">
              {house}
            </text>
            {/* Rashi label */}
            <text x={x} y={y} fontSize="10">
              {label}
            </text>
            {/* Lagna/Asc label */}
            {asc && (
              <text
                x={x}
                y={y + 7}
                textAnchor="middle"
                fontWeight="bold"
                fontSize="8"
              >
                {asc.toLowerCase().includes('lagna') ? 'Lagna' : 'Asc'}
              </text>
            )}
            {/* Planets */}
            {planets.length > 0 && (
              <text
                x={x}
                y={y + 14}
                textAnchor="middle"
                fontFamily="serif"
                fontSize="10"
              >
                {planets.map((p, i) => (
                  <tspan key={i} x={x} dy={i === 0 ? '0' : '1.2em'}>
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