import React from 'react';
import { Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  onClear,
  onSubmit,
  placeholder = 'Ask a question or enter keywords (e.g. syllabus, exam rules, circulars)...',
  loading = false,
  mode = 'hybrid',
  onModeChange,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.6rem 1rem',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        }}
      >
        <SearchIcon size={20} color="var(--primary)" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: '1rem',
            fontFamily: 'inherit',
          }}
        />

        {value && (
          <button
            type="button"
            onClick={onClear}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.2rem',
            }}
          >
            <X size={16} />
          </button>
        )}

        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          className="btn btn-primary"
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 600,
            opacity: loading || !value.trim() ? 0.6 : 1,
            cursor: loading || !value.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {onModeChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <SlidersHorizontal size={14} />
          <span>Retrieval Mode:</span>
          {['hybrid', 'vector', 'lexical'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              style={{
                background: mode === m ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                color: mode === m ? 'var(--primary)' : 'var(--text-muted)',
                border: `1px solid ${mode === m ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontWeight: mode === m ? 600 : 400,
                fontSize: '0.75rem',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
