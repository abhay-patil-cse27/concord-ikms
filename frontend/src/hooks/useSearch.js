import React, { useState } from 'react';
import { api } from '../api/client';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('hybrid');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [searchMeta, setSearchMeta] = useState(null);

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
