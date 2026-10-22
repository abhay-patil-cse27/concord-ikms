const API_BASE = '/api/v1';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('concord_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error?.message || `HTTP ${response.status}: Request failed`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.code = data?.error?.code || 'REQUEST_FAILED';
    error.details = data?.error?.details || {};
    error.requestId = data?.request_id;
    throw error;
  }

  return data;
}

export const api = {
  // Health & Admin Maintenance
  getHealth: () => apiRequest('/healthz'),
  getReadiness: () => apiRequest('/readyz'),
  reseedDemoData: () =>
    apiRequest('/admin/reseed-demo', {
      method: 'POST',
    }),

  // Auth
  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  demoLogin: (roleCode) =>
    apiRequest('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role_code: roleCode }),
    }),
  getMe: () => apiRequest('/auth/me'),

  // Organizations
  getDepartments: () => apiRequest('/organizations/departments'),
  createDepartment: (deptData) =>
    apiRequest('/organizations/departments', {
      method: 'POST',
      body: JSON.stringify(deptData),
    }),

  // Users
  getUsers: () => apiRequest('/users'),
  createUser: (userData) =>
    apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  // Audit
  getAuditEvents: (limit = 50) => apiRequest(`/audit/events?limit=${limit}`),

  // Documents (M2)
  getDocuments: (departmentId = null, status = null) => {
    const params = new URLSearchParams();
    if (departmentId) params.append('department_id', departmentId);
    if (status) params.append('status', status);
    const qs = params.toString();
    return apiRequest(`/documents${qs ? `?${qs}` : ''}`);
  },
  getDocument: (id) => apiRequest(`/documents/${id}`),
  uploadDocument: async (formData) => {
    const token = localStorage.getItem('concord_token');
    const response = await fetch('/api/v1/documents/upload', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const errorMsg = data?.error?.message || `HTTP ${response.status}: Upload failed`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.code = data?.error?.code || 'UPLOAD_FAILED';
      throw error;
    }
    return data;
  },
  deleteDocument: async (id) => {
    const token = localStorage.getItem('concord_token');
    const response = await fetch(`/api/v1/documents/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error?.message || 'Delete failed');
    }
    return true;
  },

  // Search & Retrieval (M3)
  searchKnowledgeBase: (query, options = {}) =>
    apiRequest('/search/query', {
      method: 'POST',
      body: JSON.stringify({
        query,
        department_id: options.departmentId || null,
        top_k: options.topK || 5,
        mode: options.mode || 'hybrid',
      }),
    }),

  // Document Lifecycle & Versioning (M5)
  updateDocumentLifecycle: (id, payload) =>
    apiRequest(`/documents/${id}/lifecycle`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Governance & Approvals (M6)
  getPendingDocuments: () => apiRequest('/governance/pending-documents'),
  reviewDocument: (id, decision, notes = '') =>
    apiRequest(`/governance/documents/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    }),

  // Grounded RAG with Groq Cloud (M4)
  askQuestion: (query, options = {}) =>
    apiRequest('/rag/ask', {
      method: 'POST',
      body: JSON.stringify({
        query,
        department_id: options.departmentId || null,
        top_k: options.topK || 5,
        include_superseded: options.includeSuperseded || false,
      }),
    }),

  // Evaluation & Benchmarking (M7)
  getBenchmarkMetrics: () => apiRequest('/evaluation/metrics'),
  runLiveBenchmark: () =>
    apiRequest('/evaluation/run', {
      method: 'POST',
    }),

  // Conversational Multi-Turn Memory & Sessions
  listConversations: () => apiRequest('/conversations'),
  createConversation: (payload = {}) =>
    apiRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getConversation: (id) => apiRequest(`/conversations/${id}`),
  deleteConversation: (id) =>
    apiRequest(`/conversations/${id}`, {
      method: 'DELETE',
    }),
  askConversational: (payload) =>
    apiRequest('/conversations/ask', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

