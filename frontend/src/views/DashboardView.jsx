import React from 'react';
import { 
  ShieldCheck, 
  Key, 
  Layers, 
  CheckCircle2, 
  Clock, 
  FileCheck,
  Building,
  User,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import HealthCard from '../components/HealthCard';

export default function DashboardView() {
  const { user } = useAuth();

  const role = user?.roles?.[0];
  const permissions = role?.permissions || [];

  const m1Capabilities = [
    { title: 'Frontend & Backend Startup', status: 'Active', desc: 'React Vite SPA & FastAPI ASGI running with zero errors.' },
    { title: 'Configuration Management', status: 'Active', desc: 'Pydantic Settings with .env parsing, dev/prod secret validation.' },
    { title: 'PostgreSQL Connectivity', status: 'Active', desc: 'SQLAlchemy 2.0 Async engine with pooling and health monitoring.' },
    { title: 'Database Migrations', status: 'Active', desc: 'Alembic versioned migrations with auto-schema evolution.' },
    { title: 'Health & Readiness Probes', status: 'Active', desc: '/api/v1/healthz and /api/v1/readyz with live DB latency check.' },
    { title: 'Structured Error Handling', status: 'Active', desc: 'Standard error envelope with correlation IDs and HTTP status mapping.' },
    { title: 'Structured Observability', status: 'Active', desc: 'ContextVar correlation IDs propagated across logs and audit events.' },
    { title: 'Authentication & RBAC', status: 'Active', desc: 'Bcrypt hashing, stateless JWT tokens, server-enforced ASVS guards.' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Welcome & Persona Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(2, 132, 199, 0.15) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-info" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {role?.name || 'Active Persona'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              • Code: <code style={{ color: 'var(--primary)' }}>{role?.code}</code>
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.35rem', color: '#fff' }}>
            Welcome, {user?.full_name}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Authenticated under institutional scope • Account: {user?.email}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Assigned Roles</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
              {user?.roles?.length || 0}
            </div>
          </div>
          <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Granted Permissions</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--status-success)' }}>
              {role?.code === 'platform_admin' ? 'ALL (Superuser)' : permissions.length}
            </div>
          </div>
        </div>
      </div>

      {/* Live System Health */}
      <HealthCard />

      {/* Grid: M1 Foundation Checklist & Effective Permissions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Foundation Slices Verification */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <CheckCircle2 size={20} color="var(--status-success)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Milestone 1 Foundation Slice</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {m1Capabilities.map((cap, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                    {cap.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {cap.desc}
                  </div>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                  {cap.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Server-Enforced RBAC Permissions */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Key size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Effective Security Permissions</h2>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              OWASP ASVS 4.1 Enforced
            </span>
          </div>

          {role?.code === 'platform_admin' ? (
            <div style={{ padding: '1rem', background: 'rgba(56, 189, 248, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(56, 189, 248, 0.25)', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                Full Platform Administrative Delegation
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                This persona bypasses individual route guards with unrestricted administrative authorization across all organizational scopes.
              </div>
            </div>
          ) : null}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.6rem' }}>
            {permissions.map((p) => (
              <div
                key={p.code}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                  {p.code}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  {p.description}
                </div>
              </div>
            ))}
          </div>

          {permissions.length === 0 && role?.code !== 'platform_admin' && (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No custom permissions granted for this role.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
