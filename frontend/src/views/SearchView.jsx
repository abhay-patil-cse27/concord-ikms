import React from 'react';
import { useSearch } from '../hooks/useSearch';
import SearchBar from '../components/ui/SearchBar';
import EvidenceCitationCard from '../components/ui/EvidenceCitationCard';
import { Search as SearchIcon, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SearchView() {
  const {
    query,
    setQuery,
    mode,
    setMode,
    loading,
    error,
    results,
    searchMeta,
    executeSearch,
    clearSearch,
  } = useSearch();

  const handleQuickPrompt = (promptText) => {
    setQuery(promptText);
    executeSearch(promptText);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <span className="badge badge-primary">Milestone 3</span>
          <span className="badge badge-neutral">Reciprocal Rank Fusion</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          Contextual Search & Retrieval
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Multi-stage hybrid retrieval across institutional circulars, department syllabi, and academic policies.
        </p>
      </div>

      {/* Reusable Search Bar */}
      <SearchBar
        value={query}
        onChange={setQuery}
        onClear={clearSearch}
        onSubmit={() => executeSearch()}
        loading={loading}
        mode={mode}
        onModeChange={setMode}
      />

      {/* Quick Prompts */}
      {!results.length && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Suggested Queries
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              'Syllabus and course outcomes',
              'Examination rules and regulations',
              'Internship policy guidelines',
              'Attendance threshold requirements',
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleQuickPrompt(prompt)}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-muted)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <Sparkles size={13} color="var(--primary)" />
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--danger)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} color="var(--danger)" />
          <span style={{ fontSize: '0.9rem', color: '#fff' }}>{error}</span>
        </div>
      )}

      {/* Search Diagnostics */}
      {searchMeta && !loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.825rem',
            color: 'var(--text-muted)',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="var(--success)" />
            <span>Retrieved <strong>{results.length}</strong> matching evidence segments</span>
          </div>
          <div>
            Scanned {searchMeta.totalCandidates} candidates in <strong>{searchMeta.latencyMs} ms</strong> ({searchMeta.retrievalMode} mode)
          </div>
        </div>
      )}

      {/* Results List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(56, 189, 248, 0.2)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
            <span>Executing hybrid rank fusion retrieval...</span>
          </div>
        )}

        {!loading && results.length > 0 && results.map((item) => (
          <EvidenceCitationCard key={item.chunk_id} item={item} />
        ))}

        {!loading && searchMeta && results.length === 0 && (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <SearchIcon size={32} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>No matching records found</div>
            <div style={{ fontSize: '0.85rem' }}>Try refining your keywords or query intent.</div>
          </div>
        )}
      </div>
    </div>
  );
}
