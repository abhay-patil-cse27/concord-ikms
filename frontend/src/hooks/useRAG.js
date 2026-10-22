import { useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';
import { uiCache } from '../utils/uiCache';

export function useRAG() {
  const cached = uiCache.get(uiCache.KEYS.RAG, {});

  const [query, setQuery] = useState(cached.query || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(cached.response || null);
  const [history, setHistory] = useState(cached.history || []);

  // Sync to cache on updates
  useEffect(() => {
    uiCache.set(uiCache.KEYS.RAG, {
      query,
      response,
      history,
    });
  }, [query, response, history]);

  const ask = useCallback(async (customQuery = null, options = {}) => {
    const q = customQuery !== null ? customQuery : query;
    if (!q || !q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await api.askQuestion(q.trim(), options);
      setResponse(data);
      setHistory((prev) => [
        {
          id: Date.now().toString(),
          query: q.trim(),
          answer: data.answer,
          citations: data.citations,
          confidence: data.confidence,
          model_used: data.model_used,
          latency_ms: data.latency_ms,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);
      return data;
    } catch (err) {
      const msg = err.message || 'Failed to generate grounded answer';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [query]);

  const clear = useCallback(() => {
    setQuery('');
    setResponse(null);
    setError(null);
    uiCache.remove(uiCache.KEYS.RAG);
  }, []);

  return {
    query,
    setQuery,
    loading,
    error,
    response,
    history,
    ask,
    clear,
  };
}
