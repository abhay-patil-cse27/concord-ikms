import React, { useState } from 'react';
import { useSearch } from '../hooks/useSearch';
import SearchBar from '../components/ui/SearchBar';
import EvidenceCitationCard from '../components/ui/EvidenceCitationCard';
import { BrutalBadge, BrutalTabs, BrutalSkeleton, BrutalEmptyState, BrutalToast } from '../components/brutal';
import { Search as SearchIcon, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

const SUGGESTIONS = [
  'Syllabus and course outcomes',
  'Examination rules and regulations',
  'Internship policy guidelines',
  'Attendance threshold requirements',
];

/**
 * SearchView
 * Yellow Brutalist contextual search view powered by hybrid RRF.
 */
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

  const [activeTab, setActiveTab] = useState('all');
  const [toast, setToast] = useState(null);

  React.useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
    }
  }, [error]);

  const handleQuickPrompt = (promptText) => {
    setQuery(promptText);
    executeSearch(promptText);
  };

  const tabs = [
    { id: 'all', label: `All Candidates (${results.length})` },
    { id: 'high_score', label: 'Top Scoring RRF' },
  ];

  const displayedResults = activeTab === 'high_score'
    ? results.filter((r) => (r.score || 0) >= 0.5)
    : results;

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Toast Notification */}
      {toast && (
        <BrutalToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* View Masthead */}
      <div className="pb-6 border-b-3 border-brutal-black dark:border-brutal-yellow">
        <div className="flex items-center gap-2 mb-2">
          <BrutalBadge tone="yellow" size="sm">
            HYBRID RETRIEVAL
          </BrutalBadge>
          <BrutalBadge tone="black" size="sm">
            RECIPROCAL RANK FUSION
          </BrutalBadge>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-brutal-black dark:text-brutal-white">
          Contextual Search & Retrieval
        </h1>
        <p className="font-mono text-xs text-brutal-black/70 dark:text-brutal-white/70 mt-1 max-w-2xl">
          Multi-stage lexical and dense vector search across institutional circulars, department syllabi, and administrative regulations.
        </p>
      </div>

      {/* Brutal Search Bar */}
      <SearchBar
        value={query}
        onChange={setQuery}
        onClear={clearSearch}
        onSubmit={() => executeSearch()}
        loading={loading}
        mode={mode}
        onModeChange={setMode}
      />

      {/* Suggested Quick Queries on Initial State */}
      {!results.length && !loading && (
        <div className="flex flex-col gap-3">
          <span className="font-mono text-xs font-black uppercase tracking-wider text-brutal-muted dark:text-brutal-muted-dark">
            Suggested Research Queries:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {SUGGESTIONS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleQuickPrompt(prompt)}
                className="px-3 py-1.5 border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-white dark:bg-brutal-dark-surface font-mono text-xs font-bold text-brutal-black dark:text-brutal-white shadow-brutal-sm hover:bg-brutal-yellow hover:text-brutal-black transition-colors flex items-center gap-1.5"
              >
                <Sparkles size={13} className="text-brutal-yellow group-hover:text-brutal-black" />
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-brutal-accent/15 border-3 border-brutal-accent text-brutal-black dark:text-brutal-white font-mono text-xs flex items-center gap-2">
          <AlertCircle size={18} className="text-brutal-accent flex-shrink-0" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* Diagnostics Strip */}
      {searchMeta && !loading && (
        <div className="p-3 bg-brutal-paper dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow font-mono text-xs flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-brutal-success" />
            <span className="font-bold">
              Retrieved {results.length} matching evidence chunks
            </span>
          </div>
          <div className="text-brutal-muted dark:text-brutal-muted-dark uppercase text-[11px]">
            Scanned {searchMeta.totalCandidates || 0} candidates in {searchMeta.latencyMs || 0}ms ({searchMeta.retrievalMode || mode} mode)
          </div>
        </div>
      )}

      {/* Results View */}
      {results.length > 0 && (
        <div className="mb-2">
          <BrutalTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <BrutalSkeleton count={4} height="h-28" />
          </div>
        ) : displayedResults.length > 0 ? (
          displayedResults.map((item) => (
            <EvidenceCitationCard key={item.chunk_id || item.id} item={item} />
          ))
        ) : searchMeta && results.length === 0 ? (
          <BrutalEmptyState
            title="No Matching Records Found"
            description="The hybrid RRF engine scanned the vector space and exact lexical index, but found zero high-confidence matches. Try broadening your query terms."
          />
        ) : null}
      </div>

    </div>
  );
}
