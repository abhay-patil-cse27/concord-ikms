import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw, KeyRound, Clock } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AuditLogsView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditEvents(50);
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Security Audit Trail & Compliance Events
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Tamper-resistant audit log of authentication, authorization, and administrative events.
          </p>
        </div>

        <button onClick={fetchLogs} disabled={loading} className="btn btn-secondary" style={{ padding: '0.55rem 1rem' }}>
          <RefreshCw size={14} className={loading ? 'pulse-glow' : ''} />
          Refresh Audit Trail
        </button>
      </div>

      {error ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: 'var(--status-danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', color: 'var(--status-danger)' }}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      ) : loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Querying audit logs...</div>
      ) : events.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
          No audit records found.
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-dim)', fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-dim)', fontWeight: 600 }}>Security Action</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-dim)', fontWeight: 600 }}>Target Resource</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-dim)', fontWeight: 600 }}>Actor ID</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-dim)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-dim)', fontWeight: 600 }}>Request ID</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt) => (
                <tr key={evt.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                    {new Date(evt.created_at).toLocaleTimeString()} • {new Date(evt.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                    {evt.action}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)' }}>
                    <span style={{ padding: '0.15rem 0.45rem', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', fontSize: '0.75rem' }}>
                      {evt.resource_type}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {evt.user_id ? evt.user_id.slice(0, 8) + '...' : 'system'}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem' }}>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                      {evt.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {evt.request_id || 'n/a'}
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
