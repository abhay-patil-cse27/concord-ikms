import React from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers, 
  Eye, 
  Download, 
  Trash2 
} from 'lucide-react';

export default function DocumentTable({
  documents,
  departments,
  isApprover,
  canDelete,
  onInspect,
  onReview,
  onDelete,
}) {
  return (
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
          {documents.map((doc) => {
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
                  <span className="badge badge-info">{dept ? dept.code : 'DEPT'}</span>
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
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#ef4444',
                          background: 'rgba(239, 68, 68, 0.1)',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          width: 'fit-content',
                        }}
                      >
                        🔴 SUPERSEDED
                      </span>
                    ) : doc.lifecycle_status === 'archived' ? (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#94a3b8',
                          background: 'rgba(148, 163, 184, 0.1)',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          width: 'fit-content',
                        }}
                      >
                        ⚪ ARCHIVED
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#22c55e',
                          background: 'rgba(34, 197, 94, 0.1)',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          width: 'fit-content',
                        }}
                      >
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
                          onClick={() => onReview(doc.id, 'approved')}
                          className="btn btn-primary"
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            background: '#10b981',
                            borderColor: '#10b981',
                          }}
                          title="Approve Document (Sync to Vector Index)"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onReview(doc.id, 'rejected')}
                          className="btn btn-danger"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          title="Reject Document"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => onInspect(doc.id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                      title="Inspect Chunks"
                    >
                      <Eye size={14} />
                    </button>

                    <a
                      href={`/api/v1/documents/${doc.id}/download`}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.35rem 0.5rem',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Download Raw File"
                    >
                      <Download size={14} />
                    </a>

                    {canDelete && (
                      <button
                        onClick={() => onDelete(doc.id, doc.title)}
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
  );
}
