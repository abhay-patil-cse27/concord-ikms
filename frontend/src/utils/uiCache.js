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

// Current active user ID for cache isolation
let activeUserId = null;

export const uiCache = {
  setActiveUser: (userId) => {
    activeUserId = userId || null;
  },

  getActiveUser: () => activeUserId,

  getNamespacedKey: (baseKey) => {
    return activeUserId ? `${baseKey}_user_${activeUserId}` : baseKey;
  },

  get: (key, defaultValue = null) => {
    try {
      const namespacedKey = uiCache.getNamespacedKey(key);
      // First check sessionStorage, then fallback to localStorage
      const sessionData = sessionStorage.getItem(namespacedKey);
      if (sessionData) return JSON.parse(sessionData);
      
      const localData = localStorage.getItem(namespacedKey);
      if (localData) {
        sessionStorage.setItem(namespacedKey, localData);
        return JSON.parse(localData);
      }
      return defaultValue;
    } catch (e) {
      console.warn('uiCache get error:', e);
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      const namespacedKey = uiCache.getNamespacedKey(key);
      const serialized = JSON.stringify(value);
      sessionStorage.setItem(namespacedKey, serialized);
      localStorage.setItem(namespacedKey, serialized);
    } catch (e) {
      console.warn('uiCache set error:', e);
    }
  },

  remove: (key) => {
    try {
      const namespacedKey = uiCache.getNamespacedKey(key);
      sessionStorage.removeItem(namespacedKey);
      localStorage.removeItem(namespacedKey);
    } catch (e) {
      console.warn('uiCache remove error:', e);
    }
  },

  clearAll: () => {
    try {
      // Clear all items with concord_cache prefix from both session and local storage
      const clearPrefix = (storage) => {
        const keysToRemove = [];
        for (let i = 0; i < storage.length; i++) {
          const k = storage.key(i);
          if (k && k.startsWith('concord_cache_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => storage.removeItem(k));
      };
      clearPrefix(sessionStorage);
      clearPrefix(localStorage);
    } catch (e) {
      console.warn('uiCache clearAll error:', e);
    }
  },

  KEYS: CACHE_KEYS,
};
