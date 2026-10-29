import React from 'react';
import { Send, Mic, MicOff, Square } from 'lucide-react';
import { BrutalButton } from '../brutal';
import { cn } from '../../lib/utils';

/**
 * Composer
 * Rectangular pinned chat input bar supporting keyboard shortcuts (Enter to send, Shift+Enter for newline, Esc to stop)
 * and speech recognition toggles with a dedicated Stop Generation control.
 */
export default function Composer({
  query,
  setQuery,
  onSend,
  loading = false,
  isListening = false,
  speechSupported = false,
  onToggleSpeech,
  onStop,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && loading && onStop) {
      e.preventDefault();
      onStop();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && query.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="w-full bg-brutal-paper dark:bg-brutal-dark border-t-3 border-brutal-black dark:border-brutal-yellow p-3 sm:p-4 select-none flex-shrink-0">
      <div className="max-w-4xl mx-auto flex items-end gap-2.5">
        
        {/* Multiline Input Box */}
        <div className="flex-1 bg-brutal-white dark:bg-brutal-dark-surface border-3 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm focus-within:shadow-brutal focus-within:border-brutal-black transition-all flex flex-col p-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={
              isListening
                ? 'Listening... speak your institutional inquiry...'
                : loading
                ? 'CONCORD is synthesizing institutional reasoning (Press Esc or click Stop)...'
                : 'Inquire regarding academic regulations, circulars, or syllabi (Press Enter to send)...'
            }
            rows={2}
            className="w-full bg-transparent border-none outline-none resize-none font-mono text-xs sm:text-sm text-brutal-black dark:text-brutal-white placeholder:text-brutal-muted dark:placeholder:text-brutal-muted-dark leading-relaxed p-1"
          />

          <div className="flex items-center justify-between pt-1 border-t border-brutal-black/10 dark:border-brutal-yellow/10 font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark">
            <span>{loading ? 'Press Esc to stop generation' : 'Shift + Enter for new line'}</span>
            {isListening && (
              <span className="text-brutal-accent font-bold animate-pulse">
                Recording Active
              </span>
            )}
          </div>
        </div>

        {/* Action Controls: Mic, Stop & Send Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {speechSupported && (
            <BrutalButton
              type="button"
              variant={isListening ? 'danger' : 'secondary'}
              size="md"
              onClick={onToggleSpeech}
              title={isListening ? 'Stop listening' : 'Start speech-to-text'}
              aria-label={isListening ? 'Stop speech recognition' : 'Start speech recognition'}
              className="p-3"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </BrutalButton>
          )}

          {loading ? (
            <BrutalButton
              type="button"
              variant="danger"
              size="md"
              onClick={onStop}
              title="Stop generation (Esc)"
              aria-label="Stop generation"
              className="px-5 py-3 shadow-brutal flex items-center gap-2 font-black uppercase text-xs animate-pulse hover:animate-none"
            >
              <span>Stop</span>
              <Square size={13} className="fill-current" />
            </BrutalButton>
          ) : (
            <BrutalButton
              type="button"
              variant="primary"
              size="md"
              onClick={onSend}
              disabled={loading || !query.trim()}
              className="px-5 py-3 shadow-brutal flex items-center gap-2 font-black uppercase text-xs"
            >
              <span>Send</span>
              <Send size={15} strokeWidth={2.5} />
            </BrutalButton>
          )}
        </div>

      </div>
    </div>
  );
}
