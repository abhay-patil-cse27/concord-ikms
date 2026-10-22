import React, { useState, useEffect } from 'react';
import { FileText, UploadCloud, Filter } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { uiCache } from '../utils/uiCache';
import UploadModal from '../components/documents/UploadModal';
import ChunkInspectorModal from '../components/documents/ChunkInspectorModal';
import DocumentTable from '../components/documents/DocumentTable';

export default function DocumentsView() {
  const cached = uiCache.get(uiCache.KEYS.DOCUMENTS, {});

  const { user, hasPermission } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(cached.selectedDept || '');
  const [activeFilterTab, setActiveFilterTab] = useState(cached.activeFilterTab || 'all'); // 'all' | 'pending'
  const [pendingDocs, setPendingDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    uiCache.set(uiCache.KEYS.DOCUMENTS, {
      selectedDept,
      activeFilterTab,
    });
  }, [selectedDept, activeFilterTab]);

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDeptId, setUploadDeptId] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);

  // Inspector modal state
  const [inspectDoc, setInspectDoc] = useState(null);

  const canWrite = hasPermission('documents:write');
  const canDelete = hasPermission('documents:delete');
  const isApprover = user?.roles?.some((r) => ['platform_admin', 'dept_admin'].includes(r.code));

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises = [
        api.getDocuments(selectedDept || null),
        api.getDepartments(),
      ];
      if (isApprover) {
        promises.push(api.getPendingDocuments().catch(() => []));
      }
      const [docsData, deptsData, pendingData = []] = await Promise.all(promises);
      setDocuments(docsData);
      setDepartments(deptsData);
      setPendingDocs(pendingData);
      if (!uploadDeptId && deptsData.length > 0) {
        setUploadDeptId(user?.primary_department_id || deptsData[0].id);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDept]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return;

    setUploadLoading(true);
    setUploadMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('department_id', uploadDeptId);
      if (uploadTitle.trim()) {
        formData.append('title', uploadTitle.trim());
      }

      const res = await api.uploadDocument(formData);
      setUploadMsg({ type: 'success', text: res.message || 'Document ingested and parsed!' });
      setFileToUpload(null);
      setUploadTitle('');
      await fetchData();
      setTimeout(() => {
        setShowUpload(false);
        setUploadMsg(null);
      }, 1500);
    } catch (err) {
      setUploadMsg({ type: 'error', text: err.message });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (docId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      await api.deleteDocument(docId);
      await fetchData();
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const handleInspect = async (docId) => {
    try {
      const docDetails = await api.getDocument(docId);
      setInspectDoc(docDetails);
    } catch (err) {
      alert(`Failed to load chunks: ${err.message}`);
    }
  };

  const handleReview = async (docId, decision) => {
    const notes = window.prompt(`Enter optional review notes for ${decision}:`) || '';
    try {
      await api.reviewDocument(docId, decision, notes);
      await fetchData();
    } catch (err) {
      alert(`Review failed: ${err.message}`);
    }
  };

  const displayDocs = activeFilterTab === 'pending' ? pendingDocs : documents;

  return (
    <div className="animate-fade-in">
      {/* Header Bar & Filter Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Institutional Document Ingestion & Governance
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Parse, deduplicate, chunk, and review institutional policies, course syllabi, and administrative records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isApprover && (
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <button
                onClick={() => setActiveFilterTab('all')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeFilterTab === 'all' ? 'var(--primary)' : 'transparent',
                  color: activeFilterTab === 'all' ? '#fff' : 'var(--text-muted)',
                }}
              >
                All Documents ({documents.length})
              </button>
              <button
                onClick={() => setActiveFilterTab('pending')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeFilterTab === 'pending' ? '#f59e0b' : 'transparent',
                  color: activeFilterTab === 'pending' ? '#fff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Pending Review ({pendingDocs.length})
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: '6px',
                padding: '0.45rem 0.75rem',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
              }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {canWrite && (
            <button
              onClick={() => setShowUpload(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <UploadCloud size={16} />
              Upload Document
            </button>
          )}
        </div>
      </div>

      {/* Sub-Components: Upload Modal & Chunk Inspector */}
      <UploadModal
        show={showUpload}
        onClose={() => setShowUpload(false)}
        departments={departments}
        uploadDeptId={uploadDeptId}
        setUploadDeptId={setUploadDeptId}
        uploadTitle={uploadTitle}
        setUploadTitle={setUploadTitle}
        fileToUpload={fileToUpload}
        setFileToUpload={setFileToUpload}
        uploadLoading={uploadLoading}
        uploadMsg={uploadMsg}
        onSubmit={handleUploadSubmit}
      />

      <ChunkInspectorModal
        inspectDoc={inspectDoc}
        onClose={() => setInspectDoc(null)}
      />

      {/* Document Inventory & Review Queue Table */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading institutional documents...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
            {error}
          </div>
        ) : displayDocs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <FileText size={48} color="var(--text-dim)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              {activeFilterTab === 'pending' ? 'No Documents Awaiting Review' : 'No Documents Ingested Yet'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              {activeFilterTab === 'pending'
                ? 'All uploaded documents have been reviewed and approved.'
                : 'Upload academic regulations, administrative circulars, or course handbooks to trigger automated chunking.'}
            </p>
            {canWrite && activeFilterTab !== 'pending' && (
              <button onClick={() => setShowUpload(true)} className="btn btn-primary">
                Upload First Document
              </button>
            )}
          </div>
        ) : (
          <DocumentTable
            documents={displayDocs}
            departments={departments}
            isApprover={isApprover}
            canDelete={canDelete}
            onInspect={handleInspect}
            onReview={handleReview}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
