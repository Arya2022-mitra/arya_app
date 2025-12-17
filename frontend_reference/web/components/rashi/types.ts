export interface ChartEntry {
  label?: string;
  planets: string[];
}

export interface ChartProps {
  houses: {
    [houseNumber: number]: ChartEntry;
  };
  /** Optional label to render at the very center of the chart. */
  centerLabel?: string;
  /** Optional size in pixels for charts that support custom dimensions. */
  size?: number;
}
