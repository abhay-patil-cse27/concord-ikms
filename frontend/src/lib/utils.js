import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to conditionally merge Tailwind class names without style collisions.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
