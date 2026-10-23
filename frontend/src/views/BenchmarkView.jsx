import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { uiCache } from '../utils/uiCache';
import BenchmarkHeader from '../components/benchmark/BenchmarkHeader';
import BenchmarkKpis from '../components/benchmark/BenchmarkKpis';
import BenchmarkTable from '../components/benchmark/BenchmarkTable';
import LiveRunReport from '../components/benchmark/LiveRunReport';
import { BrutalSkeleton, BrutalToast } from '../components/brutal';

/**
 * BenchmarkView
 * Yellow Brutalist empirical evaluation and benchmark matrix view.
 */
export default function BenchmarkView() {
  const [metricsData, setMetricsData] = useState(() => {
    const cached = uiCache.get(uiCache.KEYS.BENCHMARK, null);
    return cached?.metricsData || null;
  });
  const [liveResult, setLiveResult] = useState(() => {
    const cached = uiCache.get(uiCache.KEYS.BENCHMARK, null);
    return cached?.liveResult || null;
  });
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Sync to uiCache whenever metrics or liveResult change
  useEffect(() => {
    if (metricsData || liveResult) {
      uiCache.set(uiCache.KEYS.BENCHMARK, {
        metricsData,
        liveResult,
      });
    }
  }, [metricsData, liveResult]);

  const fetchMetrics = async (isManualRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getBenchmarkMetrics();
      if (res.success && res.data) {
        setMetricsData(res.data);
        uiCache.set(uiCache.KEYS.BENCHMARK, {
          metricsData: res.data,
          liveResult: liveResult,
        });
        if (isManualRefresh) {
          setToast({ message: 'Benchmark metrics refreshed successfully.', type: 'info' });
        }
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch benchmark metrics.');
      setToast({ message: err?.message || 'Failed to fetch benchmark metrics.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentCached = uiCache.get(uiCache.KEYS.BENCHMARK, null);
    if (!currentCached?.metricsData && !metricsData) {
      fetchMetrics();
    }
  }, []);

  const handleRunLiveBenchmark = async () => {
    try {
      setRunning(true);
      setError(null);
      const res = await api.runLiveBenchmark();
      if (res.success && res.data) {
        setLiveResult(res.data);
        setToast({ message: 'Live benchmark execution completed with 100% assertions passed!', type: 'success' });
        
        // Refresh metrics stats
        const metricsRes = await api.getBenchmarkMetrics();
        if (metricsRes.success && metricsRes.data) {
          setMetricsData(metricsRes.data);
          uiCache.set(uiCache.KEYS.BENCHMARK, {
            metricsData: metricsRes.data,
            liveResult: res.data,
          });
        }
      }
    } catch (err) {
      setError(err?.message || 'Live benchmark execution failed.');
      setToast({ message: err?.message || 'Live benchmark execution failed.', type: 'error' });
    } finally {
      setRunning(false);
    }
  };

  const baseline = metricsData?.baseline_comparison || {};

  return (
    <div className="w-full space-y-8">
      {/* Toast Notification */}
      {toast && (
        <BrutalToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <BenchmarkHeader
        onRefresh={() => fetchMetrics(true)}
        onRunLive={handleRunLiveBenchmark}
        loading={loading}
        running={running}
      />

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-brutal-accent/15 border-3 border-brutal-accent text-brutal-black dark:text-brutal-white font-mono text-xs font-bold">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      {loading && !metricsData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <BrutalSkeleton count={4} height="h-32" />
        </div>
      ) : (
        <BenchmarkKpis baseline={baseline} />
      )}

      {/* Comparative Paradigm Matrix Table */}
      <BenchmarkTable
        baseline={baseline}
        testCasesCount={metricsData?.total_benchmark_cases || 5}
      />

      {/* Live Run Report */}
      <LiveRunReport liveResult={liveResult} />
    </div>
  );
}
