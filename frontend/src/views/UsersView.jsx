import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { uiCache } from '../utils/uiCache';
import UsersHeader from '../components/users/UsersHeader';
import UsersTable from '../components/users/UsersTable';
import { BrutalSkeleton, BrutalEmptyState, BrutalToast } from '../components/brutal';

/**
 * UsersView
 * Yellow Brutalist institutional identity directory and RBAC permissions.
 */
export default function UsersView() {
  const cached = uiCache.get(uiCache.KEYS.USERS, {});
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState(() => cached.users || []);
  const [loading, setLoading] = useState(() => !cached.users?.length);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters
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

  useEffect(() => {
    if (!cached.users?.length) {
      fetchUsers();
    }
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
    <div className="w-full space-y-8">
      {/* Toast Feedback */}
      {toast && (
        <BrutalToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

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
              : 'Institutional user accounts will be populated via LDAP / Identity Providers.'
          }
        />
      ) : (
        <UsersTable
          users={filteredUsers}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  );
}
