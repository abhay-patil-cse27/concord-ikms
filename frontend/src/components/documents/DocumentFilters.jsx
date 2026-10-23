import React from 'react';
import { Filter, Search } from 'lucide-react';
import { BrutalInput, BrutalTabs } from '../brutal';

/**
 * DocumentFilters
 * Controls for switching queues (All vs Pending), selecting department scope, and search filtering.
 */
export default function DocumentFilters({
  activeFilterTab,
  setActiveFilterTab,
  allCount,
  pendingCount,
  isApprover,
  selectedDept,
  setSelectedDept,
  departments,
  searchQuery,
  setSearchQuery,
}) {
  const tabs = [
    { id: 'all', label: `All Documents (${allCount})` },
    ...(isApprover
      ? [{ id: 'pending', label: `Pending Review (${pendingCount})`, badge: pendingCount > 0 ? String(pendingCount) : null }]
      : []),
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      {/* Queue Tabs */}
      <div className="flex-shrink-0">
        <BrutalTabs
          tabs={tabs}
          activeTab={activeFilterTab}
          onChange={setActiveFilterTab}
        />
      </div>

      {/* Search & Department Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Field */}
        <div className="w-full sm:w-64">
          <BrutalInput
            placeholder="Search documents by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="py-1.5 text-xs"
          />
        </div>

        {/* Department Dropdown */}
        <div className="flex items-center gap-2 bg-brutal-white dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm px-3 py-1.5">
          <Filter size={14} className="text-brutal-black dark:text-brutal-yellow flex-shrink-0" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-transparent font-mono text-xs font-bold uppercase text-brutal-black dark:text-brutal-white outline-none cursor-pointer border-none p-0 w-full"
            aria-label="Filter by department"
          >
            <option value="" className="bg-brutal-white dark:bg-brutal-dark text-brutal-black dark:text-brutal-white">
              All Departments
            </option>
            {departments.map((d) => (
              <option
                key={d.id}
                value={d.id}
                className="bg-brutal-white dark:bg-brutal-dark text-brutal-black dark:text-brutal-white"
              >
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
