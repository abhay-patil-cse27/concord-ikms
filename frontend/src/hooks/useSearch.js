import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { uiCache } from '../utils/uiCache';

export function useSearch() {
  const cached = uiCache.get(uiCache.KEYS.SEARCH, {});

  const [query, setQuery] = useState(cached.query || '');
  const [mode, setMode] = useState(cached.mode || 'hybrid');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(cached.results || []);
  const [searchMeta, setSearchMeta] = useState(cached.searchMeta || null);

  useEffect(() => {
    uiCache.set(uiCache.KEYS.SEARCH, {
      query,
      mode,
      results,
      searchMeta,
    });
  }, [query, mode, results, searchMeta]);

  const executeSearch = async (overrideQuery = null, overrideDept = null) => {
    const q = overrideQuery !== null ? overrideQuery : query;
    if (!q || !q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.searchKnowledgeBase(q.trim(), {
        mode,
        departmentId: overrideDept,
        topK: 8,
      });
      setResults(response.results || []);
      setSearchMeta({
        totalCandidates: response.total_candidates,
        retrievalMode: response.retrieval_mode,
        latencyMs: response.latency_ms,
      });
    } catch (err) {
      setError(err.message || 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setSearchMeta(null);
    uiCache.remove(uiCache.KEYS.SEARCH);
  };

  return {
    query,
    setQuery,
    mode,
    setMode,
    loading,
    error,
    results,
    searchMeta,
    executeSearch,
    clearSearch,
  };
}
