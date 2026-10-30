import React, { useState, useEffect } from 'react';
import { Users, UserCheck } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { uiCache } from '../utils/uiCache';
import UsersHeader from '../components/users/UsersHeader';
import UsersTable from '../components/users/UsersTable';
import UserApprovalQueue from '../components/users/UserApprovalQueue';
import { BrutalSkeleton, BrutalEmptyState, BrutalToast } from '../components/brutal';
import { cn } from '../lib/utils';

/**
 * UsersView
 * Yellow Brutalist institutional identity directory, RBAC governance,
 * and Milestone 12 2-Tier Institutional Approval Queue.
 */
export default function UsersView() {
  const cached = uiCache.get(uiCache.KEYS.USERS, {});
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState(() => cached.users || []);
  const [loading, setLoading] = useState(() => !cached.users?.length);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Tab Mode: 'directory' | 'queue'
  const [viewMode, setViewMode] = useState('directory');
  const [pendingCount, setPendingCount] = useState(0);

  // Filters for Directory
  const [activeFilterRole, setActiveFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (users.length > 0) {
      uiCache.set(uiCache.KEYS.USERS, { users });
    }
  }, [users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data || []);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to fetch user directory.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const pending = await api.getPendingUsers();
      if (Array.isArray(pending)) {
        setPendingCount(pending.length);
      }
    } catch {
      // Ignored if unprivileged
    }
  };

  useEffect(() => {
    if (!cached.users?.length) {
      fetchUsers();
    }
    fetchPendingCount();
  }, []);

  const handleToggleStatus = (targetUser) => {
    const action = targetUser.is_active ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} user "${targetUser.full_name}"?`)) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, is_active: !u.is_active } : u
        )
      );
      setToast({
        message: `Account for ${targetUser.full_name} ${action}d.`,
        type: 'info',
      });
    }
  };

  const handleApprovalSuccess = ({ message, type }) => {
    setToast({ message, type });
    setPendingCount((prev) => Math.max(0, prev - 1));
    fetchUsers();
  };

  // Filter users by role tab and search string
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery.trim() ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      activeFilterRole === 'all' ||
      u.roles?.some((r) => r.code === activeFilterRole);

    return matchesSearch && matchesRole;
  });

  return (
    <div className="w-full space-y-6">
      {/* Toast Feedback */}
      {toast && (
        <BrutalToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top View Selector: Directory vs Approval Queue */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setViewMode('directory')}
          className={cn(
            "px-4 py-2 font-display font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-brutal-black dark:border-brutal-yellow transition-all flex items-center gap-2",
            viewMode === 'directory'
              ? "bg-brutal-yellow text-brutal-black shadow-brutal-sm"
              : "bg-brutal-white dark:bg-brutal-dark text-brutal-black dark:text-brutal-white hover:bg-brutal-paper dark:hover:bg-brutal-dark-surface"
          )}
        >
          <Users size={16} strokeWidth={2.5} />
          <span>Active Directory ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('queue')}
          className={cn(
            "px-4 py-2 font-display font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-brutal-black dark:border-brutal-yellow transition-all flex items-center gap-2",
            viewMode === 'queue'
              ? "bg-brutal-yellow text-brutal-black shadow-brutal-sm"
              : "bg-brutal-white dark:bg-brutal-dark text-brutal-black dark:text-brutal-white hover:bg-brutal-paper dark:hover:bg-brutal-dark-surface"
          )}
        >
          <UserCheck size={16} strokeWidth={2.5} />
          <span>Approval Queue</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 bg-brutal-accent text-brutal-white text-[10px] font-mono font-black border border-brutal-black animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {viewMode === 'queue' ? (
        <UserApprovalQueue onActionSuccess={handleApprovalSuccess} />
      ) : (
        <div className="w-full space-y-6">
          {/* Header */}
          <UsersHeader
            totalCount={users.length}
            activeFilterRole={activeFilterRole}
            setActiveFilterRole={setActiveFilterRole}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {/* Error Alert */}
          {error && (
            <div className="p-4 bg-brutal-accent/15 border-3 border-brutal-accent text-brutal-black dark:text-brutal-white font-mono text-xs font-bold">
              {error}
            </div>
          )}

          {/* Table or Loading/Empty States */}
          {loading ? (
            <div className="space-y-4">
              <BrutalSkeleton count={5} height="h-14" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <BrutalEmptyState
              title={searchQuery ? 'No Matching Users Found' : 'User Directory Empty'}
              description={
                searchQuery
                  ? `No user records matched your search query "${searchQuery}".`
                  : 'Institutional user accounts will be populated via self-registration or LDAP.'
              }
            />
          ) : (
            <UsersTable
              users={filteredUsers}
              onToggleStatus={handleToggleStatus}
            />
          )}
        </div>
      )}
    </div>
  );
}
