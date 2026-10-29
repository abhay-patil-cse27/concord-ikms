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
        <div className="flex-1 bg-brutal-white dark:bg-brutal-dark-surface border-3 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm focus-within:shadow-brutal focus-within:border-brutal-black transition-all flex flex-col p-2.5 relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={
              isListening
                ? 'Listening... speak your institutional inquiry...'
                : loading
                ? 'CONCORD is synthesizing institutional reasoning (Click STOP below or press Esc)...'
                : 'Inquire regarding academic regulations, circulars, or syllabi (Press Enter to send)...'
            }
            rows={2}
            className="w-full bg-transparent border-none outline-none resize-none font-mono text-xs sm:text-sm text-brutal-black dark:text-brutal-white placeholder:text-brutal-muted dark:placeholder:text-brutal-muted-dark leading-relaxed p-1"
          />

          <div className="flex items-center justify-between pt-1.5 border-t border-brutal-black/10 dark:border-brutal-yellow/10 font-mono text-[10px]">
            {loading ? (
              <>
                <div className="flex items-center gap-2 text-brutal-black/80 dark:text-brutal-yellow font-black animate-pulse">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brutal-accent opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brutal-accent" />
                  </span>
                  <span className="text-[10px] tracking-wider uppercase">Synthesizing Answer...</span>
                </div>

                {/* Stop Button INSIDE the Textbox */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onStop) onStop();
                  }}
                  title="Stop generating response (Esc)"
                  aria-label="Stop response"
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-brutal-accent hover:bg-brutal-accent-hover text-white font-mono text-[10px] font-black uppercase border-2 border-brutal-black shadow-[2px_2px_0px_#0A0A0A] dark:shadow-[2px_2px_0px_#FFE600] cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none animate-pulse hover:animate-none"
                >
                  <Square size={10} className="fill-current" />
                  <span>STOP RESPONSE</span>
                  <span className="text-[9px] px-1 bg-black/40 text-white font-mono border border-white/20">ESC</span>
                </button>
              </>
            ) : (
              <>
                <span className="text-brutal-muted dark:text-brutal-muted-dark">Shift + Enter for new line</span>
                {isListening && (
                  <span className="text-brutal-accent font-bold animate-pulse">
                    Recording Active
                  </span>
                )}
              </>
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
