import React from 'react';
import { cn } from '../../lib/utils';

/**
 * BrutalTable
 * Monospaced architectural data table with bold horizontal separators, yellow header, and hover rows.
 */
export function BrutalTable({ children, className = '' }) {
  return (
    <div className={cn('w-full overflow-x-auto border-2 border-brutal-black dark:border-brutal-yellow shadow-brutal', className)}>
      <table className="w-full border-collapse text-left font-mono text-xs">
        {children}
      </table>
    </div>
  );
}

export function BrutalTableHeader({ children, className = '' }) {
  return (
    <thead className={cn('bg-brutal-black text-brutal-white dark:bg-brutal-dark-surface dark:text-brutal-yellow uppercase tracking-wider select-none border-b-2 border-brutal-black dark:border-brutal-yellow', className)}>
      {children}
    </thead>
  );
}

export function BrutalTableBody({ children, className = '' }) {
  return (
    <tbody className={cn('divide-y-2 divide-brutal-black/20 dark:divide-brutal-yellow/20 bg-brutal-white dark:bg-brutal-dark text-brutal-black dark:text-brutal-white', className)}>
      {children}
    </tbody>
  );
}

export function BrutalTableRow({ children, className = '', highlight = false, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors duration-100',
        onClick && 'cursor-pointer',
        highlight
          ? 'bg-brutal-yellow/20 hover:bg-brutal-yellow/30 font-bold'
          : 'hover:bg-brutal-paper dark:hover:bg-brutal-dark-surface',
        className
      )}
    >
      {children}
    </tr>
  );
}

export function BrutalTableHead({ children, className = '' }) {
  return (
    <th className={cn('px-4 py-3 font-mono font-black text-xs uppercase', className)}>
      {children}
    </th>
  );
}

export function BrutalTableCell({ children, className = '' }) {
  return (
    <td className={cn('px-4 py-3 font-mono text-xs align-middle', className)}>
      {children}
    </td>
  );
}
