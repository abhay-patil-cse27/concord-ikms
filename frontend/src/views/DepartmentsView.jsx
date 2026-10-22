import React, { useState, useEffect } from 'react';
import { Building2, Plus, CheckCircle, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { uiCache } from '../utils/uiCache';

export default function DepartmentsView() {
  const cached = uiCache.get(uiCache.KEYS.DEPARTMENTS, {});
  const { hasPermission } = useAuth();
  const [departments, setDepartments] = useState(() => cached.departments || []);
  const [loading, setLoading] = useState(() => !cached.departments?.length);
  const [error, setError] = useState(null);

  // Form state
  const [showCreate, setShowCreate] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    if (departments.length > 0) {
      uiCache.set(uiCache.KEYS.DEPARTMENTS, { departments });
    }
  }, [departments]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await api.getDepartments();
      setDepartments(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cached.departments?.length) {
      fetchDepartments();
    }
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await api.createDepartment({ code: code.toUpperCase(), name, description });
      setCode('');
      setName('');
      setDescription('');
      setShowCreate(false);
      await fetchDepartments();
    } catch (err) {
      alert(`Creation failed: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const canWrite = hasPermission('departments:write');

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Institutional Departments & Tenancy
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Organizational units governing document authorization and access scopes.
          </p>
        </div>

        {canWrite && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn btn-primary"
            style={{ padding: '0.55rem 1rem' }}
          >
            <Plus size={16} />
            {showCreate ? 'Cancel' : 'New Department'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: 'var(--status-danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', color: 'var(--status-danger)' }}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Modal / Inline Create Form */}
      {showCreate && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderColor: 'var(--primary)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Register Institutional Department</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Department Code (e.g., MECH)
              </label>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="MECH"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Full Department Name
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mechanical Engineering"
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Governance Scope / Description
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Department syllabus, notices, and labs"
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={createLoading} className="btn btn-primary">
                {createLoading ? 'Registering...' : 'Save Department'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Department Cards Grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading departments...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {departments.map((dept) => (
            <div key={dept.id} className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="badge badge-info" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                  {dept.code}
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                  Active Scope
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                {dept.name}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem', lineHeight: 1.5 }}>
                {dept.description || 'No description recorded.'}
              </p>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                Registered: {new Date(dept.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
