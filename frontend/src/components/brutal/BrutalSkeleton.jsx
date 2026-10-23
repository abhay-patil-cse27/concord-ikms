import React from 'react';
import { cn } from '../../lib/utils';

/**
 * BrutalSkeleton
 * High-contrast, pulsing geometric placeholder with thick border and industrial hatching.
 */
export default function BrutalSkeleton({
  className = '',
  height = 'h-4',
  width = 'w-full',
  lines = 1,
}) {
  if (lines > 1) {
    return (
      <div className="flex flex-col gap-2.5 w-full">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'border border-brutal-black bg-brutal-paper dark:bg-brutal-dark-surface animate-pulse-brutal',
              height,
              i === lines - 1 ? 'w-3/4' : width,
              className
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'border border-brutal-black bg-brutal-paper dark:bg-brutal-dark-surface animate-pulse-brutal',
        height,
        width,
        className
      )}
    />
  );
}
