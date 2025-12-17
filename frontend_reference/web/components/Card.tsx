import { ReactNode } from 'react';

export default function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-accent/20 dark:bg-card-dark border border-accent dark:border-neon-cyan rounded shadow p-4 ${className}`}
    >
      {children}
    </div>
  );
}
