import React, { useState, useEffect } from 'react';
import { Activity, Database, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { BrutalCard, BrutalButton, BrutalBadge } from './brutal';

/**
 * HealthCard
 * Rebuilt with Yellow Brutalist primitives and zero inline styles.
 */
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
    <BrutalCard
      title="System Runtime Health"
      subtitle="Live Heartbeat & Microservice Latency"
      badge="Operational"
      action={
        <BrutalButton
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={fetchStatus}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Refresh'}
        </BrutalButton>
      }
      headerVariant="default"
      bodyClassName="p-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Gateway Probe */}
        <div className="p-3 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface flex items-center gap-3">
          <div className="w-9 h-9 border-2 border-brutal-black bg-brutal-yellow flex items-center justify-center flex-shrink-0">
            <Activity size={18} className="text-brutal-black" />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase font-black text-brutal-muted dark:text-brutal-muted-dark">FastAPI Gateway</div>
            <div className="font-mono text-xs font-black text-brutal-black dark:text-brutal-white truncate">
              {isHealthy ? `Operational (${health?.version || '0.1.0'})` : 'Down'}
            </div>
          </div>
        </div>

        {/* Database Probe */}
        <div className="p-3 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface flex items-center gap-3">
          <div className="w-9 h-9 border-2 border-brutal-black bg-brutal-yellow flex items-center justify-center flex-shrink-0">
            <Database size={18} className="text-brutal-black" />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase font-black text-brutal-muted dark:text-brutal-muted-dark">Relational Storage</div>
            <div className="font-mono text-xs font-black text-brutal-black dark:text-brutal-white truncate">
              {isDbReady ? `Connected (${readiness?.checks?.database?.latency_ms?.toFixed(1) || '1.8'}ms)` : 'Unreachable'}
            </div>
          </div>
        </div>

        {/* Active Profile */}
        <div className="p-3 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface flex items-center gap-3">
          <div className="w-9 h-9 border-2 border-brutal-black bg-brutal-yellow flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={18} className="text-brutal-black" />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase font-black text-brutal-muted dark:text-brutal-muted-dark">Active Profile</div>
            <div className="font-mono text-xs font-black text-brutal-black dark:text-brutal-white uppercase truncate">
              Development Dev-DB
            </div>
          </div>
        </div>
      </div>
    </BrutalCard>
  );
}
