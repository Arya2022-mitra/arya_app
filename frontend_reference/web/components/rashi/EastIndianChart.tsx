import React from 'react';
import { ChartProps } from './types';
import { getPlanetAbbreviations, STROKE_COLOR, STROKE_WIDTH } from './helpers';

const size = 320;
const cell = size / 3;

// In EastIndianChart.tsx, locate the POS definition and replace it entirely with:

const POS: Record<number, [number, number]> = {
  1:  [ size / 2,              cell / 2 ],                // Top-middle square
  2:  [ cell / 4,              cell / 4 ],                // Top-left outward triangle
  3:  [ cell * 3 / 4,          cell * 3 / 4 ],            // Top-left inward triangle
  4:  [ cell / 2,              size / 2 ],                // Left-middle square
  5:  [ cell * 3 / 4,          size - cell * 3 / 4 ],     // Bottom-left inward triangle
  6:  [ cell / 4,              size - cell / 4 ],         // Bottom-left outward triangle
  7:  [ size / 2,              size - cell / 2 ],         // Bottom-middle square
  8:  [ size - cell / 4,       size - cell / 4 ],         // Bottom-right outward triangle
  9:  [ size - cell * 3 / 4,   size - cell * 3 / 4 ],     // Bottom-right inward triangle
  10: [ size - cell / 2,       size / 2 ],                // Right-middle square
  11: [ size - cell * 3 / 4,   cell * 3 / 4 ],            // Top-right inward triangle
  12: [ size - cell / 4,       cell / 4 ],                // Top-right outward triangle
};


export default function EastIndianChart({ houses, centerLabel }: ChartProps) {
  const watermarkSize = size * 0.8;
  const offset = (size - watermarkSize) / 2;
  return (
    <svg
      viewBox="0 0 320 320"
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
        x="0"
        y="0"
        width="320"
        height="320"
        fill="none"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      {/* 3x3 Grid Lines */}
      <line
        x1={cell}
        y1="0"
        x2={cell}
        y2={size}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      <line
        x1={cell * 2}
        y1="0"
        x2={cell * 2}
        y2={size}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      <line
        x1="0"
        y1={cell}
        x2={size}
        y2={cell}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      <line
        x1="0"
        y1={cell * 2}
        x2={size}
        y2={cell * 2}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      {/* Diagonals in corner squares */}
      <line
        x1="0"
        y1="0"
        x2={cell}
        y2={cell}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      <line
        x1={cell * 2}
        y1="0"
        x2={size}
        y2={cell}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      <line
        x1="0"
        y1={cell * 2}
        x2={cell}
        y2={size}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      <line
        x1={cell * 2}
        y1={cell * 2}
        x2={size}
        y2={size}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
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
      {Object.entries(POS).map(([house, [x, y]]) => {
        const data = houses[Number(house)];
        const label = data?.label || '';
        const planets = data?.planets
          ? getPlanetAbbreviations(data.planets)
          : [];
        const asc = data?.planets?.find(p => /Asc|Lagna/i.test(p));
        return (
          <g key={house} textAnchor="middle" className="text-[8px]">
            <text x={x - 12} y={y - 12} className="fill-red-600 text-[6px]">
              {house}
            </text>
            <text x={x} y={y - 4}>{label}</text>
            {asc && (
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-bold text-[6px]"
              >
                {asc.toLowerCase().includes('lagna') ? 'Lagna' : 'Asc'}
              </text>
            )}
            {planets.length > 0 && (
              <text
                x={x}
                y={y + 6}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-serif text-[10px]"
              >
                {planets.map((p, i) => (
                  <tspan key={i} x={x} dy={i === 0 ? 0 : '1.2em'}>
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