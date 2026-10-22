/**
 * UI State & Results Cache for CONCORD IKMS.
 * Persists query results, RAG answers, benchmark reports, and filters across tab navigation.
 * Retains state in sessionStorage so refreshing or switching tabs never loses work,
 * while allowing explicit reruns or clear actions.
 */

const CACHE_KEYS = {
  RAG: 'concord_cache_rag',
  SEARCH: 'concord_cache_search',
  BENCHMARK: 'concord_cache_benchmark',
  DOCUMENTS: 'concord_cache_documents',
  AUDIT: 'concord_cache_audit',
  DEPARTMENTS: 'concord_cache_departments',
  USERS: 'concord_cache_users',
};

export const uiCache = {
  get: (key, defaultValue = null) => {
    try {
      const serialized = sessionStorage.getItem(key);
      if (!serialized) return defaultValue;
      return JSON.parse(serialized);
    } catch (e) {
      console.warn('uiCache get error:', e);
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('uiCache set error:', e);
    }
  },

  remove: (key) => {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn('uiCache remove error:', e);
    }
  },

  clearAll: () => {
    try {
      Object.values(CACHE_KEYS).forEach((k) => sessionStorage.removeItem(k));
    } catch (e) {
      console.warn('uiCache clearAll error:', e);
    }
  },

  KEYS: CACHE_KEYS,
};
