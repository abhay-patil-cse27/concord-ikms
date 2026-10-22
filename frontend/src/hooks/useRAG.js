import { useState, useCallback } from 'react';
import { api } from '../api/client';

export function useRAG() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const [history, setHistory] = useState([]);

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
