import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  Eye, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers, 
  Filter,
  X,
  FileCode
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DocumentsView() {
  const { user, hasPermission } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('all'); // 'all' | 'pending'
  const [pendingDocs, setPendingDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDeptId, setUploadDeptId] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);

  // Inspector modal state
  const [inspectDoc, setInspectDoc] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

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

  const handleReview = async (docId, decision) => {
    const notes = window.prompt(`Enter optional review notes for ${decision}:`) || '';
    try {
      await api.reviewDocument(docId, decision, notes);
      await fetchData();
    } catch (err) {
      alert(`Review failed: ${err.message}`);
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
      alert(`Deletion error: ${err.message}`);
    }
  };

  const handleInspect = async (docId) => {
    setInspectLoading(true);
    try {
      const doc = await api.getDocument(docId);
      setInspectDoc(doc);
    } catch (err) {
      alert(`Could not load chunks: ${err.message}`);
    } finally {
      setInspectLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header bar */}
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
          {/* View Filter Pills */}
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

          {/* Department Filter */}
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

      {/* Upload Modal */}
      {showUpload && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div className="glass-panel animate-scale-up" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', position: 'relative' }}>
            <button
              onClick={() => setShowUpload(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UploadCloud size={20} color="var(--primary)" />
              Ingest Document
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Upload PDF, DOCX, TXT, or MD files. They will be parsed, verified, and converted into semantic chunks.
            </p>

            {uploadMsg && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                background: uploadMsg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                color: uploadMsg.type === 'error' ? '#ef4444' : '#22c55e',
                border: `1px solid ${uploadMsg.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
              }}>
                {uploadMsg.text}
              </div>
            )}

            <form onSubmit={handleUploadSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Target Department
                </label>
                <select
                  value={uploadDeptId}
                  onChange={(e) => setUploadDeptId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px',
                    padding: '0.6rem 0.75rem',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                  }}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Display Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Computer Science Curriculum 2026-27"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px',
                    padding: '0.6rem 0.75rem',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Select File
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.xlsx,.xls,.txt,.md,.csv,.json"
                  required
                  onChange={(e) => setFileToUpload(e.target.files[0])}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'var(--bg-secondary)',
                    border: '1px dashed var(--border-light)',
                    borderRadius: '6px',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="btn btn-secondary"
                  disabled={uploadLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploadLoading || !fileToUpload}
                >
                  {uploadLoading ? 'Parsing & Chunking...' : 'Upload & Process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chunks Inspector Modal */}
      {inspectDoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem',
        }}>
          <div className="glass-panel animate-scale-up" style={{ width: '100%', maxWidth: '850px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '1.75rem', position: 'relative' }}>
            <button
              onClick={() => setInspectDoc(null)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <FileText size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{inspectDoc.title}</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {inspectDoc.filename} • {Math.round(inspectDoc.file_size_bytes / 1024)} KB • {inspectDoc.chunk_count} Chunks Generated
              </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
              {inspectDoc.chunks && inspectDoc.chunks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {inspectDoc.chunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        padding: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        <span className="badge badge-info">Chunk #{chunk.chunk_index}</span>
                        <span>{chunk.char_count} chars • Page {chunk.metadata_?.page_number || 1}</span>
                      </div>
                      <pre style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                        color: 'var(--text-primary)',
                        margin: 0,
                      }}>
                        {chunk.content}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No chunk segments extracted for this document.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Document Listing Table */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading institutional documents...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
            {error}
          </div>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <FileText size={48} color="var(--text-dim)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              No Documents Ingested Yet
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              Upload academic regulations, administrative circulars, or course handbooks to trigger automated chunking.
            </p>
            {canWrite && (
              <button onClick={() => setShowUpload(true)} className="btn btn-primary">
                Upload First Document
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Document</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Governance</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Version / Trust</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Chunks</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Size</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Uploaded</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(activeFilterTab === 'pending' ? pendingDocs : documents).map((doc) => {
                  const dept = departments.find((d) => d.id === doc.department_id);
                  return (
                    <tr
                      key={doc.id}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <FileText size={16} color="var(--primary)" />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{doc.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{doc.filename}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className="badge badge-info">
                          {dept ? dept.code : 'DEPT'}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        {doc.status === 'processed' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#22c55e', fontSize: '0.8rem' }}>
                            <CheckCircle2 size={14} /> Processed
                          </span>
                        ) : doc.status === 'failed' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', fontSize: '0.8rem' }}>
                            <AlertCircle size={14} /> Failed
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#38bdf8', fontSize: '0.8rem' }}>
                            <Clock size={14} /> Processing
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{doc.version || 'v1.0'}</span>
                          {doc.lifecycle_status === 'superseded' ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px', width: 'fit-content' }}>
                              🔴 SUPERSEDED
                            </span>
                          ) : doc.lifecycle_status === 'archived' ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', background: 'rgba(148, 163, 184, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px', width: 'fit-content' }}>
                              ⚪ ARCHIVED
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px', width: 'fit-content' }}>
                              🟢 ACTIVE
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                          <Layers size={14} color="var(--text-muted)" />
                          {doc.chunk_count}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {Math.round(doc.file_size_bytes / 1024)} KB
                      </td>

                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          {/* Governance Action Buttons */}
                          {isApprover && doc.approval_status === 'pending_approval' && (
                            <>
                              <button
                                onClick={() => handleReview(doc.id, 'approved')}
                                className="btn btn-primary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: '#10b981', borderColor: '#10b981' }}
                                title="Approve Document (Sync to Vector Index)"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReview(doc.id, 'rejected')}
                                className="btn btn-danger"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                title="Reject Document"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleInspect(doc.id)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                            title="Inspect Chunks"
                          >
                            <Eye size={14} />
                          </button>

                          <a
                            href={`/api/v1/documents/${doc.id}/download`}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}
                            title="Download Raw File"
                          >
                            <Download size={14} />
                          </a>

                          {canDelete && (
                            <button
                              onClick={() => handleDelete(doc.id, doc.title)}
                              className="btn btn-danger"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                              title="Delete Document"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
