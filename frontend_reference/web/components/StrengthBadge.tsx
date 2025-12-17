import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function StrengthBadge({ children }: Props) {
  return (
    <span className="ml-2 px-2 py-1 text-xs font-rajdhani border border-neon-cyan text-neon-cyan rounded">
      {children}
    </span>
  );
}
