import React from 'react';
import { Cpu, Cloud, Server, Activity, Radio } from 'lucide-react';
import { BrutalCard, BrutalButton, BrutalBadge } from '../brutal';

/**
 * DualModeEngineCard
 * Modular Yellow Brutalist controller for hot-swapping inference routing
 * between Groq Cloud LLM and local/remote OpenAI-compatible inference nodes.
 */
export default function DualModeEngineCard({
  llmConfig,
  activeMode,
  localUrlInput,
  setLocalUrlInput,
  localModelInput,
  setLocalModelInput,
  isSavingLLM,
  handleToggleMode,
  handleSaveNodeSettings,
  handleProbeNode,
  isProbing,
  probeStatus,
}) {
  return (
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
  );
}
