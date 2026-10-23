import React, { useState } from 'react';
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
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';

/**
 * DashboardView
 * Redesigned in pure Yellow Brutalist aesthetics with zero inline styles.
 */
export default function DashboardView() {
  const { user } = useAuth();
  const [reseedStatus, setReseedStatus] = useState(null);

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
    <div className="flex flex-col gap-6">
      {/* Welcome & Persona Hero Card */}
      <BrutalCard
        variant="yellow"
        className="p-6 md:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center gap-2 mb-2">
              <BrutalBadge tone="black">
                {role?.name || 'Active Persona'}
              </BrutalBadge>
              <span className="font-mono text-xs font-bold text-brutal-black/80">
                • Code: <strong>{role?.code || 'platform_admin'}</strong>
              </span>
            </div>

            <h1 className="font-display font-black text-2xl md:text-4xl uppercase tracking-tight text-brutal-black mb-2">
              Welcome, {user?.full_name}
            </h1>

            <p className="font-mono text-xs md:text-sm text-brutal-black/85">
              Authenticated under institutional scope • Account: <span className="font-bold underline">{user?.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-brutal-white border-2 border-brutal-black shadow-brutal-sm p-3 min-w-[120px] text-right">
              <div className="font-mono text-[10px] font-black uppercase text-brutal-muted">Assigned Roles</div>
              <div className="font-mono text-2xl font-black text-brutal-black">{user?.roles?.length || 1}</div>
            </div>

            <div className="bg-brutal-white border-2 border-brutal-black shadow-brutal-sm p-3 min-w-[140px] text-right">
              <div className="font-mono text-[10px] font-black uppercase text-brutal-muted">Granted Permissions</div>
              <div className="font-mono text-2xl font-black text-brutal-black">
                {role?.code === 'platform_admin' ? 'ALL' : permissions.length}
              </div>
            </div>
          </div>
        </div>
      </BrutalCard>

      {/* Admin Demo Management Bar */}
      {role?.code === 'platform_admin' && (
        <BrutalCard
          variant="default"
          className="p-4"
          headerVariant="yellow"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="font-display font-black text-sm uppercase tracking-tight flex items-center gap-2 text-brutal-black dark:text-brutal-white">
                <ShieldCheck size={18} className="text-brutal-black dark:text-brutal-yellow" />
                Institutional Demo Evaluator Controls
              </div>
              <p className="font-mono text-xs text-brutal-muted dark:text-brutal-muted-dark mt-0.5">
                Reset and re-populate canonical cross-department documents (CSE, ENTC, Exam Regulations) into SQLite and ChromaDB.
              </p>
            </div>

            <BrutalButton
              variant="primary"
              size="sm"
              icon={Layers}
              onClick={async () => {
                if (window.confirm('Reset and re-populate canonical demo knowledge records into SQLite and ChromaDB?')) {
                  try {
                    setReseedStatus('Reseeding...');
                    const res = await api.reseedDemoData();
                    alert(res.message || 'Demo records reseeded successfully!');
                  } catch (err) {
                    alert(`Reseed failed: ${err.message}`);
                  } finally {
                    setReseedStatus(null);
                  }
                }
              }}
            >
              {reseedStatus || 'Reseed Demo Knowledge Base'}
            </BrutalButton>
          </div>
        </BrutalCard>
      )}

      {/* Live System Health */}
      <HealthCard />

      {/* Grid: M1 Foundation Checklist & Effective Permissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Foundation Slices Verification */}
        <BrutalCard
          title="Milestone 1 Foundation Slice"
          badge="Active"
          headerVariant="default"
          className="p-0"
          bodyClassName="p-4 flex flex-col gap-2.5"
        >
          {m1Capabilities.map((cap, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 p-3 border-2 border-brutal-black/20 dark:border-brutal-yellow/20 bg-brutal-paper/50 dark:bg-brutal-dark-surface"
            >
              <div>
                <div className="font-mono text-xs font-black uppercase text-brutal-black dark:text-brutal-white">
                  {cap.title}
                </div>
                <div className="font-mono text-[11px] text-brutal-muted dark:text-brutal-muted-dark mt-0.5">
                  {cap.desc}
                </div>
              </div>
              <BrutalBadge tone="green" size="sm">
                {cap.status}
              </BrutalBadge>
            </div>
          ))}
        </BrutalCard>

        {/* Server-Enforced RBAC Permissions */}
        <BrutalCard
          title="Effective Security Permissions"
          subtitle="OWASP ASVS 4.1 Enforced"
          badge="RBAC"
          headerVariant="default"
          className="p-0"
          bodyClassName="p-4 flex flex-col gap-4"
        >
          {role?.code === 'platform_admin' && (
            <div className="p-3 bg-brutal-yellow border-2 border-brutal-black shadow-brutal-sm">
              <div className="font-display font-black text-xs uppercase text-brutal-black">
                Full Platform Administrative Delegation
              </div>
              <div className="font-mono text-[11px] text-brutal-black/85 mt-0.5">
                This persona bypasses individual route guards with unrestricted administrative authorization across all organizational scopes.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {permissions.map((p) => (
              <div
                key={p.code}
                className="p-2.5 border-2 border-brutal-black/30 dark:border-brutal-yellow/30 bg-brutal-paper dark:bg-brutal-dark-surface"
              >
                <div className="font-mono text-xs font-black text-brutal-black dark:text-brutal-yellow">
                  {p.code}
                </div>
                <div className="font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark mt-0.5">
                  {p.description}
                </div>
              </div>
            ))}
          </div>

          {permissions.length === 0 && role?.code !== 'platform_admin' && (
            <div className="p-4 text-center font-mono text-xs text-brutal-muted">
              No custom permissions granted for this role.
            </div>
          )}
        </BrutalCard>
      </div>
    </div>
  );
}
