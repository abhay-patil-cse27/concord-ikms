import React from 'react';
import { cn } from '../../lib/utils';

const DEFAULT_ROLES = [
  { id: 'student', label: 'Student' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'dept_admin', label: 'HOD' },
];

/**
 * RoleSelector
 * Reusable Yellow Brutalist role selection segmented control.
 * Pure Yellow Brutalist styling: solid borders, shadow-brutal-sm, monospace typography.
 */
export default function RoleSelector({
  roles = DEFAULT_ROLES,
  selectedRole,
  onSelectRole,
  disabled = false,
  className = '',
}) {
  return (
    <div className={className}>
      <label className="font-mono text-xs font-bold uppercase tracking-wider text-brutal-black dark:text-brutal-white flex items-center justify-between mb-1.5">
        <span>Institutional Persona / Role</span>
        <span className="text-brutal-accent font-black">*</span>
      </label>
      <div className="grid grid-cols-3 gap-2">
        {roles.map((r) => {
          const isSelected = selectedRole === r.id;
          return (
            <button
              key={r.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectRole(r.id)}
              className={cn(
                'py-2.5 px-3 border-2 font-mono text-xs font-black uppercase tracking-wider transition-all duration-100',
                isSelected
                  ? 'bg-brutal-yellow text-brutal-black border-brutal-black dark:border-brutal-yellow shadow-brutal-sm'
                  : 'bg-brutal-white dark:bg-brutal-dark text-brutal-muted dark:text-brutal-muted-dark hover:text-brutal-black dark:hover:text-brutal-white border-brutal-black/30 dark:border-brutal-yellow/30 hover:border-brutal-black dark:hover:border-brutal-yellow',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
