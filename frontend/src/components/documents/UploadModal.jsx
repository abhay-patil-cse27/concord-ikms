import React from 'react';
import { UploadCloud, X, FileCode } from 'lucide-react';

export default function UploadModal({
  show,
  onClose,
  departments,
  uploadDeptId,
  setUploadDeptId,
  uploadTitle,
  setUploadTitle,
  fileToUpload,
  setFileToUpload,
  uploadLoading,
  uploadMsg,
  onSubmit,
}) {
  if (!show) return null;

  return (
    <div
      style={{
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
      }}
    >
      <div
        className="glass-panel animate-scale-up"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '1.75rem',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <h3
          style={{
            fontSize: '1.2rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <UploadCloud size={20} color="var(--primary)" />
          Ingest Institutional Document
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Upload PDF, DOCX, XLSX, TXT, or MD files. They will be parsed, verified with SHA-256 provenance, and converted into semantic chunks.
        </p>

        {uploadMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              background:
                uploadMsg.type === 'error'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(34, 197, 94, 0.15)',
              color: uploadMsg.type === 'error' ? '#ef4444' : '#22c55e',
              border: `1px solid ${
                uploadMsg.type === 'error'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(34, 197, 94, 0.3)'
              }`,
            }}
          >
            {uploadMsg.text}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                marginBottom: '0.4rem',
              }}
            >
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
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                marginBottom: '0.4rem',
              }}
            >
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
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                marginBottom: '0.4rem',
              }}
            >
              File (.pdf, .docx, .xlsx, .txt, .md)
            </label>
            <div
              style={{
                border: '2px dashed var(--border-light)',
                borderRadius: '8px',
                padding: '1.5rem',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.md,.csv"
                onChange={(e) => setFileToUpload(e.target.files[0] || null)}
                style={{ display: 'none' }}
              />
              {fileToUpload ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <FileCode size={20} color="var(--primary)" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{fileToUpload.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    ({Math.round(fileToUpload.size / 1024)} KB)
                  </span>
                </div>
              ) : (
                <div>
                  <UploadCloud size={28} color="var(--text-dim)" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Click to select a file</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Max size: 50MB</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={uploadLoading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadLoading || !fileToUpload}
              className="btn btn-primary"
            >
              {uploadLoading ? 'Uploading & Chunking...' : 'Upload & Ingest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
