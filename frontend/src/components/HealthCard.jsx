import React, { useState, useEffect } from 'react';
import { Activity, Database, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';

export default function HealthCard() {
  const [health, setHealth] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = () => {
    setLoading(true);
    Promise.all([
      api.getHealth().catch((e) => ({ status: 'down', error: e.message })),
      api.getReadiness().catch((e) => ({ status: 'down', error: e.message })),
    ]).then(([h, r]) => {
      setHealth(h);
      setReadiness(r);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const isHealthy = health?.status === 'healthy';
  const isDbReady = readiness?.status === 'ready' && readiness?.checks?.database?.status === 'connected';

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Activity size={18} color="var(--primary)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            System Runtime Health
          </span>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {loading ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* API Core */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          {isHealthy ? (
            <CheckCircle2 size={20} color="var(--status-success)" />
          ) : (
            <AlertTriangle size={20} color="var(--status-danger)" />
          )}
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>FastAPI Gateway</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isHealthy ? 'var(--status-success)' : 'var(--status-danger)' }}>
              {isHealthy ? `Operational (${health?.version})` : 'Service Unavailable'}
            </div>
          </div>
        </div>

        {/* Database Engine */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <Database size={20} color={isDbReady ? 'var(--primary)' : 'var(--status-danger)'} />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PostgreSQL & Migrations</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isDbReady ? 'var(--text-main)' : 'var(--status-danger)' }}>
              {isDbReady ? `Connected (${readiness.checks.database.latency_ms}ms)` : 'Database Offline'}
            </div>
          </div>
        </div>

        {/* Environment */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-success)', boxShadow: '0 0 8px var(--status-success)' }} />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Profile</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {health?.environment ? health.environment.toUpperCase() : 'DEVELOPMENT'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
