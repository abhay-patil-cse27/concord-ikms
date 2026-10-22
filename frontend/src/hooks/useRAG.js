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
      
      // Convert messages to history turns
      const threadTurns = [];
      const msgs = detail.messages || [];
      for (let i = 0; i < msgs.length; i += 2) {
        const u = msgs[i];
        const a = msgs[i + 1];
        if (u && u.role === 'user') {
          threadTurns.push({
            id: u.id,
            query: u.content,
            answer: a ? a.content : '',
            citations: a?.citations || [],
            confidence: a?.confidence || 'medium',
            model_used: a?.model_used || 'groq',
            latency_ms: a?.latency_ms || 0,
            timestamp: new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }
      }
      setHistory(threadTurns.reverse());
      if (threadTurns.length > 0) {
        setResponse({
          query: threadTurns[0].query,
          answer: threadTurns[0].answer,
          citations: threadTurns[0].citations,
          confidence: threadTurns[0].confidence,
          model_used: threadTurns[0].model_used,
          latency_ms: threadTurns[0].latency_ms,
        });
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
      setHistory((prev) => [
        {
          id: Date.now().toString(),
          query: q.trim(),
          effective_query: data.effective_query,
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
