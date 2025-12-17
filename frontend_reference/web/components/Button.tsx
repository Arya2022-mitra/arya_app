import { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export default function Button({ variant = 'secondary', className = '', ...props }: Props) {
  const base =
    'px-4 py-2 rounded focus:outline-none font-rajdhani transition-all duration-300';
  const variants: Record<string, string> = {
    primary:
      'border border-neon-cyan text-neon-cyan bg-transparent animate-pulse-glow hover:shadow-[0_0_20px_#00ffff]',
    secondary: 'border border-sky-blue text-sky-blue hover:bg-sky-blue hover:text-neo-dark',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
