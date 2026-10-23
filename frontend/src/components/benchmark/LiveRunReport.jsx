import React from 'react';
import { CheckCircle2, Clock, Check, X } from 'lucide-react';
import { BrutalCard, BrutalBadge } from '../brutal';

/**
 * LiveRunReport
 * Details the real-time execution report of live benchmark test queries.
 */
export default function LiveRunReport({ liveResult }) {
  if (!liveResult) return null;

  return (
    <BrutalCard tone="default" className="p-6 border-3 shadow-brutal space-y-4">
      <div className="flex items-center justify-between pb-3 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brutal-success text-brutal-white flex items-center justify-center border-2 border-brutal-black shadow-brutal-sm">
            <CheckCircle2 size={16} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-display font-black text-base uppercase text-brutal-black dark:text-brutal-white">
              Latest Live Benchmark Execution Report
            </h3>
            <span className="font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark uppercase tracking-wider">
              Completed in {liveResult.execution_time_ms}ms
            </span>
          </div>
        </div>

        <BrutalBadge tone="success" size="sm">
          ASSERTIONS: {liveResult.test_cases_passed} / {liveResult.test_cases_run} PASSED
        </BrutalBadge>
      </div>

      {/* Query Detail Rows */}
      <div className="space-y-2">
        <span className="font-mono text-xs font-black uppercase tracking-wider text-brutal-muted dark:text-brutal-muted-dark">
          Evaluated Queries & Empirical Rank:
        </span>

        <div className="space-y-2">
          {liveResult.details?.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-brutal-paper dark:bg-brutal-dark-surface border-2 border-brutal-black/30 dark:border-brutal-yellow/30 font-mono text-xs flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="min-w-0">
                <span className="font-bold text-brutal-black dark:text-brutal-white">
                  "{item.query}"
                </span>
                <div className="text-[10px] text-brutal-muted dark:text-brutal-muted-dark uppercase mt-0.5">
                  Target: {item.expected_doc}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <BrutalBadge tone={item.rank_achieved === 1 ? 'yellow' : 'paper'} size="sm">
                  RANK #{item.rank_achieved}
                </BrutalBadge>
                {item.rank_achieved === 1 ? (
                  <span className="w-5 h-5 bg-brutal-success text-brutal-white flex items-center justify-center border border-brutal-black text-[10px] font-bold">
                    ✓
                  </span>
                ) : (
                  <span className="w-5 h-5 bg-brutal-yellow text-brutal-black flex items-center justify-center border border-brutal-black text-[10px] font-bold">
                    ~
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </BrutalCard>
  );
}
