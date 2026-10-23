import React from 'react';
import { Users, Search, Filter } from 'lucide-react';
import { BrutalBadge, BrutalInput, BrutalTabs } from '../brutal';

/**
 * UsersHeader
 * Masthead for User Directory & RBAC Governance.
 */
export default function UsersHeader({
  totalCount,
  activeFilterRole,
  setActiveFilterRole,
  searchQuery,
  setSearchQuery,
}) {
  const tabs = [
    { id: 'all', label: `All Users (${totalCount})` },
    { id: 'platform_admin', label: 'Admins' },
    { id: 'dept_admin', label: 'HODs' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'student', label: 'Students' },
  ];

  return (
    <div className="flex flex-col gap-6 pb-6 border-b-3 border-brutal-black dark:border-brutal-yellow">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BrutalBadge tone="yellow" size="sm">
              IDENTITY GOVERNANCE
            </BrutalBadge>
            <BrutalBadge tone="black" size="sm">
              OWASP ASVS 4.1 RBAC
            </BrutalBadge>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-brutal-black dark:text-brutal-white">
            User Directory & Access Controls
          </h1>
          <p className="font-mono text-xs text-brutal-black/70 dark:text-brutal-white/70 mt-1 max-w-2xl">
            Institutional identities mapped to fine-grained scopes, departmental tenants, and permission boundaries.
          </p>
        </div>

        {/* Search Field */}
        <div className="w-full sm:w-72">
          <BrutalInput
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs py-1.5"
          />
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div>
        <BrutalTabs
          tabs={tabs}
          activeTab={activeFilterRole}
          onChange={setActiveFilterRole}
        />
      </div>
    </div>
  );
}
