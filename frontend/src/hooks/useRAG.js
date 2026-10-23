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
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(cached.activeConversationId || null);
  const [convLoading, setConvLoading] = useState(false);

  // Sync to cache on updates
  useEffect(() => {
    uiCache.set(uiCache.KEYS.RAG, {
      query,
      response,
      history,
      activeConversationId,
    });
  }, [query, response, history, activeConversationId]);

  // Load user conversation list
  const loadConversations = useCallback(async () => {
    try {
      setConvLoading(true);
      const list = await api.listConversations();
      setConversations(list);
    } catch (err) {
      console.warn('Failed to fetch conversation list:', err);
    } finally {
      setConvLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Select an existing conversation thread
  const selectConversation = useCallback(async (convId) => {
    if (!convId) return;
    try {
      setLoading(true);
      setError(null);
      const detail = await api.getConversation(convId);
      setActiveConversationId(convId);
      
      // Load messages directly in chronological order
      const msgs = (detail.messages || []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: m.citations || [],
        confidence: m.confidence || 'medium',
        model_used: m.model_used || 'groq',
        latency_ms: m.latency_ms || 0,
        timestamp: m.created_at
          ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));

      // Keep strict chronological order: oldest queries at the top, newest at the bottom
      setHistory(msgs);
      if (msgs.length > 0) {
        const lastAsst = [...msgs].reverse().find((m) => m.role === 'assistant');
        if (lastAsst) {
          setResponse({
            query: msgs[msgs.length - 2]?.content || '',
            answer: lastAsst.content,
            citations: lastAsst.citations,
            confidence: lastAsst.confidence,
            model_used: lastAsst.model_used,
            latency_ms: lastAsst.latency_ms,
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load conversation history');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a brand new clean thread
  const createNewSession = useCallback(() => {
    setActiveConversationId(null);
    setHistory([]);
    setResponse(null);
    setQuery('');
    setError(null);
  }, []);

  // Delete a thread
  const deleteSession = useCallback(async (convId) => {
    try {
      await api.deleteConversation(convId);
      if (activeConversationId === convId) {
        createNewSession();
      }
      await loadConversations();
    } catch (err) {
      console.warn('Failed to delete session:', err);
    }
  }, [activeConversationId, createNewSession, loadConversations]);

  const ask = useCallback(async (customQuery = null, options = {}) => {
    const q = customQuery !== null ? customQuery : query;
    if (!q || !q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Use conversational API endpoint to persist context & resolve pronouns
      const data = await api.askConversational({
        query: q.trim(),
        conversation_id: activeConversationId,
        department_id: options.departmentId || null,
        top_k: options.topK || 5,
        include_superseded: options.includeSuperseded || false,
      });

      if (!activeConversationId && data.conversation_id) {
        setActiveConversationId(data.conversation_id);
        loadConversations();
      }

      setResponse(data);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setHistory((prev) => [
        ...prev,
        {
          id: `u-${Date.now()}`,
          role: 'user',
          content: q.trim(),
          timestamp: nowStr,
        },
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.answer,
          citations: data.citations,
          confidence: data.confidence,
          model_used: data.model_used,
          latency_ms: data.latency_ms,
          timestamp: nowStr,
        },
      ]);
      return data;
    } catch (err) {
      const msg = err.message || 'Failed to generate grounded answer';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [query, activeConversationId, loadConversations]);

  const clear = useCallback(() => {
    createNewSession();
    uiCache.remove(uiCache.KEYS.RAG);
  }, [createNewSession]);

  return {
    query,
    setQuery,
    loading,
    error,
    response,
    history,
    conversations,
    activeConversationId,
    convLoading,
    selectConversation,
    createNewSession,
    deleteSession,
    loadConversations,
    ask,
    clear,
  };
}
