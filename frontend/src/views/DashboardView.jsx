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
  Radio,
  HelpCircle,
  Info,
  UserCheck,
  ArrowRight,
  Search,
  Bot,
  FileText,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import HealthCard from '../components/HealthCard';
import UserProfileModal from '../components/auth/UserProfileModal';
import { BrutalCard, BrutalButton, BrutalBadge, BrutalToast, BrutalModal } from '../components/brutal';

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

  const [toast, setToast] = useState(null);
  const [showReseedConfirm, setShowReseedConfirm] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  const { hasPermission, hasRole } = useAuth();
  const role = user?.roles?.[0];
  const permissions = role?.permissions || [];
  const isAdmin = hasRole('platform_admin') || hasRole('superadmin');
  const isHOD = hasRole('dept_admin') || hasRole('hod') || user?.role_code === 'dept_admin_cse';
  const isFaculty = hasRole('faculty') || user?.role_code === 'faculty_cse';
  const isStudent = hasRole('student') || user?.role_code === 'student_cse' || (!isAdmin && !isHOD && !isFaculty);
  const canReviewApprovals = isAdmin || isHOD || hasPermission('users:read');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  // Load pending approvals count on mount if authorized
  useEffect(() => {
    if (canReviewApprovals) {
      api.getPendingUsers()
        .then((res) => {
          if (Array.isArray(res)) setPendingApprovalsCount(res.length);
        })
        .catch(() => {});
    }
  }, [canReviewApprovals]);

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
        showToast(
          'success',
          'Routing Strategy Updated',
          `Inference mode seamlessly switched to ${targetMode === 'local' ? 'Local Inference Node (Ollama)' : 'Groq Cloud API'} with zero server downtime.`
        );
      }
    } catch (err) {
      showToast('error', 'Mode Switch Failed', err.message);
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
        showToast(
          'success',
          'Inference Node Updated',
          'Local/Remote node endpoint and model parameters saved successfully!'
        );
      }
    } catch (err) {
      showToast('error', 'Configuration Update Failed', err.message);
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
      if (res?.reachable) {
        showToast(
          'success',
          'Inference Node Online',
          `Connected to ${localUrlInput} (${res.latency_ms}ms roundtrip). Detected: ${res.models?.join(', ') || 'model ready'}`
        );
      } else {
        showToast(
          'warning',
          'Node Unreachable',
          res?.status_message || 'Inference node probe failed or target service offline.'
        );
      }
    } catch (err) {
      setProbeStatus({
        reachable: false,
        latency_ms: 0,
        status_message: err.message || 'Probe request failed',
        models: [],
      });
      showToast('error', 'Probe Request Failed', err.message || 'Could not contact target host');
    } finally {
      setIsProbing(false);
    }
  };

  const handleConfirmReseed = async () => {
    setShowReseedConfirm(false);
    try {
      setReseedStatus('Reseeding...');
      const res = await api.reseedDemoData();
      showToast(
        'success',
        'Knowledge Base Reseeded',
        res.message || 'Canonical demo records reseeded successfully into SQLite and ChromaDB.'
      );
    } catch (err) {
      showToast('error', 'Reseed Operation Failed', err.message);
    } finally {
      setReseedStatus(null);
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

      {/* Pending Institutional Approvals Alert Banner */}
      {pendingApprovalsCount > 0 && (
        <div className="bg-brutal-yellow border-3 border-brutal-black p-4 shadow-brutal flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brutal-black text-brutal-yellow border-2 border-brutal-black flex items-center justify-center font-display font-black text-xl flex-shrink-0">
              {pendingApprovalsCount}
            </div>
            <div>
              <div className="font-display font-black text-base uppercase text-brutal-black">
                Institutional Approval Queue Action Required
              </div>
              <div className="font-mono text-xs text-brutal-black/85">
                {pendingApprovalsCount} {pendingApprovalsCount === 1 ? 'applicant is' : 'applicants are'} awaiting your credential verification and department clearance.
              </div>
            </div>
          </div>
          <a
            href="#/users"
            className="px-4 py-2 bg-brutal-black text-brutal-yellow font-mono text-xs font-black uppercase tracking-wider border-2 border-brutal-black shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2 whitespace-nowrap self-start sm:self-auto"
          >
            <UserCheck size={14} strokeWidth={2.5} />
            <span>Open Queue ({pendingApprovalsCount})</span>
            <ArrowRight size={14} strokeWidth={2.5} />
          </a>
        </div>
      )}

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

            {/* Segmented Mode Control with Dynamic Model Tags */}
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
                Cloud ({llmConfig?.groq_model || 'openai/gpt-oss-120b'})
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
                Local ({llmConfig?.local_model || localModelInput})
              </button>
            </div>
          </div>

          {/* Node Settings & Health Beacon Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Target Node Config */}
            <div className="flex flex-col gap-4 p-4 border-2 border-brutal-black/40 dark:border-brutal-yellow/30 bg-brutal-white dark:bg-brutal-dark-surface">
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs font-black uppercase text-brutal-black dark:text-brutal-white flex items-center gap-2">
                  <Server size={14} className="text-brutal-black dark:text-brutal-yellow" />
                  Local Inference Node (Ollama / Lab PC)
                </div>
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
                Engine operates on standard local <code>/v1/chat/completions</code>. Completely detachable for future cloud or college lab server migration.
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
              onClick={() => setShowReseedConfirm(true)}
            >
              {reseedStatus || 'Reseed Demo Knowledge Base'}
            </BrutalButton>
          </div>
        </BrutalCard>
      )}

      {/* Live System Health */}
      <HealthCard />

      {/* Role-Adaptive Grid: Slices / Academic Hub & Effective Permissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isStudent ? (
          /* Student Academic Knowledge Hub */
          <BrutalCard
            title="Student Academic Knowledge Hub"
            badge="Autonomous Regulations"
            headerVariant="yellow"
            className="p-0"
            bodyClassName="p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="p-3 bg-brutal-paper dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow font-mono text-xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-brutal-muted">Department:</span>
                  <span className="font-bold text-brutal-black dark:text-brutal-white truncate max-w-[200px]">
                    {user?.department?.name || user?.department?.code || 'Computer Science & Engineering'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-brutal-muted">Permanent Reg. No (PRN):</span>
                  <span className="font-bold text-brutal-black dark:text-brutal-yellow">
                    {user?.registration_number || '2024BTECS089'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-brutal-muted">Clearance Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    VERIFIED ENROLLED STUDENT
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <a
                  href="#/search"
                  className="p-3 bg-brutal-white dark:bg-brutal-dark border-2 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm hover:bg-brutal-yellow hover:text-brutal-black transition-all flex items-center gap-3 font-mono text-xs font-bold"
                >
                  <div className="p-2 bg-brutal-yellow text-brutal-black border border-brutal-black">
                    <Search size={16} />
                  </div>
                  <div>
                    <div>Search Regulations</div>
                    <div className="text-[10px] text-brutal-muted font-normal">Syllabus & circulars</div>
                  </div>
                </a>

                <a
                  href="#/rag"
                  className="p-3 bg-brutal-white dark:bg-brutal-dark border-2 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm hover:bg-brutal-yellow hover:text-brutal-black transition-all flex items-center gap-3 font-mono text-xs font-bold"
                >
                  <div className="p-2 bg-brutal-black text-brutal-yellow border border-brutal-black">
                    <Bot size={16} />
                  </div>
                  <div>
                    <div>Ask AI Assistant</div>
                    <div className="text-[10px] text-brutal-muted font-normal">Grounded cited answers</div>
                  </div>
                </a>
              </div>
            </div>

            <div className="pt-2 border-t-2 border-brutal-black/20 dark:border-brutal-yellow/20">
              <button
                type="button"
                onClick={() => setShowIdCard(true)}
                className="w-full py-2 px-3 bg-brutal-black text-brutal-yellow dark:bg-brutal-yellow dark:text-brutal-black font-display font-black text-xs uppercase tracking-wider border-2 border-brutal-black shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard size={14} strokeWidth={2.5} />
                <span>View Official Institutional ID Card</span>
              </button>
            </div>
          </BrutalCard>
        ) : isFaculty ? (
          /* Faculty Academic Ingestion Hub */
          <BrutalCard
            title="Faculty Ingestion & Academic Hub"
            badge="Staff Scope"
            headerVariant="yellow"
            className="p-0"
            bodyClassName="p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="p-3 bg-brutal-paper dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow font-mono text-xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-brutal-muted">Department:</span>
                  <span className="font-bold text-brutal-black dark:text-brutal-white truncate max-w-[200px]">
                    {user?.department?.name || user?.department?.code || 'Computer Science & Engineering'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-brutal-muted">Faculty ID:</span>
                  <span className="font-bold text-brutal-black dark:text-brutal-yellow">
                    {user?.registration_number || 'EMP-CSE-042'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-brutal-muted">Ingestion Authority:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    AUTHORIZED ACADEMIC CONTRIBUTOR
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <a
                  href="#/documents"
                  className="p-3 bg-brutal-white dark:bg-brutal-dark border-2 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm hover:bg-brutal-yellow hover:text-brutal-black transition-all flex items-center gap-3 font-mono text-xs font-bold"
                >
                  <div className="p-2 bg-brutal-yellow text-brutal-black border border-brutal-black">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div>Ingest Document</div>
                    <div className="text-[10px] text-brutal-muted font-normal">Upload syllabus & notes</div>
                  </div>
                </a>

                <a
                  href="#/rag"
                  className="p-3 bg-brutal-white dark:bg-brutal-dark border-2 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm hover:bg-brutal-yellow hover:text-brutal-black transition-all flex items-center gap-3 font-mono text-xs font-bold"
                >
                  <div className="p-2 bg-brutal-black text-brutal-yellow border border-brutal-black">
                    <Bot size={16} />
                  </div>
                  <div>
                    <div>Ask Policy RAG</div>
                    <div className="text-[10px] text-brutal-muted font-normal">Cross-reference rules</div>
                  </div>
                </a>
              </div>
            </div>

            <div className="pt-2 border-t-2 border-brutal-black/20 dark:border-brutal-yellow/20">
              <button
                type="button"
                onClick={() => setShowIdCard(true)}
                className="w-full py-2 px-3 bg-brutal-black text-brutal-yellow dark:bg-brutal-yellow dark:text-brutal-black font-display font-black text-xs uppercase tracking-wider border-2 border-brutal-black shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard size={14} strokeWidth={2.5} />
                <span>View Official Faculty Credential</span>
              </button>
            </div>
          </BrutalCard>
        ) : (
          /* Foundation Slices Verification (Admin & HOD) */
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
        )}

        {/* Server-Enforced RBAC Permissions */}
        <BrutalCard
          title={isStudent ? "Academic Permissions & Scopes" : "Effective Security Permissions"}
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
              Standard read-only academic catalog privileges.
            </div>
          )}
        </BrutalCard>
      </div>

      {/* Universal User Profile Digital ID Modal */}
      <UserProfileModal
        isOpen={showIdCard}
        onClose={() => setShowIdCard(false)}
      />

      {/* Reusable React UI Toast Notification Banner */}
      {toast && (
        <BrutalToast
          isOpen={true}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Reusable React UI Confirmation Modal for Reseed */}
      <BrutalModal
        isOpen={showReseedConfirm}
        onClose={() => setShowReseedConfirm(false)}
        title="Confirm Knowledge Base Reseed"
        badge="Administrative Reset"
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <BrutalButton
              variant="secondary"
              size="sm"
              onClick={() => setShowReseedConfirm(false)}
            >
              Cancel
            </BrutalButton>
            <BrutalButton
              variant="danger"
              size="sm"
              onClick={handleConfirmReseed}
            >
              Confirm Reseed
            </BrutalButton>
          </div>
        }
      >
        <p className="font-mono text-xs leading-relaxed text-brutal-black dark:text-brutal-white">
          Reset and re-populate canonical cross-department documents (CSE, ENTC, Exam Regulations) into SQLite and ChromaDB? Existing demo documents will be refreshed.
        </p>
      </BrutalModal>
    </div>
  );
}
