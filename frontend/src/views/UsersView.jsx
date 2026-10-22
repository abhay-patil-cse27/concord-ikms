import React, { useState, useEffect } from 'react';
import { Users, UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { uiCache } from '../utils/uiCache';

export default function UsersView() {
  const cached = uiCache.get(uiCache.KEYS.USERS, {});
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState(() => cached.users || []);
  const [loading, setLoading] = useState(() => !cached.users?.length);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (users.length > 0) {
      uiCache.set(uiCache.KEYS.USERS, { users });
    }
  }, [users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cached.users?.length) {
      fetchUsers();
    }
  }, []);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Institutional Identity & User Directory
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Users governed by multi-department roles and granular permissions.
          </p>
        </div>
      </div>

      {error ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: 'var(--status-danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', color: 'var(--status-danger)' }}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      ) : loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading institutional users...</div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-dim)', fontWeight: 600 }}>User Identity</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-dim)', fontWeight: 600 }}>Email Address</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-dim)', fontWeight: 600 }}>Assigned Role(s)</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-dim)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-dim)', fontWeight: 600 }}>Registered</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {u.full_name}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {u.roles.map((r) => (
                        <span key={r.code} className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                          {r.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
