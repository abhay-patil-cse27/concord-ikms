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
      <label className="block font-mono text-[11px] font-black uppercase tracking-wider mb-2 text-brutal-black dark:text-brutal-white">
        Institutional Persona / Role:
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
                'py-2 px-3 border-2 font-mono text-xs font-bold uppercase transition-all',
                isSelected
                  ? 'bg-brutal-yellow text-brutal-black border-brutal-black shadow-[2px_2px_0px_#0A0A0A]'
                  : 'bg-transparent text-brutal-muted hover:text-brutal-black dark:hover:text-brutal-white border-brutal-black/20 dark:border-brutal-yellow/20',
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

