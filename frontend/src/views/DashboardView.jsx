import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Layers, 
  CheckCircle2, 
  Clock, 
  FileCheck,
  Building,
  User,
  AlertCircle,
  Cpu,
  Cloud,
  Server,
  Activity,
  RefreshCw,
  Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import HealthCard from '../components/HealthCard';
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';

/**
 * DashboardView
 * Redesigned in pure Yellow Brutalist aesthetics with zero inline styles.
 * Features Milestone 11 Dual-Mode LLM Engine Management (Cloud vs Local/Remote Node).
 */
export default function DashboardView() {
  const { user } = useAuth();
  const [reseedStatus, setReseedStatus] = useState(null);

  // Dual-Mode LLM State (Milestone 11)
  const [llmConfig, setLlmConfig] = useState(null);
  const [localUrlInput, setLocalUrlInput] = useState('http://127.0.0.1:11434');
  const [localModelInput, setLocalModelInput] = useState('qwen2.5:1.5b');
  const [isSavingLLM, setIsSavingLLM] = useState(false);
  const [probeStatus, setProbeStatus] = useState(null); // { reachable: bool, latency_ms, status_message, models }
  const [isProbing, setIsProbing] = useState(false);

  const role = user?.roles?.[0];
  const permissions = role?.permissions || [];
  const isAdmin = role?.code === 'platform_admin';

  // Load LLM configuration on mount if admin
  useEffect(() => {
    if (isAdmin) {
      loadLLMConfig();
    }
  }, [isAdmin]);

  const loadLLMConfig = async () => {
    try {
      const res = await api.getLLMConfig();
      if (res?.config) {
        setLlmConfig(res.config);
        setLocalUrlInput(res.config.local_url || 'http://127.0.0.1:11434');
        setLocalModelInput(res.config.local_model || 'qwen2.5:1.5b');
      }
    } catch (err) {
      console.warn('Failed to fetch LLM config:', err.message);
    }
  };

  const handleToggleMode = async (targetMode) => {
    setIsSavingLLM(true);
    try {
      const res = await api.updateLLMConfig({ provider_mode: targetMode });
      if (res?.config) {
        setLlmConfig(res.config);
      }
    } catch (err) {
      alert(`Failed to switch mode: ${err.message}`);
    } finally {
      setIsSavingLLM(false);
    }
  };

  const handleSaveNodeSettings = async () => {
    setIsSavingLLM(true);
    try {
      const res = await api.updateLLMConfig({
        local_url: localUrlInput,
        local_model: localModelInput,
      });
      if (res?.config) {
        setLlmConfig(res.config);
        alert('Inference node configuration updated successfully!');
      }
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setIsSavingLLM(false);
    }
  };

  const handleProbeNode = async () => {
    setIsProbing(true);
    setProbeStatus(null);
    try {
      const res = await api.testLLMNode({
        node_url: localUrlInput,
        timeout_seconds: 5.0,
      });
      setProbeStatus(res);
    } catch (err) {
      setProbeStatus({
        reachable: false,
        latency_ms: 0,
        status_message: err.message || 'Probe request failed',
        models: [],
      });
    } finally {
      setIsProbing(false);
    }
  };

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

  const activeMode = llmConfig?.provider_mode || 'cloud';

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

      {/* Milestone 11: Dual-Mode LLM Engine Controller (Platform Admin Only) */}
      {isAdmin && (
        <BrutalCard
          title="Dual-Mode LLM Engine Controller"
          subtitle="Dynamic Inference Routing • Cloud API vs Local / Remote OpenAI Node"
          badge="Milestone 11"
          headerVariant="yellow"
          className="p-0"
          bodyClassName="p-6 flex flex-col gap-6"
        >
          {/* Top Engine Mode Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-2 border-brutal-black bg-brutal-paper dark:bg-brutal-dark-surface shadow-brutal-sm">
            <div>
              <div className="font-display font-black text-sm uppercase tracking-tight flex items-center gap-2 text-brutal-black dark:text-brutal-white">
                <Cpu size={18} className="text-brutal-black dark:text-brutal-yellow" />
                Active Inference Routing Strategy
              </div>
              <p className="font-mono text-xs text-brutal-muted dark:text-brutal-muted-dark mt-0.5">
                Switching routes institutional queries immediately with zero server downtime.
              </p>
            </div>

            {/* Segmented Mode Control */}
            <div className="flex items-center border-2 border-brutal-black shadow-brutal-sm bg-brutal-white">
              <button
                type="button"
                disabled={isSavingLLM}
                onClick={() => handleToggleMode('cloud')}
                className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-black uppercase transition-colors ${
                  activeMode === 'cloud'
                    ? 'bg-brutal-yellow text-brutal-black'
                    : 'bg-brutal-white text-brutal-black/70 hover:bg-brutal-paper'
                }`}
              >
                <Cloud size={14} />
                Cloud API (Groq)
              </button>
              <button
                type="button"
                disabled={isSavingLLM}
                onClick={() => handleToggleMode('local')}
                className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-black uppercase border-l-2 border-brutal-black transition-colors ${
                  activeMode === 'local'
                    ? 'bg-brutal-black text-brutal-yellow'
                    : 'bg-brutal-white text-brutal-black/70 hover:bg-brutal-paper'
                }`}
              >
                <Server size={14} />
                Local / Remote Node
              </button>
            </div>
          </div>

          {/* Node Settings & Health Beacon Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Target Node Config */}
            <div className="flex flex-col gap-4 p-4 border-2 border-brutal-black/40 dark:border-brutal-yellow/30 bg-brutal-white dark:bg-brutal-dark-surface">
              <div className="font-mono text-xs font-black uppercase text-brutal-black dark:text-brutal-white flex items-center gap-2">
                <Server size={14} className="text-brutal-black dark:text-brutal-yellow" />
                OpenAI-Compatible Node Configuration
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[11px] font-bold uppercase text-brutal-muted dark:text-brutal-muted-dark">
                  Node URL (Ollama / vLLM / Lab PC / Tunnel)
                </label>
                <input
                  type="text"
                  value={localUrlInput}
                  onChange={(e) => setLocalUrlInput(e.target.value)}
                  placeholder="http://127.0.0.1:11434"
                  className="font-mono text-xs p-2 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-white dark:bg-brutal-dark text-brutal-black dark:text-brutal-white focus:outline-none focus:ring-2 focus:ring-brutal-yellow"
                />
                <span className="font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark">
                  Example: <code>http://127.0.0.1:11434</code> (laptop), <code>http://192.168.1.50:11434</code> (lab PC), or Cloudflare tunnel.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[11px] font-bold uppercase text-brutal-muted dark:text-brutal-muted-dark">
                  Model Identifier / Tag
                </label>
                <input
                  type="text"
                  value={localModelInput}
                  onChange={(e) => setLocalModelInput(e.target.value)}
                  placeholder="qwen2.5:1.5b"
                  className="font-mono text-xs p-2 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-white dark:bg-brutal-dark text-brutal-black dark:text-brutal-white focus:outline-none focus:ring-2 focus:ring-brutal-yellow"
                />
                <span className="font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark">
                  Recommended for 8GB laptop: <strong>qwen2.5:1.5b</strong> (~1.2GB RAM). Fits with zero laptop hanging.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <BrutalButton
                  variant="primary"
                  size="sm"
                  disabled={isSavingLLM}
                  onClick={handleSaveNodeSettings}
                >
                  {isSavingLLM ? 'Saving...' : 'Apply Node Settings'}
                </BrutalButton>
                <BrutalButton
                  variant="outline"
                  size="sm"
                  icon={Radio}
                  disabled={isProbing}
                  onClick={handleProbeNode}
                >
                  {isProbing ? 'Probing...' : 'Test Connection'}
                </BrutalButton>
              </div>
            </div>

            {/* Right: Live Diagnostics Beacon */}
            <div className="flex flex-col justify-between p-4 border-2 border-brutal-black/40 dark:border-brutal-yellow/30 bg-brutal-paper/60 dark:bg-brutal-dark-surface">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-black uppercase text-brutal-black dark:text-brutal-white flex items-center gap-2">
                    <Activity size={14} />
                    Live Node Diagnostic Beacon
                  </div>
                  {probeStatus ? (
                    <BrutalBadge tone={probeStatus.reachable ? 'green' : 'red'}>
                      {probeStatus.reachable ? 'ONLINE' : 'UNREACHABLE'}
                    </BrutalBadge>
                  ) : (
                    <BrutalBadge tone="black">AWAITING TEST</BrutalBadge>
                  )}
                </div>

                <div className="p-3 border-2 border-brutal-black bg-brutal-white dark:bg-brutal-dark shadow-brutal-sm font-mono text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-brutal-muted">Target Host:</span>
                    <span className="font-bold truncate max-w-[200px]">{localUrlInput}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brutal-muted">Status:</span>
                    <span className={probeStatus?.reachable ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>
                      {probeStatus?.status_message || 'Click "Test Connection" to probe node health'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brutal-muted">Roundtrip Latency:</span>
                    <span className="font-bold">{probeStatus ? `${probeStatus.latency_ms} ms` : '—'}</span>
                  </div>
                </div>

                {probeStatus?.models && probeStatus.models.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] font-bold uppercase text-brutal-muted">
                      Detected Models on Node ({probeStatus.models.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {probeStatus.models.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setLocalModelInput(m)}
                          className="font-mono text-[10px] px-2 py-0.5 border border-brutal-black bg-brutal-yellow/60 hover:bg-brutal-yellow transition-colors font-bold"
                          title="Click to select this model"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-brutal-black/20 font-mono text-[10px] text-brutal-muted">
                Engine operates on standard OpenAI <code>/v1/chat/completions</code>. Completely detachable for future cloud or college lab server migration.
              </div>
            </div>
          </div>
        </BrutalCard>
      )}

      {/* Admin Demo Management Bar */}
      {isAdmin && (
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
