import { ReactNode } from 'react';

export default function ProfileInfoBlock({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{children}</div>;
}
