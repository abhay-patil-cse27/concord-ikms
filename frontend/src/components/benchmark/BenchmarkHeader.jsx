import React from 'react';
import { motion } from 'framer-motion';
import { Award, ShieldCheck, RefreshCw, Play } from 'lucide-react';
import { BrutalBadge, BrutalButton } from '../brutal';

/**
 * BenchmarkHeader
 * Masthead for Evaluation & Retrieval Benchmarks view with test suite trigger.
 */
export default function BenchmarkHeader({
  onRefresh,
  onRunLive,
  loading = false,
  running = false,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b-3 border-brutal-black dark:border-brutal-yellow">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BrutalBadge tone="yellow" size="sm">
            MILESTONES 7 & 8
          </BrutalBadge>
          <BrutalBadge tone="black" size="sm">
            EMPIRICAL RIGOR
          </BrutalBadge>
          <BrutalBadge tone="success" size="sm">
            INSTITUTIONAL HARDENING
          </BrutalBadge>
        </div>

        <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-brutal-black dark:text-brutal-white">
          Evaluation & Retrieval Benchmarks
        </h1>
        <p className="font-mono text-xs text-brutal-black/70 dark:text-brutal-white/70 mt-1 max-w-2xl">
          Empirical evaluation comparing BM25 Lexical, Dense Vector Embeddings, and CONCORD Hybrid RRF with Cross-Encoder Reranking.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0">
        <BrutalButton
          variant="secondary"
          size="md"
          onClick={onRefresh}
          disabled={running || loading}
          loading={loading}
          className="shadow-brutal-sm text-xs font-black uppercase"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </BrutalButton>

        <BrutalButton
          variant="primary"
          size="md"
          onClick={onRunLive}
          disabled={running}
          loading={running}
          className="shadow-brutal text-xs font-black uppercase flex items-center gap-2"
        >
          {!running && <Play size={14} fill="currentColor" />}
          <span>{running ? 'Executing Suite...' : 'Run Live Benchmark'}</span>
        </BrutalButton>
      </div>
    </div>
  );
}
