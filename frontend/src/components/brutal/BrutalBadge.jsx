import React from 'react';
import { cn } from '../../lib/utils';

/**
 * BrutalBadge
 * High-contrast, monospaced status indicator with thick border and sharp geometry.
 *
 * Tones:
 *  - yellow: High-voltage yellow tag with black text
 *  - black: Stark pitch-black tag with white text
 *  - green: High-contrast emerald success tag
 *  - red: Alert hazard tag
 *  - cyan: Blueprint / technical tag
 *  - paper: Neutral archival tag
 */
export default function BrutalBadge({
  children,
  tone = 'yellow',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) {
  const toneClasses = {
    yellow: 'bg-brutal-yellow text-brutal-black border-brutal-black shadow-brutal-sm',
    black: 'bg-brutal-black text-brutal-white border-brutal-black dark:border-brutal-yellow shadow-brutal-sm',
    paper: 'bg-brutal-paper text-brutal-black border-brutal-black',
    red: 'bg-brutal-accent text-brutal-white border-brutal-black shadow-brutal-sm',
    green: 'bg-brutal-success text-brutal-white border-brutal-black shadow-brutal-sm',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  const dotClasses = {
    yellow: 'bg-brutal-black',
    black: 'bg-brutal-yellow',
    paper: 'bg-brutal-black',
    red: 'bg-brutal-white',
    green: 'bg-brutal-yellow',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono font-black uppercase tracking-wider border-2 select-none',
        sizeClasses[size],
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full inline-block', dotClasses[tone])} />
      )}
      <span>{children}</span>
    </span>
  );
}
