import { ReactNode } from 'react';

export default function DomainChip({ children }: { children: ReactNode }) {
  return (
    <span className="px-2 py-1 mr-2 mb-2 text-xs font-rajdhani bg-neon-cyan text-neo-dark rounded-full">
      {children}
    </span>
  );
}
