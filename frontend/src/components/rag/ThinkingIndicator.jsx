import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, ChevronDown, ChevronRight, Layers, Cpu, Square } from 'lucide-react';
import { getShuffledThinkingVerbs } from '../../constants/thinkingVerbs';

/**
 * ThinkingIndicator
 * Claude-style unified thinking block with progressive thinking steps.
 * When active (no tokens yet): Displays animated reasoning steps and dynamic academic verbs.
 * When tokens stream/complete: Collapses into an interactive "Thought process" tray.
 */
export default function ThinkingIndicator({
  isStreaming = false,
  hasContent = false,
  streamingState = 'thinking',
  isConversational = false,
  onStop,
}) {
  const [verbs] = useState(() => getShuffledThinkingVerbs());
  const [verbIndex, setVerbIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(!hasContent);

  // Rotate academic verbs during active thinking
  useEffect(() => {
    if (hasContent) return;
    const verbTimer = setInterval(() => {
      setVerbIndex((prev) => (prev + 1) % verbs.length);
    }, 1800);
    return () => clearInterval(verbTimer);
  }, [hasContent, verbs.length]);

  // Advance progressive thinking steps
  useEffect(() => {
    if (hasContent) {
      setIsExpanded(false); // Auto-collapse when content begins streaming
      return;
    }
    setIsExpanded(true);
    const stepTimer = setInterval(() => {
      setActiveStepIndex((prev) => Math.min(prev + 1, 2));
    }, 1200);
    return () => clearInterval(stepTimer);
  }, [hasContent]);

  const currentVerb = verbs[verbIndex] || 'Synthesizing';

  const steps = isConversational
    ? [
        { label: 'Analyzed conversational intent & dialogue tone', done: true },
        { label: hasContent ? 'Synthesized natural dialogue response' : 'Formulating conversational response tokens...', done: hasContent },
      ]
    : [
        { label: 'Verified user role & scope permissions', done: activeStepIndex >= 0 },
        {
          label: activeStepIndex >= 1
            ? 'Scanned institutional repository & cross-referenced circulars'
            : 'Cross-referencing institutional syllabus & regulation records...',
          done: activeStepIndex >= 1 || hasContent,
        },
        {
          label: hasContent
            ? 'Synthesized grounded, verifiable response with citations'
            : `${currentVerb} verified institutional knowledge tokens...`,
          done: hasContent,
        },
      ];

  // If streaming finished and has content, keep thought tray collapsed and clean
  return (
    <div className="my-2 border-2 border-brutal-black/30 dark:border-brutal-yellow/30 bg-brutal-paper/80 dark:bg-brutal-dark/80 select-none overflow-hidden transition-all">
      {/* Claude-style Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 bg-brutal-black/5 dark:bg-brutal-yellow/5 hover:bg-brutal-black/10 dark:hover:bg-brutal-yellow/10 transition-colors text-left"
        title="Toggle thought process details"
      >
        <div className="flex items-center gap-2">
          {/* Pulsing Brutalist Tactile Blocks (Pulsing while thinking, solid when done) */}
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 border border-brutal-black ${hasContent ? 'bg-brutal-black dark:bg-brutal-yellow' : 'bg-brutal-yellow animate-pulse'}`} />
            <span className={`w-2 h-2 border border-brutal-black ${hasContent ? 'bg-brutal-black dark:bg-brutal-yellow' : 'bg-brutal-black dark:bg-brutal-yellow animate-pulse delay-150'}`} />
            <span className={`w-2 h-2 border border-brutal-black ${hasContent ? 'bg-brutal-black dark:bg-brutal-yellow' : 'bg-brutal-yellow animate-pulse delay-300'}`} />
          </div>

          <span className="font-mono text-[11px] font-black uppercase tracking-wider text-brutal-black dark:text-brutal-white flex items-center gap-1.5">
            <Cpu size={12} className="text-brutal-accent" />
            {hasContent ? (
              <span>Thought Process ({steps.length} steps executed)</span>
            ) : (
              <span className="flex items-center gap-1">
                <span>Cogitating institutional reasoning:</span>
                <span className="text-brutal-accent">{currentVerb}...</span>
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isStreaming && onStop && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onStop();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onStop();
                }
              }}
              className="px-2 py-0.5 border border-brutal-accent bg-brutal-accent text-brutal-black hover:bg-brutal-black hover:text-brutal-accent font-mono text-[10px] font-black uppercase flex items-center gap-1 transition-colors cursor-pointer"
              title="Stop generation (Esc)"
            >
              <Square size={9} className="fill-current" />
              <span>Stop</span>
            </span>
          )}
          <div className="flex items-center gap-1 text-brutal-muted dark:text-brutal-muted-dark font-mono text-[10px]">
            <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </div>
      </button>

      {/* Expandable Thinking Steps Log */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="px-3.5 py-2.5 space-y-2 border-t border-brutal-black/15 dark:border-brutal-yellow/15 font-mono text-xs"
          >
            {steps.map((s, idx) => {
              const isCurrent = !s.done && (idx === 0 || steps[idx - 1]?.done);
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 transition-opacity ${s.done ? 'text-brutal-black dark:text-brutal-white' : isCurrent ? 'text-brutal-accent font-bold animate-pulse' : 'text-brutal-muted dark:text-brutal-muted-dark opacity-60'}`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {s.done ? (
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brutal-black dark:bg-brutal-yellow text-brutal-yellow dark:text-brutal-black rounded-none text-[9px] font-black">
                        ✓
                      </span>
                    ) : isCurrent ? (
                      <span className="inline-block w-3.5 h-3.5 border border-brutal-black dark:border-brutal-yellow bg-brutal-yellow animate-spin text-[9px]" />
                    ) : (
                      <span className="inline-block w-3.5 h-3.5 border border-dashed border-brutal-black/40 dark:border-brutal-yellow/40" />
                    )}
                  </div>
                  <span className="leading-snug text-[11px]">{s.label}</span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
