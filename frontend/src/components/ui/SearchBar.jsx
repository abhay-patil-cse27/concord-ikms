import React from 'react';
import { Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react';
import { BrutalInput, BrutalButton } from '../brutal';
import { cn } from '../../lib/utils';

/**
 * SearchBar
 * High-voltage Yellow Brutalist search box featuring mode toggles (Hybrid, Vector, Lexical).
 */
export default function SearchBar({
  value,
  onChange,
  onClear,
  onSubmit,
  placeholder = 'Ask a question or enter keywords (e.g. syllabus, exam rules, circulars)...',
  loading = false,
  mode = 'hybrid',
  onModeChange,
  className = '',
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.();
    }
  };

  const modes = [
    { id: 'hybrid', label: 'Hybrid RRF' },
    { id: 'vector', label: 'Dense Vector' },
    { id: 'lexical', label: 'BM25 Lexical' },
  ];

  return (
    <div className={cn('flex flex-col gap-3 w-full', className)}>
      {/* Primary Input Strip */}
      <div className="flex items-center gap-2 bg-brutal-white dark:bg-brutal-dark-surface border-3 border-brutal-black dark:border-brutal-yellow shadow-brutal p-2">
        <div className="pl-2 pr-1 text-brutal-black dark:text-brutal-yellow flex-shrink-0">
          <SearchIcon size={20} strokeWidth={2.5} />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1 bg-transparent border-none outline-none font-mono text-sm font-bold text-brutal-black dark:text-brutal-white placeholder:text-brutal-muted dark:placeholder:text-brutal-muted-dark p-1"
        />

        {value && (
          <button
            type="button"
            onClick={onClear}
            className="p-1.5 text-brutal-muted dark:text-brutal-muted-dark hover:text-brutal-black dark:hover:text-brutal-white transition-colors"
            title="Clear search"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}

        <BrutalButton
          type="button"
          variant="primary"
          size="md"
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          loading={loading}
          className="shadow-brutal-sm font-black text-xs uppercase px-5 py-2.5"
        >
          <span>{loading ? 'Searching...' : 'Search'}</span>
        </BrutalButton>
      </div>

      {/* Retrieval Mode Pills */}
      {onModeChange && (
        <div className="flex items-center gap-2 font-mono text-xs text-brutal-black dark:text-brutal-white select-none">
          <SlidersHorizontal size={14} className="text-brutal-muted dark:text-brutal-muted-dark flex-shrink-0" />
          <span className="font-black uppercase tracking-wider text-[11px] text-brutal-muted dark:text-brutal-muted-dark">
            Retrieval Mode:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {modes.map((m) => {
              const isActive = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onModeChange(m.id)}
                  className={cn(
                    'px-2.5 py-1 font-mono text-[11px] font-bold uppercase border-2 transition-all',
                    isActive
                      ? 'bg-brutal-yellow text-brutal-black border-brutal-black shadow-brutal-sm font-black'
                      : 'bg-brutal-paper dark:bg-brutal-dark text-brutal-black dark:text-brutal-white border-brutal-black/30 dark:border-brutal-yellow/30 hover:border-brutal-black'
                  )}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
