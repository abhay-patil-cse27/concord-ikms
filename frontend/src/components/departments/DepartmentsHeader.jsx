import React from 'react';
import { Building2, Plus, Layers } from 'lucide-react';
import { BrutalButton, BrutalBadge } from '../brutal';

/**
 * DepartmentsHeader
 * Masthead for Institutional Departments & Tenancy view.
 */
export default function DepartmentsHeader({ totalCount, canWrite, onOpenCreate }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b-3 border-brutal-black dark:border-brutal-yellow">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BrutalBadge tone="yellow" size="sm">
            ORGANIZATIONAL TENANCY
          </BrutalBadge>
          <BrutalBadge tone="black" size="sm">
            {totalCount} DEPARTMENTS
          </BrutalBadge>
          <BrutalBadge tone="success" size="sm">
            RBAC ENFORCED
          </BrutalBadge>
        </div>

        <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-brutal-black dark:text-brutal-white">
          Departments & Tenancy Scopes
        </h1>
        <p className="font-mono text-xs text-brutal-black/70 dark:text-brutal-white/70 mt-1 max-w-2xl">
          Organizational units governing document authorization, circular distribution, and cross-tenant isolation gates.
        </p>
      </div>

      {canWrite && (
        <div className="flex-shrink-0">
          <BrutalButton
            variant="primary"
            size="md"
            onClick={onOpenCreate}
            className="flex items-center gap-2 px-5 py-3 shadow-brutal font-black text-xs uppercase"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Department</span>
          </BrutalButton>
        </div>
      )}
    </div>
  );
}
